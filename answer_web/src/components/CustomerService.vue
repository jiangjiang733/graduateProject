<template>
  <div class="customer-service-widget">
    <!-- Floating Button -->
    <div 
      class="service-float-btn" 
      :class="{ 'has-unread': unreadCount > 0 }"
      @click="toggleChat"
    >
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="badge">
        <el-icon :size="24"><Service /></el-icon>
      </el-badge>
      <span class="btn-label">联系工作人员</span>
    </div>

    <!-- Chat Dialog -->
    <el-dialog
      v-model="visible"
      title="工作人员在线咨询"
      width="450px"
      append-to-body
      destroy-on-close
      class="service-chat-dialog"
    >
      <div class="chat-wrapper">
        <div class="message-list custom-scrollbar" ref="messageBox">
          <div v-if="history.length === 0" class="empty-state">
            <el-empty description="描述您遇到的问题，工作人员将尽快回复" />
          </div>
          <div 
            v-for="(msg, index) in history" 
            :key="index" 
            class="message-item"
            :class="{ 'me': isMe(msg) }"
          >
            <el-avatar :size="32" :src="getAvatar(msg)" class="avatar">
              {{ getAvatarText(msg) }}
            </el-avatar>
            <div class="msg-body">
              <div class="bubble">{{ msg.content }}</div>
              <span class="time">{{ formatTime(msg.createTime) }}</span>
            </div>
          </div>
        </div>
        
        <div class="input-area">
          <el-input
            v-model="inputContent"
            type="textarea"
            :rows="3"
            placeholder="请在此输入您的问题..."
            resize="none"
            @keydown.ctrl.enter="handleSend"
          />
          <div class="actions">
            <span class="tip">Ctrl + Enter 发送</span>
            <el-button type="primary" :loading="sending" @click="handleSend" :disabled="!inputContent.trim()">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { Service } from '@element-plus/icons-vue'
import { getAdminChatInfo, getChatHistory, sendChatMessage, markChatRead } from '@/api/chat'
import { useUserInfo } from '@/stores/user'
import { ElMessage } from 'element-plus'

const props = defineProps({
  userType: {
    type: String,
    required: true // 'STUDENT' or 'TEACHER'
  },
  userId: {
    type: [String, Number],
    required: true
  }
})

const visible = ref(false)
const history = ref([])
const unreadCount = ref(0)
const inputContent = ref('')
const sending = ref(false)
const messageBox = ref(null)
const pollTimer = ref(null)

const userStore = useUserInfo()

// 监听未读数变化，弹出提示
watch(unreadCount, (newVal, oldVal) => {
  if (newVal > oldVal && !visible.value) {
    ElMessage({
      message: '您有新的工作人员回复，请点击右下角查看',
      type: 'info',
      duration: 5000,
      offset: 70
    })
  }
})

const isMe = (msg) => {
  return String(msg.senderId) === String(props.userId) && msg.senderType === props.userType.toUpperCase()
}

const getAvatar = (msg) => {
  if (isMe(msg)) return userStore.avatarUrl
  return '' // Admin default avatar
}

const getAvatarText = (msg) => {
  if (isMe(msg)) return userStore.userName?.charAt(0) || '我'
  return '管'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

const toggleChat = () => {
  visible.value = !visible.value
  if (visible.value) {
    loadHistory()
    markAsRead()
  }
}

const loadHistory = async () => {
  try {
    const res = await getChatHistory({
      user1Id: props.userId,
      user1Type: props.userType.toUpperCase(),
      user2Id: '1',
      user2Type: 'ADMIN'
    })
    if (res.code === 200) {
      history.value = res.data || []
      scrollToBottom()
    }
  } catch (e) {}
}

const loadUnread = async () => {
  try {
    const res = await getAdminChatInfo(props.userType.toUpperCase(), props.userId)
    if (res.code === 200) {
      unreadCount.value = res.data.unreadCount || 0
      // If unread messages and dialog is open, refresh history
      if (visible.value && unreadCount.value > 0) {
        loadHistory()
        markAsRead()
      }
    }
  } catch (e) {}
}

const markAsRead = async () => {
  try {
    await markChatRead({
      currentUserId: props.userId,
      currentUserType: props.userType.toUpperCase(),
      senderId: '1',
      senderType: 'ADMIN'
    })
  } catch (e) {}
}

const handleSend = async () => {
  if (!inputContent.value.trim() || sending.value) return
  
  sending.value = true
  const msgData = {
    senderId: props.userId,
    senderType: props.userType.toUpperCase(),
    receiverId: '1',
    receiverType: 'ADMIN',
    content: inputContent.value,
    msgType: 'TEXT'
  }

  try {
    const res = await sendChatMessage(msgData)
    if (res.code === 200) {
      history.value.push(res.data)
      inputContent.value = ''
      scrollToBottom()
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight
    }
  })
}

onMounted(() => {
  loadUnread()
  pollTimer.value = setInterval(loadUnread, 5000)
})

onUnmounted(() => {
  if (pollTimer.value) clearInterval(pollTimer.value)
})
</script>

<style scoped>
.customer-service-widget {
  position: fixed;
  right: 15px;
  bottom: 15px;
  z-index: 2000;
}

.service-float-btn {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: white;
}

.service-float-btn:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.4);
}

.btn-label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  position: absolute;
  right: 70px;
  background: rgba(31, 41, 55, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(10px);
}

.service-float-btn:hover .btn-label {
  opacity: 1;
  transform: translateX(0);
}

.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.message-list {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.message-item.me {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.message-item:not(.me) .bubble {
  background: white;
  border-top-left-radius: 2px;
  color: #1f2937;
}

.message-item.me .bubble {
  background: #3b82f6;
  border-top-right-radius: 2px;
  color: white;
}

.time {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 4px;
  display: block;
}

.message-item.me .time {
  text-align: right;
}

.input-area {
  padding: 15px;
  border-top: 1px solid #e5e7eb;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.tip {
  font-size: 12px;
  color: #9ca3af;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
