/**
 * 学生消息中心逻辑
 */
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserInfo } from '@/stores/user'
import {
    sendChatMessage, getChatHistory, getChatContacts,
    getActiveContacts, markChatRead, getChatUnreadCount
} from '@/api/chat'
import { getMessageList, markAsRead, getUnreadCount } from '@/api/message'
import { getStudentNotifications } from '@/api/notification'
import { addComment } from '@/api/comment'

export function useStudentMessageCenter() {
    const userStore = useUserInfo()
    const router = useRouter()

    // State
    const activeTab = ref('chat')
    const activeInteractionType = ref('system')
    const searchKeyword = ref('')
    const currentChatTeacher = ref(null)
    const inputMessage = ref('')
    const messageBox = ref(null)

    const teacherList = ref([])
    const currentMessages = ref([])
    const interactionList = ref([])
    const interactionUnread = ref(0)
    const chatUnreadTotal = ref(0)
    const loadingContacts = ref(false)
    const interactionLoading = ref(false)

    const studentId = computed(() => userStore.userId)
    const userType = computed(() => userStore.userType || 'STUDENT')

    // Computed
    const filteredTeacherList = computed(() => {
        if (!searchKeyword.value) return teacherList.value
        return teacherList.value.filter(t =>
            t.contactName?.includes(searchKeyword.value) ||
            t.courseName?.includes(searchKeyword.value)
        )
    })

    const interactionTitle = computed(() => {
        if (activeInteractionType.value === 'system') return '系统通知'
        if (activeInteractionType.value === 'comment') return '收到的回复'
        if (activeInteractionType.value === 'invitation') return '课程邀请'
        return '通知'
    })

    const filteredInteractionList = computed(() => {
        return interactionList.value.filter(item => {
            if (activeInteractionType.value === 'system') return item.type === 'SYSTEM'
            if (activeInteractionType.value === 'comment') {
                return item.type === 'INTERACTION' || item.type === 'COMMENT'
            }
            if (activeInteractionType.value === 'invitation') return item.type === 'COURSE_INVITATION'
            return item.type !== 'SYSTEM'
        })
    })

    // Methods
    const loadContacts = async (showLoading = true) => {
        if (showLoading) loadingContacts.value = true
        try {
            const activeRes = await getActiveContacts(userType.value.toLowerCase(), studentId.value)
            const chatRes = await getChatContacts(userType.value.toLowerCase(), studentId.value)

            if (activeRes.code === 200) {
                const activeContacts = activeRes.data || []
                const chatSummaries = chatRes.code === 200 ? chatRes.data : []

                teacherList.value = activeContacts.map(ac => {
                    const summary = chatSummaries.find(cs => cs.contactId === ac.contactId)
                    return {
                        ...ac,
                        lastMessage: summary?.lastMessage || '',
                        lastTime: summary?.lastTime || null,
                        unreadCount: summary?.unreadCount || 0
                    }
                })

                teacherList.value.sort((a, b) => {
                    if (!a.lastTime && !b.lastTime) return 0
                    if (!a.lastTime) return 1
                    if (!b.lastTime) return -1
                    return new Date(b.lastTime) - new Date(a.lastTime)
                })
            }

            await updateUnreadCounts()
        } catch (error) {
            console.error('加载联系人失败:', error)
        } finally {
            loadingContacts.value = false
        }
    }

    const updateUnreadCounts = async () => {
        try {
            const chatUnreadRes = await getChatUnreadCount(userType.value.toLowerCase(), studentId.value)
            if (chatUnreadRes.code === 200) chatUnreadTotal.value = chatUnreadRes.data

            const sysUnreadRes = await getUnreadCount(studentId.value, userType.value)
            if (sysUnreadRes.code === 200) interactionUnread.value = sysUnreadRes.data.unreadCount
        } catch (e) { }
    }

    const loadInteractions = async (showLoading = true) => {
        if (showLoading) interactionLoading.value = true
        try {
            const sid = studentId.value
            const stype = userType.value
            if (!sid) return

            // 并行获取个人互动消息和全局公告广播
            const [messageRes, notifyRes] = await Promise.all([
                getMessageList(sid, stype, { pageSize: 50 }),
                getStudentNotifications({ pageSize: 20 })
            ])

            let combinedList = []

            // 1. 处理个人互动消息
            if (messageRes.code === 200 && messageRes.data?.records) {
                const messages = messageRes.data.records.map(m => {
                    const oldItem = interactionList.value.find(oi => oi.id === m.messageId && oi.source === 'MESSAGE')
                    return {
                        id: m.messageId,
                        source: 'MESSAGE',
                        senderId: m.senderId,
                        senderType: m.senderType || 'TEACHER',
                        type: m.messageType || (m.title?.includes('系统通知') ? 'SYSTEM' : 'INTERACTION'),
                        userName: m.senderName || (m.title?.includes('系统通知') ? '系统' : '答疑助教'),
                        userAvatar: m.senderAvatar || '',
                        content: m.content,
                        time: m.createTime,
                        isRead: m.isRead === 1,
                        actionText: m.title || (m.messageType === 'INTERACTION' ? '发表了新回复' : '发来一条消息'),
                        showReply: oldItem ? oldItem.showReply : false,
                        replyContent: oldItem ? oldItem.replyContent : '',
                        relatedId: m.relatedId,
                        courseId: m.courseId
                    }
                })
                combinedList.push(...messages)
            }

            // 2. 处理全局公告广播 (NOTIFICATION)
            if (notifyRes.code === 200 && notifyRes.data?.records) {
                const notifications = notifyRes.data.records.map(n => ({
                    id: n.notificationId,
                    source: 'NOTIFICATION',
                    type: 'SYSTEM',
                    userName: '系统公告',
                    userAvatar: '',
                    content: n.content,
                    time: n.createTime,
                    isRead: true, // 广播式暂不维护持久化已读状态
                    actionText: n.title,
                    priority: n.priority
                }))
                combinedList.push(...notifications)
            }

            // 3. 排序：按时间倒序
            combinedList.sort((a, b) => new Date(b.time) - new Date(a.time))
            interactionList.value = combinedList

        } catch (error) {
            console.error('加载互动消息失败:', error)
        } finally {
            interactionLoading.value = false
        }
    }

    const selectChatTeacher = async (teacher) => {
        currentChatTeacher.value = teacher
        try {
            const res = await getChatHistory({
                user1Id: studentId.value,
                user1Type: userType.value,
                user2Id: teacher.contactId,
                user2Type: teacher.contactType || 'TEACHER'
            })
            if (res.code === 200) {
                currentMessages.value = res.data || []
                scrollToBottom()

                if (teacher.unreadCount > 0) {
                    await markChatRead({
                        currentUserId: studentId.value,
                        currentUserType: userType.value,
                        senderId: teacher.contactId,
                        senderType: teacher.contactType || 'TEACHER'
                    })
                    teacher.unreadCount = 0
                    updateUnreadCounts()
                }
            }
        } catch (error) {
            ElMessage.error('获取历史记录失败')
        }
    }

    const handleSendMessage = async () => {
        if (!inputMessage.value.trim() || !currentChatTeacher.value) return

        const msgData = {
            senderId: studentId.value,
            senderType: userType.value,
            receiverId: currentChatTeacher.value.contactId,
            receiverType: currentChatTeacher.value.contactType || 'TEACHER',
            content: inputMessage.value,
            msgType: 'TEXT'
        }

        try {
            const res = await sendChatMessage(msgData)
            if (res.code === 200) {
                if (!Array.isArray(currentMessages.value)) {
                    currentMessages.value = []
                }
                currentMessages.value.push(res.data)
                currentChatTeacher.value.lastMessage = inputMessage.value
                currentChatTeacher.value.lastTime = new Date()
                inputMessage.value = ''
                scrollToBottom()
            } else {
                ElMessage.error(res.message || '发送失败')
            }
        } catch (error) {
            console.error('发送私信异常:', error)
            ElMessage.error('网络错误，发送失败')
        }
    }

    const isMyMessage = (msg) => {
        if (!msg || !studentId.value) return false
        return String(msg.senderId) === String(studentId.value) && msg.senderType === userType.value
    }

    const handleInteractionDetail = async (item) => {
        if (!item.isRead && item.type !== 'COMMENT' && item.source === 'MESSAGE') {
            try {
                await markAsRead(item.id, studentId.value, userType.value)
                item.isRead = true
                interactionUnread.value = Math.max(0, interactionUnread.value - 1)
            } catch (e) { }
        }

        if (item.courseId && (item.type === 'COMMENT' || item.type === 'INTERACTION')) {
            router.push({
                path: `/student/course/detail/${item.courseId}`,
                query: {
                    tab: 'reviews',
                    commentId: item.relatedId
                }
            })
        }
    }

    const toggleQuickReply = (item) => {
        item.showReply = !item.showReply
    }

    const handleQuickReply = async (item) => {
        if (!item.replyContent.trim()) return

        try {
            if (item.type === 'COMMENT' || item.type === 'INTERACTION') {
                const commentData = {
                    userId: studentId.value,
                    userName: userStore.userName,
                    userAvatar: userStore.avatar,
                    userType: userType.value,
                    content: item.replyContent,
                    parentId: item.relatedId,
                    targetUserId: item.senderId,
                    targetUserType: item.senderType || 'TEACHER'
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
                const msgData = {
                    senderId: studentId.value,
                    senderType: userType.value,
                    receiverId: item.senderId,
                    receiverType: item.senderType || 'TEACHER',
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

    const markAllRead = async () => {
        const unreadItems = filteredInteractionList.value.filter(item => !item.isRead && item.source === 'MESSAGE')
        if (unreadItems.length === 0) return
        try {
            await Promise.all(unreadItems.map(item => markAsRead(item.id, studentId.value, userType.value)))
            unreadItems.forEach(item => item.isRead = true)
            updateUnreadCounts()
            ElMessage.success('已清空未读')
        } catch (error) {
            ElMessage.error('操作失败')
        }
    }

    const scrollToBottom = () => {
        nextTick(() => {
            if (messageBox.value) {
                messageBox.value.scrollTop = messageBox.value.scrollHeight
            }
        })
    }

    const formatTime = (time) => {
        if (!time) return ''
        const date = new Date(time)
        const now = new Date()
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }

    const formatExtendedTime = (time) => {
        if (!time) return ''
        const date = new Date(time)
        const now = new Date()
        const diff = now - date
        if (diff < 60000) return '刚刚'

        if (date.toDateString() === now.toDateString()) {
            return date.getHours().toString().padStart(2, '0') + ':' +
                date.getMinutes().toString().padStart(2, '0')
        }

        return (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
            date.getDate().toString().padStart(2, '0')
    }

    const getAvatarUrl = (path) => {
        const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
        if (!path || path.trim() === '') return defaultAvatar
        if (path.startsWith('http')) return path
        const realPath = path.startsWith('/') ? path : '/' + path
        return `http://localhost:8088${realPath}`
    }

    const refreshChatHistory = async () => {
        if (!currentChatTeacher.value) return
        try {
            const res = await getChatHistory({
                user1Id: studentId.value,
                user1Type: userType.value,
                user2Id: currentChatTeacher.value.contactId,
                user2Type: 'TEACHER'
            })
            if (res.code === 200 && res.data) {
                if (Array.isArray(res.data) && res.data.length > currentMessages.value.length) {
                    currentMessages.value = res.data
                    scrollToBottom()
                } else if (Array.isArray(res.data)) {
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

    let refreshTimer = null

    onMounted(() => {
        userStore.initUserInfo()
        loadContacts()
        loadInteractions()

        refreshTimer = setInterval(() => {
            updateUnreadCounts()
            loadContacts(false)

            if (activeTab.value === 'interaction') {
                loadInteractions(false)
            }

            if (currentChatTeacher.value && activeTab.value === 'chat') {
                refreshChatHistory()
            }
        }, 3000)
    })

    watch(activeInteractionType, () => {
        loadInteractions()
    })

    onUnmounted(() => {
        if (refreshTimer) clearInterval(refreshTimer)
    })

    return {
        userStore,
        activeTab,
        activeInteractionType,
        searchKeyword,
        currentChatTeacher,
        inputMessage,
        messageBox,
        teacherList,
        currentMessages,
        interactionList,
        interactionUnread,
        chatUnreadTotal,
        loadingContacts,
        interactionLoading,
        filteredTeacherList,
        interactionTitle,
        filteredInteractionList,
        loadContacts,
        selectChatTeacher,
        handleSendMessage,
        isMyMessage,
        handleInteractionDetail,
        toggleQuickReply,
        handleQuickReply,
        markAllRead,
        formatTime,
        formatExtendedTime,
        getAvatarUrl
    }
}
