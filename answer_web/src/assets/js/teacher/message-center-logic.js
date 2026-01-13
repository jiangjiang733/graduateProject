import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMessageList, markAsRead, getUnreadCount } from '@/api/message.js'
import { getTeacherNotifications } from '@/api/notification.js'
import {
    sendChatMessage, getChatHistory, getChatContacts,
    getActiveContacts, markChatRead, getChatUnreadCount
} from '@/api/chat'
import { addComment, deleteComment } from '@/api/comment'
import { useUserInfo } from '@/stores/user'

const DEFAULT_AVATAR = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

export function useMessageCenter() {
    const userStore = useUserInfo()
    const router = useRouter()

    const activeTab = ref('chat')
    const activeInteractionType = ref('comment')
    const commentSubTab = ref('discussion') // 'discussion' | 'reply'
    const loadingContacts = ref(false)
    const interactionLoading = ref(false)
    const searchKeyword = ref('')
    const currentChatUser = ref(null)
    const inputMessage = ref('')
    const messageBox = ref(null)

    const userList = ref([])
    const currentMessages = ref([])
    const interactionList = ref([])
    const chatUnreadTotal = ref(0)
    const interactionUnread = ref(0)

    // Computed
    const filteredUserList = computed(() => {
        if (!searchKeyword.value) return userList.value
        return userList.value.filter(u => u.contactName?.includes(searchKeyword.value))
    })

    const interactionTitle = computed(() => {
        if (activeInteractionType.value === 'comment') return '课程互动'
        return '通知'
    })

    const filteredInteractionList = computed(() => {
        // 1. 初步过滤大类
        let list = interactionList.value.filter(item => {
            if (activeInteractionType.value === 'system') return item.type === 'SYSTEM'
            return item.type !== 'SYSTEM'
        })

        // 2. 如果是评论模式，再根据子Tab过滤
        if (activeInteractionType.value === 'comment') {
            if (commentSubTab.value === 'discussion') {
                // 过滤"新课程讨论"：通常依据标题判断
                return list.filter(item => item.actionText && item.actionText.includes('新课程讨论'))
            } else {
                // 过滤"收到的回复"
                return list.filter(item => !item.actionText || !item.actionText.includes('新课程讨论'))
            }
        }

        return list
    })

    const emptyStateText = computed(() => {
        if (activeInteractionType.value === 'comment') {
            return commentSubTab.value === 'discussion' ? '暂无新讨论' : '暂无新回复'
        }
        return '暂无新消息'
    })

    // Methods
    const loadContacts = async (showLoading = true) => {
        if (showLoading) loadingContacts.value = true
        try {
            const teacherId = userStore.userId
            const teacherType = 'TEACHER'
            const activeRes = await getActiveContacts(teacherType.toLowerCase(), teacherId)
            const chatRes = await getChatContacts(teacherType.toLowerCase(), teacherId)

            if (activeRes.code === 200) {
                const activeContacts = activeRes.data || []
                const chatSummaries = chatRes.code === 200 ? chatRes.data : []

                userList.value = activeContacts.map(ac => {
                    const summary = chatSummaries.find(cs => cs.contactId === ac.contactId)
                    return {
                        ...ac,
                        lastMessage: summary?.lastMessage || '',
                        lastTime: summary?.lastTime || null,
                        unreadCount: summary?.unreadCount || 0
                    }
                })

                userList.value.sort((a, b) => {
                    if (!a.lastTime && !b.lastTime) return 0
                    if (!a.lastTime) return 1
                    if (!b.lastTime) return -1
                    return new Date(b.lastTime) - new Date(a.lastTime)
                })
            }
            await updateUnreadCounts()
        } catch (e) { console.error(e) } finally { loadingContacts.value = false }
    }

    const updateUnreadCounts = async () => {
        try {
            const teacherId = userStore.userId
            const teacherType = 'TEACHER'
            const chatRes = await getChatUnreadCount(teacherType.toLowerCase(), teacherId)
            if (chatRes.code === 200) chatUnreadTotal.value = chatRes.data

            const sysRes = await getUnreadCount(teacherId, teacherType)
            if (sysRes.code === 200) interactionUnread.value = sysRes.data.unreadCount
        } catch (e) { }
    }

    const loadInteractions = async (showLoading = true) => {
        if (showLoading) interactionLoading.value = true
        try {
            const teacherId = userStore.userId
            if (!teacherId) return

            const teacherType = 'TEACHER'
            // 并行获取私信/互动消息和系统公告广播
            const [messageRes, notifyRes] = await Promise.all([
                getMessageList(teacherId, teacherType, { pageSize: 50 }),
                getTeacherNotifications({ pageSize: 20 })
            ])

            let combinedList = []

            // 1. 处理私信/互动消息
            if (messageRes.code === 200 && messageRes.data?.records) {
                const messages = messageRes.data.records.map(m => {
                    const oldItem = interactionList.value.find(oi => oi.id === m.messageId && oi.source === 'MESSAGE')
                    return {
                        id: m.messageId,
                        source: 'MESSAGE',
                        senderId: m.senderId,
                        senderType: m.senderType || 'STUDENT',
                        type: (m.messageType === 'INTERACTION' || m.messageType === 'COMMENT') ? 'COMMENT' : 'SYSTEM',
                        userName: m.senderName || '系统',
                        userAvatar: m.senderAvatar || DEFAULT_AVATAR,
                        content: m.content,
                        time: m.createTime,
                        isRead: m.isRead === 1,
                        actionText: m.title || (m.messageType === 'INTERACTION' ? '发表了新回复' : '系统消息'),
                        relatedId: m.relatedId,
                        courseId: m.courseId,
                        showReply: oldItem ? oldItem.showReply : false,
                        replyContent: oldItem ? oldItem.replyContent : ''
                    }
                })
                combinedList.push(...messages)
            }

            // 2. 处理系统公告（广播式，无特定receiverId）
            if (notifyRes.code === 200 && notifyRes.data?.records) {
                const notifications = notifyRes.data.records.map(n => ({
                    id: n.notificationId,
                    source: 'NOTIFICATION',
                    type: 'SYSTEM',
                    userName: '系统公告',
                    userAvatar: '', // 可使用特定图标
                    content: n.content,
                    time: n.createTime,
                    isRead: true, // 广播式公告暂不维护个人读写状态，设为已读或根据本地存储判断
                    actionText: n.title,
                    priority: n.priority
                }))
                combinedList.push(...notifications)
            }

            // 3. 排序：按时间倒序
            combinedList.sort((a, b) => new Date(b.time) - new Date(a.time))
            interactionList.value = combinedList

        } catch (e) {
            console.error('加载消息失败:', e)
        } finally {
            interactionLoading.value = false
        }
    }

    const selectChatUser = async (user) => {
        currentChatUser.value = user
        try {
            const teacherId = userStore.userId
            const res = await getChatHistory({
                user1Id: teacherId,
                user1Type: 'TEACHER',
                user2Id: user.contactId,
                user2Type: user.contactType || 'STUDENT'
            })
            if (res.code === 200) {
                currentMessages.value = Array.isArray(res.data) ? res.data : []
                scrollToBottom()
                if (user.unreadCount > 0) {
                    await markChatRead({
                        currentUserId: teacherId,
                        currentUserType: 'TEACHER',
                        senderId: user.contactId,
                        senderType: user.contactType || 'STUDENT'
                    })
                    user.unreadCount = 0
                    updateUnreadCounts()
                }
            }
        } catch (e) { }
    }

    const handleSendMessage = async () => {
        if (!inputMessage.value.trim() || !currentChatUser.value) return
        const text = inputMessage.value
        const teacherId = userStore.userId
        const msg = {
            senderId: String(teacherId),
            senderType: 'TEACHER',
            receiverId: String(currentChatUser.value.contactId),
            receiverType: currentChatUser.value.contactType || 'STUDENT',
            content: text,
            msgType: 'TEXT'
        }

        // 清空输入框
        inputMessage.value = ''

        try {
            console.log('教师发送消息:', msg)
            const res = await sendChatMessage(msg)
            if (res.code === 200) {
                // 使用后端返回的完整对象
                if (!Array.isArray(currentMessages.value)) currentMessages.value = []
                currentMessages.value.push(res.data)

                // 更新左侧列表
                if (currentChatUser.value) {
                    currentChatUser.value.lastMessage = text
                    currentChatUser.value.lastTime = new Date()
                }
                scrollToBottom()
            } else {
                ElMessage.error(res.message || '发送失败')
                inputMessage.value = text // 恢复输入内容
            }
        } catch (e) {
            console.error('发送私信异常:', e)
            ElMessage.error('网络错误，发送失败')
            inputMessage.value = text
        }
    }

    const isMyMessage = (msg) => {
        const teacherId = userStore.userId
        if (!msg || !teacherId) return false
        const sId = String(msg.senderId)
        const tId = String(teacherId)
        return sId === tId && (msg.senderType === 'TEACHER' || msg.senderRole === 'TEACHER')
    }

    const handleInteractionDetail = async (item) => {
        // 1. 标记已读
        if (!item.isRead) {
            try {
                await markAsRead(item.id, userStore.userId, 'TEACHER')
                item.isRead = true
                updateUnreadCounts()
            } catch (e) { }
        }

        // 如果是课程评论，跳转到课程详情页的评论部分
        if (item.courseId && (item.type === 'COMMENT' || item.type === 'INTERACTION')) {
            router.push({
                path: `/teacher/course/detail/${item.courseId}`,
                query: {
                    tab: 'comments', // 对应 el-tab-pane 的 name
                    commentId: item.relatedId
                }
            })
            return
        }

        // 2. 如果是其它类型，或者没有relatedId，尝试跳转到私信
        if (item.senderId) {
            const student = userList.value.find(u => String(u.contactId) === String(item.senderId))
            if (student) {
                activeTab.value = 'chat'
                selectChatUser(student)
            } else {
                ElMessage.info('正在为您打开对话框...')
                activeTab.value = 'chat'
                selectChatUser({
                    contactId: item.senderId,
                    contactName: item.userName,
                    contactAvatar: item.userAvatar,
                    contactType: 'STUDENT'
                })
            }
        }
    }

    const toggleQuickReply = async (item) => {
        item.showReply = !item.showReply
        // 实时响应已读
        if (!item.isRead) {
            try {
                await markAsRead(item.id, userStore.userId, 'TEACHER')
                item.isRead = true
                updateUnreadCounts()
            } catch (e) { console.error(e) }
        }
    }

    const handleQuickReply = async (item) => {
        if (!item.replyContent.trim()) return

        // 屏蔽系统通知回复
        if (!item.senderId || item.userName.includes('系统')) {
            ElMessage.warning('系统通知无法直接回复')
            return
        }

        try {
            const { userId, userName, avatarUrl } = userStore

            // 核心逻辑：区分是"公开回复评论"还是"私信回复"
            if (item.type === 'COMMENT' || item.type === 'INTERACTION') {
                // 尝试复用 addComment 接口
                // relatedId 存的是父评论ID，不是courseId
                // 将 relatedId 作为 parentId 传给后端，让后端自动继承 courseId
                const commentData = {
                    // 不传 courseId，让后端从父评论继承
                    userId: userId,
                    userName: userName,
                    userAvatar: avatarUrl,
                    userType: 'TEACHER',
                    content: item.replyContent,
                    parentId: item.relatedId, // 父评论ID（后端会从父评论继承 courseId）
                    targetUserId: item.senderId,
                    targetUserType: item.senderType || 'STUDENT'
                }

                const res = await addComment(commentData)
                if (res.code === 200) {
                    ElMessage.success('回复成功')
                    item.replyContent = ''
                    item.showReply = false
                } else {
                    ElMessage.error(res.message || '回复失败')
                }
            } else {
                // 普通私信回复
                const msgData = {
                    senderId: String(userId),
                    senderType: 'TEACHER',
                    receiverId: String(item.senderId),
                    receiverType: item.senderType || 'STUDENT',
                    content: `[回复] ${item.replyContent}`,
                    msgType: 'TEXT'
                }
                const res = await sendChatMessage(msgData)
                if (res.code === 200) {
                    ElMessage.success('私信回复成功')
                    item.replyContent = ''
                    item.showReply = false
                } else {
                    ElMessage.error(res.message || '回复失败')
                }
            }
        } catch (error) {
            console.error(error)
            ElMessage.error('发送失败')
        }
    }

    // 删除评论（同时会删除关联的消息通知）
    const handleDeleteComment = async (item) => {
        if (!item.relatedId) {
            ElMessage.warning('无法获取评论ID')
            return
        }

        try {
            // 确认删除
            await ElMessageBox.confirm(
                '确定要删除这条评论吗？删除后相关的消息通知也会被清除。',
                '删除确认',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const res = await deleteComment(item.relatedId)
            if (res.code === 200) {
                ElMessage.success('删除成功')
                // 从列表中移除该项
                const index = interactionList.value.findIndex(i => i.id === item.id)
                if (index > -1) {
                    interactionList.value.splice(index, 1)
                }
                updateUnreadCounts()
            } else {
                ElMessage.error(res.message || '删除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error(error)
                ElMessage.error('删除失败')
            }
        }
    }

    const markAllRead = async () => {
        const unread = filteredInteractionList.value.filter(i => !i.isRead)
        if (unread.length === 0) return
        try {
            await Promise.all(unread.map(i => markAsRead(i.id, userStore.userId, 'TEACHER')))
            unread.forEach(i => i.isRead = true)
            updateUnreadCounts()
            ElMessage.success('已全部标记已读')
        } catch (e) { }
    }

    const scrollToBottom = () => {
        nextTick(() => {
            if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight
        })
    }

    const formatTime = (time) => {
        if (!time) return ''
        const date = new Date(time)
        const now = new Date()
        if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }

    const formatDetailedTime = (time) => {
        if (!time) return ''
        const date = new Date(time)
        const now = new Date()
        const diff = now - date
        if (diff < 60000) return '刚刚'

        // 如果是今天，显示 HH:mm
        if (date.toDateString() === now.toDateString()) {
            return date.getHours().toString().padStart(2, '0') + ':' +
                date.getMinutes().toString().padStart(2, '0')
        }

        // 超过24h显示日期 MM-dd
        return (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
            date.getDate().toString().padStart(2, '0')
    }

    const getAvatarUrl = (path) => {
        const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
        if (!path) return defaultAvatar
        if (path.startsWith('http')) return path
        const realPath = path.startsWith('/') ? path : '/' + path
        return `http://localhost:8088${realPath}`
    }

    // 刷新当前聊天窗口的消息历史
    const refreshChatHistory = async () => {
        if (!currentChatUser.value) return
        try {
            const teacherId = userStore.userId
            const res = await getChatHistory({
                user1Id: teacherId,
                user1Type: 'TEACHER',
                user2Id: currentChatUser.value.contactId,
                user2Type: currentChatUser.value.contactType || 'STUDENT'
            })
            if (res.code === 200 && res.data) {
                // 如果有新消息才更新
                if (Array.isArray(res.data) && res.data.length > currentMessages.value.length) {
                    currentMessages.value = res.data
                    scrollToBottom()
                } else if (Array.isArray(res.data)) {
                    // 检查最后一条消息是否不同
                    const hasNewMessage = currentMessages.value.length > 0 &&
                        res.data.length > 0 &&
                        res.data[res.data.length - 1].createTime > currentMessages.value[currentMessages.value.length - 1].createTime
                    if (hasNewMessage) {
                        currentMessages.value = res.data
                        scrollToBottom()
                    }
                }
            }
        } catch (error) {
            console.error('刷新聊天历史失败:', error)
        }
    }

    let timer = null

    const initMessageCenter = () => {
        userStore.initUserInfo()
        loadContacts()
        loadInteractions()
        timer = setInterval(() => {
            updateUnreadCounts()

            // 1. 刷新联系人摘要排序 (不显示 loading)
            loadContacts(false)

            // 2. 刷新互动通知 (不显示 loading)
            loadInteractions(false)

            // 3. 如果在聊天窗口，刷新历史
            if (currentChatUser.value && activeTab.value === 'chat') {
                refreshChatHistory()
            }
        }, 3000)
    }

    const cleanupMessageCenter = () => {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
    }

    return {
        // State
        userStore,
        activeTab,
        activeInteractionType,
        commentSubTab,
        loadingContacts,
        interactionLoading,
        searchKeyword,
        currentChatUser,
        inputMessage,
        messageBox,
        userList,
        currentMessages,
        interactionList,
        chatUnreadTotal,
        interactionUnread,

        // Computed
        filteredUserList,
        interactionTitle,
        filteredInteractionList,
        emptyStateText,

        // Methods
        loadContacts,
        updateUnreadCounts,
        loadInteractions,
        selectChatUser,
        handleSendMessage,
        isMyMessage,
        handleInteractionDetail,
        toggleQuickReply,
        handleQuickReply,
        handleDeleteComment,
        markAllRead,
        scrollToBottom,
        formatTime,
        formatDetailedTime,
        getAvatarUrl,
        refreshChatHistory,
        initMessageCenter,
        cleanupMessageCenter
    }
}
