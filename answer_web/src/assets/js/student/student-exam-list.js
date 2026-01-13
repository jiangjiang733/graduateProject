import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStudentExamList } from '@/api/exam'

export function useStudentExamList() {
    const router = useRouter()
    const loading = ref(false)
    const exams = ref([])
    const filterStatus = ref('')
    const searchKeyword = ref('')
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')

    // Pagination State
    const currentPage = ref(1)
    const pageSize = ref(6)

    const loadExams = async () => {
        if (!studentId) {
            ElMessage.warning('身份信息已失效，请重新登录')
            return
        }

        loading.value = true
        try {
            const params = filterStatus.value || null
            const res = await getStudentExamList(studentId, params, null)
            if (res.success || res.code === 200) {
                exams.value = res.data || []
            } else {
                ElMessage.error(res.message || '获取考试列表失败')
            }
        } catch (error) {
            console.error('获取考试列表出错:', error)
            ElMessage.error('网络连接异常，请检查网络')
        } finally {
            loading.value = false
        }
    }

    const handleFilterChange = () => {
        currentPage.value = 1
        loadExams()
    }

    const handlePageChange = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const filteredExams = computed(() => {
        let result = exams.value
        if (searchKeyword.value) {
            const lower = searchKeyword.value.toLowerCase()
            result = result.filter(e =>
                (e.examTitle && e.examTitle.toLowerCase().includes(lower)) ||
                (e.courseName && e.courseName.toLowerCase().includes(lower))
            )
        }
        return result
    })

    const paginatedExams = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return filteredExams.value.slice(start, end)
    })

    const getStatus = (exam) => {
        const now = new Date().getTime()
        const start = new Date(exam.startTime).getTime()
        const end = new Date(exam.endTime).getTime()
        if (now < start) return 'NOT_STARTED'
        if (now > end) return 'ENDED'
        return 'ONGOING'
    }

    const getStatusClass = (exam) => {
        if (exam.isSubmitted) return 'state-finished'
        const status = getStatus(exam)
        if (status === 'ONGOING') return 'state-active'
        if (status === 'NOT_STARTED') return 'state-pending'
        return 'state-over'
    }

    const getStatusType = (exam) => {
        if (exam.isSubmitted) return 'success'
        const status = getStatus(exam)
        if (status === 'ONGOING') return 'danger'
        if (status === 'NOT_STARTED') return 'primary'
        return 'info'
    }

    const getButtonType = (exam) => {
        if (exam.isSubmitted) return 'success'
        const status = getStatus(exam)
        if (status === 'ONGOING') return 'primary'
        return 'info'
    }

    const getStatusText = (exam) => {
        if (exam.isSubmitted) return '已交卷'
        const status = getStatus(exam)
        if (status === 'ONGOING') return '正在进行'
        if (status === 'NOT_STARTED') return '未开始'
        return '已逾期'
    }

    const canStart = (exam) => {
        if (exam.isSubmitted) return true
        const status = getStatus(exam)
        return status === 'ONGOING'
    }

    const getActionButtonText = (exam) => {
        if (exam.isSubmitted) return exam.studentScore !== null ? '查看成绩' : '回顾试卷'
        const status = getStatus(exam)
        if (status === 'NOT_STARTED') return '尚未开启'
        if (status === 'ENDED') return '缺考'
        return '立即进入'
    }

    const formatTimeShort = (time) => {
        if (!time) return '-'
        return new Date(time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const formatTime = (time) => {
        if (!time) return '-'
        return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    const formatRange = (start, end) => {
        return `${formatTime(start)} ~ ${formatTime(end)}`
    }

    const handleStartExam = (exam) => {
        const path = exam.isSubmitted ? `/student/exam/${exam.examId}/result` : `/student/exam/${exam.examId}/take`
        router.push(path)
    }

    onMounted(() => {
        loadExams()
    })

    return {
        loading,
        filterStatus,
        searchKeyword,
        currentPage,
        pageSize,
        loadExams,
        handleFilterChange,
        handlePageChange,
        filteredExams,
        paginatedExams,
        getStatusClass,
        getStatusType,
        getButtonType,
        getStatusText,
        canStart,
        getActionButtonText,
        formatTimeShort,
        formatRange,
        handleStartExam
    }
}
