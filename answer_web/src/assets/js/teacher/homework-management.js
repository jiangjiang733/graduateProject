import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { getQuestionList } from '@/api/question.js'
import {
    getCourseLabReportList,
    createLabReport,
    updateLabReport,
    deleteLabReport,
    getLabReportDetail
} from '@/api/homework.js'

export function useHomeworkManagement() {
    const router = useRouter()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const submitting = ref(false)
    const formRef = ref()

    // 题库选择相关状态
    const bankDialogVisible = ref(false)
    const bankLoading = ref(false)
    const bankQuestions = ref([])
    const bankSearchKeyword = ref('')
    const selectedQuestions = ref([])

    // 课程列表
    const courses = ref([])

    // 作业列表
    const homeworks = ref([])

    // 筛选表单
    const filterForm = reactive({
        courseId: '',
        status: '',
        keyword: ''
    })

    // 作业表单
    const homeworkForm = reactive({
        title: '',
        courseId: '',
        description: '',
        deadline: '',
        totalScore: 100,
        attachments: []
    })

    // 文件列表
    const fileList = ref([])

    // 表单验证规则
    const rules = {
        title: [
            { required: true, message: '请输入作业题目/名称', trigger: 'blur' }
        ],
        description: [
            { required: true, message: '请输入作业要求/内容', trigger: 'blur' }
        ],
        courseId: [
            { required: true, message: '请选择课程', trigger: 'change' }
        ],
        deadline: [
            { required: true, message: '请选择截止时间', trigger: 'change' }
        ]
    }

    // 题库相关方法
    const openQuestionBank = async () => {
        bankDialogVisible.value = true
        await searchBank()
    }

    const searchBank = async () => {
        bankLoading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getQuestionList({
                teacherId: teacherId,
                keyword: bankSearchKeyword.value,
                pageNum: 1,
                pageSize: 50
            })
            if (response.success && response.data) {
                bankQuestions.value = response.data.list || []
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

        let importText = '\n--- 题目内容 ---\n'
        selectedQuestions.value.forEach((q, index) => {
            const typeText = getQuestionTypeText(q.type)
            importText += `【第 ${index + 1} 题 - ${typeText}】\n${q.content}\n`

            if (q.type === 1 || q.type === 2) { // 单选或多选
                const options = ['A', 'B', 'C', 'D', 'E', 'F']
                const items = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE, q.optionF]
                items.forEach((item, i) => {
                    if (item) importText += `  ${options[i]}. ${item}\n`
                })
            } else if (q.type === 3) { // 判断
                importText += `  A. 正确\n  B. 错误\n`
            }
            importText += '\n'
        })

        homeworkForm.description = (homeworkForm.description || '') + importText
        bankDialogVisible.value = false
        ElMessage.success(`成功导入 ${selectedQuestions.value.length} 道题目`)
    }

    const getQuestionTypeText = (type) => {
        const types = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题' }
        return types[type] || '未知'
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
            // 如果选择了特定课程，加载该课程的作业
            if (filterForm.courseId) {
                const response = await getCourseLabReportList(filterForm.courseId)
                if (response.success && response.data) {
                    let reports = response.data

                    // 应用状态筛选
                    if (filterForm.status) {
                        reports = reports.filter(r => r.status === filterForm.status)
                    }

                    // 应用关键词搜索
                    if (filterForm.keyword) {
                        const keyword = filterForm.keyword.toLowerCase()
                        reports = reports.filter(r =>
                            r.reportTitle?.toLowerCase().includes(keyword) ||
                            r.title?.toLowerCase().includes(keyword)
                        )
                    }

                    // 转换数据格式以匹配UI
                    homeworks.value = reports.map(report => ({
                        id: report.reportId || report.id,
                        title: report.reportTitle || report.title,
                        courseId: report.courseId,
                        courseName: report.courseName || '未知课程',
                        description: report.reportDescription || report.description,
                        deadline: report.deadline,
                        totalScore: report.totalScore,
                        status: report.status || 1,
                        submittedCount: report.submittedCount || 0,
                        gradedCount: report.gradedCount || 0,
                        totalStudents: report.totalStudents || 0
                    }))
                } else {
                    homeworks.value = []
                }
            } else {
                // 如果没有选择课程，加载所有课程的作业
                const allHomeworks = []
                for (const course of courses.value) {
                    try {
                        const response = await getCourseLabReportList(course.id)
                        if (response.success && response.data) {
                            const reports = response.data.map(report => ({
                                id: report.reportId || report.id,
                                title: report.reportTitle || report.title,
                                courseId: report.courseId,
                                courseName: course.courseName || course.name,
                                description: report.reportDescription || report.description,
                                deadline: report.deadline,
                                totalScore: report.totalScore,
                                status: report.status || 1,
                                submittedCount: report.submittedCount || 0,
                                gradedCount: report.gradedCount || 0,
                                totalStudents: report.totalStudents || 0
                            }))
                            allHomeworks.push(...reports)
                        }
                    } catch (err) {
                        console.error(`加载课程 ${course.id} 的作业失败:`, err)
                    }
                }

                // 应用筛选
                let filteredHomeworks = allHomeworks
                if (filterForm.status) {
                    filteredHomeworks = filteredHomeworks.filter(h => h.status === filterForm.status)
                }
                if (filterForm.keyword) {
                    const keyword = filterForm.keyword.toLowerCase()
                    filteredHomeworks = filteredHomeworks.filter(h =>
                        h.title?.toLowerCase().includes(keyword)
                    )
                }

                homeworks.value = filteredHomeworks
            }
        } catch (error) {
            console.error('加载作业列表失败:', error)
            ElMessage.error('加载作业列表失败')
            homeworks.value = []
        } finally {
            loading.value = false
        }
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
            attachments: []
        })
        fileList.value = []
        dialogVisible.value = true
    }

    // 文件选择
    const handleFileChange = (file, files) => {
        fileList.value = files
    }

    // 保存草稿
    const saveAsDraft = async () => {
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
            formData.append('totalScore', homeworkForm.totalScore)
            formData.append('status', 0) // 设置状态为草稿
            // 添加附件（如果有）
            if (fileList.value.length > 0) {
                formData.append('attachment', fileList.value[0].raw)
            }

            // 调用保存草稿API (使用相同的创建接口，但状态为DRAFT)
            const response = await createLabReport(formData)

            if (response.success) {
                ElMessage.success('草稿保存成功')
                dialogVisible.value = false
                loadHomeworks()
            } else {
                ElMessage.error(response.message || '草稿保存失败')
            }
        } catch (error) {
            if (error.errors) return
            console.error('保存草稿失败:', error)
            ElMessage.error('保存草稿失败')
        } finally {
            submitting.value = false
        }
    }

    // 提交作业
    const submitHomework = async () => {
        // 如果是编辑模式，调用更新函数
        if (isEdit.value) {
            return updateHomeworkData()
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
            formData.append('totalScore', homeworkForm.totalScore)

            // 添加附件（如果有）
            if (fileList.value.length > 0) {
                formData.append('attachment', fileList.value[0].raw)
            }

            // 调用发布作业API
            const response = await createLabReport(formData)

            if (response.success) {
                ElMessage.success('作业发布成功')
                dialogVisible.value = false
                loadHomeworks()
            } else {
                console.log(response.message)
                ElMessage.error(response.message || '作业发布失败')
            }
        } catch (error) {
            if (error.errors) return
            console.error('发布作业失败:', error)
            ElMessage.error('发布作业失败')
        } finally {
            submitting.value = false
        }
    }

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
                    totalScore: detail.totalScore
                })
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

    // 更新作业
    const updateHomeworkData = async () => {
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
            formData.append('totalScore', homeworkForm.totalScore)

            // 添加附件（如果有）
            if (fileList.value.length > 0) {
                formData.append('attachment', fileList.value[0].raw)
            }

            // 调用更新作业API
            const response = await updateLabReport(homeworkForm.id, formData)

            if (response.success) {
                ElMessage.success('作业更新成功')
                dialogVisible.value = false
                loadHomeworks()
            } else {
                ElMessage.error(response.message || '作业更新失败')
            }
        } catch (error) {
            if (error.errors) return
            console.error('更新作业失败:', error)
            ElMessage.error('更新作业失败')
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

    onMounted(() => {
        loadCourses()
        loadHomeworks()
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
        bankSearchKeyword,
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
        getQuestionTypeText
    }
}
