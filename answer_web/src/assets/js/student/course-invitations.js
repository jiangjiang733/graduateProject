/**
 * 课程邀请逻辑 - 学生端
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStudentEnrollments, reviewEnrollment } from '@/api/enrollment.js'

export function useCourseInvitations() {
    const loading = ref(false)
    const submitting = ref(false)
    const rejectDialogVisible = ref(false)
    const rejectFormRef = ref()
    const currentTab = ref('pending')
    const invitations = ref([])
    const currentInvitation = ref({})

    const rejectForm = reactive({
        reason: ''
    })

    const rejectRules = {
        reason: [
            { max: 200, message: '拒绝原因不超过200个字符', trigger: 'blur' }
        ]
    }

    // 统计数据
    const pendingCount = computed(() => invitations.value.filter(i => i.status === 'pending').length)
    const approvedCount = computed(() => invitations.value.filter(i => i.status === 'approved').length)
    const rejectedCount = computed(() => invitations.value.filter(i => i.status === 'rejected').length)

    // 过滤后的邀请
    const filteredInvitations = computed(() => {
        if (currentTab.value === 'pending') {
            return invitations.value.filter(i => i.status === 'pending')
        } else if (currentTab.value === 'approved') {
            return invitations.value.filter(i => i.status === 'approved')
        } else if (currentTab.value === 'rejected') {
            return invitations.value.filter(i => i.status === 'rejected')
        }
        return invitations.value
    })

    // 加载邀请列表
    const loadInvitations = async () => {
        loading.value = true
        try {
            const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
            if (!studentId) {
                ElMessage.warning('请先登录')
                return
            }

            const response = await getStudentEnrollments(studentId)
            if (response.success) {
                invitations.value = (response.data || []).map(item => ({
                    ...item,
                    accepting: false,
                    rejecting: false
                }))
            }
        } catch (error) {
            console.error('加载邀请列表失败:', error)
            ElMessage.error('加载失败')
        } finally {
            loading.value = false
        }
    }

    // 接受邀请
    const handleAccept = async (invitation) => {
        try {
            await ElMessageBox.confirm(
                `确定要接受课程"${invitation.courseName}"的邀请吗？`,
                '确认接受',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'success'
                }
            )

            invitation.accepting = true
            const response = await reviewEnrollment(invitation.id, 'approved')

            if (response.success) {
                ElMessage.success('已接受邀请')
                invitation.status = 'approved'
                invitation.reviewTime = new Date().toISOString()
            } else {
                ElMessage.error(response.message || '操作失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('接受邀请失败:', error)
                ElMessage.error('操作失败')
            }
        } finally {
            invitation.accepting = false
        }
    }

    // 显示拒绝对话框
    const showRejectDialog = (invitation) => {
        currentInvitation.value = invitation
        rejectForm.reason = ''
        rejectDialogVisible.value = true
    }

    // 拒绝邀请
    const handleReject = async () => {
        try {
            await rejectFormRef.value.validate()
            submitting.value = true

            const response = await reviewEnrollment(
                currentInvitation.value.id,
                'rejected',
                rejectForm.reason || '学生拒绝了邀请'
            )

            if (response.success) {
                ElMessage.success('已拒绝邀请')
                currentInvitation.value.status = 'rejected'
                currentInvitation.value.reviewTime = new Date().toISOString()
                currentInvitation.value.rejectReason = rejectForm.reason
                rejectDialogVisible.value = false
            } else {
                ElMessage.error(response.message || '操作失败')
            }
        } catch (error) {
            if (error.errors) return
            console.error('拒绝邀请失败:', error)
            ElMessage.error('操作失败')
        } finally {
            submitting.value = false
        }
    }

    // 获取状态类型
    const getStatusType = (status) => {
        const types = {
            pending: 'warning',
            approved: 'success',
            rejected: 'danger'
        }
        return types[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
        const texts = {
            pending: '待处理',
            approved: '已接受',
            rejected: '已拒绝'
        }
        return texts[status] || '未知'
    }

    // 格式化时间
    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date
        if (diff < 60000) return '刚刚'
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
        return date.toLocaleDateString()
    }

    onMounted(() => {
        loadInvitations()
    })

    return {
        loading,
        submitting,
        rejectDialogVisible,
        rejectFormRef,
        currentTab,
        invitations,
        currentInvitation,
        rejectForm,
        rejectRules,
        pendingCount,
        approvedCount,
        rejectedCount,
        filteredInvitations,
        loadInvitations,
        handleAccept,
        showRejectDialog,
        handleReject,
        getStatusType,
        getStatusText,
        formatTimeAgo
    }
}
