import { ref, computed, nextTick } from 'vue'
import { getActiveContacts, getChatHistory, sendMessage, markRead, getUnreadCount, getContacts } from '@/api/chat'
import { ElMessage } from 'element-plus'

export function useChatManagement() {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}')
    const currentUserId = adminInfo.id || '1'
    const currentUserType = 'ADMIN'

    const contacts = ref<any[]>([])
    const activeChat = ref<any>(null)
    const messages = ref<any[]>([])
    const inputText = ref('')
    const loading = ref(false)
    const searching = ref(false)
    const messageBox = ref<any>(null)
    const unreadTotal = ref(0)

    const searchKeyword = ref('')

    const filteredContacts = computed(() => {
        if (!searchKeyword.value) return contacts.value
        return contacts.value.filter(c =>
            c.contactName?.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
            c.courseName?.toLowerCase().includes(searchKeyword.value.toLowerCase())
        )
    })

    const loadContacts = async (showLoading = true) => {
        if (showLoading) searching.value = true
        try {
            const [activeRes, chatRes]: any[] = await Promise.all([
                getActiveContacts(currentUserType, currentUserId),
                getContacts(currentUserType, currentUserId)
            ])

            if (activeRes.code === 200) {
                const activeData = activeRes.data || []
                const chatSummaries = chatRes.code === 200 ? chatRes.data : []

                contacts.value = activeData.map((ac: any) => {
                    const summary = chatSummaries.find((cs: any) =>
                        String(cs.contactId) === String(ac.contactId) &&
                        cs.contactType === ac.contactType
                    )
                    return {
                        ...ac,
                        lastMessage: summary?.lastMessage || '',
                        lastTime: summary?.lastTime || null,
                        unreadCount: summary?.unreadCount || 0
                    }
                })

                // 按最后消息时间排序
                contacts.value.sort((a, b) => {
                    if (!a.lastTime && !b.lastTime) return 0
                    if (!a.lastTime) return 1
                    if (!b.lastTime) return -1
                    return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
                })
            }
        } catch (error) {
            console.error('Failed to load contacts:', error)
        } finally {
            searching.value = false
        }
    }

    const loadHistory = async (contact: any) => {
        loading.value = true
        try {
            const res: any = await getChatHistory({
                user1Id: currentUserId,
                user1Type: currentUserType,
                user2Id: contact.contactId,
                user2Type: contact.contactType
            })
            if (res.code === 200) {
                messages.value = res.data || []
                scrollToBottom()

                // Mark as read if there are unread messages
                if (contact.unreadCount > 0) {
                    await markRead({
                        currentUserId,
                        currentUserType,
                        senderId: contact.contactId,
                        senderType: contact.contactType
                    })
                    contact.unreadCount = 0
                    refreshUnreadCount()
                }
            }
        } catch (error) {
            console.error('Failed to load history:', error)
        } finally {
            loading.value = false
        }
    }

    const refreshHistory = async (contact: any) => {
        if (!contact) return
        try {
            const res: any = await getChatHistory({
                user1Id: currentUserId,
                user1Type: currentUserType,
                user2Id: contact.contactId,
                user2Type: contact.contactType
            })
            if (res.code === 200 && res.data) {
                if (res.data.length > messages.value.length) {
                    messages.value = res.data
                    scrollToBottom()
                }
            }
        } catch (e) { }
    }

    const selectContact = (contact: any) => {
        activeChat.value = contact
        loadHistory(contact)
    }

    const handleSend = async () => {
        if (!inputText.value.trim() || !activeChat.value) return

        const msgData = {
            senderId: String(currentUserId),
            senderType: currentUserType,
            receiverId: String(activeChat.value.contactId),
            receiverType: activeChat.value.contactType,
            content: inputText.value,
            msgType: 'TEXT'
        }

        try {
            const res: any = await sendMessage(msgData)
            if (res.code === 200) {
                messages.value.push(res.data)
                inputText.value = ''
                scrollToBottom()
            } else {
                ElMessage.error(res.message || '发送失败')
            }
        } catch (error) {
            ElMessage.error('网络错误，发送失败')
        }
    }

    const refreshUnreadCount = async () => {
        try {
            const res: any = await getUnreadCount(currentUserType, currentUserId)
            if (res.code === 200) {
                unreadTotal.value = res.data
            }
        } catch (e) {
            console.error('Refresh unread failed:', e)
        }
    }

    const scrollToBottom = () => {
        nextTick(() => {
            if (messageBox.value) {
                messageBox.value.scrollTop = messageBox.value.scrollHeight
            }
        })
    }

    const formatTime = (time: string) => {
        if (!time) return ''
        const date = new Date(time)
        const now = new Date()
        if (date.toDateString() === now.toDateString()) {
            return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
        }
        return (date.getMonth() + 1) + '-' + date.getDate()
    }

    const getAvatar = (path: string) => {
        if (!path) return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
        if (path.startsWith('http')) return path
        return `http://localhost:8088${path.startsWith('/') ? '' : '/'}${path}`
    }

    return {
        contacts,
        activeChat,
        messages,
        inputText,
        loading,
        searching,
        messageBox,
        searchKeyword,
        filteredContacts,
        unreadTotal,
        loadContacts,
        selectContact,
        handleSend,
        formatTime,
        getAvatar,
        refreshUnreadCount,
        refreshHistory
    }
}
