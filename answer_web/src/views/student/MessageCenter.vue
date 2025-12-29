<template>
  <div class="message-center modern-page">
    <div class="chat-container">
      <!-- Side: Teacher List -->
      <aside class="chat-sidebar glass-panel">
        <div class="sidebar-header">
          <h3>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="chat-badge" type="danger">
              <el-icon><ChatLineRound /></el-icon> 我的老师
            </el-badge>
          </h3>
          <div class="search-wrap">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索老师..." 
              prefix-icon="Search"
              clearable 
              size="small"
              class="glass-input-small"
            />
          </div>
        </div>
        
        <div class="user-list custom-scrollbar">
          <div 
            v-for="teacher in filteredTeacherList" 
            :key="teacher.id" 
            class="user-item"
            :class="{ active: currentChatTeacher?.id === teacher.id }"
            @click="selectChatTeacher(teacher)"
          >
            <div class="user-avatar-wrap">
              <el-avatar :size="40" :src="teacher.avatarUrl" shape="square" class="teacher-avatar">
                {{ teacher.name?.charAt(0) }}
              </el-avatar>
              <span v-if="teacher.unread > 0" class="unread-dot">{{ teacher.unread }}</span>
            </div>
            <div class="user-info">
              <div class="info-top">
                <span class="name">{{ teacher.name }}</span>
                <span class="course-tag">{{ teacher.course }}</span>
              </div>
              <div class="info-bottom">
                 <p class="last-msg">{{ teacher.lastMessage || '暂无消息' }}</p>
                 <span class="time">{{ formatTime(teacher.lastTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main: Chat Window -->
      <main class="chat-window glass-panel">
        <template v-if="currentChatTeacher">
          <header class="window-header">
            <div class="user-title">
              <span class="name">{{ currentChatTeacher.name }} 老师</span>
              <span class="sub-text">{{ currentChatTeacher.course }}</span>
            </div>
            <div class="window-actions">
              <el-button link><el-icon><MoreFilled /></el-icon></el-button>
            </div>
          </header>

          <div class="message-area custom-scrollbar" ref="messageBox">
            <div v-for="(msg, index) in currentMessages" :key="index" class="message-row" :class="{ 'me': msg.isSelf }">
              <div class="msg-avatar">
                <el-avatar :size="36" v-if="!msg.isSelf" class="teacher-avatar">{{ currentChatTeacher.name?.charAt(0) }}</el-avatar>
                <el-avatar :size="36" v-else class="my-avatar">我</el-avatar>
              </div>
              <div class="msg-content">
                 <div class="bubble">
                   {{ msg.content }}
                 </div>
                 <div class="msg-time">{{ formatTime(msg.time) }}</div>
              </div>
            </div>
          </div>

          <footer class="input-area">
             <div class="toolbar">
               <el-icon title="发送图片"><Picture /></el-icon>
               <el-icon title="发送文件"><Folder /></el-icon>
               <el-icon title="语音输入"><Microphone /></el-icon>
             </div>
             <textarea 
               v-model="inputMessage" 
               class="chat-input" 
               placeholder="向老师提问..." 
               @keydown.enter.prevent="sendMessage"
             ></textarea>
             <div class="send-btn-wrap">
               <el-button type="primary" :disabled="!inputMessage.trim()" @click="sendMessage">发送</el-button>
             </div>
          </footer>
        </template>
        
        <div v-else class="empty-chat">
          <el-icon size="64" color="#d1d5db"><ChatDotRound /></el-icon>
          <p>选择一位老师开始提问</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { 
  ChatLineRound, Search, MoreFilled, Picture, Folder, Microphone, ChatDotRound 
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css' // Reuse the modern theme

// Mock Data
const searchKeyword = ref('')
const currentChatTeacher = ref(null)
const inputMessage = ref('')
const messageBox = ref(null)

// Mock Teacher List
const teacherList = ref([
  { id: 't1', name: '王老师', course: '计算机网络', avatarUrl: '', unread: 0, lastTime: new Date().getTime() - 1000000, lastMessage: '好的，下通过这几个点去复习。' },
  { id: 't2', name: '李老师', course: 'Web开发', avatarUrl: '', unread: 1, lastTime: new Date().getTime() - 500000, lastMessage: '作业截止日期是周五。' },
  { id: 't3', name: '张老师', course: '数据结构', avatarUrl: '', unread: 0, lastTime: new Date().getTime() - 20000000, lastMessage: '期末考试重点在第三章。' },
])

// Mock Messages
const messagesMap = ref({
  't1': [
    { id: 1, isSelf: true, content: '王老师，请问期末考试范围是哪些？', time: new Date().getTime() - 2000000 },
    { id: 2, isSelf: false, content: '好的，下通过这几个点去复习。', time: new Date().getTime() - 1000000 },
  ],
  't2': [
    { id: 1, isSelf: false, content: '作业截止日期是周五。', time: new Date().getTime() - 500000 },
  ],
  't3': [
      { id: 1, isSelf: false, content: '期末考试重点在第三章。', time: new Date().getTime() - 20000000 },
  ]
})

const unreadCount = computed(() => {
  return teacherList.value.reduce((sum, t) => sum + t.unread, 0)
})

const filteredTeacherList = computed(() => {
  if (!searchKeyword.value) return teacherList.value
  return teacherList.value.filter(t => 
    t.name.includes(searchKeyword.value) || 
    t.course.includes(searchKeyword.value)
  )
})

const currentMessages = computed(() => {
  if(!currentChatTeacher.value) return []
  return messagesMap.value[currentChatTeacher.value.id] || []
})

const selectChatTeacher = (teacher) => {
  currentChatTeacher.value = teacher
  teacher.unread = 0
  scrollToBottom()
}

const sendMessage = () => {
  if (!inputMessage.value.trim() || !currentChatTeacher.value) return
  
  const newList = messagesMap.value[currentChatTeacher.value.id] || []
  newList.push({
    id: Date.now(),
    isSelf: true,
    content: inputMessage.value,
    time: Date.now()
  })
  messagesMap.value[currentChatTeacher.value.id] = newList
  
  // Update last message in sidebar
  currentChatTeacher.value.lastMessage = inputMessage.value
  currentChatTeacher.value.lastTime = Date.now()
  
  inputMessage.value = ''
  scrollToBottom()
  
  // Mock auto reply
  setTimeout(() => {
    receiveMockReply(currentChatTeacher.value.id)
  }, 1000)
}

const receiveMockReply = (teacherId) => {
   const replies = ['收到，我会尽快回复你', '这个问题很好', '请参考教材第50页', '下课后来办公室找我']
   const reply = replies[Math.floor(Math.random() * replies.length)]
   
   const newList = messagesMap.value[teacherId] || []
   newList.push({
     id: Date.now(),
     isSelf: false,
     content: reply,
     time: Date.now()
   })
   
   const teacher = teacherList.value.find(t => t.id === teacherId)
   if(teacher) {
     teacher.lastMessage = reply
     teacher.lastTime = Date.now()
     if(currentChatTeacher.value?.id !== teacherId) {
       teacher.unread++
     } else {
       scrollToBottom()
     }
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
  const date = new Date(time)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.message-center {
  height: calc(100vh - 140px);
  overflow: hidden;
}

.chat-container {
  display: flex;
  height: 100%;
  gap: 20px;
}

/* Sidebar */
.chat-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.sidebar-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.user-item:hover {
  background-color: rgba(0,0,0,0.02);
}

.user-item.active {
  background-color: #ecfdf5;
}

.user-avatar-wrap {
  position: relative;
}

.teacher-avatar {
  background-color: #8b5cf6; /* Purple for teacher */
  color: white;
}

.unread-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.info-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
}

.name {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.course-tag {
  font-size: 10px;
  background-color: #f3f4f6;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
}

.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 8px;
}

.last-msg {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Main Window */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.window-header {
  height: 60px;
  padding: 0 24px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-title {
  display: flex;
  flex-direction: column;
}

.user-title .name {
  font-size: 16px;
  font-weight: 700;
}

.user-title .sub-text {
  font-size: 12px;
  color: #6b7280;
}

.message-area {
  flex: 1;
  background-color: #f9fafb;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-row {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message-row.me {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.me .bubble {
  background: #10b981;
  color: white;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
}

.msg-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.me .msg-time { opacity: 0.8; }

/* Input Area */
.input-area {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f3f4f6;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: #6b7280;
}

.toolbar .el-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
}

.toolbar .el-icon:hover {
  color: #10b981;
}

.chat-input {
  width: 100%;
  height: 80px;
  border: none;
  resize: none;
  outline: none;
  font-size: 14px;
  color: #374151;
  font-family: inherit;
  background: transparent;
}

.send-btn-wrap {
  display: flex;
  justify-content: flex-end;
}

.empty-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 16px;
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
</style>
