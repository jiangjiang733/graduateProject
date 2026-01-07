import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { getQuestionList } from '@/api/question.js'
import { generateQuestionsWithAi } from '@/api/exam.js'
import {
    getCourseLabReportList,
    getLabReportsByTeacher,
    createLabReport,
    updateLabReport,
    deleteLabReport,
    getLabReportDetail
} from '@/api/homework.js'

export function useHomeworkManagement() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const submitting = ref(false)
    const formRef = ref()

    // AI 生成相关状态
    const aiDialogVisible = ref(false)
    const aiLoading = ref(false)
    const aiForm = reactive({
        topic: '',
        count: 3,
        types: ['SINGLE', 'JUDGE']
    })

    const openAiDialog = () => {
        aiForm.topic = ''
        aiForm.count = 3
        aiForm.types = ['SINGLE', 'JUDGE']
        aiDialogVisible.value = true
    }

    const handleAiGenerate = async () => {
        if (!aiForm.topic) {
            ElMessage.warning('请输入生成主题或课程名称')
            return
        }
        if (aiForm.types.length === 0) {
            ElMessage.warning('请至少选择一种题型')
            return
        }

        aiLoading.value = true
        try {
            const res = await generateQuestionsWithAi({
                courseName: aiForm.topic,
                questionCount: aiForm.count,
                questionTypes: aiForm.types.join(',')
            })

            if (res.success && res.data) {
                const aiQs = res.data.map(q => {
                    let ans = q.correctAnswer || q.answer

                    if (q.questionType === 'JUDGE') {
                        if (ans === '正确' || ans === '对' || ans === 'B' || String(ans).toLowerCase() === 'true') ans = 'A'
                        else if (ans === '错误' || ans === '错' || ans === 'A' || String(ans).toLowerCase() === 'false') ans = 'B'
                    }

                    return {
                        questionType: q.questionType,
                        questionContent: q.questionContent,
                        questionOptions: q.questionOptions,
                        correctAnswer: ans,
                        score: q.score || 5,
                        analysis: q.analysis
                    }
                })

                if (!homeworkForm.questions) homeworkForm.questions = []
                homeworkForm.questions.push(...aiQs)

                aiDialogVisible.value = false
                ElMessage.success(`成功生成 ${aiQs.length} 道题目`)
                // 同步更新总分
                calculateHomeworkTotalScore()
            } else {
                ElMessage.error(res.message || '生成失败')
            }
        } catch (e) {
            console.error(e)
            ElMessage.error('AI 生成请求失败')
        } finally {
            aiLoading.value = false
        }
    }

    // 题库选择相关状态
    const bankDialogVisible = ref(false)
    const bankLoading = ref(false)
    const bankQuestions = ref([])
    const bankFilter = reactive({ courseId: '', type: '', keyword: '' })
    const bankPagination = reactive({ current: 1, size: 10, total: 0 })
    const selectedQuestions = ref([])

    // 课程列表
    const courses = ref([])

    // 作业列表
    const homeworks = ref([])

    // 筛选表单
    const filterForm = reactive({
        courseId: route.query.courseId || '',
        status: '',
        keyword: ''
    })

    // 分页状态
    const pagination = reactive({
        current: 1,
        size: 10,
        total: 0
    })

    // 作业表单
    const homeworkForm = reactive({
        title: '',
        courseId: '',
        description: '',
        deadline: '',
        totalScore: 100,
        attachments: [],
        questions: []
    })

    // 文件列表
    const fileList = ref([])

    // 表单验证规则
    const rules = {
        title: [{ required: true, message: '请输入作业题目/名称', trigger: 'blur' }],
        courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
        deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }]
    }

    // --- 题目编辑相关 ---
    const editQuestionDialogVisible = ref(false)
    const editingQuestionIndex = ref(-1)
    const editingQuestion = reactive({
        questionType: 'SINGLE',
        questionContent: '',
        questionOptions: '',
        options: [], // 用于编辑的数组格式
        correctAnswer: '',
        score: 5,
        analysis: ''
    })

    const openEditQuestion = (index) => {
        const q = homeworkForm.questions[index]
        editingQuestionIndex.value = index

        // 深拷贝数据到编辑表单
        editingQuestion.questionType = q.questionType
        editingQuestion.questionContent = q.questionContent
        editingQuestion.score = q.score || 5
        editingQuestion.analysis = q.analysis || ''
        editingQuestion.correctAnswer = q.correctAnswer || q.answer

        // 处理选项
        if (['SINGLE', 'MULTIPLE'].includes(q.questionType)) {
            const opts = typeof q.questionOptions === 'string' ? JSON.parse(q.questionOptions) : q.questionOptions
            editingQuestion.options = Array.isArray(opts) ? JSON.parse(JSON.stringify(opts)) : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]
        } else {
            editingQuestion.options = []
        }

        editQuestionDialogVisible.value = true
    }

    const saveEditQuestion = () => {
        if (!editingQuestion.questionContent) {
            return ElMessage.warning('请输入题目内容')
        }

        const q = homeworkForm.questions[editingQuestionIndex.value]
        q.questionContent = editingQuestion.questionContent
        q.questionType = editingQuestion.questionType
        q.score = editingQuestion.score
        q.analysis = editingQuestion.analysis
        q.correctAnswer = editingQuestion.correctAnswer

        if (['SINGLE', 'MULTIPLE'].includes(q.questionType)) {
            q.questionOptions = JSON.stringify(editingQuestion.options)
        } else {
            q.questionOptions = null
        }

        editQuestionDialogVisible.value = false
        ElMessage.success('题目已修改')
        calculateHomeworkTotalScore()
    }

    const addOption = () => {
        editingQuestion.options.push({ text: '' })
    }

    const removeOption = (idx) => {
        editingQuestion.options.splice(idx, 1)
    }

    // 保存到题库
    const saveToBank = async (q) => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const postData = {
                type: q.questionType,
                content: q.questionContent,
                options: q.questionOptions,
                answer: q.correctAnswer || q.answer,
                score: q.score,
                analysis: q.analysis,
                courseId: homeworkForm.courseId,
                difficulty: 1, // 默认难度
                creatorId: teacherId
            }

            const res = await createQuestion(postData)
            if (res.success) {
                ElMessage.success('已成功存入题库')
            } else {
                ElMessage.error(res.message || '存入题库失败')
            }
        } catch (e) {
            ElMessage.error('网络错误，存入失败')
        }
    }

    const openQuestionBank = async () => {
        bankFilter.courseId = homeworkForm.courseId
        bankDialogVisible.value = true
        await searchBank()
    }

    const searchBank = async () => {
        bankLoading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getQuestionList({
                teacherId: teacherId,
                pageNum: bankPagination.current,
                pageSize: bankPagination.size,
                ...bankFilter
            })
            if (response.success && response.data) {
                bankQuestions.value = response.data.records || []
                bankPagination.total = response.data.total || 0
            }
        } catch (error) {
            console.error('获取题库失败:', error)
            ElMessage.error('获取题库失败')
        } finally {
            bankLoading.value = false
        }
    }

    const handleBankSelection = (selection) => {
        selectedQuestions.value = selection
    }

    const confirmImportQuestions = () => {
        if (selectedQuestions.value.length === 0) return

        const newQs = selectedQuestions.value.map(bq => {
            let opts = bq.options
            if (typeof opts === 'object' && opts !== null) opts = JSON.stringify(opts)

            let ans = bq.answer
            // 题库导入时，也将判断题文字答案转为 A/B 代码 (A正确 B错误)
            if (bq.type === 'JUDGE') {
                if (ans === '正确') ans = 'A'
                else if (ans === '错误') ans = 'B'
            }

            return {
                questionType: bq.type,
                questionContent: bq.content,
                questionOptions: opts,
                correctAnswer: ans,
                score: 5,
                analysis: bq.analysis
            }
        })

        if (!homeworkForm.questions) homeworkForm.questions = []
        homeworkForm.questions.push(...newQs)

        const count = newQs.length
        bankDialogVisible.value = false
        selectedQuestions.value = []
        ElMessage.success(`成功导入 ${count} 道题目`)
        calculateHomeworkTotalScore()
    }

    const removeHomeworkQuestion = (index) => {
        homeworkForm.questions.splice(index, 1)
        calculateHomeworkTotalScore()
    }

    const moveHomeworkQuestion = (index, delta) => {
        const newIdx = index + delta
        if (newIdx < 0 || newIdx >= homeworkForm.questions.length) return
        const temp = homeworkForm.questions[index]
        homeworkForm.questions[index] = homeworkForm.questions[newIdx]
        homeworkForm.questions[newIdx] = temp
    }

    const calculateHomeworkTotalScore = () => {
        const total = homeworkForm.questions.reduce((sum, q) => sum + (q.score || 0), 0)
        if (total > 0) homeworkForm.totalScore = total
    }

    const getQuestionTypeText = (type) => {
        const types = {
            1: '单选题', 'SINGLE': '单选题',
            2: '多选题', 'MULTIPLE': '多选题',
            3: '判断题', 'JUDGE': '判断题',
            4: '填空题', 'COMPLETION': '填空题',
            5: '简答题', 'ESSAY': '简答题'
        }
        return types[type] || type || '未知'
    }

    // 加载课程列表
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

    // 加载作业列表
    const loadHomeworks = async () => {
        loading.value = true
        try {
            // 尝试加载课程，但不阻塞主要的作业加载
            if (courses.value.length === 0) {
                try {
                    await loadCourses()
                } catch (e) {
                    console.warn('预加载课程列表失败，继续加载作业:', e)
                }
            }

            console.log('开始加载作业列表, 筛选条件:', filterForm)

            // 如果选择了特定课程，加载该课程的作业
            if (filterForm.courseId) {
                const response = await getCourseLabReportList(filterForm.courseId)
                if (response.success && response.data) {
                    processReports(response.data)
                } else {
                    homeworks.value = []
                }
            } else {
                // 如果没有选择课程记录，加载教师的所有作业
                const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
                console.log('Teacher ID:', teacherId)

                const response = await getLabReportsByTeacher(teacherId)
                console.log('API响应:', response)

                if (response.success && response.data) {
                    processReports(response.data)
                } else {
                    console.warn('API返回成功但无数据或格式不正确')
                    homeworks.value = []
                }
            }
        } catch (error) {
            console.error('加载作业列表失败:', error)
            ElMessage.error('加载作业列表失败')
            homeworks.value = []
        } finally {
            loading.value = false
        }
    }

    // 辅助处理函数
    const processReports = (data) => {
        console.log('处理作业数据:', data)
        let reports = []
        if (Array.isArray(data)) {
            reports = data
        } else if (data.list && Array.isArray(data.list)) {
            reports = data.list
        } else if (data.records && Array.isArray(data.records)) {
            reports = data.records
        }

        console.log('解析后的列表:', reports)

        // 应用关键词搜索
        if (filterForm.keyword) {
            const keyword = filterForm.keyword.toLowerCase()
            reports = reports.filter(r =>
                (r.reportTitle || r.title || '').toLowerCase().includes(keyword)
            )
        }

        // 转换数据格式以匹配UI
        let mappedReports = reports.map(report => ({
            id: report.reportId || report.id,
            title: report.reportTitle || report.title,
            courseId: report.courseId,
            courseName: report.courseName || '未知课程',
            description: report.reportDescription || report.description,
            deadline: report.deadline,
            totalScore: report.totalScore,
            status: (report.status === 0 || report.status === '0') ? 0 : (report.status || 1),
            submittedCount: report.submittedCount || 0,
            gradedCount: report.gradedCount || 0,
            totalStudents: report.totalStudents || 0
        }))

        console.log('映射后的数据:', mappedReports)

        // 应用状态筛选
        if (filterForm.status !== '' && filterForm.status !== null) {
            mappedReports = mappedReports.filter(h => h.status == filterForm.status)
        }

        // 更新总条目数
        pagination.total = mappedReports.length

        // 前端分页处理
        const start = (pagination.current - 1) * pagination.size
        const end = start + pagination.size
        homeworks.value = mappedReports.slice(start, end)
        console.log('最终显示的作业列表:', homeworks.value)
    }

    const handlePageChange = (page) => {
        pagination.current = page
        loadHomeworks()
    }

    const handleSizeChange = (size) => {
        pagination.size = size
        pagination.current = 1
        loadHomeworks()
    }

    // 显示创建对话框
    const showCreateDialog = () => {
        isEdit.value = false
        Object.assign(homeworkForm, {
            title: '',
            courseId: '',
            description: '',
            deadline: '',
            totalScore: 100,
            attachments: [],
            questions: []
        })
        fileList.value = []
        dialogVisible.value = true
    }

    // 文件选择
    const handleFileChange = (file, files) => {
        fileList.value = files
    }


    // 提交/发布作业
    const submitHomework = async (statusOverride = 1) => {
        // 修正：防止点击事件对象 (PointerEvent) 被误作为 statusOverride 传入
        const status = (typeof statusOverride === 'number') ? statusOverride : 1

        // 如果是编辑模式，调用更新函数
        if (isEdit.value) {
            return updateHomeworkData(status)
        }

        try {
            await formRef.value.validate()
            submitting.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            // 创建FormData对象
            const formData = new FormData()
            formData.append('courseId', homeworkForm.courseId)
            formData.append('teacherId', teacherId)
            formData.append('reportTitle', homeworkForm.title)
            formData.append('reportDescription', homeworkForm.description)
            formData.append('deadline', homeworkForm.deadline)

            // 确保总分为数字，如果为空则传 0 或不传
            if (homeworkForm.totalScore !== null && homeworkForm.totalScore !== '') {
                formData.append('totalScore', homeworkForm.totalScore)
            }

            // 设置状态：1-直接发布，0-保存草稿
            formData.append('status', status)

            // 添加结构化题目列表
            if (homeworkForm.questions && homeworkForm.questions.length > 0) {
                formData.append('questionList', JSON.stringify(homeworkForm.questions))
            }

            // 添加附件（如果有）
            if (fileList.value.length > 0) {
                // 如果是 el-upload 的原始文件对象
                const file = fileList.value[0].raw || fileList.value[0]
                formData.append('attachment', file)
            }

            // 调用发布作业API
            const response = await createLabReport(formData)

            if (response.success) {
                ElMessage.success(status === 0 ? '草稿保存成功' : '作业发布成功')
                dialogVisible.value = false
                loadHomeworks()
            } else {
                ElMessage.error(response.message || '发布失败')
            }
        } catch (error) {
            if (error.name === 'ValidationError') return
            console.error('操作作业失败:', error)
            ElMessage.error('网络或系统错误，请稍后刷新重试')
        } finally {
            submitting.value = false
        }
    }

    // 保存草稿的快捷方式
    const saveAsDraft = () => submitHomework(0)

    // 查看作业详情
    const viewHomework = (homework) => {
        router.push(`/teacher/homework/${homework.id}`)
    }

    // 批改作业
    const gradeHomework = (homework) => {
        router.push(`/teacher/homework/${homework.id}/grade`)
    }

    // 编辑作业
    const editHomework = async (homework) => {
        isEdit.value = true

        // 加载作业详情
        try {
            const response = await getLabReportDetail(homework.id)
            if (response.success && response.data) {
                const detail = response.data
                Object.assign(homeworkForm, {
                    id: detail.reportId || detail.id,
                    title: detail.reportTitle || detail.title,
                    courseId: detail.courseId,
                    description: detail.reportDescription || detail.description,
                    deadline: detail.deadline,
                    totalScore: detail.totalScore,
                    questions: []
                })

                // 解析题目列表
                const qList = detail.questionList || detail.questions
                if (qList) {
                    try {
                        homeworkForm.questions = typeof qList === 'string' ? JSON.parse(qList) : qList
                    } catch (e) {
                        console.error('解析题目列表失败:', e)
                        homeworkForm.questions = []
                    }
                }
            } else {
                // 如果获取详情失败，使用列表数据
                Object.assign(homeworkForm, {
                    id: homework.id,
                    title: homework.title,
                    courseId: homework.courseId,
                    description: homework.description,
                    deadline: homework.deadline,
                    totalScore: homework.totalScore
                })
            }
        } catch (error) {
            console.error('加载作业详情失败:', error)
            // 使用列表数据
            Object.assign(homeworkForm, {
                id: homework.id,
                title: homework.title,
                courseId: homework.courseId,
                description: homework.description,
                deadline: homework.deadline,
                totalScore: homework.totalScore
            })
        }

        fileList.value = []
        dialogVisible.value = true
    }

    // 更新作业数据
    const updateHomeworkData = async (statusOverride = 1) => {
        const status = (typeof statusOverride === 'number') ? statusOverride : 1
        try {
            await formRef.value.validate()
            submitting.value = true

            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            // 创建FormData对象
            const formData = new FormData()
            formData.append('courseId', homeworkForm.courseId)
            formData.append('teacherId', teacherId)
            formData.append('reportTitle', homeworkForm.title)
            formData.append('reportDescription', homeworkForm.description)
            formData.append('deadline', homeworkForm.deadline)

            if (homeworkForm.totalScore !== null && homeworkForm.totalScore !== '') {
                formData.append('totalScore', homeworkForm.totalScore)
            }

            // 更新时也允许修改状态（例如从草稿箱发布）
            formData.append('status', status)

            // 添加结构化题目列表
            if (homeworkForm.questions && homeworkForm.questions.length > 0) {
                formData.append('questionList', JSON.stringify(homeworkForm.questions))
            }

            // 添加附件（如果有）
            if (fileList.value.length > 0) {
                const file = fileList.value[0].raw || fileList.value[0]
                formData.append('attachment', file)
            }

            // 调用更新作业API
            const response = await updateLabReport(homeworkForm.id, formData)

            if (response.success) {
                ElMessage.success(statusOverride === 0 ? '草稿更新成功' : '作业更新成功')
                dialogVisible.value = false
                loadHomeworks()
            } else {
                ElMessage.error(response.message || '更新失败')
            }
        } catch (error) {
            if (error.name === 'ValidationError') return
            console.error('更新作业失败:', error)
            ElMessage.error('更新失败，服务繁忙')
        } finally {
            submitting.value = false
        }
    }

    // 删除作业
    const deleteHomeworkItem = async (homework) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除作业"${homework.title}"吗？此操作不可恢复。`,
                '删除确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            // 调用删除API
            const response = await deleteLabReport(homework.id)

            if (response.success) {
                ElMessage.success('作业删除成功')
                loadHomeworks()
            } else {
                ElMessage.error(response.message || '作业删除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除作业失败:', error)
                ElMessage.error('删除作业失败')
            }
        }
    }

    // 获取状态类型
    const getStatusType = (status) => {
        const types = {
            1: 'success',
            2: 'info',
            0: 'warning'
        }
        return types[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
        const texts = {
            1: '进行中',
            2: '已截止',
            0: '草稿'
        }
        return texts[status] || '进行中'
    }

    // 格式化日期
    const formatDate = (dateStr) => {
        if (!dateStr) return '未设置'
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
    }

    // 获取提交进度
    const getSubmitProgress = (homework) => {
        if (!homework.totalStudents || homework.totalStudents === 0) return 0
        return Math.round((homework.submittedCount / homework.totalStudents) * 100)
    }

    // 获取进度条颜色
    const getProgressColor = (homework) => {
        const progress = getSubmitProgress(homework)
        if (progress >= 80) return '#67c23a'
        if (progress >= 50) return '#e6a23c'
        return '#f56c6c'
    }

    onMounted(async () => {
        await loadCourses()
        await loadHomeworks()
    })

    return {
        loading,
        dialogVisible,
        isEdit,
        submitting,
        formRef,
        courses,
        homeworks,
        filterForm,
        homeworkForm,
        fileList,
        rules,
        bankDialogVisible,
        bankLoading,
        bankQuestions,
        bankFilter,
        bankPagination,
        selectedQuestions,
        loadCourses,
        loadHomeworks,
        showCreateDialog,
        handleFileChange,
        saveAsDraft,
        submitHomework,
        viewHomework,
        gradeHomework,
        editHomework,
        updateHomeworkData,
        deleteHomeworkItem,
        getStatusType,
        getStatusText,
        formatDate,
        getSubmitProgress,
        getProgressColor,
        openQuestionBank,
        searchBank,
        handleBankSelection,
        confirmImportQuestions,
        getQuestionTypeText,
        pagination,
        handlePageChange,
        handleSizeChange,
        aiDialogVisible,
        aiLoading,
        aiForm,
        openAiDialog,
        openAiDialog,
        handleAiGenerate,
        removeHomeworkQuestion,
        moveHomeworkQuestion,
        calculateHomeworkTotalScore,
        editQuestionDialogVisible,
        editingQuestion,
        openEditQuestion,
        saveEditQuestion,
        addOption,
        removeOption,
        saveToBank
    }
}
