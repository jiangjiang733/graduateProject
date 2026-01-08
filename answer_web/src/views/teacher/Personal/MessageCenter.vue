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
            <span class="tab-label">互动通知</span>
          </div>
        </div>

        <div v-show="activeTab === 'chat'" class="sidebar-content">
          <div class="search-wrap">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索联系人..." 
              prefix-icon="Search"
              clearable 
              class="glass-input-small"
            />
          </div>
          
          <div v-loading="loadingContacts" class="user-list custom-scrollbar">
            <div 
              v-for="user in filteredUserList" 
              :key="user.contactId" 
              class="user-item"
              :class="{ active: currentChatUser?.contactId === user.contactId }"
              @click="selectChatUser(user)"
            >
              <div class="user-avatar-wrap">
                <el-avatar :size="44" :src="getAvatarUrl(user.contactAvatar)" shape="circle">
                  {{ user.contactName?.charAt(0) }}
                </el-avatar>
                <span v-if="user.unreadCount > 0" class="unread-dot">{{ user.unreadCount }}</span>
              </div>
              <div class="user-info">
                <div class="info-top">
                  <span class="name">{{ user.contactName }}</span>
                  <span class="time">{{ formatTime(user.lastTime) }}</span>
                </div>
                <div class="info-bottom">
                   <p class="last-msg">{{ user.lastMessage || '暂无消息' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'interaction'" class="sidebar-content interaction-menu">
           <div 
             class="menu-item"
             :class="{ active: activeInteractionType === 'comment' }"
             @click="activeInteractionType = 'comment'"
           >
              <el-icon class="icon-box bg-blue"><Comment /></el-icon>
              <span>收到的评论</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
           </div>

           <div 
             class="menu-item"
             :class="{ active: activeInteractionType === 'system' }"
             @click="activeInteractionType = 'system'"
           >
              <el-icon class="icon-box bg-green"><Bell /></el-icon>
              <span>系统通知</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
           </div>
        </div>
      </aside>

      <!-- Main Area -->
      <main class="chat-main">
        <!-- View 1: Chat Window -->
        <template v-if="activeTab === 'chat'">
          <template v-if="currentChatUser">
            <header class="window-header">
              <div class="user-title">
                <el-avatar :size="40" :src="getAvatarUrl(currentChatUser.contactAvatar)">{{ currentChatUser.contactName?.charAt(0) }}</el-avatar>
                <div class="user-status">
                  <span class="name">{{ currentChatUser.contactName }}</span>
                  <span class="status-text">在线答疑</span>
                </div>
              </div>
              <div class="window-actions">
                <el-button link><el-icon><MoreFilled /></el-icon></el-button>
              </div>
            </header>

            <div class="message-area custom-scrollbar" ref="messageBox">
              <div v-for="(msg, index) in currentMessages" :key="index" class="message-row" :class="{ 'me': isMyMessage(msg) }">
                <div class="msg-avatar">
                  <el-avatar :size="36" v-if="!isMyMessage(msg)" :src="getAvatarUrl(currentChatUser.contactAvatar)">{{ currentChatUser.contactName?.charAt(0) }}</el-avatar>
                  <el-avatar :size="36" v-else :src="getAvatarUrl(teacherAvatar)" class="my-avatar">我</el-avatar>
                </div>
                <div class="msg-body">
                   <div class="msg-header">
                     <span class="msg-name">{{ isMyMessage(msg) ? (teacherName || '教师') : currentChatUser.contactName }}</span>
                     <span class="msg-time-label">{{ formatDetailedTime(msg.createTime) }}</span>
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
                 <el-icon title="图片"><Picture /></el-icon>
                 <el-icon title="文件"><Folder /></el-icon>
                 <el-icon title="星标"><Star /></el-icon>
               </div>
               <div class="input-wrapper">
                 <textarea 
                   v-model="inputMessage" 
                   class="chat-input" 
                   placeholder="按 Enter 发送消息..." 
                   @keydown.enter.prevent="handleSendMessage"
                 ></textarea>
                 <div class="send-btn-wrap">
                   <el-button type="primary" :disabled="!inputMessage.trim()" @click="handleSendMessage">
                     发送
                   </el-button>
                 </div>
               </div>
            </footer>
          </template>
          
          <div v-else class="empty-state">
            <img src="https://cdni.iconscout.com/illustration/premium/thumb/messaging-1-5364468-4491787.png" alt="Empty" width="200" style="opacity: 0.6; mix-blend-mode: multiply;">
            <h3>开始聊天</h3>
            <p>从左侧列表选择一位学生进行沟通</p>
          </div>
        </template>

        <!-- View 2: Interaction List -->
        <template v-if="activeTab === 'interaction'">
           <header class="window-header interaction-header">
              <h3>{{ interactionTitle }}</h3>
              <el-button link type="primary" @click="markAllRead">全部标记已读</el-button>
           </header>
           
           <div v-loading="interactionLoading" class="interaction-list custom-scrollbar">
              <div v-for="(item, index) in filteredInteractionList" :key="index" class="interaction-item animate-slide-up">
                 <div class="item-avatar">
                    <el-avatar :size="48" :src="item.userAvatar" shape="circle">{{ item.userName?.charAt(0) }}</el-avatar>
                    <div v-if="!item.isRead" class="unread-badge"></div>
                 </div>
                 <div class="item-content">
                    <div class="item-top">
                       <span class="user-name">{{ item.userName }}</span>
                       <span class="action-text">{{ item.actionText }}</span>
                       <span class="time">{{ formatDetailedTime(item.time) }}</span>
                    </div>
                    <div class="reply-content" v-if="item.content">{{ item.content }}</div>
                    
                    <div class="item-actions">
                       <el-button v-if="item.type === 'COMMENT'" link type="primary" size="small" @click="handleInteractionDetail(item)">回复</el-button>
                       <el-button link size="small" @click="handleInteractionDetail(item)">查看详情</el-button>
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
import { 
  ChatLineRound, Search, MoreFilled, Picture, Folder, Comment, Bell, ArrowRight, VideoPlay, Star
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'
import { getMessageList, markAsRead, getUnreadCount } from '@/api/message.js'
import { 
  sendChatMessage, getChatHistory, getChatContacts, 
  getActiveContacts, markChatRead, getChatUnreadCount 
} from '@/api/chat'
import { ElMessage } from 'element-plus'

const activeTab = ref('chat') 
const activeInteractionType = ref('comment') 
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

const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
const teacherName = localStorage.getItem('teacherName')
const teacherAvatar = localStorage.getItem('teacherHead')
const teacherType = 'TEACHER'

// Computed
const filteredUserList = computed(() => {
  if (!searchKeyword.value) return userList.value
  return userList.value.filter(u => u.contactName?.includes(searchKeyword.value))
})

const interactionTitle = computed(() => {
  return activeInteractionType.value === 'comment' ? '收到的评论' : '系统通知'
})

const filteredInteractionList = computed(() => {
  return interactionList.value.filter(item => {
      if (activeInteractionType.value === 'system') return item.type === 'SYSTEM'
      return item.type !== 'SYSTEM'
  })
})

// Methods
const loadContacts = async () => {
    loadingContacts.value = true
    try {
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
        const chatRes = await getChatUnreadCount(teacherType.toLowerCase(), teacherId)
        if (chatRes.code === 200) chatUnreadTotal.value = chatRes.data
        
        const sysRes = await getUnreadCount(teacherId, teacherType)
        if (sysRes.code === 200) interactionUnread.value = sysRes.data.unreadCount
    } catch (e) {}
}

const loadInteractions = async () => {
    interactionLoading.value = true
    try {
        const res = await getMessageList(teacherId, teacherType, { pageSize: 50 })
        if (res.code === 200 && res.data) {
            interactionList.value = res.data.records.map(m => ({
                id: m.messageId,
                senderId: m.senderId,
                type: m.msgType || (m.title?.includes('系统通知') ? 'SYSTEM' : 'COMMENT'),
                userName: m.senderName || '系统',
                userAvatar: m.senderAvatar || '',
                content: m.content,
                time: m.createTime,
                isRead: m.isRead === 1,
                actionText: m.title
            }))
        }
    } catch (e) {} finally { interactionLoading.value = false }
}

const selectChatUser = async (user) => {
    currentChatUser.value = user
    try {
        const res = await getChatHistory({
            user1Id: teacherId,
            user1Type: teacherType,
            user2Id: user.contactId,
            user2Type: 'STUDENT'
        })
        if (res.code === 200) {
            currentMessages.value = Array.isArray(res.data) ? res.data : []
            scrollToBottom()
            if (user.unreadCount > 0) {
                await markChatRead({
                    currentUserId: teacherId,
                    currentUserType: teacherType,
                    senderId: user.contactId,
                    senderType: 'STUDENT'
                })
                user.unreadCount = 0
                updateUnreadCounts()
            }
        }
    } catch (e) {}
}

const handleSendMessage = async () => {
    if (!inputMessage.value.trim() || !currentChatUser.value) return
    const text = inputMessage.value
    const msg = {
        senderId: String(teacherId), 
        senderType: teacherType,
        receiverId: String(currentChatUser.value.contactId), 
        receiverType: 'STUDENT',
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
    if (!msg || !teacherId) return false
    const sId = String(msg.senderId)
    const tId = String(teacherId)
    return sId === tId && (msg.senderType === 'TEACHER' || msg.senderRole === 'TEACHER')
}

const handleInteractionDetail = async (item) => {
    // 1. 标记已读
    if (!item.isRead) {
        try {
            await markAsRead(item.id, teacherId, teacherType)
            item.isRead = true
            updateUnreadCounts()
        } catch (e) {}
    }
    
    // 2. 如果是学生评价，跳转到与该学生的聊天
    if (item.senderId && item.type === 'COMMENT') {
        const student = userList.value.find(u => String(u.contactId) === String(item.senderId))
        if (student) {
            activeTab.value = 'chat'
            selectChatUser(student)
        } else {
            // 如果不在活跃列表，可能需要额外加载或提示
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

const markAllRead = async () => {
    const unread = filteredInteractionList.value.filter(i => !i.isRead)
    if (unread.length === 0) return
    try {
        await Promise.all(unread.map(i => markAsRead(i.id, teacherId, teacherType)))
        unread.forEach(i => i.isRead = true)
        updateUnreadCounts()
        ElMessage.success('已全部标记已读')
    } catch (e) {}
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

let timer = null
onMounted(() => {
    loadContacts()
    loadInteractions()
    timer = setInterval(updateUnreadCounts, 10000)
})
onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
/* Scopes mostly preserved from previous version with small adjustments for full-height */
.message-center { padding: 0; height: calc(100vh - 120px); overflow: hidden; padding-bottom: 20px; }
.chat-container { display: flex; height: 100%; border-radius: 16px; background: #fff; border: 1px solid rgba(0,0,0,0.05); }

/* Sidebar */
.chat-sidebar { width: 320px; display: flex; flex-direction: column; background: #f9fafb; border-right: 1px solid #eee; border-radius: 16px 0 0 16px; }
.sidebar-tabs { display: flex; border-bottom: 1px solid #e5e7eb; background: #fff; border-radius: 16px 0 0 0; }
.tab-item { flex: 1; height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; color: #6b7280; cursor: pointer; position: relative; }
.tab-item.active { color: #10b981; font-weight: 600; background: #fff; border-bottom: 2px solid #10b981; }

.tab-badge { position: absolute; top: 10px; right: 15%; background: #ef4444; color: white; font-size: 10px; height: 16px; min-width: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 1px solid #fff; }

.sidebar-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.search-wrap { padding: 16px; }

.user-list { flex: 1; overflow-y: auto; padding: 0 10px; }
.user-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; }
.user-item:hover { background-color: #f3f4f6; }
.user-item.active { background-color: #ecfdf5; }

.unread-dot { position: absolute; top: -2px; right: -2px; background: #ef4444; color: white; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

.interaction-menu { padding: 16px; gap: 8px; }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 500; }
.menu-item.active { background: #ecfdf5; color: #059669; }
.icon-box { width: 36px; height: 36px; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.bg-blue { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.bg-green { background: linear-gradient(135deg, #34d399, #10b981); }
.arrow { margin-left: auto; color: #cbd5e1; }

.chat-main { flex: 1; display: flex; flex-direction: column; background: white; border-radius: 0 16px 16px 0; overflow: hidden; position: relative; }
.window-header { height: 70px; padding: 0 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.user-title { display: flex; align-items: center; gap: 12px; }
.user-status { display: flex; flex-direction: column; }
.user-status .name { font-size: 16px; font-weight: 600; color: #1f2937; }
.user-status .status-text { font-size: 12px; color: #10b981; }

.message-area { flex: 1; background-color: #f9fafb; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.message-row { display: flex; gap: 12px; max-width: 80%; width: fit-content; }
.message-row.me { align-self: flex-end; flex-direction: row-reverse; }

.msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; color: #9ca3af; }
.me .msg-header { flex-direction: row-reverse; }
.msg-name { font-weight: 500; }
.msg-time-label { font-size: 11px; }

.bubble { padding: 12px 16px; border-radius: 12px; background: white; color: #374151; font-size: 15px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-top-left-radius: 2px; position: relative; }
.me .bubble { background: #10b981; color: white; border-top-left-radius: 12px; border-top-right-radius: 2px; }

.msg-body { display: flex; flex-direction: column; }

.input-area { padding: 16px 24px; background: #fff; border-top: 1px solid #f3f4f6; }
.toolbar { display: flex; gap: 16px; margin-bottom: 12px; color: #6b7280; font-size: 18px; }
.toolbar .el-icon { cursor: pointer; transition: color 0.2s; }
.toolbar .el-icon:hover { color: #10b981; }

.input-wrapper { display: flex; flex-direction: column; gap: 12px; }
.chat-input { width: 100%; min-height: 80px; border: none; resize: none; font-size: 15px; color: #374151; outline: none; background: transparent; }
.chat-input::placeholder { color: #9ca3af; }

.send-btn-wrap { display: flex; justify-content: flex-end; }
.send-btn-wrap .el-button { padding: 8px 24px; border-radius: 8px; font-weight: 500; }

.interaction-list { flex: 1; overflow-y: auto; }
.interaction-item { display: flex; padding: 20px 24px; border-bottom: 1px solid #f1f2f4; background: #fff; }
.unread-badge { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; }
.empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; gap: 16px; background: #f9fafb; }

.animate-slide-up { animation: slideUp 0.4s ease-out backwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
</style>

