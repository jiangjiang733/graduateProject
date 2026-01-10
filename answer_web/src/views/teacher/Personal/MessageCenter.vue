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
            <span>通知</span>
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
                  <el-avatar :size="36" v-else :src="getAvatarUrl(userStore.avatarUrl)" class="my-avatar">我</el-avatar>
                </div>
                <div class="msg-body">
                  <div class="msg-header">
                    <span class="msg-name">{{ isMyMessage(msg) ? (userStore.userName || '教师') : currentChatUser.contactName }}</span>
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
            <el-icon size="64" color="#d1d5db"><ChatDotRound /></el-icon>
            <h3>开始聊天</h3>
            <p>从左侧列表选择一位学生进行沟通</p>
          </div>
        </template>

        <template v-if="activeTab === 'interaction'">
          <header class="window-header interaction-header">
            <div v-if="activeInteractionType === 'comment'" class="header-tabs">
              <div
                  class="header-tab-item"
                  :class="{ active: commentSubTab === 'discussion' }"
                  @click="commentSubTab = 'discussion'"
              >
                新课程讨论
                <div class="active-bar"></div>
              </div>
              <div
                  class="header-tab-item"
                  :class="{ active: commentSubTab === 'reply' }"
                  @click="commentSubTab = 'reply'"
              >
                收到的回复
                <div class="active-bar"></div>
              </div>
            </div>
            <h3 v-else>{{ interactionTitle }}</h3>

            <el-button link type="primary" @click="markAllRead">全部标记已读</el-button>
          </header>

          <div v-loading="interactionLoading" class="interaction-list custom-scrollbar">
            <div v-for="(item, index) in filteredInteractionList" :key="index" class="interaction-item animate-slide-up">
              <div class="item-avatar-wrap">
                <el-avatar :size="44" :src="getAvatarUrl(item.userAvatar)" shape="circle">
                  <el-icon v-if="item.type === 'SYSTEM'"><BellFilled /></el-icon>
                  <span v-else>{{ item.userName?.charAt(0) }}</span>
                </el-avatar>
                <div v-if="!item.isRead" class="unread-dot-lg"></div>
              </div>

              <div class="item-main">
                <div class="item-header">
                  <span class="user-name">{{ item.userName }}</span>
                  <span class="time">{{ formatDetailedTime(item.time) }}</span>
                </div>
                <div class="item-action-row">
                  <span class="action-text">{{ item.actionText }}</span>
                </div>
                <div class="reply-content" v-if="item.content">{{ item.content }}</div>

                <div class="item-actions">
                  <el-button v-if="item.type === 'COMMENT'" link type="primary" size="small" @click="toggleQuickReply(item)">
                    {{ item.showReply ? '取消回复' : '快捷回复' }}
                  </el-button>
                  <el-button link size="small" @click="handleInteractionDetail(item)">查看详情</el-button>
                  <el-button v-if="item.type === 'COMMENT' && item.relatedId" link type="danger" size="small" @click="handleDeleteComment(item)">删除</el-button>
                </div>

                <el-collapse-transition>
                  <div v-if="item.showReply" class="quick-reply-box">
                    <el-input
                        v-model="item.replyContent"
                        placeholder="输入回复内容..."
                        size="small"
                        @keydown.enter.prevent="handleQuickReply(item)"
                    >
                      <template #append>
                        <el-button @click="handleQuickReply(item)">发送</el-button>
                      </template>
                    </el-input>
                  </div>
                </el-collapse-transition>
              </div>
            </div>

            <div v-if="filteredInteractionList.length === 0" class="empty-state">
              <el-empty :description="emptyStateText" />
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
  ChatLineRound, Search, MoreFilled, Picture, Folder, Comment, Bell, ArrowRight, VideoPlay, Star, BellFilled, ChatDotRound
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'
import { getMessageList, markAsRead, getUnreadCount } from '@/api/message.js'
import {
  sendChatMessage, getChatHistory, getChatContacts,
  getActiveContacts, markChatRead, getChatUnreadCount
} from '@/api/chat'
import { addComment, deleteComment } from '@/api/comment'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserInfo } from '@/stores/user'

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

const DEFAULT_AVATAR = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

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
      // 过滤“新课程讨论”：通常依据标题判断
      return list.filter(item => item.actionText && item.actionText.includes('新课程讨论'))
    } else {
      // 过滤“收到的回复”
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
  } catch (e) {}
}

const loadInteractions = async (showLoading = true) => {
  if (showLoading) interactionLoading.value = true
  try {
    const teacherId = userStore.userId
    if (!teacherId) {
      console.error("Teacher ID not found in store");
      return;
    }
    const teacherType = 'TEACHER'
    const res = await getMessageList(teacherId, teacherType, { pageSize: 50 })

    if (res.code === 200 && res.data && res.data.records) {
      interactionList.value = res.data.records.map(m => {
        // 查找旧列表中是否存在该消息，以保留UI状态
        const oldItem = interactionList.value.find(oi => oi.id === m.messageId)
        
        return {
          id: m.messageId,
          senderId: m.senderId,
          senderType: m.senderType || 'STUDENT',
          type: (m.messageType === 'INTERACTION' || m.messageType === 'COMMENT') ? 'COMMENT' : 'SYSTEM',
          userName: m.senderName || '通知',
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
    } else {
      interactionList.value = []
    }
  } catch (e) {
    console.error('加载消息失败:', e)
    interactionList.value = []
  } finally { interactionLoading.value = false }
}

const selectChatUser = async (user) => {
  currentChatUser.value = user
  try {
    const teacherId = userStore.userId
    const res = await getChatHistory({
      user1Id: teacherId,
      user1Type: 'TEACHER',
      user2Id: user.contactId,
      user2Type: 'STUDENT'
    })
    if (res.code === 200) {
      currentMessages.value = Array.isArray(res.data) ? res.data : []
      scrollToBottom()
      if (user.unreadCount > 0) {
        await markChatRead({
          currentUserId: teacherId,
          currentUserType: 'TEACHER',
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
  const teacherId = userStore.userId
  const msg = {
    senderId: String(teacherId),
    senderType: 'TEACHER',
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
    } catch (e) {}
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

    // 核心逻辑：区分是“公开回复评论”还是“私信回复”
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

// 刷新当前聊天窗口的消息历史
const refreshChatHistory = async () => {
  if (!currentChatUser.value) return
  try {
    const teacherId = userStore.userId
    const res = await getChatHistory({
      user1Id: teacherId,
      user1Type: 'TEACHER',
      user2Id: currentChatUser.value.contactId,
      user2Type: 'STUDENT'
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
onMounted(() => {
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
})
onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
/* CSS Updates */
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

/* Header Tabs */
.header-tabs { display: flex; gap: 24px; height: 100%; }
.header-tab-item {
  display: flex; align-items: center; height: 100%; position: relative; cursor: pointer;
  font-size: 15px; font-weight: 500; color: #64748b; transition: color 0.3s;
}
.header-tab-item:hover { color: #3b82f6; }
.header-tab-item.active { color: #3b82f6; font-weight: 600; }
.active-bar {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 3px;
  background: #3b82f6; border-radius: 3px 3px 0 0; transform: scaleX(0);
  transition: transform 0.3s;
}
.header-tab-item.active .active-bar { transform: scaleX(1); }

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

/* Interaction List Styles (Improved) */
.interaction-list { flex: 1; overflow-y: auto; background: #f9fafb; padding: 20px; }
.interaction-item {
  display: flex; gap: 16px; padding: 20px; margin-bottom: 16px;
  border-radius: 12px; background: #fff; border: 1px solid #f3f4f6;
  transition: all 0.2s;
}
.interaction-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-1px); }

.item-avatar-wrap { position: relative; flex-shrink: 0; }
.unread-dot-lg {
  position: absolute; top: 0; right: 0; width: 12px; height: 12px;
  background: #ef4444; border-radius: 50%; border: 2px solid #fff;
}

.item-main { flex: 1; min-width: 0; }
.item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.user-name { font-weight: 600; color: #1f2937; font-size: 15px; }
.time { color: #9ca3af; font-size: 12px; }

.item-action-row { margin-bottom: 8px; }
.action-text { color: #6b7280; font-size: 13px; }

.reply-content {
  background: #f3f4f6; padding: 12px 16px; border-radius: 8px;
  color: #374151; font-size: 14px; margin-bottom: 12px; line-height: 1.5;
}

.item-actions { display: flex; gap: 12px; }
.quick-reply-box { margin-top: 12px; }

.empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; gap: 16px; background: #f9fafb; }

.animate-slide-up { animation: slideUp 0.4s ease-out backwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
</style>