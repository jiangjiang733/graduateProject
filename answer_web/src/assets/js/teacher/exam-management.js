import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { getCourseList } from '@/api/course'
import { getQuestionList } from '@/api/question'
import { createExam, updateExam, saveExamQuestions } from '@/api/exam'

export function useExamManagement() {
    const router = useRouter()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const submitting = ref(false)
    const formRef = ref(null)

    const courses = ref([])
    const exams = ref([])
    const filterForm = reactive({
        courseId: '',
        status: '',
        keyword: ''
    })

    const currentPage = ref(1)
    const pageSize = ref(10)

    const paginatedExams = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return exams.value.slice(start, end)
    })

    const handleCurrentChange = (val) => {
        currentPage.value = val
    }

    const handleSizeChange = (val) => {
        pageSize.value = val
        currentPage.value = 1
    }

    const examForm = reactive({
        examId: null,
        examTitle: '',
        courseId: '',
        startTime: '',
        endTime: '',
        duration: 120,
        totalScore: 100,
        passScore: 60,
        status: 'DRAFT',
        timeRange: []
    })

    const rules = {
        examTitle: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
        courseId: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
        timeRange: [{ required: true, message: '请选择考试时间', type: 'array', trigger: 'change' }]
    }

    const bankImportVisible = ref(false)
    const questionsToImport = ref([])
    const selectedImportQuestions = ref([])
    const isImportingToBank = ref(false)
    const currentPublishCourseId = ref(null)

    const onImportSelectionChange = (selection) => {
        selectedImportQuestions.value = selection
    }

    const confirmImportToBank = async () => {
        if (selectedImportQuestions.value.length === 0) {
            bankImportVisible.value = false
            loadExams()
            return
        }
        isImportingToBank.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const imports = selectedImportQuestions.value.map(q => {
                return request.post('/question/create', {
                    courseId: currentPublishCourseId.value,
                    teacherId,
                    type: q.questionType,
                    content: q.questionContent,
                    options: q.questionOptions,
                    correctAnswer: q.answer,
                    analysis: q.analysis,
                    difficulty: 2
                })
            })
            await Promise.all(imports)
            ElMessage.success(`成功将 ${imports.length} 道试题无缝加入课程题芯`)
        } catch (e) {
            ElMessage.error('加入题库发生部分错误')
        } finally {
            isImportingToBank.value = false
            bankImportVisible.value = false
            selectedImportQuestions.value = []
            loadExams()
        }
    }

    const currentStep = ref(1)
    const examQuestions = ref([])

    const bankPickerVisible = ref(false)
    const bankLoading = ref(false)
    const bankQuestions = ref([])
    const bankFilter = reactive({ courseId: '', type: '', keyword: '' })
    const bankPagination = reactive({ current: 1, size: 10, total: 0 })
    const selectedBankQuestions = ref([])

    const questionEditVisible = ref(false)
    const isEditingQuestion = ref(false)
    const editingQuestionIndex = ref(-1)
    const currentQuestion = reactive({
        questionType: 'SINGLE',
        questionContent: '',
        options: ['', '', '', ''],
        correctMap: {},
        answer: '',
        score: 10,
        analysis: ''
    })

    const aiLoading = ref(false)
    const aiPickerVisible = ref(false)
    const aiConfig = reactive({
        courseName: '',
        questionCount: 5,
        defaultScore: 10,
        questionTypes: ['SINGLE', 'MULTIPLE']
    })

    const canGenerateAi = computed(() => {
        return examForm.courseId &&
            aiConfig.courseName.trim() &&
            aiConfig.questionTypes.length > 0
    })

    const calculatedPassScore = computed(() => Math.floor(examForm.totalScore * 0.6))

    const totalQuestionScore = computed(() => {
        return examQuestions.value.reduce((sum, q) => sum + (Number(q.score) || 0), 0)
    })

    const canGoNext = computed(() => {
        return examForm.examTitle && examForm.courseId && examForm.timeRange && examForm.timeRange.length === 2
    })

    watch(() => examForm.totalScore, (val) => {
        examForm.passScore = Math.floor(val * 0.6)
    })

    watch(() => examForm.timeRange, (val) => {
        if (val && val.length === 2) {
            examForm.startTime = val[0]
            examForm.endTime = val[1]
        } else {
            examForm.startTime = ''
            examForm.endTime = ''
        }
    })

    const loadCourses = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) return
            const res = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })
            if (res.success && res.data) {
                courses.value = res.data.list || []
            }
        } catch (e) {
            console.error('加载课程失败', e)
        }
    }

    const loadExams = async () => {
        loading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                console.error('无法获取教师ID')
                return
            }

            let examsData = []

            if (filterForm.courseId || filterForm.status || filterForm.keyword) {
                const searchParams = {
                    teacherId,
                    courseId: filterForm.courseId || undefined,
                    status: filterForm.status || undefined,
                    keyword: filterForm.keyword || undefined
                }
                const res = await request.get('/exam/search', { params: searchParams })
                if ((res.success || res.code === 200) && res.data) {
                    examsData = res.data
                }
            } else {
                const res = await request.get(`/exam/teacher/${teacherId}`)
                if ((res.success || res.code === 200) && res.data) {
                    examsData = res.data
                }
            }

            exams.value = examsData.map(exam => {
                let mappedExam = {
                    ...exam,
                    examId: exam.examId || exam.exam_id || exam.id,
                    examTitle: exam.examTitle || exam.exam_title || exam.title,
                    courseId: exam.courseId || exam.course_id || (exam.course && (exam.course.id || exam.course.courseId)),
                    courseName: exam.courseName || exam.course_name || exam.courseTitle ||
                        (exam.course && (exam.course.courseName || exam.course.course_name || exam.course.title))
                }

                if (!mappedExam.courseName && mappedExam.courseId && courses.value.length > 0) {
                    const course = courses.value.find(c =>
                        String(c.id) === String(mappedExam.courseId) ||
                        String(c.courseId) === String(mappedExam.courseId)
                    )
                    if (course) {
                        mappedExam.courseName = course.courseName || course.name || course.title || course.courseTitle
                    }
                }

                if (!mappedExam.courseName) mappedExam.courseName = '未分配课程'

                return mappedExam
            })

        } catch (e) {
            console.error('加载考试列表失败', e)
            ElMessage.error('加载考试列表失败')
        } finally {
            loading.value = false
            currentPage.value = 1
        }
    }

    const showCreateDialog = () => {
        isEdit.value = false
        currentStep.value = 1
        Object.assign(examForm, {
            examId: null,
            examTitle: '',
            courseId: '',
            startTime: '',
            endTime: '',
            duration: 120,
            totalScore: 100,
            passScore: 60,
            status: 'DRAFT',
            timeRange: []
        })
        examQuestions.value = []
        dialogVisible.value = true
    }

    const nextStep = async () => {
        if (!canGoNext.value) {
            ElMessage.warning('请完整填写基本信息')
            return
        }
        currentStep.value = 2
    }

    const prevStep = () => {
        currentStep.value = 1
    }

    const onCourseSelected = (courseId) => {
        bankFilter.courseId = courseId
    }

    const openBankPicker = () => {
        if (!examForm.courseId) {
            ElMessage.warning('请先选择课程')
            return
        }
        bankFilter.courseId = examForm.courseId
        bankPickerVisible.value = true
        searchBankQuestions()
    }

    const searchBankQuestions = async () => {
        bankLoading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const res = await getQuestionList({
                pageNum: bankPagination.current,
                pageSize: bankPagination.size,
                teacherId,
                courseId: bankFilter.courseId || undefined,
                type: bankFilter.type || undefined,
                keyword: bankFilter.keyword || undefined
            })
            if (res.success && res.data) {
                bankQuestions.value = res.data.records || []
                bankPagination.total = res.data.total || 0
            }
        } catch (e) {
            console.error('加载题库失败', e)
        } finally {
            bankLoading.value = false
        }
    }

    const onBankSelectionChange = (selection) => {
        selectedBankQuestions.value = selection
    }

    const confirmImportBank = () => {
        const newQuestions = selectedBankQuestions.value.map(q => {
            let opts = q.options || q.questionOptions
            if (typeof opts === 'object' && opts !== null) {
                opts = JSON.stringify(opts)
            }
            return {
                questionType: q.type || q.questionType,
                questionContent: q.content || q.questionContent,
                questionOptions: opts,
                answer: q.answer || q.correctAnswer,
                score: q.score || 5,
                analysis: q.analysis || ''
            }
        })

        examQuestions.value.push(...newQuestions)
        calculateQuestionTotal()
        bankPickerVisible.value = false
        selectedBankQuestions.value = []
        ElMessage.success(`成功导入 ${newQuestions.length} 道题目`)
    }

    const cancelImportToBank = () => {
        bankImportVisible.value = false
        selectedImportQuestions.value = []
        loadExams()
    }

    const addSingleQuestionToBank = async (index) => {
        try {
            if (!examForm.courseId) {
                ElMessage.warning('请先选择相应的所属课程')
                return
            }
            const q = examQuestions.value[index]
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            await request.post('/question/create', {
                courseId: examForm.courseId,
                teacherId,
                type: q.questionType,
                content: q.questionContent,
                options: q.questionOptions,
                correctAnswer: q.answer,
                analysis: q.analysis,
                difficulty: 2
            })
            ElMessage.success('已成功添加到课程题库')
        } catch (e) {
            ElMessage.error('加入题库失败')
        }
    }

    const addNewQuestion = () => {
        isEditingQuestion.value = false
        editingQuestionIndex.value = -1
        Object.assign(currentQuestion, {
            questionType: 'SINGLE',
            questionContent: '',
            options: ['', '', '', ''],
            correctMap: {},
            answer: '',
            score: 10,
            analysis: ''
        })
        questionEditVisible.value = true
    }

    const editQuestion = (index) => {
        const q = examQuestions.value[index]
        isEditingQuestion.value = true
        editingQuestionIndex.value = index

        let opts = []
        try {
            if (q.questionOptions) {
                const parsed = JSON.parse(q.questionOptions)
                opts = Array.isArray(parsed) ? parsed.map(o => typeof o === 'object' ? o.text : o) : []
            }
        } catch {
            opts = []
        }

        let correctMap = {}
        if (['SINGLE', 'MULTIPLE'].includes(q.questionType)) {
            const ans = q.answer || q.correctAnswer || ''
            for (let i = 0; i < opts.length; i++) {
                correctMap[i] = ans.includes(String.fromCharCode(65 + i))
            }
        }

        Object.assign(currentQuestion, {
            questionType: q.questionType || 'SINGLE',
            questionContent: q.questionContent,
            options: opts.length >= 2 ? opts : ['', '', '', ''],
            correctMap,
            answer: q.answer || q.correctAnswer || '',
            score: q.score || 10,
            analysis: q.analysis || ''
        })

        questionEditVisible.value = true
    }

    const removeQuestion = async (index) => {
        try {
            await ElMessageBox.confirm('确定要删除这道题目吗？', '删除确认', { type: 'warning' })
            examQuestions.value.splice(index, 1)
            ElMessage.success('删除成功')
        } catch { }
    }

    const addOption = () => {
        if (currentQuestion.options.length < 6) {
            currentQuestion.options.push('')
        }
    }

    const removeOption = (idx) => {
        if (currentQuestion.options.length > 2) {
            currentQuestion.options.splice(idx, 1)
            if (currentQuestion.correctMap[idx]) {
                delete currentQuestion.correctMap[idx]
            }
        }
    }

    const saveQuestionToExam = () => {
        if (!currentQuestion.questionContent) {
            ElMessage.warning('请输入题目内容')
            return
        }

        let answer = currentQuestion.answer
        let opts = null

        if (['SINGLE', 'MULTIPLE'].includes(currentQuestion.questionType)) {
            const validOpts = currentQuestion.options.filter(o => o && o.trim())
            if (validOpts.length < 2) {
                ElMessage.warning('请至少输入两个有效选项')
                return
            }
            const correctIndexes = Object.keys(currentQuestion.correctMap).filter(k => currentQuestion.correctMap[k])
            if (correctIndexes.length === 0) {
                ElMessage.warning('请选择正确答案')
                return
            }
            if (currentQuestion.questionType === 'SINGLE' && correctIndexes.length > 1) {
                ElMessage.warning('单选题只能选择一个正确答案')
                return
            }

            opts = validOpts.map((text, idx) => ({
                text, isCorrect: currentQuestion.correctMap[idx] || false
            }))
            answer = correctIndexes.map(i => String.fromCharCode(65 + Number(i))).join('')
        } else if (currentQuestion.questionType === 'JUDGE') {
            if (!currentQuestion.answer) {
                ElMessage.warning('请选择正确答案')
                return
            }
        } else if (['FILL_BLANK', 'SHORT_ANSWER'].includes(currentQuestion.questionType)) {
            if (!currentQuestion.answer) {
                ElMessage.warning('请输入参考答案')
                return
            }
        }

        const questionData = {
            questionType: currentQuestion.questionType,
            questionContent: currentQuestion.questionContent,
            questionOptions: opts ? JSON.stringify(opts) : null,
            answer,
            score: currentQuestion.score,
            analysis: currentQuestion.analysis
        }

        if (isEditingQuestion.value && editingQuestionIndex.value >= 0) {
            examQuestions.value[editingQuestionIndex.value] = questionData
        } else {
            examQuestions.value.push(questionData)
        }

        calculateQuestionTotal()
        questionEditVisible.value = false
        ElMessage.success('题目保存成功')
    }

    const calculateQuestionTotal = () => {
        const total = totalQuestionScore.value
        if (total > 0) {
            examForm.totalScore = total
        }
    }

    const syncTotalScore = () => {
        const total = totalQuestionScore.value
        if (total > 0 && total !== examForm.totalScore) {
            examForm.totalScore = total
            ElMessage.success(`试卷总分已自动调整为 ${total} 分`)
        }
    }

    const openAiPicker = () => {
        if (!examForm.courseId) {
            ElMessage.warning('请先选择课程')
            return
        }
        aiConfig.courseName = courses.value.find(c => String(c.id) === String(examForm.courseId))?.courseName || ''
        aiPickerVisible.value = true
    }

    const generateWithAiAndAdd = async () => {
        aiLoading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const requestData = {
                teacherId,
                courseId: examForm.courseId,
                courseName: aiConfig.courseName,
                questionCount: aiConfig.questionCount,
                questionTypes: aiConfig.questionTypes.join(','),
                defaultScore: aiConfig.defaultScore
            }

            let newQuestions = []
            const res = await request.post('/exam/ai/generate', requestData)

            if (res.code === 200 || res.success) {
                const questions = res.data || []
                if (questions.length > 0) {
                    newQuestions = questions.map(q => ({
                        questionType: q.questionType || q.type || 'SINGLE',
                        questionContent: q.questionContent || q.content || '',
                        questionOptions: q.questionOptions || q.options || null,
                        answer: q.answer || q.correctAnswer || '',
                        score: q.score || aiConfig.defaultScore,
                        analysis: q.analysis || ''
                    }))
                }
            }

            if (newQuestions.length === 0) {
                newQuestions = generateMockQuestions(aiConfig)
                ElMessage.warning('AI服务暂不可用，已生成示例题目')
            }

            examQuestions.value.push(...newQuestions)
            syncTotalScore()
            aiPickerVisible.value = false
            ElMessage.success(`成功添加 ${newQuestions.length} 道AI生成题目`)
        } catch (e) {
            console.error('AI出题失败', e)
            const mockQuestions = generateMockQuestions(aiConfig)
            examQuestions.value.push(...mockQuestions)
            syncTotalScore()
            aiPickerVisible.value = false
            ElMessage.warning('AI服务暂不可用，已生成示例题目')
        } finally {
            aiLoading.value = false
        }
    }

    const generateMockQuestions = (config) => {
        const questions = []
        const types = config.questionTypes || ['SINGLE']
        const count = config.questionCount || 5
        const score = config.defaultScore || 10
        const courseName = config.courseName || '测试'

        for (let i = 0; i < count; i++) {
            const type = types[i % types.length]
            if (type === 'SINGLE') {
                questions.push({
                    questionType: 'SINGLE',
                    questionContent: `${courseName}：以下关于概念${i + 1}的描述，哪个是正确的？`,
                    questionOptions: JSON.stringify([
                        { text: '选项A：这是正确的描述', isCorrect: true },
                        { text: '选项B：这是错误的描述', isCorrect: false },
                        { text: '选项C：这是部分正确的', isCorrect: false },
                        { text: '选项D：以上都不对', isCorrect: false }
                    ]),
                    answer: 'A',
                    score,
                    analysis: '正确答案是A。'
                })
            } else if (type === 'MULTIPLE') {
                questions.push({
                    questionType: 'MULTIPLE',
                    questionContent: `${courseName}：以下哪些是正确的？（多选）`,
                    questionOptions: JSON.stringify([
                        { text: '选项A：正确说法一', isCorrect: true },
                        { text: '选项B：正确说法二', isCorrect: true },
                        { text: '选项C：错误说法', isCorrect: false },
                        { text: '选项D：正确说法三', isCorrect: true }
                    ]),
                    answer: 'ABD',
                    score,
                    analysis: 'ABD都是正确的。'
                })
            } else if (type === 'JUDGE') {
                questions.push({
                    questionType: 'JUDGE',
                    questionContent: `${courseName}：判断该命题是否正确。`,
                    questionOptions: null,
                    answer: 'A',
                    score,
                    analysis: '该命题正确。'
                })
            } else if (type === 'FILL_BLANK') {
                questions.push({
                    questionType: 'FILL_BLANK',
                    questionContent: `${courseName}：______是最重要的概念。`,
                    questionOptions: null,
                    answer: '答案',
                    score,
                    analysis: '填空内容为"答案"。'
                })
            }
        }
        return questions
    }

    const parseQuestionOptions = (optsRaw) => {
        if (!optsRaw) return []
        try {
            const parsed = JSON.parse(optsRaw)
            return Array.isArray(parsed) ? parsed.map(o => typeof o === 'object' ? o.text || o : o) : []
        } catch {
            return []
        }
    }

    const isOptionCorrect = (q, optIdx) => {
        const ans = q.answer || q.correctAnswer || ''
        return ans.includes(String.fromCharCode(65 + optIdx))
    }

    const getQuestionTypeTag = (type) => {
        const map = { 'SINGLE': 'primary', 'MULTIPLE': 'success', 'JUDGE': 'warning', 'FILL_BLANK': 'info', 'SHORT_ANSWER': 'danger' }
        return map[type] || 'info'
    }

    const getQuestionTypeText = (type) => {
        const map = { 'SINGLE': '单选', 'MULTIPLE': '多选', 'JUDGE': '判断', 'FILL_BLANK': '填空', 'SHORT_ANSWER': '简答' }
        return map[type] || type
    }

    const saveAsDraft = async () => {
        examForm.status = 'DRAFT'
        await handleFormSubmit()
    }

    const submitExam = async () => {
        if (examQuestions.value.length === 0) {
            ElMessage.warning('请至少添加一道题目')
            return
        }
        examForm.status = 'PUBLISHED'
        await handleFormSubmit()
    }

    const handleFormSubmit = async () => {
        submitting.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            let res
            if (isEdit.value) {
                res = await updateExam(examForm.examId, { ...examForm, teacherId })
            } else {
                res = await createExam({ ...examForm, teacherId })
            }

            if (res.code === 200 || res.success) {
                // 后端返回的 res.data 可能直接就是 Long 类型的 examId
                const examId = isEdit.value ? examForm.examId : (res.data?.examId || res.data?.id || res.data)

                if (examId && examQuestions.value.length > 0) {
                    const questionsData = examQuestions.value.map((q, idx) => ({
                        ...q,
                        questionOrder: idx + 1,
                        examId
                    }))
                    await saveExamQuestions(examId, questionsData)
                }

                // 如果用户点击的是"确定并发布"，后端默认建的是草稿(状态0)，需要我们手动调用一次发布接口
                if (examForm.status === 'PUBLISHED' && examId) {
                    try {
                        await request.put(`/exam/${examId}/publish`)
                        // 准备加入题库弹窗数据
                        const detailRes = await request.get(`/exam/${examId}`)
                        if ((detailRes.code === 200 || detailRes.success) && detailRes.data?.questions) {
                            questionsToImport.value = detailRes.data.questions
                        } else {
                            questionsToImport.value = JSON.parse(JSON.stringify(examQuestions.value))
                        }

                        if (questionsToImport.value.length > 0) {
                            currentPublishCourseId.value = examForm.courseId
                            bankImportVisible.value = true
                        }
                    } catch (e) {
                        console.error('自动发布失败', e)
                    }
                }

                ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
                dialogVisible.value = false
                if (!bankImportVisible.value) {
                    loadExams()
                }
            } else {
                ElMessage.error(res.message || '保存失败')
            }
        } catch (e) {
            console.error('保存考试失败', e)
            ElMessage.error('保存失败')
        } finally {
            submitting.value = false
        }
    }

    const viewExam = (exam) => {
        router.push(`/teacher/exam/${exam.examId}`)
    }

    const manageQuestions = (exam) => {
        router.push(`/teacher/exam/${exam.examId}/questions`)
    }

    const viewScores = (exam) => {
        router.push(`/teacher/exam/${exam.examId}/scores`)
    }

    const editExam = async (exam) => {
        isEdit.value = true
        currentStep.value = 1
        Object.assign(examForm, exam)
        if (exam.startTime && exam.endTime) {
            examForm.timeRange = [exam.startTime, exam.endTime]
        }

        examQuestions.value = []
        try {
            const res = await request.get(`/exam/${exam.examId}`)
            if (res.code === 200 || res.success) {
                if (res.data && res.data.questions) {
                    examQuestions.value = res.data.questions
                }
            }
        } catch (e) {
            console.error('获取考试详情失败', e)
        }

        dialogVisible.value = true
    }

    const publishExam = async (exam) => {
        try {
            await ElMessageBox.confirm('确定要发布该考试吗？发布后部分信息将无法修改', '提示')
            const res = await request.put(`/exam/${exam.examId}/publish`)
            if (res.code === 200 || res.success || res.data) {
                ElMessage.success('发布成功')
                exam.status = 1
                exam.statusText = 'PUBLISHED'

                // 获取题目详情询问是否加入题库
                try {
                    const detailRes = await request.get(`/exam/${exam.examId}`)
                    if ((detailRes.code === 200 || detailRes.success) && detailRes.data?.questions?.length > 0) {
                        questionsToImport.value = detailRes.data.questions
                        currentPublishCourseId.value = exam.courseId
                        bankImportVisible.value = true
                    } else {
                        loadExams()
                    }
                } catch (e) {
                    loadExams()
                }
            } else {
                ElMessage.error(res.message || '发布失败')
            }
        } catch (e) { }
    }

    const unpublishExamAction = async (exam) => {
        try {
            await ElMessageBox.confirm('确定要将该考试退回为草稿吗？退回后学生将无法看到该考试', '警告', { type: 'warning' })
            const res = await request.put(`/exam/${exam.examId}/unpublish`)
            if (res.code === 200 || res.success) {
                ElMessage.success('已转为草稿')
                exam.status = 0
                exam.statusText = 'DRAFT'
                loadExams()
            } else {
                ElMessage.error(res.message || '操作失败')
            }
        } catch (e) { }
    }

    const deleteExam = async (exam) => {
        try {
            await ElMessageBox.confirm('确定要删除该考试吗？此操作不可逆', '警告', { type: 'error' })
            const res = await request.delete(`/exam/${exam.examId}`)
            if (res.code === 200 || res.success || res.data) {
                ElMessage.success('删除成功')
                const index = exams.value.findIndex(e => e.examId === exam.examId)
                if (index > -1) exams.value.splice(index, 1)
                loadExams()
            } else {
                ElMessage.error(res.message || '删除失败')
            }
        } catch (e) { }
    }

    const getStatusType = (status) => {
        const map = { 'DRAFT': 'info', 'PUBLISHED': 'primary', 'ONGOING': 'success', 'ENDED': 'danger', 0: 'info', 1: 'primary' }
        return map[status] || 'info'
    }

    const getStatusText = (status) => {
        const map = { 'DRAFT': '草稿', 'PUBLISHED': '已发布', 'ONGOING': '进行中', 'ENDED': '已结束', 0: '草稿', 1: '已发布' }
        return map[status] || status
    }

    const formatDate = (date) => {
        if (!date) return '-'
        const d = new Date(date)
        return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    onMounted(async () => {
        await loadCourses()
        await loadExams()
    })

    return {
        loading,
        dialogVisible,
        isEdit,
        submitting,
        formRef,
        courses,
        exams,
        paginatedExams,
        currentPage,
        pageSize,
        handleCurrentChange,
        handleSizeChange,
        filterForm,
        examForm,
        rules,
        loadExams,
        showCreateDialog,
        saveAsDraft,
        submitExam,
        viewExam,
        manageQuestions,
        viewScores,
        editExam,
        publishExam,
        deleteExam,
        getStatusType,
        getStatusText,
        formatDate,
        currentStep,
        examQuestions,
        calculatedPassScore,
        totalQuestionScore,
        canGoNext,
        nextStep,
        prevStep,
        onCourseSelected,
        bankPickerVisible,
        bankLoading,
        bankQuestions,
        bankFilter,
        bankPagination,
        selectedBankQuestions,
        openBankPicker,
        searchBankQuestions,
        onBankSelectionChange,
        confirmImportBank,
        questionEditVisible,
        isEditingQuestion,
        currentQuestion,
        addNewQuestion,
        editQuestion,
        removeQuestion,
        addOption,
        removeOption,
        saveQuestionToExam,
        calculateQuestionTotal,
        parseQuestionOptions,
        isOptionCorrect,
        getQuestionTypeTag,
        getQuestionTypeText,
        aiLoading,
        aiPickerVisible,
        aiConfig,
        canGenerateAi,
        openAiPicker,
        generateWithAiAndAdd,
        syncTotalScore,
        unpublishExamAction,
        bankImportVisible,
        questionsToImport,
        selectedImportQuestions,
        isImportingToBank,
        onImportSelectionChange,
        confirmImportToBank,
        cancelImportToBank,
        addSingleQuestionToBank
    }
}
