<template>
  <div class="message-center modern-page">
    <div class="chat-container glass-panel">
      <!-- Sidebar -->
      <aside class="chat-sidebar">
        <!-- Sidebar Tabs -->
        <div class="sidebar-tabs">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'chat' }"
            @click="activeTab = 'chat'"
          >
            <div class="tab-icon-wrap">
              <el-icon><ChatLineRound /></el-icon>
              <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
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

        <!-- Chat List (Visible when activeTab === 'chat') -->
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
          
          <div v-loading="loadingList" class="user-list custom-scrollbar">
            <div 
              v-for="user in filteredUserList" 
              :key="user.studentId" 
              class="user-item"
              :class="{ active: currentChatUser?.studentId === user.studentId }"
              @click="selectChatUser(user)"
            >
              <div class="user-avatar-wrap">
                <el-avatar :size="44" :src="user.avatarUrl" shape="circle">
                  {{ user.studentName?.charAt(0) }}
                </el-avatar>
                <span v-if="user.unread > 0" class="unread-dot">{{ user.unread }}</span>
              </div>
              <div class="user-info">
                <div class="info-top">
                  <span class="name">{{ user.studentName }}</span>
                  <span class="time">{{ formatTime(user.lastTime) }}</span>
                </div>
                <div class="info-bottom">
                   <p class="last-msg">{{ user.lastMessage || '暂无消息' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Interaction List (Sidebar view for Interactions is just a summary or empty if we move list to main) -->
        <!-- User Preference Idea: Douyin puts interactions in a specific list. We can show categories here or just "All Interactions". -->
        <div v-show="activeTab === 'interaction'" class="sidebar-content interaction-menu">
           <div class="menu-item active">
              <el-icon class="icon-box bg-blue"><Comment /></el-icon>
              <span>收到的评论</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
           </div>
           <div class="menu-item">
              <el-icon class="icon-box bg-red"><Pointer /></el-icon>
              <span>点赞我的</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
           </div>
           <div class="menu-item">
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
                <span class="name">{{ currentChatUser.studentName }}</span>
                <div class="status-dot"></div>
                <span class="status-text">在线</span>
              </div>
              <div class="window-actions">
                <el-button link><el-icon><MoreFilled /></el-icon></el-button>
              </div>
            </header>

            <div class="message-area custom-scrollbar" ref="messageBox">
              <div v-for="(msg, index) in currentMessages" :key="index" class="message-row" :class="{ 'me': msg.isSelf }">
                <div class="msg-avatar">
                  <el-avatar :size="36" v-if="!msg.isSelf" :src="currentChatUser.avatarUrl">{{ currentChatUser.studentName?.charAt(0) }}</el-avatar>
                  <el-avatar :size="36" v-else :src="teacherAvatar" class="my-avatar">我</el-avatar>
                </div>
                <div class="msg-body">
                   <div class="msg-content-wrapper">
                     <div class="bubble">
                       {{ msg.content }}
                     </div>
                   </div>
                   <div class="msg-time">{{ formatTime(msg.time) }}</div>
                </div>
              </div>
            </div>

            <footer class="input-area">
               <div class="toolbar">
                 <el-icon title="图片"><Picture /></el-icon>
                 <el-icon title="文件"><Folder /></el-icon>
                 <el-icon title="表情"><Star /></el-icon>
               </div>
               <textarea 
                 v-model="inputMessage" 
                 class="chat-input" 
                 placeholder="按 Enter 发送消息..." 
                 @keydown.enter.prevent="sendMessage"
               ></textarea>
               <div class="send-btn-wrap">
                 <el-button type="primary" :disabled="!inputMessage.trim()" @click="sendMessage">发送</el-button>
               </div>
            </footer>
          </template>
          
          <div v-else class="empty-state">
            <img src="https://cdni.iconscout.com/illustration/premium/thumb/messaging-1-5364468-4491787.png" alt="Empty" width="200" style="opacity: 0.6; mix-blend-mode: multiply;">
            <h3>开始聊天</h3>
            <p>从左侧列表选择一位学生进行沟通</p>
          </div>
        </template>

        <!-- View 2: Interaction List (Douyin Style) -->
        <template v-if="activeTab === 'interaction'">
           <header class="window-header interaction-header">
              <h3>评论回复</h3>
              <el-button link type="primary">全部标记已读</el-button>
           </header>
           
           <div class="interaction-list custom-scrollbar">
              <div v-for="(item, index) in interactionList" :key="index" class="interaction-item animate-slide-up" :style="{ animationDelay: index * 0.05 + 's' }">
                 <div class="item-avatar">
                    <el-avatar :size="48" :src="item.userAvatar" shape="circle">{{ item.userName?.charAt(0) }}</el-avatar>
                    <div v-if="!item.isRead" class="unread-badge"></div>
                 </div>
                 <div class="item-content">
                    <div class="item-top">
                       <span class="user-name">{{ item.userName }}</span>
                       <span class="action-text">回复了你的评论</span>
                       <span class="time">{{ formatTime(item.time) }}</span>
                    </div>
                    <div class="reply-content">{{ item.content }}</div>
                    
                    <div class="context-box">
                       <div class="context-bar"></div>
                       <div class="context-text">
                          <span class="my-name">我: </span>
                          {{ item.originalContent }}
                       </div>
                       <!-- If it links to a course/video -->
                       <div class="context-source" v-if="item.sourceName">
                          <el-icon><VideoPlay /></el-icon> {{ item.sourceName }}
                       </div>
                    </div>
                    
                    <div class="item-actions">
                       <el-button link type="primary" size="small" @click="handleReplyInteraction(item)">回复</el-button>
                       <el-button link size="small">查看详情</el-button>
                    </div>
                 </div>
                 <div class="item-right-thumb" v-if="item.coverUrl">
                    <img :src="item.coverUrl" alt="Cover">
                 </div>
              </div>
              
              <div v-if="interactionList.length === 0" class="empty-state">
                 <el-empty description="暂无新消息" />
              </div>
           </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { 
  ChatLineRound, Search, MoreFilled, Picture, Folder, Mute, ChatDotRound, Comment, Bell, Pointer, ArrowRight, VideoPlay, Star
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'
import { getMessageList, markAsRead, getUnreadCount } from '@/api/message.js'

const activeTab = ref('interaction') 
const loadingList = ref(false)
const interactionLoading = ref(false)
const searchKeyword = ref('')
const currentChatUser = ref(null)
const inputMessage = ref('')
const messageBox = ref(null)
const teacherAvatar = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png') 

const userList = ref([
  { studentId: '101', studentName: '李华', avatarUrl: '', unread: 2, lastTime: Date.now() - 100000, lastMessage: '老师，昨天的作业那个算法题我不太懂。' },
  { studentId: '102', studentName: '张伟', avatarUrl: '', unread: 0, lastTime: Date.now() - 1000000, lastMessage: '收到，谢谢老师！' },
  { studentId: '103', studentName: '王芳', avatarUrl: '', unread: 1, lastTime: Date.now() - 5000000, lastMessage: '请问期末考试范围是？' },
])

const messagesMap = ref({
  '101': [
    { id: 1, isSelf: false, content: '老师好！', time: Date.now() - 200000 },
    { id: 2, isSelf: true, content: '你好，李华。有什么问题吗？', time: Date.now() - 190000 },
    { id: 3, isSelf: false, content: '老师，昨天的作业那个算法题我不太懂。', time: Date.now() - 100000 },
  ],
  '102': [
    { id: 1, isSelf: true, content: '张伟，你的实验报告我看了，写得不错。', time: Date.now() - 1100000 },
    { id: 2, isSelf: false, content: '收到，谢谢老师！', time: Date.now() - 1000000 },
  ],
  '103': [
     { id: 1, isSelf: false, content: '请问期末考试范围是？', time: Date.now() - 5000000 },
  ]
})

// Real Interaction Data
const interactionList = ref([])

// Computed
const unreadCount = computed(() => userList.value.reduce((sum, u) => sum + u.unread, 0))
const interactionUnread = ref(0) // Will be updated by API

const filteredUserList = computed(() => {
  if (!searchKeyword.value) return userList.value
  return userList.value.filter(u => u.studentName.includes(searchKeyword.value))
})

const currentMessages = computed(() => {
  if(!currentChatUser.value) return []
  return messagesMap.value[currentChatUser.value.studentId] || []
})

// Methods
const loadInteractions = async () => {
    interactionLoading.value = true
    try {
        const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
        const res = await getMessageList(teacherId, { pageSize: 50 })
        if (res.code === 200 && res.data) {
            interactionList.value = res.data.records.map(m => ({
                id: m.messageId,
                userName: m.senderName || '未知用户',
                userAvatar: m.senderAvatar || '',
                content: m.content,
                time: m.createTime,
                isRead: m.isRead === 1,
                originalContent: '回复了您的评论', // Backend could provide more context
                sourceName: '课程互动',
                coverUrl: ''
            }))
            
            // Update unread count
            const countRes = await getUnreadCount(teacherId)
            if (countRes.code === 200) {
                interactionUnread.value = countRes.data.unreadCount
            }
        }
    } catch (error) {
        console.error('加载互动消息失败:', error)
    } finally {
        interactionLoading.value = false
    }
}

const selectChatUser = (user) => {
  currentChatUser.value = user
  user.unread = 0
  scrollToBottom()
}

const sendMessage = () => {
  if (!inputMessage.value.trim() || !currentChatUser.value) return
  
  const newList = messagesMap.value[currentChatUser.value.studentId] || []
  newList.push({ id: Date.now(), isSelf: true, content: inputMessage.value, time: Date.now() })
  messagesMap.value[currentChatUser.value.studentId] = newList
  
  currentChatUser.value.lastMessage = inputMessage.value
  currentChatUser.value.lastTime = Date.now()
  inputMessage.value = ''
  scrollToBottom()
  
  setTimeout(() => receiveMockReply(currentChatUser.value.studentId), 1000)
}

const receiveMockReply = (studentId) => {
   const replies = ['好的谢谢老师', '明白了', '我会再试一下', '收到']
   const reply = replies[Math.floor(Math.random() * replies.length)]
   
   const newList = messagesMap.value[studentId] || []
   newList.push({ id: Date.now(), isSelf: false, content: reply, time: Date.now() })
   
   const user = userList.value.find(u => u.studentId === studentId)
   if(user) {
     user.lastMessage = reply
     user.lastTime = Date.now()
     if(currentChatUser.value?.studentId !== studentId) {
       user.unread++
     } else {
       scrollToBottom()
     }
   }
}

const handleReplyInteraction = async (item) => {
    // Mark as read
    if (!item.isRead) {
        try {
            await markAsRead(item.id)
            item.isRead = true
            interactionUnread.value = Math.max(0, interactionUnread.value - 1)
        } catch (e) { console.error(e) }
    }
    ElMessage.info('正在跳转到评论页面...')
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
  const diff = now - date;
  
  if (diff < 1000 * 60) return '刚刚'
  if (diff < 1000 * 60 * 60) return Math.floor(diff / (1000 * 60)) + '分钟前'
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

onMounted(() => {
    loadInteractions()
})
</script>

<style scoped>
.message-center { padding: 0; height: calc(100vh - 84px); overflow: hidden; }

.chat-container {
  display: flex; height: 100%; border-radius: 0; border: none; background: #fff;
}

/* Sidebar */
.chat-sidebar {
  width: 320px; display: flex; flex-direction: column; background: #f9fafb; border-right: 1px solid #eee;
}

.sidebar-tabs {
    display: flex; border-bottom: 1px solid #e5e7eb; background: #fff;
}
.tab-item {
    flex: 1; height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 15px; color: #6b7280; cursor: pointer; position: relative; transition: all 0.2s;
}
.tab-item:hover { color: #1f2937; background: #f9fafb; }
.tab-item.active { color: #10b981; font-weight: 600; background: #fff; border-bottom: 2px solid #10b981; }

.tab-icon-wrap { position: relative; font-size: 18px; display: flex; }
.tab-badge {
    position: absolute; top: -6px; right: -8px; background: #ef4444; color: white;
    font-size: 10px; height: 16px; min-width: 16px; border-radius: 8px; 
    display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 1px solid #fff;
}

.sidebar-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.search-wrap { padding: 16px; }

/* User List */
.user-list { flex: 1; overflow-y: auto; padding: 0 10px; }
.user-item {
  display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px;
}
.user-item:hover { background-color: #f3f4f6; }
.user-item.active { background-color: #ecfdf5; }

.user-avatar-wrap { position: relative; }
.unread-dot {
  position: absolute; top: -2px; right: -2px; background: #ef4444; color: white;
  font-size: 10px; width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; border: 2px solid white;
}

.user-info { flex: 1; min-width: 0; }
.info-top { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: baseline; }
.name { font-weight: 600; font-size: 15px; color: #1f2937; }
.time { font-size: 11px; color: #9ca3af; }
.last-msg { margin: 0; font-size: 13px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Interaction Menu (Sidebar View) */
.interaction-menu { padding: 16px; gap: 8px; }
.menu-item {
    display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; color: #374151; font-weight: 500;
}
.menu-item:hover { background: #e5e7eb; }
.menu-item.active { background: #ecfdf5; color: #059669; }
.icon-box {
    width: 36px; height: 36px; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.bg-blue { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.bg-red { background: linear-gradient(135deg, #f87171, #ef4444); }
.bg-green { background: linear-gradient(135deg, #34d399, #10b981); }
.arrow { margin-left: auto; color: #d1d5db; }


/* Main Chat Window */
.chat-main { flex: 1; display: flex; flex-direction: column; background: white; overflow: hidden; position: relative; }

.window-header {
  height: 60px; padding: 0 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #fff; z-index: 10;
}
.user-title { display: flex; align-items: center; gap: 8px; }
.user-title .name { font-size: 17px; font-weight: 700; }
.status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
.status-text { font-size: 12px; color: #10b981; }

.message-area { flex: 1; background-color: #f9fafb; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
.message-row { display: flex; gap: 16px; max-width: 75%; }
.message-row.me { align-self: flex-end; flex-direction: row-reverse; }

.msg-avatar { flex-shrink: 0; }
.msg-body { display: flex; flex-direction: column; gap: 4px; }
.msg-content-wrapper { display: flex; }
.me .msg-content-wrapper { justify-content: flex-end; }

.bubble {
  padding: 12px 18px; border-radius: 18px; background: white; 
  color: #374151; font-size: 15px; line-height: 1.5; box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  border-top-left-radius: 2px;
}
.me .bubble {
  background: #10b981; color: white; border-top-left-radius: 18px; border-top-right-radius: 2px;
  box-shadow: 0 4px 10px -2px rgba(16, 185, 129, 0.3);
}

.msg-time { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.me .msg-time { text-align: right; }

/* Input Area */
.input-area { padding: 16px 24px; background: white; border-top: 1px solid #f3f4f6; }
.toolbar { display: flex; gap: 20px; margin-bottom: 12px; color: #6b7280; }
.toolbar .el-icon { font-size: 22px; cursor: pointer; transition: color 0.2s; }
.toolbar .el-icon:hover { color: #10b981; }

.chat-input {
  width: 100%; height: 60px; border: none; resize: none; outline: none; font-size: 14px; color: #374151; font-family: inherit; background: transparent;
}
.send-btn-wrap { display: flex; justify-content: flex-end; }
.empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; gap: 16px; background: #f9fafb; }


/* Interaction List Styles (Douyin Style) */
.interaction-header { justify-content: space-between; }
.interaction-header h3 { font-size: 18px; font-weight: 700; margin: 0; }

.interaction-list { flex: 1; overflow-y: auto; padding: 0; }
.interaction-item {
    display: flex; padding: 20px 24px; border-bottom: 1px solid #f1f2f4; transition: background 0.2s;
    background: #fff;
}
.interaction-item:hover { background: #fafafa; }

.item-avatar { position: relative; flex-shrink: 0; margin-right: 16px; }
.unread-badge {
    position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid #fff;
}

.item-content { flex: 1; display: flex; flex-direction: column; gap: 6px; }

.item-top { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.user-name { font-weight: 700; color: #1f2937; }
.action-text { color: #6b7280; }
.time { color: #9ca3af; font-size: 12px; }

.reply-content { font-size: 15px; color: #111827; margin: 4px 0; line-height: 1.5; }

.context-box {
    display: flex; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 13px; color: #6b7280; gap: 8px; align-items: center; margin-top: 4px;
    border-left: 3px solid #d1d5db;
}
.context-text { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.my-name { font-weight: 600; color: #4b5563; }
.context-source { 
    display: flex; align-items: center; gap: 4px; color: #10b981; font-weight: 500; font-size: 12px; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;
}

.item-actions { margin-top: 4px; opacity: 0; transition: opacity 0.2s; }
.interaction-item:hover .item-actions { opacity: 1; }

.item-right-thumb { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; margin-left: 16px; flex-shrink: 0; }
.item-right-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Utilities */
.animate-slide-up { animation: slideUp 0.4s ease-out backwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
</style>
