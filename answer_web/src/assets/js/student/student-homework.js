/**
 * 学生端作业列表逻辑
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStudentLabReports } from '@/api/homework'

export function useStudentHomework() {
    const router = useRouter()
    const loading = ref(false)
    const homeworks = ref([])
    const filterStatus = ref(null)
    const searchKeyword = ref('')

    onMounted(() => {
        loadHomeworks()
    })

    const loadHomeworks = async () => {
        loading.value = true
        try {
            const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId')

            if (!studentId) {
                ElMessage.warning('未能获取学生信息，请重新登录')
                return
            }
            const response = await getStudentLabReports(String(studentId))
            if (response) {
                homeworks.value = response.data || (Array.isArray(response) ? response : [])
            }
        } catch (error) {
            ElMessage.error('获取作业列表失败')
        } finally {
            loading.value = false
        }
    }

    const filteredHomeworks = computed(() => {
        let result = homeworks.value
        if (filterStatus.value !== null) {
            result = result.filter(hw => (hw.status || 0) === filterStatus.value)
        }
        if (searchKeyword.value) {
            const kw = searchKeyword.value.toLowerCase()
            result = result.filter(hw => hw.reportTitle.toLowerCase().includes(kw))
        }
        return result
    })

    const getCountByStatus = (status) => {
        return homeworks.value.filter(hw => (hw.status || 0) === status).length
    }

    const getStatusType = (status) => {
        const map = { 0: 'info', 1: 'warning', 2: 'success' }
        return map[status] || 'info'
    }

    const getStatusText = (status) => {
        const map = { 0: '待提交', 1: '待批改', 2: '已批改' }
        return map[status] || '待提交'
    }

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const isOverdue = (deadline) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
    }

    const goToSubmit = (hw) => router.push({
        name: 'student_homework_submit',
        params: { id: hw.reportId },
        query: { studentReportId: hw.studentReportId }
    })

    const viewDetail = (hw) => router.push({
        name: 'student_homework_detail',
        params: { id: hw.studentReportId }
    })

    const filterHomeworks = () => { }

    return {
        loading,
        homeworks,
        filterStatus,
        searchKeyword,
        filteredHomeworks,
        getCountByStatus,
        getStatusType,
        getStatusText,
        formatDate,
        isOverdue,
        goToSubmit,
        viewDetail,
        filterHomeworks
    }
}
