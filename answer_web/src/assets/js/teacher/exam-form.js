import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { createExam, generateQuestionsWithAi, getExamDetail, updateExam, saveExamQuestions } from '@/api/exam.js'
import { getQuestionList } from '@/api/question.js'

export function useExamForm() {
    const route = useRoute()
    const router = useRouter()

    const isEdit = computed(() => route.params.id && route.params.id !== 'create')
    const activeTab = ref('manual')
    const submitting = ref(false)
    const courses = ref([])
    const timeRange = ref([])

    const examForm = reactive({
        examTitle: '',
        courseId: '',
        examDescription: '',
        duration: 60,
        totalScore: 0,
        passScore: 0
    })

    // 手动创建相关
    const manualQuestions = ref([])

    // AI 相关
    const aiForm = reactive({
        courseName: '',
        questionCount: 5,
        questionTypes: ['SINGLE', 'MULTIPLE']
    })

    const aiQuestions = ref([])
    const aiLoading = ref(false)

    // 题库选择相关
    const bankDialogVisible = ref(false)
    const bankLoading = ref(false)
    const bankQuestions = ref([])
    const bankFilter = reactive({ courseId: '', type: '', keyword: '' })
    const bankPagination = reactive({ current: 1, size: 10, total: 0 })
    const selectedBankQuestions = ref([])

    // 题目编辑
    const questionDialogVisible = ref(false)
    const isEditQuestion = ref(false)
    const questionForm = reactive({
        questionId: null,
        questionType: 'SINGLE_CHOICE',
        questionContent: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        correctAnswerArray: [],
        score: 10,
        analysis: ''
    })

    const canGenerateAi = computed(() => {
        return examForm.courseId &&
            examForm.examTitle &&
            aiForm.courseName.trim() &&
            aiForm.questionTypes.length > 0 &&
            timeRange.value &&
            timeRange.value.length === 2
    })

    const totalAiScore = computed(() => {
        return aiQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
    })

    const totalManualScore = computed(() => {
        return manualQuestions.value.reduce((sum, q) => sum + (Number(q.score) || 0), 0)
    })

    watch(totalManualScore, (newTotal) => {
        examForm.totalScore = newTotal
        examForm.passScore = Math.floor(newTotal * 0.6)
    })

    // === 考试时间与时长双向绑定逻辑 ===
    let isInternalChange = false // 防止循环触发

    // 1. 监听时间范围变化 -> 更新时长
    watch(timeRange, (newRange) => {
        if (isInternalChange) return
        if (newRange && newRange.length === 2) {
            const start = new Date(newRange[0]).getTime()
            const end = new Date(newRange[1]).getTime()
            if (end > start) {
                const diffMinutes = Math.floor((end - start) / (1000 * 60))
                isInternalChange = true
                examForm.duration = diffMinutes
                setTimeout(() => { isInternalChange = false }, 50)
            }
        }
    })

    // 2. 监听时长变化 -> 更新结束时间
    watch(() => examForm.duration, (newDuration) => {
        if (isInternalChange) return
        if (newDuration && timeRange.value && timeRange.value[0]) {
            const start = new Date(timeRange.value[0]).getTime()
            const newEnd = new Date(start + newDuration * 60 * 1000)

            const formatStr = (date) => {
                const d = new Date(date)
                return d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0') + ' ' +
                    String(d.getHours()).padStart(2, '0') + ':' +
                    String(d.getMinutes()).padStart(2, '0') + ':' +
                    String(d.getSeconds()).padStart(2, '0')
            }

            isInternalChange = true
            timeRange.value = [timeRange.value[0], formatStr(newEnd)]
            setTimeout(() => { isInternalChange = false }, 50)
        }
    })

    const canCreateManual = computed(() => {
        return examForm.courseId &&
            examForm.examTitle &&
            manualQuestions.value.length > 0 &&
            timeRange.value &&
            timeRange.value.length === 2
    })

    const loadCourses = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })
            if (response.success && response.data) {
                courses.value = response.data.list || []
            }
        } catch (error) {
            console.error('加载课程列表失败:', error)
        }
    }

    const handleCourseChange = (courseId) => {
        const selectedCourse = courses.value.find(c => c.id === courseId)
        if (selectedCourse) {
            aiForm.courseName = selectedCourse.courseName
            if (!examForm.examTitle) {
                examForm.examTitle = `${selectedCourse.courseName} - 考试`
            }
        }
    }

    const addManualQuestion = () => {
        isEditQuestion.value = false
        Object.assign(questionForm, {
            questionId: null,
            questionType: 'SINGLE_CHOICE',
            questionContent: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            correctAnswerArray: [],
            score: 10,
            analysis: ''
        })
        questionDialogVisible.value = true
    }

    const editManualQuestion = (index) => {
        const question = manualQuestions.value[index]

        const typeMapping = {
            'SINGLE': 'SINGLE_CHOICE',
            'MULTIPLE': 'MULTIPLE_CHOICE',
            'JUDGE': 'TRUE_FALSE',
            'FILL_BLANK': 'FILL_BLANK',
            'SHORT_ANSWER': 'SHORT_ANSWER'
        }

        isEditQuestion.value = true
        const mappedType = typeMapping[question.questionType] || 'SINGLE_CHOICE'

        Object.assign(questionForm, {
            questionId: index,
            questionType: mappedType,
            questionContent: question.questionContent,
            options: getOptionsForEdit(question.questionOptions),
            correctAnswer: mappedType === 'TRUE_FALSE'
                ? normalizeJudgeAnswer(question.answer || question.correctAnswer)
                : (question.answer || question.correctAnswer),
            correctAnswerArray: (question.questionType === 'MULTIPLE' || question.questionType === 'MULTIPLE_CHOICE')
                ? (question.answer || question.correctAnswer || '').split('') : [],
            score: question.score,
            analysis: question.analysis || ''
        })

        questionDialogVisible.value = true
    }

    const deleteManualQuestion = (index) => {
        ElMessageBox.confirm('确定要删除这道题目吗？', '删除确认', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            manualQuestions.value.splice(index, 1)
            calculateTotal()
            ElMessage.success('删除成功')
        }).catch(() => { })
    }

    // 题库选题方法
    const openBankSelection = () => {
        bankFilter.courseId = examForm.courseId
        bankDialogVisible.value = true
        searchBank()
    }

    const searchBank = async () => {
        bankLoading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id') || '1'
            const res = await getQuestionList({
                pageNum: bankPagination.current,
                pageSize: bankPagination.size,
                teacherId: teacherId,
                ...bankFilter
            })
            if (res.success) {
                bankQuestions.value = res.data.records
                bankPagination.total = res.data.total
            }
        } finally {
            bankLoading.value = false
        }
    }

    const handleBankSelection = (val) => {
        selectedBankQuestions.value = val
    }

    const confirmImportFromBank = () => {
        const newQs = selectedBankQuestions.value.map(q => {
            const qClone = JSON.parse(JSON.stringify(q))

            let opts = qClone.options
            // Ensure options are handled correctly (might be string or array)
            if (typeof opts === 'string') {
                try {
                    const parsed = JSON.parse(opts)
                    opts = JSON.stringify(parsed)
                } catch (e) { }
            } else if (Array.isArray(opts)) {
                opts = JSON.stringify(opts)
            } else if (['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(qClone.type) && (!opts || opts === 'null')) {
                // Fix for missing options in Judgment questions from bank
                opts = JSON.stringify([
                    { text: 'A. 正确', isCorrect: false },
                    { text: 'B. 错误', isCorrect: false }
                ])
            }

            return {
                questionType: qClone.type,
                questionContent: qClone.content,
                questionOptions: opts,
                correctAnswer: qClone.answer, // Unified field name
                score: 5,
                analysis: qClone.analysis
            }
        })

        manualQuestions.value.push(...newQs)
        calculateTotal()
        bankDialogVisible.value = false
        selectedBankQuestions.value = []
        ElMessage.success(`成功导入 ${newQs.length} 道题目`)
    }

    const isCorrectOption = (question, optIdx) => {
        if (question.questionType === 'SINGLE') {
            return question.correctAnswer === String.fromCharCode(65 + optIdx)
        }
        if (question.questionType === 'MULTIPLE') {
            return question.correctAnswer && question.correctAnswer.includes(String.fromCharCode(65 + optIdx))
        }
        // Simplified Judgment display handled in template logic
        return false
    }

    const calculateTotal = () => {
        const total = manualQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
        examForm.totalScore = total
    }

    const getQuestionTypeTag = (type) => {
        const typeMap = {
            'SINGLE': 'primary',
            'MULTIPLE': 'success',
            'JUDGE': 'warning',
            'FILL_BLANK': 'info',
            'SHORT_ANSWER': 'danger'
        }
        return typeMap[type] || 'info'
    }

    const getQuestionTypeText = (type) => {
        const textMap = {
            'SINGLE': '单选题',
            'MULTIPLE': '多选题',
            'JUDGE': '判断题',
            'FILL_BLANK': '填空题',
            'SHORT_ANSWER': '简答题'
        }
        return textMap[type] || type
    }

    const parseOptions = (optionsStr) => {
        try {
            return JSON.parse(optionsStr)
        } catch {
            return []
        }
    }

    const generateWithAi = async () => {
        if (!examForm.courseId) {
            ElMessage.warning('请先选择课程')
            return
        }

        if (!examForm.examTitle) {
            ElMessage.warning('请先填写考试标题')
            return
        }

        if (!aiForm.courseName.trim()) {
            ElMessage.warning('请输入课程名称')
            return
        }

        if (aiForm.questionTypes.length === 0) {
            ElMessage.warning('请至少选择一种题型')
            return
        }

        if (!timeRange.value || timeRange.value.length !== 2) {
            ElMessage.warning('请选择考试时间')
            return
        }

        aiLoading.value = true
        ElMessage.info('AI正在生成题目，请稍候...')

        try {
            const data = {
                courseName: aiForm.courseName,
                questionCount: aiForm.questionCount,
                questionTypes: aiForm.questionTypes.join(',')
            }

            const response = await generateQuestionsWithAi(data)

            if (response.code === 200 || response.success) {
                aiQuestions.value = response.data || []

                if (aiQuestions.value.length > 0) {
                    ElMessage.success(`AI成功生成 ${aiQuestions.value.length} 道题目！请预览并确认`)

                    setTimeout(() => {
                        const previewEl = document.querySelector('.ai-preview')
                        if (previewEl) {
                            previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                    }, 100)
                } else {
                    ElMessage.warning('AI未生成题目，请重试')
                }
            } else {
                ElMessage.error(response.message || 'AI生成失败，请重试')
            }
        } catch (error) {
            console.error('AI 生成失败:', error)
            ElMessage.error('AI生成失败，请检查网络或稍后重试')
        } finally {
            aiLoading.value = false
        }
    }

    const getOptionsForEdit = (optionsRaw) => {
        const opts = parseOptions(optionsRaw)
        if (Array.isArray(opts)) {
            return opts.map(o => (typeof o === 'object' && o !== null) ? (o.text || '') : String(o))
        }
        return ['', '', '', '']
    }

    const normalizeJudgeAnswer = (ans) => {
        if (ans === '正确' || ans === '对' || ans === 'true' || ans === 'True') return 'A'
        if (ans === '错误' || ans === '错' || ans === 'false' || ans === 'False') return 'B'
        return ans
    }

    const editAiQuestion = (index) => {
        const question = aiQuestions.value[index]

        const typeMapping = {
            'SINGLE': 'SINGLE_CHOICE',
            'MULTIPLE': 'MULTIPLE_CHOICE',
            'JUDGE': 'TRUE_FALSE',
            'FILL_BLANK': 'FILL_BLANK',
            'SHORT_ANSWER': 'SHORT_ANSWER'
        }

        isEditQuestion.value = true
        const mappedType = typeMapping[question.questionType] || 'SINGLE_CHOICE'

        Object.assign(questionForm, {
            questionId: index,
            questionType: mappedType,
            questionContent: question.questionContent,
            options: getOptionsForEdit(question.questionOptions),
            correctAnswer: mappedType === 'TRUE_FALSE'
                ? normalizeJudgeAnswer(question.answer || question.correctAnswer)
                : (question.answer || question.correctAnswer),
            correctAnswerArray: (question.questionType === 'MULTIPLE' || question.questionType === 'MULTIPLE_CHOICE')
                ? (question.answer || question.correctAnswer || '').split('') : [],
            score: question.score,
            analysis: question.analysis || ''
        })

        questionDialogVisible.value = true
    }

    const deleteAiQuestion = (index) => {
        ElMessageBox.confirm('确定要删除这道题目吗？', '删除确认', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            aiQuestions.value.splice(index, 1)
            ElMessage.success('删除成功')
        }).catch(() => { })
    }

    const addOption = () => {
        if (questionForm.options.length < 6) {
            questionForm.options.push('')
        }
    }

    const removeOption = (index) => {
        if (questionForm.options.length > 2) {
            questionForm.options.splice(index, 1)
        }
    }

    const saveQuestion = async () => {
        if (!questionForm.questionContent) {
            ElMessage.warning('请输入题目内容')
            return
        }

        if (questionForm.questionType === 'MULTIPLE_CHOICE') {
            questionForm.correctAnswer = questionForm.correctAnswerArray.join('')
        }

        if (!questionForm.correctAnswer) {
            ElMessage.warning('请输入正确答案')
            return
        }

        const typeMap = {
            'SINGLE_CHOICE': 'SINGLE',
            'MULTIPLE_CHOICE': 'MULTIPLE',
            'TRUE_FALSE': 'JUDGE',
            'FILL_BLANK': 'FILL_BLANK',
            'SHORT_ANSWER': 'SHORT_ANSWER'
        }

        let optionsData = null
        if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.questionType)) {
            optionsData = questionForm.options
                .filter(o => o)
                .map((opt, idx) => {
                    const char = String.fromCharCode(65 + idx)
                    let isCorrect = false
                    if (questionForm.questionType === 'SINGLE_CHOICE') {
                        isCorrect = questionForm.correctAnswer === char
                    } else {
                        isCorrect = questionForm.correctAnswerArray.includes(char)
                    }
                    return { text: opt, isCorrect }
                })
        } else if (questionForm.questionType === 'TRUE_FALSE') {
            optionsData = [
                { text: 'A. 正确', isCorrect: questionForm.correctAnswer === 'A' || questionForm.correctAnswer === '正确' || questionForm.correctAnswer === '对' },
                { text: 'B. 错误', isCorrect: questionForm.correctAnswer === 'B' || questionForm.correctAnswer === '错误' || questionForm.correctAnswer === '错' }
            ]
        }

        const questionData = {
            questionType: typeMap[questionForm.questionType] || questionForm.questionType,
            questionContent: questionForm.questionContent,
            questionOptions: optionsData ? JSON.stringify(optionsData) : null,
            answer: questionForm.questionType === 'MULTIPLE_CHOICE'
                ? questionForm.correctAnswerArray.join('')
                : questionForm.correctAnswer,
            score: questionForm.score,
            analysis: questionForm.analysis
        }

        if (isEditQuestion.value && typeof questionForm.questionId === 'number') {
            const index = questionForm.questionId

            // 根据当前 tab 判断是编辑 AI 题目还是手动题目
            if (activeTab.value === 'ai' && index >= 0 && index < aiQuestions.value.length) {
                aiQuestions.value[index] = { ...questionData }
                ElMessage.success('题目更新成功')
                questionDialogVisible.value = false
                return
            } else if (activeTab.value === 'manual' && index >= 0 && index < manualQuestions.value.length) {
                manualQuestions.value[index] = { ...questionData }
                ElMessage.success('题目更新成功')
                questionDialogVisible.value = false
                return
            }
        }

        // 新增题目
        if (activeTab.value === 'manual') {
            manualQuestions.value.push({ ...questionData })
        }

        ElMessage.success('题目保存成功')
        questionDialogVisible.value = false
    }

    const processQuestionsForSubmit = (list) => {
        return list.map((q, idx) => {
            let opts = q.questionOptions
            let ans = q.answer || q.correctAnswer

            if (typeof opts === 'object' && opts !== null) {
                opts = JSON.stringify(opts)
            }

            if (['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(q.questionType) && (!opts || opts === 'null')) {
                const isACorrect = ans === 'A' || ans === '对' || ans === '正确' || ans === 'true' || ans === 'True' || ans === '1'
                const isBCorrect = ans === 'B' || ans === '错' || ans === '错误' || ans === 'false' || ans === 'False' || ans === '0'

                opts = JSON.stringify([
                    { text: 'A. 正确', isCorrect: isACorrect },
                    { text: 'B. 错误', isCorrect: isBCorrect }
                ])

                if (isACorrect) ans = 'A'
                else if (isBCorrect) ans = 'B'
            }

            return {
                ...q,
                questionOptions: opts,
                answer: ans,
                questionOrder: idx + 1
            }
        })
    }

    const confirmCreateManual = async () => {
        if (!examForm.courseId) {
            ElMessage.warning('请选择课程')
            return
        }

        if (!examForm.examTitle) {
            ElMessage.warning('请输入考试标题')
            return
        }

        if (manualQuestions.value.length === 0) {
            ElMessage.warning('请至少添加一道题目')
            return
        }

        if (!timeRange.value || timeRange.value.length !== 2) {
            ElMessage.warning('请选择考试时间')
            return
        }

        try {
            submitting.value = true

            const data = {
                courseId: examForm.courseId,
                teacherId: localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
                examTitle: examForm.examTitle,
                examDescription: examForm.examDescription || '',
                startTime: timeRange.value[0],
                endTime: timeRange.value[1],
                duration: examForm.duration || 60,
                totalScore: examForm.totalScore,
                passScore: examForm.passScore,
                questions: processQuestionsForSubmit(manualQuestions.value)
            }

            const response = await createExam(data)

            if (response.code === 200 || response.success) {
                const examId = response.data

                ElMessage.success('考试创建成功！')

                ElMessageBox.confirm(
                    `考试创建成功！是否立即查看？`,
                    '创建成功',
                    {
                        confirmButtonText: '查看考试',
                        cancelButtonText: '返回列表',
                        type: 'success'
                    }
                ).then(() => {
                    router.push(`/teacher/exam/${examId}`)
                }).catch(() => {
                    router.push('/teacher/exams')
                })
            } else {
                ElMessage.error(response.message || '创建考试失败')
            }
        } catch (error) {
            console.error('创建考试失败:', error)
            ElMessage.error('创建考试失败')
        } finally {
            submitting.value = false
        }
    }

    const confirmCreateWithAi = async () => {
        if (aiQuestions.value.length === 0) {
            ElMessage.warning('没有可用的题目')
            return
        }

        if (!timeRange.value || timeRange.value.length !== 2) {
            ElMessage.warning('请选择考试时间')
            return
        }

        try {
            submitting.value = true

            const totalScore = aiQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
            const passScore = Math.floor(totalScore * 0.6)

            const data = {
                courseId: examForm.courseId,
                teacherId: localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
                examTitle: examForm.examTitle,
                examDescription: `AI 自动生成试卷 - ${aiForm.courseName}`,
                startTime: timeRange.value[0],
                endTime: timeRange.value[1],
                duration: examForm.duration || 60,
                totalScore: totalScore,
                passScore: passScore,
                questions: processQuestionsForSubmit(aiQuestions.value)
            }

            const response = await createExam(data)

            if (response.code === 200 || response.success) {
                const examId = response.data

                ElMessage.success('考试创建成功！')

                ElMessageBox.confirm(
                    `考试创建成功！是否立即查看？`,
                    '创建成功',
                    {
                        confirmButtonText: '查看考试',
                        cancelButtonText: '返回列表',
                        type: 'success'
                    }
                ).then(() => {
                    router.push(`/teacher/exam/${examId}`)
                }).catch(() => {
                    router.push('/teacher/exams')
                })
            } else {
                ElMessage.error(response.message || '创建考试失败')
            }
        } catch (error) {
            console.error('创建考试失败:', error)
            ElMessage.error('创建考试失败')
        } finally {
            submitting.value = false
        }
    }

    const confirmUpdate = async () => {
        if (!examForm.examTitle) {
            ElMessage.warning('请输入考试标题')
            return
        }

        if (manualQuestions.value.length === 0) {
            ElMessage.warning('请至少添加一道题目')
            return
        }

        if (!timeRange.value || timeRange.value.length !== 2) {
            ElMessage.warning('请选择考试时间')
            return
        }

        try {
            submitting.value = true
            const examId = route.params.id

            // 1. 更新考试基础信息
            const examInfo = {
                courseId: examForm.courseId,
                examTitle: examForm.examTitle,
                examDescription: examForm.examDescription || '',
                startTime: timeRange.value[0],
                endTime: timeRange.value[1],
                duration: examForm.duration,
                totalScore: examForm.totalScore,
                passScore: examForm.passScore
            }

            const updateRes = await updateExam(examId, examInfo)
            if (!updateRes.success && updateRes.code !== 200) {
                throw new Error(updateRes.message || '更新考试基础信息失败')
            }

            // 2. 更新试题
            const questionsData = processQuestionsForSubmit(manualQuestions.value)

            const questionsRes = await saveExamQuestions(examId, questionsData)
            if (!questionsRes.success && questionsRes.code !== 200) {
                throw new Error(questionsRes.message || '保存试题失败')
            }

            ElMessage.success('考试更新成功！')
            router.push(`/teacher/exam/${examId}`)
        } catch (error) {
            console.error('更新考试失败:', error)
            ElMessage.error(error.message || '更新考试失败')
        } finally {
            submitting.value = false
        }
    }

    const goBack = () => {
        router.back()
    }

    const fetchExamData = async () => {
        if (!isEdit.value) return

        try {
            const examId = route.params.id
            const response = await getExamDetail(examId)
            if ((response.success || response.code === 200) && response.data) {
                // 兼容不同的后端返回结构
                let exam, examQuestions;
                if (response.data.exam) {
                    exam = response.data.exam
                    examQuestions = response.data.questions || response.data.exam.questions || []
                } else {
                    exam = response.data
                    examQuestions = response.data.questions || response.data.questionList || []
                }

                if (!exam) return;

                // 填充基础信息
                Object.assign(examForm, {
                    examTitle: exam.examTitle,
                    courseId: exam.courseId,
                    examDescription: exam.examDescription,
                    duration: exam.duration,
                    totalScore: exam.totalScore,
                    passScore: exam.passScore
                })

                // 填充时间
                if (exam.startTime && exam.endTime) {
                    timeRange.value = [
                        exam.startTime,
                        exam.endTime
                    ]
                }

                // 填充题目
                manualQuestions.value = examQuestions.map(q => ({
                    questionType: q.questionType,
                    questionContent: q.questionContent,
                    questionOptions: q.questionOptions,
                    answer: q.answer || q.correctAnswer,
                    score: q.score,
                    analysis: q.analysis,
                    questionOrder: q.questionOrder
                }))

                calculateTotal()
            }
        } catch (error) {
            console.error('获取考试详情失败:', error)
            ElMessage.error('获取考试详情失败')
        }
    }

    onMounted(() => {
        loadCourses()
        if (isEdit.value) {
            fetchExamData()
        }
    })

    return {
        // State
        isEdit,
        activeTab,
        submitting,
        courses,
        timeRange,
        examForm,
        manualQuestions,
        aiForm,
        aiQuestions,
        aiLoading,
        bankDialogVisible,
        bankLoading,
        bankQuestions,
        bankFilter,
        bankPagination,
        selectedBankQuestions,
        questionDialogVisible,
        isEditQuestion,
        questionForm,

        // Computed
        canGenerateAi,
        totalAiScore,
        totalManualScore,
        canCreateManual,

        // Methods
        loadCourses,
        handleCourseChange,
        addManualQuestion,
        editManualQuestion,
        deleteManualQuestion,
        openBankSelection,
        searchBank,
        handleBankSelection,
        confirmImportFromBank,
        isCorrectOption,
        calculateTotal,
        getQuestionTypeTag,
        getQuestionTypeText,
        parseOptions,
        generateWithAi,
        getOptionsForEdit,
        normalizeJudgeAnswer,
        editAiQuestion,
        deleteAiQuestion,
        addOption,
        removeOption,
        saveQuestion,
        processQuestionsForSubmit,
        confirmCreateManual,
        confirmCreateWithAi,
        confirmUpdate,
        goBack,
        fetchExamData
    }
}
