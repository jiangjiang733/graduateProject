import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLabReportDetail, getSubmissions, gradeLabReport } from '@/api/homework.js'
import { getProfile } from '@/api/student.js'

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

        questionList.value.forEach((q, idx) => {
            // 只对客观题自动评分
            if (['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL'].includes(q.questionType)) {
                objectiveCount++
                if (isCorrect(idx, q)) {
                    total += (q.score || 0)
                    correctCount++
                }
            }
        })

        gradeForm.score = total

        if (showMessage) {
            ElMessage.success({
                message: `自动评分完成！客观题 ${correctCount}/${objectiveCount} 正确，得分：${total} 分`,
                duration: 3000
            })
        }

        autoGrading.value = false
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

        currentSubmission.value = sub
        gradeForm.score = sub.score || 0
        gradeForm.teacherComment = sub.teacherComment || ''

        // 智能选择默认标签页
        if (hasQuestions.value) {
            activeTab.value = 'questions'
            // 未批改且未评分的，自动应用客观题评分
            if (sub.status !== 2 && (!sub.score || sub.score === 0)) {
                setTimeout(() => applyAutoScore(false), 300)
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

                // 自动选择第一个未批改的提交
                if (!currentSubmission.value && submissions.value.length > 0) {
                    const firstPending = submissions.value.find(s => s.status !== 2)
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
        if (!searchKeyword.value) return submissions.value

        const kw = searchKeyword.value.toLowerCase().trim()
        return submissions.value.filter(s =>
            (s.studentName && s.studentName.toLowerCase().includes(kw)) ||
            (s.studentId && s.studentId.toLowerCase().includes(kw)) ||
            (s.studentNumber && s.studentNumber.toLowerCase().includes(kw))
        )
    })

    // ===== 12. 已批改数量统计 =====
    const gradedCount = computed(() => {
        return submissions.value.filter(s => s.status === 2).length
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

        try {
            const link = document.createElement('a')
            link.href = url.startsWith('http') ? url : `/api/${url}`
            link.download = ''
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (e) {
            ElMessage.error('文件下载失败')
        }
    }

    // ===== 15. 提交批改（支持验证和确认） =====
    const submitGrade = async () => {
        if (!currentSubmission.value) {
            ElMessage.warning('请先选择一个学生提交')
            return
        }

        // 验证分数
        const maxScore = homework.value.totalScore || 100
        if (gradeForm.score < 0 || gradeForm.score > maxScore) {
            ElMessage.warning(`分数必须在 0-${maxScore} 之间`)
            return
        }

        // 确认提交
        try {
            await ElMessageBox.confirm(
                `确认给 ${currentSubmission.value.studentName} 评分 ${gradeForm.score} 分吗？`,
                '确认批改',
                {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning'
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
                gradedAt: new Date().toISOString()
            })

            if (response.success) {
                ElMessage.success('批改成功！')

                // 更新当前提交状态
                currentSubmission.value.status = 2
                currentSubmission.value.score = gradeForm.score
                currentSubmission.value.teacherComment = gradeForm.teacherComment

                // 自动跳转到下一个未批改的提交
                const pendingIndex = submissions.value.findIndex(s => s.status !== 2)
                if (pendingIndex !== -1) {
                    setTimeout(() => {
                        selectSubmission(submissions.value[pendingIndex])
                        ElMessage.info('已自动切换到下一个待批改作业')
                    }, 500)
                } else {
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
        getStudentAnswer,
        getCorrectAnswer,
        isCorrect,
        applyAutoScore,
        getQuestionTypeText,
        getQuestionTypeTag,
        getStudentAvatarUrl,
        loadData
    }
}
