import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLabReportDetail, getSubmissions, gradeLabReport } from '@/api/homework.js'
import { getProfile } from '@/api/student.js'
import { aiGradeAnswer } from '@/api/exam.js'
import { buildFileUrl, downloadFile as downloadFileUtil, getFileName } from '@/utils/fileUtils.js'

export function useHomeworkGrade() {
    const route = useRoute()
    const router = useRouter()

    const homework = ref({})
    const submissions = ref([])
    const loading = ref(false)
    const searchKeyword = ref('')
    const currentSubmission = ref(null)
    const activeTab = ref('content')
    const submitting = ref(false)
    const autoGrading = ref(false)

    const gradeForm = reactive({
        score: 0,
        teacherComment: ''
    })

    const questionScores = ref([]) // 用于存储每道题的实际得分
    let isInternalUpdating = false // 内部赋值标记，避免循环触发

    // 监听每道题得分的变化，自动更新总分
    watch(questionScores, (newScores) => {
        if (isInternalUpdating) return
        const total = newScores.reduce((sum, s) => sum + (Number(s) || 0), 0)
        gradeForm.score = total
        
        // 实时同步到左侧学生列表，增强视觉反馈
        if (currentSubmission.value) {
            const sub = submissions.value.find(s => s.studentReportId === currentSubmission.value.studentReportId)
            if (sub) {
                sub.score = total
            }
        }
    }, { deep: true })

    const filterStatus = ref('ALL') // 'ALL', 'PENDING', 'GRADED'

    // ===== 1. 数据为空状态处理 =====
    const hasSubmissions = computed(() => submissions.value && submissions.value.length > 0)
    const hasQuestions = computed(() => questionList.value && questionList.value.length > 0)
    const hasContent = computed(() => currentSubmission.value?.content)
    const hasAttachment = computed(() => currentSubmission.value?.attachmentUrl)

    // ===== 2. 题目相关逻辑（支持实时数据响应） =====
    const questionList = computed(() => {
        const qList = homework.value.questionList || homework.value.questions
        if (!qList) return []
        try {
            const parsed = typeof qList === 'string' ? JSON.parse(qList) : qList
            return Array.isArray(parsed) ? parsed : []
        } catch (e) {
            console.error('解析题目列表失败:', e)
            return []
        }
    })

    // ===== 3. 学生答案获取（支持多种数据格式） =====
    const getStudentAnswer = (idx, q) => {
        if (!currentSubmission.value?.structuredAnswers) return ''
        try {
            const ansList = typeof currentSubmission.value.structuredAnswers === 'string'
                ? JSON.parse(currentSubmission.value.structuredAnswers)
                : currentSubmission.value.structuredAnswers

            if (!Array.isArray(ansList)) return ''

            const answer = ansList[idx]?.answer || ansList[idx]?.studentAnswer || ansList[idx]
            return answer || ''
        } catch (e) {
            console.error('解析学生答案失败:', e)
            return ''
        }
    }

    // ===== 4. 正确答案获取 =====
    const getCorrectAnswer = (q) => {
        return q.correctAnswer || q.answer || q.standardAnswer || ''
    }

    // ===== 5. 答案正确性判断（支持多种题型） =====
    const isCorrect = (idx, q) => {
        const sAns = getStudentAnswer(idx, q)
        const cAns = getCorrectAnswer(q)

        if (!sAns || !cAns) return false

        const studentAnswer = String(sAns).trim().toUpperCase()
        const correctAnswer = String(cAns).trim().toUpperCase()

        // 多选题特殊处理（支持逗号、分号、空格分隔）
        if (q.questionType === 'MULTIPLE') {
            const sArr = studentAnswer.split(/[,，;；\s]+/).filter(Boolean).sort()
            const cArr = correctAnswer.split(/[,，;；\s]+/).filter(Boolean).sort()
            return JSON.stringify(sArr) === JSON.stringify(cArr)
        }

        // 判断题特殊处理
        if (q.questionType === 'JUDGE') {
            const trueValues = ['A', '正确', 'TRUE', 'T', '对', '√']
            const falseValues = ['B', '错误', 'FALSE', 'F', '错', '×']

            const sIsTrue = trueValues.includes(studentAnswer)
            const cIsTrue = trueValues.includes(correctAnswer)
            const sIsFalse = falseValues.includes(studentAnswer)
            const cIsFalse = falseValues.includes(correctAnswer)

            return (sIsTrue && cIsTrue) || (sIsFalse && cIsFalse)
        }

        // 其他题型直接比较
        return studentAnswer === correctAnswer
    }

    // 独立检测多选题部分正确逻辑
    const getMultipleChoiceScoreRatio = (idx, q) => {
        const sAns = getStudentAnswer(idx, q)
        const cAns = getCorrectAnswer(q)
        if (!sAns || !cAns) return 0
        const studentAnswer = String(sAns).trim().toUpperCase()
        const correctAnswer = String(cAns).trim().toUpperCase()

        const sArr = studentAnswer.split(/[,，;；\s]+/).filter(Boolean)
        const cArr = correctAnswer.split(/[,，;；\s]+/).filter(Boolean)

        let isSubset = true
        for (const item of sArr) {
            if (!cArr.includes(item)) {
                isSubset = false
                break
            }
        }
        if (isSubset && sArr.length > 0) {
            if (sArr.length === cArr.length) return 1 // 满分
            return 0.5 // 漏选一半
        }
        return 0 // 多选错选0分
    }

    // ===== 6. 自动评分（支持多种题型） =====
    const applyAutoScore = (showMessage = true) => {
        if (!hasQuestions.value) {
            if (showMessage) ElMessage.warning('没有在线题目，无法自动评分')
            return
        }

        autoGrading.value = true
        let total = 0
        let correctCount = 0
        let objectiveCount = 0

        // 临时标记，避免在内部更新questionScores时触发watch
        isInternalUpdating = true
        questionList.value.forEach((q, idx) => {
            // 只对客观题自动评分
            if (['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL'].includes(q.questionType)) {
                objectiveCount++
                let qScore = 0
                if (q.questionType === 'MULTIPLE') {
                    const ratio = getMultipleChoiceScoreRatio(idx, q)
                    if (ratio > 0) {
                        qScore = (q.score || 0) * ratio
                        if (ratio === 1) correctCount++
                    }
                } else if (isCorrect(idx, q)) {
                    qScore = (q.score || 0)
                    correctCount++
                }
                total += qScore
                questionScores.value[idx] = qScore
            }
        })
        isInternalUpdating = false // 恢复标记

        gradeForm.score = total

        if (showMessage) {
            ElMessage.success({
                message: `自动评分完成！客观题 ${correctCount}/${objectiveCount} 正确，得分：${total} 分`,
                duration: 3000
            })
        }

        autoGrading.value = false
    }

    // ===== 6.5 AI智能批改简答题 =====
    const aiGrading = ref(false)
    const applyAiGrading = async (silent = false) => {
        if (!hasQuestions.value) {
            if (!silent) ElMessage.warning('没有在线题目，无法AI批阅')
            return
        }

        const subjectiveQuestions = []
        questionList.value.forEach((q, idx) => {
            const type = (q.questionType || q.type || '').toString().toUpperCase()
            if (['SHORT', 'SHORT_ANSWER', 'ESSAY'].includes(type) || type.includes('简答')) {
                subjectiveQuestions.push({ idx, q })
            }
        })

        if (subjectiveQuestions.length === 0) {
            if (!silent) ElMessage.info('未找到需要AI批阅的简答题')
            return
        }

        aiGrading.value = true
        let aiScoreSum = 0
        let aiComments = []

        try {
            if (!silent) ElMessage.info('AI正在疯狂批阅中，请稍候...')
            // 先应用客观题分数作为底分
            let baseObjectiveScore = 0
            questionList.value.forEach((q, idx) => {
                const type = (q.questionType || q.type || '').toString().toUpperCase()
                if (['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', '1', '2', '3', '4'].includes(type) ||
                    ['单选', '多选', '判断', '填空'].includes(type) ||
                    type.includes('CHOICE') || type.includes('SINGLE') || type.includes('MULTIPLE')) {

                    if (type.includes('MULTIPLE') || type.includes('多选')) {
                        const ratio = getMultipleChoiceScoreRatio(idx, q)
                        baseObjectiveScore += (q.score || 0) * ratio
                    } else if (isCorrect(idx, q)) {
                        baseObjectiveScore += (q.score || 0)
                    }
                }
            })

            for (const item of subjectiveQuestions) {
                const sAns = getStudentAnswer(item.idx, item.q)
                if (!sAns || sAns === '') {
                    aiComments.push(`第${item.idx + 1}题 [0分]: 缺答`)
                    continue
                }
                const res = await aiGradeAnswer({
                    questionContent: item.q.questionContent || item.q.content || '',
                    referenceAnswer: getCorrectAnswer(item.q) || '',
                    studentAnswer: String(sAns),
                    maxScore: item.q.score || 0
                })
                if (res.code === 200 || res.success) {
                    if (res.data) {
                        const qScore = res.data.score || 0
                        aiScoreSum += qScore
                        questionScores.value[item.idx] = qScore
                    }
                }
            }

            gradeForm.score = baseObjectiveScore + aiScoreSum
            // 不再向评语框自动填充详细的 AI 批改过程，保持界面简洁，仅供控制台检查或未来扩展使用
            if (!silent && aiComments.length > 0) {
                console.log('AI批改详情已生成:', aiComments)
            }

            if (!silent) ElMessage.success('智能批阅完成！分值已合并到最终得分。')
        } catch (error) {
            console.error('AI批阅异常', error)
            if (!silent) ElMessage.error('智能批改出错')
        } finally {
            aiGrading.value = false
        }
    }

    // ===== 6.6 一键批量批改发布 =====
    const batchGradingLoading = ref(false)
    const batchAiGrading = async () => {
        const pendingList = submissions.value.filter(s => s.status == 1)
        if (pendingList.length === 0) {
            ElMessage.warning('没有待批改的作业，或者全被退回了')
            return
        }

        try {
            await ElMessageBox.confirm(`确认使用AI一键批改发布 ${pendingList.length} 份作业？系统将自动判分并保存提交。`, '一键批改发布', {
                confirmButtonText: '确认一键发布',
                cancelButtonText: '取消',
                type: 'warning'
            })
        } catch {
            return
        }

        batchGradingLoading.value = true
        let successCount = 0
        // Save old status
        const originalSubId = currentSubmission.value?.studentReportId

        try {
            const loadingInstance = ElMessage({
                message: `正在批量AI批阅中 (0/${pendingList.length})...`,
                type: 'info',
                duration: 0
            })

            for (let i = 0; i < pendingList.length; i++) {
                const sub = pendingList[i]
                loadingInstance.message = `正在批量AI批阅中 (${i + 1}/${pendingList.length}): ${sub.studentName}`
                // 1. Select student gently
                selectSubmission(sub)

                // 2. Score via objective rules (applyAutoScore logic but without message)
                applyAutoScore(false)

                // 3. AI grading for subjective (silent)
                await applyAiGrading(true)

                // 4. Submit logic (bypassing user confirm step, silent)
                const maxScore = homework.value.totalScore || 100
                if (gradeForm.score < 0 || gradeForm.score > maxScore) {
                    // fall back
                    gradeForm.score = Math.min(Math.max(gradeForm.score, 0), maxScore)
                }

                const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
                const res = await gradeLabReport(currentSubmission.value.studentReportId, {
                    score: gradeForm.score,
                    teacherComment: gradeForm.teacherComment,
                    teacherId: teacherId,
                    gradedAt: new Date().toISOString()
                })

                if (res.success) {
                    successCount++
                    currentSubmission.value.status = 2
                    currentSubmission.value.score = gradeForm.score
                    currentSubmission.value.teacherComment = gradeForm.teacherComment
                }
            }
            loadingInstance.close()
            ElMessage.success(`一键批改发布完成！共成功批阅 ${successCount} 份作业。`)

            // Restore selection or select next pending
            const nextPending = submissions.value.find(s => s.status == 1)
            if (nextPending) {
                selectSubmission(nextPending)
            } else if (originalSubId) {
                const orig = submissions.value.find(s => s.studentReportId === originalSubId)
                if (orig) selectSubmission(orig)
            }
        } catch (e) {
            console.error('批量批阅中断', e)
            ElMessage.error('一键批阅中断，部分作业可能未保存')
        } finally {
            batchGradingLoading.value = false
        }
    }

    // ===== 7. 题型文本映射 =====
    const getQuestionTypeText = (type) => {
        const types = {
            SINGLE: '单选题',
            MULTIPLE: '多选题',
            JUDGE: '判断题',
            FILL: '填空题',
            ESSAY: '简答题',
            CODE: '编程题'
        }
        return types[type] || type
    }

    // 解析选项
    const parseOptions = (options) => {
        if (!options) return []
        try {
            const parsed = typeof options === 'string' ? JSON.parse(options) : options
            return Array.isArray(parsed) ? parsed : []
        } catch (e) {
            console.error('解析选项失败:', e)
            return []
        }
    }

    // ===== 8. 题型标签颜色 =====
    const getQuestionTypeTag = (type) => {
        const tags = {
            SINGLE: 'primary',
            MULTIPLE: 'success',
            JUDGE: 'warning',
            FILL: 'info',
            ESSAY: 'danger',
            CODE: ''
        }
        return tags[type] || 'info'
    }

    // ===== 9. 选择学生提交 =====
    const selectSubmission = (sub) => {
        if (!sub) return

        isInternalUpdating = true
        currentSubmission.value = sub
        gradeForm.score = sub.score || 0
        gradeForm.teacherComment = sub.teacherComment || ''

        // 1. 初始化题目得分列表为0
        questionScores.value = new Array(questionList.value.length).fill(0)

        // 2. 即使已批改，也尝试静默执行一次自动评分以展示客观题的分数分布
        if (hasQuestions.value) {
            // 这里我们手动执行客观题评分逻辑，不要改变 gradeForm.score
            questionList.value.forEach((q, idx) => {
                if (['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL'].includes(q.questionType)) {
                    let qScore = 0
                    if (q.questionType === 'MULTIPLE') {
                        const ratio = getMultipleChoiceScoreRatio(idx, q)
                        qScore = (q.score || 0) * ratio
                    } else if (isCorrect(idx, q)) {
                        qScore = (q.score || 0)
                    }
                    questionScores.value[idx] = qScore
                }
            })
        }

        // 3. 如果当前是从数据库加载的有分数值的状态，尝试分配剩余分数到主观题，防止总分被重置
        if (sub.score > 0) {
            const objectiveSum = questionScores.value.reduce((a, b) => a + b, 0)
            const gap = sub.score - objectiveSum
            if (gap > 0) {
                // 找到第一个主观题，把差额补上去，保证页面显示的总分和列表一致
                const firstSubjectiveIdx = questionList.value.findIndex(q => 
                    !['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL'].includes(q.questionType)
                )
                if (firstSubjectiveIdx !== -1) {
                    questionScores.value[firstSubjectiveIdx] = gap
                }
            }
        }

        isInternalUpdating = false

        // 4. 重置总分，确保与列表一致
        gradeForm.score = sub.score || 0

        // 智能选择默认标签页
        if (hasQuestions.value) {
            activeTab.value = 'questions'
            // 如果还未有任何打分记录，且不是已批改状态，触发提示型的自动打分
            if (sub.status != 2 && sub.status !== 'GRADED' && (!sub.score || sub.score === 0)) {
                setTimeout(() => applyAutoScore(true), 300)
            }
        } else if (hasAttachment.value) {
            activeTab.value = 'attachment'
        } else if (hasContent.value) {
            activeTab.value = 'content'
        }
    }

    // ===== 10. 加载数据（支持错误处理和重试） =====
    const loadData = async (retry = 0) => {
        loading.value = true
        try {
            const id = route.params.id

            if (!id) {
                throw new Error('作业ID不存在')
            }

            // 并行加载作业详情和提交列表
            const [hwRes, subRes] = await Promise.all([
                getLabReportDetail(id),
                getSubmissions(id)
            ])

            if (hwRes.success) {
                homework.value = hwRes.data || {}
            } else {
                throw new Error(hwRes.message || '加载作业详情失败')
            }

            if (subRes.success) {
                const submissionList = subRes.data || []

                // 并行获取每个学生的头像信息
                const submissionsWithAvatar = await Promise.all(
                    submissionList.map(async (sub) => {
                        try {
                            const profileRes = await getProfile(sub.studentId)
                            if (profileRes.success && profileRes.data) {
                                return {
                                    ...sub,
                                    studentAvatar: profileRes.data.studentsHead || profileRes.data.studentAvatar
                                }
                            }
                        } catch (e) {
                            console.warn('获取学生头像失败:', sub.studentId, e)
                        }
                        return sub
                    })
                )

                submissions.value = submissionsWithAvatar

                // 检查纯客观题自动批改状态
                const isOnlyObjective = questionList.value.length > 0 && questionList.value.every(q => {
                    const type = (q.questionType || q.type || '').toString().toUpperCase()
                    return ['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', '1', '2', '3', '4'].includes(type) ||
                        ['单选', '多选', '判断', '填空'].includes(type) ||
                        type.includes('CHOICE') || type.includes('SINGLE') || type.includes('MULTIPLE')
                })

                if (isOnlyObjective) {
                    submissions.value.forEach(sub => {
                        // 如果后端未将纯客观题标记为已批改，且学生已提交（有客观题答案）则将其视为已批改
                        if (sub.status != 2 && sub.status !== 'GRADED') {
                            if (sub.score > 0 || sub.structuredAnswers) {
                                sub.status = 2 // 强制标记为已评分
                            }
                        }
                    })
                }

                // 自动选择第一个符合条件的提交
                if (!currentSubmission.value && submissions.value.length > 0) {
                    const firstPending = submissions.value.find(s => s.status == 1)
                    selectSubmission(firstPending || submissions.value[0])
                }
            } else {
                throw new Error(subRes.message || '加载提交列表失败')
            }
        } catch (error) {
            console.error('加载数据失败:', error)

            // 支持重试机制（最多3次）
            if (retry < 3) {
                ElMessage.warning(`加载失败，正在重试... (${retry + 1}/3)`)
                setTimeout(() => loadData(retry + 1), 1000)
            } else {
                ElMessage.error({
                    message: error.message || '加载数据失败，请刷新页面重试',
                    duration: 5000
                })
            }
        } finally {
            loading.value = false
        }
    }

    // ===== 11. 筛选提交列表（支持实时搜索） =====
    const filteredSubmissions = computed(() => {
        let result = submissions.value

        if (filterStatus.value === 'PENDING') {
            result = result.filter(s => s.status == 1 || s.status == 3) // 1 是待批改，3 是被退回（需要重新关注）
        } else if (filterStatus.value === 'GRADED') {
            result = result.filter(s => s.status == 2 || s.status === 'GRADED') // 退回（3）目前当做未批改
        }

        if (searchKeyword.value) {
            const kw = searchKeyword.value.toLowerCase().trim()
            result = result.filter(s =>
                (s.studentName && s.studentName.toLowerCase().includes(kw)) ||
                (s.studentId && s.studentId.toLowerCase().includes(kw)) ||
                (s.studentNumber && s.studentNumber.toLowerCase().includes(kw))
            )
        }

        return result
    })

    // ===== 12. 已批改数量统计 =====
    const gradedCount = computed(() => {
        return submissions.value.filter(s => s.status == 2 || s.status === 'GRADED').length
    })

    // ===== 13. 日期格式化 =====
    const formatDate = (date) => {
        if (!date) return '-'
        try {
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (e) {
            return date
        }
    }

    // ===== 13.5 获取学生头像URL =====
    const getStudentAvatarUrl = (student) => {
        if (!student || !student.studentAvatar) return ''
        if (student.studentAvatar.startsWith('http')) return student.studentAvatar
        return `http://localhost:8088${student.studentAvatar}`
    }

    // ===== 14. 文件下载 =====
    const downloadFile = (url) => {
        if (!url) {
            ElMessage.warning('文件地址不存在')
            return
        }
        const fileName = getFileName(url)
        ElMessage.info(`正在准备下载：${fileName}`)
        downloadFileUtil(url, fileName)
    }

    // ===== 15. 提交批改（支持验证和确认，新增 targetStatus 参数支持暂存/发布） =====
    const submitGrade = async (targetStatus = 2) => {
        if (!currentSubmission.value) {
            ElMessage.warning('请先选择一个学生提交')
            return
        }
        
        const isDraft = targetStatus === 1

        // 验证分数
        const maxScore = homework.value.totalScore || 100
        if (gradeForm.score < 0 || gradeForm.score > maxScore) {
            ElMessage.warning(`分数必须在 0-${maxScore} 之间`)
            return
        }

        // 确认提交
        try {
            await ElMessageBox.confirm(
                isDraft ? `确定暂存 ${currentSubmission.value.studentName} 的成绩吗？（学生暂时不可见）` : `确认给 ${currentSubmission.value.studentName} 评分并发布吗？`,
                isDraft ? '确认暂存' : '确认批改发布',
                {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: isDraft ? 'info' : 'warning'
                }
            )
        } catch {
            return
        }


        submitting.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            if (!teacherId) {
                throw new Error('教师ID不存在，请重新登录')
            }

            const response = await gradeLabReport(currentSubmission.value.studentReportId, {
                score: gradeForm.score,
                teacherComment: gradeForm.teacherComment,
                teacherId: teacherId,
                status: targetStatus,
                gradedAt: new Date().toISOString()
            })

            if (response.success) {
                ElMessage.success(isDraft ? '暂存成功！' : '批改并发布成功！')

                // 更新当前提交状态和列表中的数据
                currentSubmission.value.status = targetStatus
                currentSubmission.value.score = gradeForm.score
                currentSubmission.value.teacherComment = gradeForm.teacherComment
                
                // 同步到 submissions 列表
                const subIndex = submissions.value.findIndex(s => s.studentReportId === currentSubmission.value.studentReportId)
                if (subIndex !== -1) {
                    submissions.value[subIndex].status = targetStatus
                    submissions.value[subIndex].score = gradeForm.score
                }
                const pendingIndex = submissions.value.findIndex(s => s.status == 1)
                if (pendingIndex !== -1 && !isDraft) { // 只有非暂存才跳到下一个
                    setTimeout(() => {
                        selectSubmission(submissions.value[pendingIndex])
                        ElMessage.info('已自动切换到下一个待批改作业')
                    }, 500)
                } else if (!isDraft) {
                    ElMessage.success('所有作业已批改完成！')
                }
            } else {
                throw new Error(response.message || '批改失败')
            }
        } catch (e) {
            ElMessage.error(e.message || '批改保存失败，请重试')
        } finally {
            submitting.value = false
        }
    }

    // ===== 15.5 退回重写 =====
    const returnForRevision = async () => {
        if (!currentSubmission.value) {
            ElMessage.warning('请先选择一个学生提交')
            return
        }

        try {
            await ElMessageBox.confirm(
                `确认将 ${currentSubmission.value.studentName} 的作业退回重写吗？`,
                '退回重写',
                {
                    confirmButtonText: '确认退回',
                    cancelButtonText: '取消',
                    type: 'danger'
                }
            )
        } catch {
            return
        }

        submitting.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            // 使用现有API修改状态为 3 （退回）
            const response = await gradeLabReport(currentSubmission.value.studentReportId, {
                score: 0,
                teacherComment: gradeForm.teacherComment || '您的作业不符合要求，请退回重写。',
                teacherId: teacherId,
                status: 3, // 添加特定状态字段，需要后端配合或通过score区分
                gradedAt: new Date().toISOString()
            })

            if (response.success || response.code === 200) {
                ElMessage.success('已退回重写！')
                currentSubmission.value.status = 3
                currentSubmission.value.teacherComment = gradeForm.teacherComment || '您的作业不符合要求，请退回重写。'
            } else {
                throw new Error(response.message || '退回失败')
            }
        } catch (e) {
            ElMessage.error(e.message || '操作失败，请重试')
        } finally {
            submitting.value = false
        }
    }

    // ===== 16. 监听搜索关键词变化 =====
    watch(searchKeyword, (newVal) => {
        // 搜索时自动选择第一个匹配的提交
        if (newVal && filteredSubmissions.value.length > 0) {
            selectSubmission(filteredSubmissions.value[0])
        }
    })

    onMounted(loadData)

    return {
        homework,
        submissions,
        loading,
        searchKeyword,
        currentSubmission,
        activeTab,
        submitting,
        autoGrading,
        gradeForm,
        questionList,
        filterStatus,
        filteredSubmissions,
        gradedCount,
        hasSubmissions,
        hasQuestions,
        hasContent,
        hasAttachment,
        selectSubmission,
        formatDate,
        downloadFile,
        submitGrade,
        returnForRevision,
        getStudentAnswer,
        getCorrectAnswer,
        isCorrect,
        applyAutoScore,
        aiGrading,
        applyAiGrading,
        batchAiGrading,
        batchGradingLoading,
        questionScores, // 暴露 questionScores
        getQuestionTypeText,
        getQuestionTypeTag,
        getStudentAvatarUrl,
        parseOptions,
        loadData
    }
}
