import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMessageList, markAsRead, deleteMessage, getUnreadCount } from '@/api/message.js'

export function useMessageCenter() {
    const loading = ref(false)
    const messages = ref([])
    const unreadCount = ref(0)
    const filterStatus = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    // 加载消息列表
    const loadMessages = async () => {
        loading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                ElMessage.warning('请先登录')
                return
            }

            const params = {
                pageNumber: currentPage.value,
                pageSize: pageSize.value
            }

            if (filterStatus.value !== '') {
                params.isRead = filterStatus.value
            }

            const response = await getMessageList(teacherId, params)
            if (response.success && response.data) {
                messages.value = response.data.records || []
                total.value = response.data.total || 0
            }

            // 加载未读数量
            loadUnreadCount()
        } catch (error) {
            console.error('加载消息失败:', error)
            ElMessage.error('加载消息失败')
        } finally {
            loading.value = false
        }
    }

    // 加载未读数量
    const loadUnreadCount = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getUnreadCount(teacherId)
            if (response.success && response.data) {
                unreadCount.value = response.data.unreadCount || 0
            }
        } catch (error) {
            console.error('加载未读数量失败:', error)
        }
    }

    // 标记已读
    const markRead = async (message) => {
        try {
            const response = await markAsRead(message.messageId)
            if (response.success) {
                ElMessage.success('已标记为已读')
                loadMessages()
            }
        } catch (error) {
            console.error('标记失败:', error)
            ElMessage.error('标记失败')
        }
    }

    // 删除消息
    const deleteMsg = async (message) => {
        try {
            await ElMessageBox.confirm(
                '确定要删除这条留言吗？',
                '删除确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const response = await deleteMessage(message.messageId)
            if (response.success) {
                ElMessage.success('删除成功')
                loadMessages()
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除失败:', error)
                ElMessage.error('删除失败')
            }
        }
    }

    // 格式化日期
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
    }

    onMounted(() => {
        loadMessages()
    })

    return {
        loading,
        messages,
        unreadCount,
        filterStatus,
        currentPage,
        pageSize,
        total,
        loadMessages,
        loadUnreadCount,
        markRead,
        deleteMsg,
        formatDate
    }
}
