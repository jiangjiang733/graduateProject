/**
 * 学生端作业列表逻辑
 * 含分页 + 教师批改实时通知（轮询对比状态变化）
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { getStudentLabReports } from '@/api/homework'

export function useStudentHomework() {
    const router = useRouter()
    const loading = ref(false)
    const homeworks = ref([])
    const filterStatus = ref(null)
    const searchKeyword = ref('')

    // ---- 分页 ----
    const currentPage = ref(1)
    const pageSize = ref(6)

    // ---- 实时通知：记录上一次各作业的状态快照 ----
    const prevStatusMap = ref({})   // { [reportId]: status }
    let pollTimer = null

    // ============ 加载作业 ============
    const loadHomeworks = async (silent = false) => {
        if (!silent) loading.value = true
        try {
            const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId')
            if (!studentId) {
                ElMessage.warning('未能获取学生信息，请重新登录')
                return
            }
            const response = await getStudentLabReports(String(studentId))
            const list = response.data || (Array.isArray(response) ? response : [])

            if (silent && homeworks.value.length > 0) {
                // 静默刷新：对比状态变化
                detectGradeChanges(list)
            }

            homeworks.value = list

            // 初始化状态快照
            if (!silent) {
                prevStatusMap.value = {}
                list.forEach(hw => {
                    prevStatusMap.value[hw.reportId] = hw.status
                })
            }
        } catch (error) {
            if (!silent) ElMessage.error('获取作业列表失败')
        } finally {
            if (!silent) loading.value = false
        }
    }

    // ============ 检测批改状态变化 ============
    const detectGradeChanges = (newList) => {
        newList.forEach(hw => {
            const prevStatus = prevStatusMap.value[hw.reportId]
            const nowStatus = hw.status

            // 状态从"待批改(1)"变为"已完成(2)"→ 教师批改了
            if (prevStatus === 1 && nowStatus === 2) {
                showGradedNotification(hw)
            }
            // 状态从"待批改(1)"变为"被退回(3)"→ 教师退回了
            if (prevStatus === 1 && nowStatus === 3) {
                showReturnedNotification(hw)
            }
            // 更新快照
            prevStatusMap.value[hw.reportId] = nowStatus
        })
    }

    // ============ 批改完成通知 ============
    const showGradedNotification = (hw) => {
        ElNotification({
            title: '🎉 作业已批改',
            dangerouslyUseHTMLString: true,
            message: `
                <div class="notify-body">
                    <div class="notify-name">${hw.reportTitle}</div>
                    <div class="notify-score">
                        得分：<strong>${hw.score ?? '—'}</strong> / ${hw.totalScore ?? '—'} 分
                    </div>
                    ${hw.teacherComment ? `<div class="notify-comment">💬 ${hw.teacherComment}</div>` : ''}
                </div>
            `,
            type: 'success',
            duration: 6000,
            position: 'top-right',
            onClick: () => {
                if (hw.studentReportId) viewDetail(hw)
            }
        })
    }

    const showReturnedNotification = (hw) => {
        ElNotification({
            title: '📝 作业被退回，请修改',
            dangerouslyUseHTMLString: true,
            message: `
                <div class="notify-body">
                    <div class="notify-name">${hw.reportTitle}</div>
                    ${hw.teacherComment ? `<div class="notify-comment">教师意见：${hw.teacherComment}</div>` : ''}
                </div>
            `,
            type: 'warning',
            duration: 8000,
            position: 'top-right',
            onClick: () => goToSubmit(hw)
        })
    }

    // ============ 过滤 + 分页 ============
    const filteredAll = computed(() => {
        let result = homeworks.value
        if (filterStatus.value !== null) {
            result = result.filter(hw => (hw.status || 0) === filterStatus.value)
        }
        if (searchKeyword.value) {
            const kw = searchKeyword.value.toLowerCase()
            result = result.filter(hw =>
                (hw.reportTitle && hw.reportTitle.toLowerCase().includes(kw))
            )
        }
        return result
    })

    const total = computed(() => filteredAll.value.length)

    // 当前页展示的作业
    const filteredHomeworks = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        return filteredAll.value.slice(start, start + pageSize.value)
    })

    const handlePageChange = (page) => {
        currentPage.value = page
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const getCountByStatus = (status) => {
        return homeworks.value.filter(hw => (hw.status || 0) === status).length
    }

    const getStatusType = (status) => {
        const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
        return map[status] || 'info'
    }

    const getStatusText = (status) => {
        const map = { 0: '待提交', 1: '待批改', 2: '已完成', 3: '被退回' }
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

    const filterHomeworks = () => {
        currentPage.value = 1  // 切换筛选时重置到第一页
    }

    // ============ 生命周期 ============
    onMounted(() => {
        loadHomeworks()
        // 每 2 秒静默轮询，提升实时交互和无延迟提醒
        pollTimer = setInterval(() => loadHomeworks(true), 2000)
    })

    onUnmounted(() => {
        if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
        }
    })

    return {
        loading,
        homeworks,
        filterStatus,
        searchKeyword,
        filteredHomeworks,
        total,
        currentPage,
        pageSize,
        getCountByStatus,
        getStatusType,
        getStatusText,
        formatDate,
        isOverdue,
        goToSubmit,
        viewDetail,
        filterHomeworks,
        handlePageChange
    }
}
