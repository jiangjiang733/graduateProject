<template>
  <div class="message-center modern-page">
    <div class="chat-container glass-panel">
      <!-- Sidebar -->
      <aside class="chat-sidebar">
        <div class="sidebar-tabs">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'chat' }"
            @click="activeTab = 'chat'"
          >
            <div class="tab-icon-wrap">
              <el-icon><ChatLineRound /></el-icon>
              <span v-if="chatUnreadTotal > 0" class="tab-badge">{{ chatUnreadTotal }}</span>
            </div>
            <span class="tab-label">私信</span>
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'interaction' }"
            @click="activeTab = 'interaction'"
          >
            <div class="tab-icon-wrap">
              <el-icon><Comment /></el-icon>
              <span v-if="interactionUnread > 0" class="tab-badge">{{ interactionUnread }}</span>
            </div>
            <span class="tab-label">通知</span>
          </div>
        </div>

        <div v-show="activeTab === 'chat'" class="sidebar-content">
          <div class="search-wrap">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索我的老师..." 
              prefix-icon="Search"
              clearable 
              class="glass-input-small"
            />
          </div>
          
          <div v-loading="loadingContacts" class="user-list custom-scrollbar">
            <div 
              v-for="teacher in filteredTeacherList" 
              :key="teacher.contactId" 
              class="user-item"
              :class="{ active: currentChatTeacher?.contactId === teacher.contactId }"
              @click="selectChatTeacher(teacher)"
            >
              <div class="user-avatar-wrap">
                <el-avatar :size="44" :src="getAvatarUrl(teacher.contactAvatar)" shape="circle" class="teacher-avatar">
                  {{ teacher.contactName?.charAt(0) }}
                </el-avatar>
                <span v-if="teacher.unreadCount > 0" class="unread-dot">{{ teacher.unreadCount }}</span>
              </div>
              <div class="user-info">
                <div class="info-top">
                  <span class="name">{{ teacher.contactName }} 老师</span>
                  <span class="course-tag">{{ teacher.courseName }}</span>
                </div>
                <div class="info-bottom">
                   <p class="last-msg">{{ teacher.lastMessage || '暂无消息' }}</p>
                   <span class="time">{{ formatTime(teacher.lastTime) }}</span>
                </div>
              </div>
            </div>
            <div v-if="!loadingContacts && filteredTeacherList.length === 0" class="empty-list">
              <p>暂无联系人</p>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'interaction'" class="sidebar-content interaction-menu">
           <div 
             class="menu-item"
             :class="{ active: activeInteractionType === 'system' }"
             @click="activeInteractionType = 'system'"
           >
              <el-icon class="icon-box bg-green"><Bell /></el-icon>
              <span>系统通知</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
           </div>
           <div 
             class="menu-item"
             :class="{ active: activeInteractionType === 'comment' }"
             @click="activeInteractionType = 'comment'"
           >
              <el-icon class="icon-box bg-blue"><Comment /></el-icon>
              <span>收到的回复</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
           </div>
        </div>
      </aside>

      <!-- Main Area -->
      <main class="chat-main">
        <template v-if="activeTab === 'chat'">
          <template v-if="currentChatTeacher">
            <header class="window-header">
              <div class="user-title">
                <el-avatar :size="40" :src="getAvatarUrl(currentChatTeacher.contactAvatar)" class="header-avatar">
                  {{ currentChatTeacher.contactName?.charAt(0) }}
                </el-avatar>
                <div class="user-info-text">
                  <span class="name">{{ currentChatTeacher.contactName }} 老师</span>
                  <span class="sub-text">{{ currentChatTeacher.courseName }}</span>
                </div>
              </div>
              <div class="window-actions">
                <el-button link><el-icon><MoreFilled /></el-icon></el-button>
              </div>
            </header>

            <div class="message-area custom-scrollbar" ref="messageBox">
              <div v-for="(msg, index) in currentMessages" :key="index" class="message-row" :class="{ 'me': isMyMessage(msg) }">
                <div class="msg-avatar">
                  <el-avatar :size="36" v-if="!isMyMessage(msg)" :src="getAvatarUrl(currentChatTeacher.contactAvatar)" class="partner-avatar">
                    {{ currentChatTeacher.contactName?.charAt(0) }}
                  </el-avatar>
                  <el-avatar :size="36" v-else :src="userStore.avatarUrl" class="my-avatar">我</el-avatar>
                </div>
                <div class="msg-body">
                   <div class="msg-header">
                     <span class="msg-name">{{ isMyMessage(msg) ? (userStore.userName || '学生') : currentChatTeacher.contactName }}</span>
                     <span class="msg-time-label">{{ formatExtendedTime(msg.createTime) }}</span>
                   </div>
                   <div class="msg-content-wrapper">
                     <div class="bubble">
                       {{ msg.content }}
                     </div>

                   </div>
                </div>
              </div>
            </div>

            <footer class="input-area">
               <div class="toolbar">
                 <el-icon title="发送图片"><Picture /></el-icon>
                 <el-icon title="发送文件"><Folder /></el-icon>
                 <el-icon title="语言录制"><Microphone /></el-icon>
               </div>
               <div class="input-wrapper">
                 <textarea 
                   v-model="inputMessage" 
                   class="chat-input" 
                   placeholder="向老师提问..." 
                   @keydown.enter.prevent="handleSendMessage"
                 ></textarea>
                 <div class="send-btn-wrap">
                   <el-button type="primary" :disabled="!inputMessage.trim()" @click="handleSendMessage">发送</el-button>
                 </div>
               </div>
            </footer>
          </template>
          
          <div v-else class="empty-state">
            <el-icon size="64" color="#d1d5db"><ChatDotRound /></el-icon>
            <h3>我的老师</h3>
            <p>从左侧选择一位授课老师开始提问</p>
          </div>
        </template>

        <template v-if="activeTab === 'interaction'">
           <header class="window-header interaction-header">
              <h3>{{ interactionTitle }}</h3>
              <el-button link type="primary" @click="markAllRead">全部标记已读</el-button>
           </header>
           
           <div v-loading="interactionLoading" class="interaction-list custom-scrollbar">
              <div v-for="(item, index) in filteredInteractionList" :key="index" class="interaction-item animate-slide-up">
                 <div class="item-avatar">
                    <el-avatar :size="48" :src="item.userAvatar" shape="circle">
                      <el-icon v-if="item.type === 'SYSTEM'"><BellFilled /></el-icon>
                      <span v-else>{{ item.userName?.charAt(0) }}</span>
                    </el-avatar>
                    <div v-if="!item.isRead" class="unread-badge"></div>
                 </div>
                 <div class="item-content">
                    <div class="item-top">
                       <span class="user-name">{{ item.userName }}</span>
                       <span class="action-text">{{ item.actionText }}</span>
                       <span class="time">{{ formatExtendedTime(item.time) }}</span>
                    </div>
                    <div class="reply-content" v-if="item.content">{{ item.content }}</div>
                    <div class="item-actions">
                       <el-button v-if="item.type !== 'SYSTEM'" link type="primary" size="small" @click="toggleQuickReply(item)">
                         {{ item.showReply ? '取消回复' : '快捷回复' }}
                       </el-button>
                       <el-button link size="small" @click="handleInteractionDetail(item)">查看详情</el-button>
                    </div>
                    <div v-if="item.showReply" class="quick-reply-box">
                       <el-input 
                         v-model="item.replyContent" 
                         placeholder="发送私信回复..." 
                         size="small"
                         @keydown.enter.prevent="handleQuickReply(item)"
                       >
                         <template #append>
                           <el-button @click="handleQuickReply(item)">发送</el-button>
                         </template>
                       </el-input>
                    </div>
                 </div>
              </div>
              <div v-if="filteredInteractionList.length === 0" class="empty-state">
                  <el-empty description="暂无新消息" />
              </div>
           </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ChatLineRound, Search, MoreFilled, Picture, Folder, Microphone, ChatDotRound, Comment, Bell, BellFilled, ArrowRight, Document
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'
import { 
  sendChatMessage, getChatHistory, getChatContacts, 
  getActiveContacts, markChatRead, getChatUnreadCount 
} from '@/api/chat'
import { getMessageList, markAsRead, getUnreadCount } from '@/api/message'
import { getTeacherComments, addComment } from '@/api/comment'
import { ElMessage } from 'element-plus'
import { useUserInfo } from '@/stores/user'
import { watch } from 'vue'

const userStore = useUserInfo()
const router = useRouter() // Ensure router is available if needed, though not used in this snippet explicitly but good practice or check imports

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
// Remove manual localStorage reads for name/avatar as we use store directly in template/logic

// Computed
const filteredTeacherList = computed(() => {
  if (!searchKeyword.value) return teacherList.value
  return teacherList.value.filter(t => 
    t.contactName?.includes(searchKeyword.value) || 
    t.courseName?.includes(searchKeyword.value)
  )
})

const interactionTitle = computed(() => {
  return activeInteractionType.value === 'system' ? '系统通知' : '收到的回复'
})

const filteredInteractionList = computed(() => {
  return interactionList.value.filter(item => {
    if (activeInteractionType.value === 'system') return item.type === 'SYSTEM'
    if (activeInteractionType.value === 'comment') return item.type === 'INTERACTION' // Comment notifications
    return item.type !== 'SYSTEM' 
  })
})

// Methods
const loadContacts = async () => {
    loadingContacts.value = true
    try {
        // 步骤1：获取所有相关老师（基于课程）
        const activeRes = await getActiveContacts(userType.value.toLowerCase(), studentId.value)
        // 步骤2：获取实际有过聊天记录的摘要
        const chatRes = await getChatContacts(userType.value.toLowerCase(), studentId.value)
        
        if (activeRes.code === 200) {
            const activeContacts = activeRes.data || []
            const chatSummaries = chatRes.code === 200 ? chatRes.data : []
            
            // 合并：以 activeContacts 为主，合并 chatSummaries 中的最后一条消息和时间
            teacherList.value = activeContacts.map(ac => {
                const summary = chatSummaries.find(cs => cs.contactId === ac.contactId)
                return {
                    ...ac,
                    lastMessage: summary?.lastMessage || '',
                    lastTime: summary?.lastTime || null,
                    unreadCount: summary?.unreadCount || 0
                }
            })
            
            // 排序：有消息的在前，按最后时间倒序
            teacherList.value.sort((a, b) => {
                if (!a.lastTime && !b.lastTime) return 0
                if (!a.lastTime) return 1
                if (!b.lastTime) return -1
                return new Date(b.lastTime) - new Date(a.lastTime)
            })
        }
        
        // 更新总未读
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
    } catch (e) {}
}

const loadInteractions = async () => {
    interactionLoading.value = true
    try {
        // All users (teachers and students) load from Message table
        const res = await getMessageList(studentId.value, userType.value, { pageSize: 50 })
        if (res.code === 200 && res.data) {
            interactionList.value = res.data.records.map(m => ({
                id: m.messageId,
                senderId: m.senderId, 
                senderType: m.senderType || 'STUDENT', // Comment notifications come from students
                type: m.msgType || 'SYSTEM',
                userName: m.senderName || '系统',
                userAvatar: m.senderAvatar || '',
                content: m.content,
                time: m.createTime,
                isRead: m.isRead === 1,
                actionText: m.title,
                showReply: false, 
                replyContent: '',
                relatedId: m.relatedId // Comment ID for potential navigation
            }))
        }
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
            user2Type: 'TEACHER'
        })
        if (res.code === 200) {
            console.log('加载聊天历史成功:', res.data)
            currentMessages.value = res.data || []
            scrollToBottom()
            
            // 标记已读
            if (teacher.unreadCount > 0) {
                await markChatRead({
                    currentUserId: studentId.value,
                    currentUserType: userType.value,
                    senderId: teacher.contactId,
                    senderType: 'TEACHER'
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
        receiverType: 'TEACHER',
        content: inputMessage.value,
        msgType: 'TEXT'
    }
    
    try {
        console.log('正在发送消息...', msgData)
        const res = await sendChatMessage(msgData)
        if (res.code === 200) {
            console.log('消息发送成功:', res.data)
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
    if (!item.isRead && item.type !== 'COMMENT') { // Comments don't have read status via msg API
        try {
            await markAsRead(item.id, studentId.value, userType.value)
            item.isRead = true
            interactionUnread.value = Math.max(0, interactionUnread.value - 1)
        } catch (e) {}
    }
}

const toggleQuickReply = (item) => {
    item.showReply = !item.showReply
}

const handleQuickReply = async (item) => {
    if (!item.replyContent.trim()) return

    try {
        if (item.type === 'COMMENT') {
            // Reply via Comment API (Public Reply)
            const commentData = {
                courseId: item.courseId,
                chapterId: item.chapterId,
                userId: studentId.value,
                userName: userStore.userName,
                userAvatar: userStore.avatar,
                userType: userType.value,
                content: item.replyContent,
                parentId: item.id,
                targetUserId: item.senderId
            }
            const res = await addComment(commentData)
            if (res.code === 200) {
                ElMessage.success('评论回复成功')
                item.replyContent = ''
                item.showReply = false
            } else {
                ElMessage.error(res.message || '回复失败')
            }
        } else {
            // Reply via DM (Private Message)
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
    const unreadItems = filteredInteractionList.value.filter(item => !item.isRead)
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
    if (!path || path.trim() === '') return defaultAvatar
    if (path.startsWith('http')) return path
    const realPath = path.startsWith('/') ? path : '/' + path
    return `http://localhost:8088${realPath}`
}

let refreshTimer = null
onMounted(() => {
    userStore.initUserInfo() // Initialize store data if not already done
    loadContacts()
    loadInteractions()
    
    // 轮询新消息
    refreshTimer = setInterval(() => {
        updateUnreadCounts()
        // 可选：如果打开了聊天窗口，定期刷新历史
        if (currentChatTeacher.value && activeTab.value === 'chat') {
            // 这里可以做一个增量刷新，暂且不表
        }
    }, 10000)
})

watch(activeInteractionType, () => {
    loadInteractions()
})

onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.message-center { height: calc(100vh - 120px); overflow: hidden; padding-bottom: 20px; }
.chat-container { display: flex; height: 100%; border-radius: 16px; background: #fff; border: 1px solid rgba(0,0,0,0.05); }

/* Sidebar Tabs */
.chat-sidebar { width: 320px; display: flex; flex-direction: column; background: #f9fafb; border-right: 1px solid #eee; border-radius: 16px 0 0 16px; }
.sidebar-tabs { display: flex; border-bottom: 1px solid #e5e7eb; background: #fff; border-radius: 16px 0 0 0; }
.tab-item { flex: 1; height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; color: #6b7280; cursor: pointer; position: relative; }
.tab-item.active { color: #10b981; font-weight: 600; background: #fff; border-bottom: 2px solid #10b981; }

.tab-badge { 
  position: absolute; top: 10px; right: 15%; background: #ef4444; color: white; font-size: 10px; height: 16px; min-width: 16px; 
  border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 1px solid #fff; 
}

.sidebar-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.search-wrap { padding: 16px; }

/* User List */
.user-list { flex: 1; overflow-y: auto; padding: 0 10px; }
.user-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; }
.user-item:hover { background-color: #f3f4f6; }
.user-item.active { background-color: #ecfdf5; }
.user-avatar-wrap { position: relative; }
.unread-dot { position: absolute; top: -2px; right: -2px; background: #ef4444; color: white; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

.user-info { flex: 1; min-width: 0; }
.info-top { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; }
.course-tag { font-size: 10px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 2px 6px; border-radius: 4px; }
.last-msg { margin: 0; font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 10px; color: #9ca3af; }

/* Main Area */
.chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; border-radius: 0 16px 16px 0; overflow: hidden; position: relative; }
.window-header { height: 70px; padding: 0 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.user-title { display: flex; align-items: center; gap: 12px; }
.user-info-text { display: flex; flex-direction: column; justify-content: center; }
.user-info-text .name { font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.2; }
.user-info-text .sub-text { font-size: 12px; color: #6b7280; margin-top: 2px; }

.message-area { flex: 1; background-color: #f9fafb; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.message-row { display: flex; gap: 12px; max-width: 80%; width: fit-content; }
.message-row.me { align-self: flex-end; flex-direction: row-reverse; }

.msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; color: #9ca3af; }
.me .msg-header { flex-direction: row-reverse; }
.msg-name { font-weight: 500; }
.msg-time-label { font-size: 11px; }

.bubble { padding: 12px 16px; border-radius: 12px; background: white; color: #374151; font-size: 15px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-top-left-radius: 2px; position: relative; }
.me .bubble { background: #3b82f6; color: white; border-top-left-radius: 12px; border-top-right-radius: 2px; }

.msg-body { display: flex; flex-direction: column; }

.input-area { padding: 16px 24px; background: #fff; border-top: 1px solid #f3f4f6; }
.toolbar { display: flex; gap: 16px; margin-bottom: 12px; color: #6b7280; font-size: 18px; }
.toolbar .el-icon { cursor: pointer; transition: color 0.2s; }
.toolbar .el-icon:hover { color: #3b82f6; }

.input-wrapper { display: flex; flex-direction: column; gap: 12px; }
.chat-input { width: 100%; min-height: 80px; border: none; resize: none; font-size: 15px; color: #374151; outline: none; background: transparent; }
.chat-input::placeholder { color: #9ca3af; }

.send-btn-wrap { display: flex; justify-content: flex-end; }
.send-btn-wrap .el-button { padding: 8px 24px; border-radius: 8px; font-weight: 500; }

/* Interaction Menu */
.interaction-menu { padding: 16px; gap: 8px; }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 500; }
.menu-item:hover { background: #f1f5f9; }
.menu-item.active { background: #ecfdf5; color: #059669; }
.icon-box { width: 36px; height: 36px; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.bg-green { background: linear-gradient(135deg, #34d399, #10b981); }
.bg-blue { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.arrow { margin-left: auto; color: #cbd5e1; }

.interaction-list { flex: 1; overflow-y: auto; }
.interaction-item { display: flex; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; gap: 16px; }
.item-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.item-top { display: flex; gap: 8px; align-items: center; font-size: 13px; }
.user-name { font-weight: 700; }
.action-text { color: #64748b; }
.time { font-size: 11px; color: #9ca3af; }
.reply-content { font-size: 14px; color: #1e293b; margin: 4px 0; }
.unread-badge { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; }

.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 16px; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
.quick-reply-box { margin-top: 12px; }
</style>
