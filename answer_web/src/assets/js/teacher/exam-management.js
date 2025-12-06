import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { 
  createExam, 
  getExamsByCourse, 
  publishExam as publishExamApi, 
  deleteExam as deleteExamApi 
} from '@/api/exam.js'

export function useExamManagement() {
    const router = useRouter()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const submitting = ref(false)
    const formRef = ref()

    const courses = ref([])
    const exams = ref([])
    const timeRange = ref([])

    const filterForm = reactive({
        courseId: '',
        status: '',
        keyword: ''
    })

    const examForm = reactive({
        examTitle: '',
        courseId: '',
        duration: 60,
        totalScore: 100,
        passScore: 60
    })

    const rules = {
        examTitle: [
            { required: true, message: '请输入考试标题', trigger: 'blur' }
        ],
        courseId: [
            { required: true, message: '请选择课程', trigger: 'change' }
        ]
    }

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

    const loadExams = async () => {
        loading.value = true
        try {
            if (filterForm.courseId) {
                const response = await getExamsByCourse(filterForm.courseId)
                if (response.success) {
                    exams.value = response.data || []
                }
            } else {
                exams.value = []
            }
        } catch (error) {
            console.error('加载考试列表失败:', error)
            ElMessage.error('加载考试列表失败')
        } finally {
            loading.value = false
        }
    }

    const showCreateDialog = () => {
        createExamPage()
    }

    const saveAsDraft = async () => {
        try {
            await formRef.value.validate()
            if (!timeRange.value || timeRange.value.length !== 2) {
                ElMessage.warning('请选择考试时间')
                return
            }

            submitting.value = true

            const data = {
                ...examForm,
                startTime: timeRange.value[0],
                endTime: timeRange.value[1],
                teacherId: localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
                status: 'DRAFT'
            }

            const response = await createExam(data)
            if (response.success) {
                ElMessage.success('草稿保存成功')
                dialogVisible.value = false
                loadExams()
            }
        } catch (error) {
            if (error.errors) return
            console.error('保存草稿失败:', error)
            ElMessage.error('保存草稿失败')
        } finally {
            submitting.value = false
        }
    }

    const submitExam = async () => {
        try {
            await formRef.value.validate()
            if (!timeRange.value || timeRange.value.length !== 2) {
                ElMessage.warning('请选择考试时间')
                return
            }

            submitting.value = true

            const data = {
                ...examForm,
                startTime: timeRange.value[0],
                endTime: timeRange.value[1],
                teacherId: localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
                status: 'PUBLISHED'
            }

            const response = await createExam(data)
            if (response.success) {
                ElMessage.success('考试创建成功')
                dialogVisible.value = false
                loadExams()
            }
        } catch (error) {
            if (error.errors) return
            console.error('创建考试失败:', error)
            ElMessage.error('创建考试失败')
        } finally {
            submitting.value = false
        }
    }

    const viewExam = (exam) => {
        router.push(`/teacher/exam/${exam.examId}`)
    }

    const viewScores = (exam) => {
        router.push(`/teacher/exam/${exam.examId}/scores`)
    }

    const editExam = (exam) => {
        router.push(`/teacher/exam/edit/${exam.examId}`)
    }
    
    const createExamPage = () => {
        router.push('/teacher/exam/create')
    }

    const publishExam = async (exam) => {
        try {
            await ElMessageBox.confirm(
                `确定要发布考试"${exam.examTitle}"吗？发布后学生即可参加考试。`,
                '发布确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const response = await publishExamApi(exam.examId)
            if (response.success) {
                ElMessage.success('考试发布成功')
                loadExams()
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('发布考试失败:', error)
                ElMessage.error('发布考试失败')
            }
        }
    }

    const deleteExam = async (exam) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除考试"${exam.examTitle}"吗？此操作不可恢复。`,
                '删除确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const response = await deleteExamApi(exam.examId)
            if (response.success) {
                ElMessage.success('考试删除成功')
                loadExams()
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除考试失败:', error)
                ElMessage.error('删除考试失败')
            }
        }
    }

    const getStatusType = (status) => {
        // status 可能是数字或字符串
        const statusStr = typeof status === 'number' ? getStatusTextFromNumber(status) : status
        const types = {
            DRAFT: 'info',
            PUBLISHED: 'success',
            ONGOING: 'warning',
            ENDED: 'info'
        }
        return types[statusStr] || 'info'
    }

    const getStatusText = (status) => {
        // status 可能是数字或字符串
        const statusStr = typeof status === 'number' ? getStatusTextFromNumber(status) : status
        const texts = {
            DRAFT: '草稿',
            PUBLISHED: '已发布',
            ONGOING: '进行中',
            ENDED: '已结束'
        }
        return texts[statusStr] || '未知'
    }
    
    const getStatusTextFromNumber = (status) => {
        if (status === 0) return 'DRAFT'
        if (status === 1) return 'PUBLISHED'
        return 'PUBLISHED'
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '未设置'
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
    }

    onMounted(() => {
        loadCourses()
    })

    return {
        loading,
        dialogVisible,
        isEdit,
        submitting,
        formRef,
        courses,
        exams,
        timeRange,
        filterForm,
        examForm,
        rules,
        loadCourses,
        loadExams,
        showCreateDialog,
        saveAsDraft,
        submitExam,
        viewExam,
        viewScores,
        editExam,
        publishExam,
        deleteExam,
        getStatusType,
        getStatusText,
        formatDate,
        createExamPage
    }
}
