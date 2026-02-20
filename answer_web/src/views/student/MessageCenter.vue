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
           <div 
             class="menu-item"
             :class="{ active: activeInteractionType === 'invitation' }"
             @click="activeInteractionType = 'invitation'"
           >
              <el-icon class="icon-box bg-purple"><MessageIcon /></el-icon>
              <span>课程邀请</span>
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
            <el-icon size="64" color="var(--text-sub)"><ChatDotRound /></el-icon>
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
                    <el-avatar :size="48" :src="getAvatarUrl(item.userAvatar)" shape="circle">
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
                    <div class="reply-content" v-if="item.content">
                      <span v-if="item.content.includes('已删除')" style="color: #94a3b8; font-style: italic;">该评论已被删除</span>
                      <span v-else>{{ item.content }}</span>
                    </div>

                    <div v-if="item.type === 'COURSE_INVITATION'" class="invitation-card-modern">
                      <div class="invitation-body">
                        <div class="invitation-main-text">
                          <el-icon class="book-icon"><School /></el-icon>
                          <span>邀请您加入课程：<strong class="course-highlight">{{ item.content.split('：')[1] || item.content }}</strong></span>
                        </div>
                        
                        <div v-if="item.invitationStatus === 'pending'" class="invitation-op-btns">
                          <el-button type="success" size="small" rounded @click="handleAcceptInvitation(item)" :loading="item.accepting">
                            <el-icon><Check /></el-icon> 接受
                          </el-button>
                          <el-button type="danger" size="small" plain rounded @click="handleRejectInvitation(item)" :loading="item.rejecting">
                            <el-icon><Close /></el-icon> 拒绝
                          </el-button>
                        </div>
                        <div v-else class="invitation-status-box">
                          <div :class="['status-pill', item.invitationStatus === 'approved' ? 'is-approved' : 'is-rejected']">
                            <el-icon><CircleCheck v-if="item.invitationStatus === 'approved'" /><CircleClose v-else /></el-icon>
                            <span>{{ item.invitationStatus === 'approved' ? '已接受' : '已拒绝' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Regular Interaction Actions -->
                    <div class="item-actions">
                       <el-button v-if="item.type !== 'SYSTEM' && item.type !== 'COURSE_INVITATION' && !item.content?.includes('已删除')" link type="primary" size="small" @click="toggleQuickReply(item)">
                         {{ item.showReply ? '取消回复' : '快捷回复' }}
                       </el-button>
                       <el-button v-if="item.type !== 'COURSE_INVITATION' && !item.content?.includes('已删除')" link size="small" @click="handleInteractionDetail(item)">查看详情</el-button>
                       <el-button link type="danger" size="small" class="delete-btn" @click="handleDeleteMessage(item)">
                         <el-icon><Delete /></el-icon> 删除
                       </el-button>
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
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ChatLineRound, Search, MoreFilled, Picture, Folder, Microphone, ChatDotRound, Comment, Bell, BellFilled, ArrowRight, Document,
  Check, Close, Message as MessageIcon, School, CircleCheck, CircleClose, Delete
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'
import { 
  sendChatMessage, getChatHistory, getChatContacts, 
  getActiveContacts, markChatRead, getChatUnreadCount 
} from '@/api/chat'
import { getMessageList, markAsRead, getUnreadCount, deleteMessage } from '@/api/message'
import { getTeacherComments, addComment } from '@/api/comment'
import { studentReviewEnrollment } from '@/api/enrollment'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserInfo } from '@/stores/user'

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
        const res = await getMessageList(studentId.value, userType.value, { pageSize: 50 })
        if (res.code === 200 && res.data) {
            interactionList.value = res.data.records.map(m => ({
                id: m.messageId,
                senderId: m.senderId, 
                senderType: m.senderType || 'TEACHER', 
                type: m.messageType || (m.title?.includes('系统通知') ? 'SYSTEM' : 'INTERACTION'),
                userName: m.senderName || (m.title?.includes('系统通知') ? '系统' : '答疑助教'),
                userAvatar: m.senderAvatar || '',
                content: m.content,
                time: m.createTime,
                isRead: m.isRead === 1,
                actionText: m.title || (m.messageType === 'INTERACTION' ? '发表了新回复' : '发来一条消息'),
                showReply: false, 
                replyContent: '',
                relatedId: m.relatedId,
                // Course invitation specific fields
                enrollmentId: m.relatedId,
                courseName: m.courseName || extractCourseName(m.content),
                invitationStatus: m.invitationStatus || m.invitation_status || m.status || 'pending',
                accepting: false,
                rejecting: false
            }))
        }
    } catch (error) {
        console.error('加载互动消息失败:', error)
    } finally {
        interactionLoading.value = false
    }
}

// Helper function to extract course name from content
const extractCourseName = (content) => {
    if (!content) return ''
    const match = content.match(/课程[：:]\s*(.+?)(?:[，,。\n]|$)/)
    return match ? match[1].trim() : ''
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

// Handle course invitation accept
const handleAcceptInvitation = async (item) => {
    try {
        await ElMessageBox.confirm(
            `确定要接受课程"${item.courseName || '该课程'}"的邀请吗？`,
            '确认接受',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'success'
            }
        )
        
        item.accepting = true
        // 使用学生专用的审核API
        const response = await studentReviewEnrollment(item.enrollmentId, 'approved')
        if (response.success || response.code === 200) {
            ElMessage.success('已接受邀请')
    
            const index = interactionList.value.findIndex(i => i.id === item.id)
            if (index !== -1) {
                interactionList.value[index] = {
                    ...interactionList.value[index],
                    invitationStatus: 'approved',
                    isRead: true
                }
            }
            
            // 重新加载互动列表以获取最新状态
            setTimeout(() => loadInteractions(), 500)
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('接受邀请失败:', error)
            ElMessage.error('操作失败')
        }
    } finally {
        item.accepting = false
    }
}

// Handle course invitation reject
const handleRejectInvitation = async (item) => {
    try {
        const { value: reason } = await ElMessageBox.prompt(
            '请输入拒绝原因（可选）',
            '拒绝课程邀请',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputType: 'textarea',
                inputPlaceholder: '请输入拒绝原因',
                inputPattern: /.{0,200}/,
                inputErrorMessage: '拒绝原因不超过200字'
            }
        )
        
        item.rejecting = true
        // 使用学生专用的审核API
        const response = await studentReviewEnrollment(item.enrollmentId, 'rejected', reason || '学生拒绝了邀请')
        
        if (response.success || response.code === 200) {
            ElMessage.success('已拒绝邀请')
            
            // Force reactive update by creating new object
            const index = interactionList.value.findIndex(i => i.id === item.id)
            if (index !== -1) {
                interactionList.value[index] = {
                    ...interactionList.value[index],
                    invitationStatus: 'rejected',
                    isRead: true
                }
            }
            
            // 重新加载互动列表以获取最新状态
            setTimeout(() => loadInteractions(), 500)
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('拒绝邀请失败:', error)
            ElMessage.error('操作失败')
        }
    } finally {
        item.rejecting = false
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

// 删除通知消息
const handleDeleteMessage = async (item) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这条通知消息吗？',
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const res = await deleteMessage(item.id, studentId.value, userType.value)
        if (res.code === 200) {
            ElMessage.success('删除成功')
            // 从列表中移除
            const index = interactionList.value.findIndex(i => i.id === item.id)
            if (index > -1) {
                interactionList.value.splice(index, 1)
            }
        } else {
            ElMessage.error(res.message || '删除失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
            ElMessage.error('网络错误，删除失败')
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

// 刷新当前聊天窗口的消息历史
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

let refreshTimer = null
onMounted(() => {
    userStore.initUserInfo() // Initialize store data if not already done
    loadContacts()
    loadInteractions()
    
    // 轮询新消息
    refreshTimer = setInterval(() => {
        updateUnreadCounts()
        // 如果打开了聊天窗口，定期刷新历史
        if (currentChatTeacher.value && activeTab.value === 'chat') {
            refreshChatHistory()
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
.chat-container { display: flex; height: 100%; border-radius: 16px; background: var(--bg-card, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.05)); }

/* Sidebar Tabs */
.chat-sidebar { width: 320px; display: flex; flex-direction: column; background: var(--bg-page, #f9fafb); border-right: 1px solid var(--border-color, #eee); border-radius: 16px 0 0 16px; }
.sidebar-tabs { display: flex; border-bottom: 1px solid var(--border-color, #e5e7eb); background: var(--bg-card, #fff); border-radius: 16px 0 0 0; }
.tab-item { flex: 1; height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; color: var(--text-sub, #6b7280); cursor: pointer; position: relative; }
.tab-item.active { color: #10b981; font-weight: 600; background: var(--bg-card, #fff); border-bottom: 2px solid #10b981; }

.tab-badge { 
  position: absolute; top: 10px; right: 15%; background: #ef4444; color: white; font-size: 10px; height: 16px; min-width: 16px; 
  border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 1px solid #fff; 
}

.sidebar-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.search-wrap { padding: 16px; }

/* User List */
.user-list { flex: 1; overflow-y: auto; padding: 0 10px; }
.user-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; }
.user-item:hover { background-color: var(--bg-page, #f3f4f6); }
.user-item.active { background-color: rgba(16, 185, 129, 0.1); }
.user-avatar-wrap { position: relative; }
.unread-dot { position: absolute; top: -2px; right: -2px; background: #ef4444; color: white; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

.user-info { flex: 1; min-width: 0; }
.info-top { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; }
.course-tag { font-size: 10px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 2px 6px; border-radius: 4px; }
.last-msg { margin: 0; font-size: 12px; color: var(--text-sub, #6b7280); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 10px; color: var(--text-sub, #9ca3af); }

/* Main Area */
.chat-main { flex: 1; display: flex; flex-direction: column; background: var(--bg-card, #fff); border-radius: 0 16px 16px 0; overflow: hidden; position: relative; }
.window-header { height: 70px; padding: 0 24px; border-bottom: 1px solid var(--border-color, #f3f4f6); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card, #fff); }
.user-title { display: flex; align-items: center; gap: 12px; }
.user-info-text { display: flex; flex-direction: column; justify-content: center; }
.user-info-text .name { font-size: 16px; font-weight: 600; color: var(--text-main, #1f2937); line-height: 1.2; }
.user-info-text .sub-text { font-size: 12px; color: var(--text-sub, #6b7280); margin-top: 2px; }

.message-area { flex: 1; background-color: var(--bg-page, #f9fafb); padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.message-row { display: flex; gap: 12px; max-width: 80%; width: fit-content; }
.message-row.me { align-self: flex-end; flex-direction: row-reverse; }

.msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; color: #9ca3af; }
.me .msg-header { flex-direction: row-reverse; }
.msg-name { font-weight: 500; }
.msg-time-label { font-size: 11px; }

.bubble { padding: 12px 16px; border-radius: 12px; background: var(--bg-card, white); color: var(--text-main, #374151); font-size: 15px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-top-left-radius: 2px; border: 1px solid var(--border-color, transparent); position: relative; }
.me .bubble { background: #3b82f6; color: white; border-top-left-radius: 12px; border-top-right-radius: 2px; border: none; }

.msg-body { display: flex; flex-direction: column; }

.input-area { padding: 16px 24px; background: var(--bg-card, #fff); border-top: 1px solid var(--border-color, #f3f4f6); }
.toolbar { display: flex; gap: 16px; margin-bottom: 12px; color: #6b7280; font-size: 18px; }
.toolbar .el-icon { cursor: pointer; transition: color 0.2s; }
.toolbar .el-icon:hover { color: #3b82f6; }

.input-wrapper { display: flex; flex-direction: column; gap: 12px; }
.chat-input { width: 100%; min-height: 80px; border: none; resize: none; font-size: 15px; color: var(--text-main, #374151); outline: none; background: transparent; }
.chat-input::placeholder { color: var(--text-sub, #9ca3af); }

.send-btn-wrap { display: flex; justify-content: flex-end; }
.send-btn-wrap .el-button { padding: 8px 24px; border-radius: 8px; font-weight: 500; }

/* Interaction Menu */
.interaction-menu { padding: 16px; gap: 8px; }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: 500; color: var(--text-main, #1f2937); }
.menu-item:hover { background: var(--bg-page, #f1f5f9); }
.menu-item.active { background: rgba(16, 185, 129, 0.1); color: #059669; }
.icon-box { width: 36px; height: 36px; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.bg-green { background: linear-gradient(135deg, #34d399, #10b981); }
.bg-blue { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.bg-purple { background: linear-gradient(135deg, #a78bfa, #8b5cf6); }
.arrow { margin-left: auto; color: var(--text-sub, #cbd5e1); }

.interaction-list { flex: 1; overflow-y: auto; }
.interaction-item { display: flex; padding: 16px 24px; border-bottom: 1px solid var(--border-color, #f1f5f9); gap: 16px; }
.item-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.item-top { display: flex; gap: 8px; align-items: center; font-size: 13px; }
.user-name { font-weight: 700; color: var(--text-main, #1f2937); }
.action-text { color: var(--text-sub, #64748b); }
.time { font-size: 11px; color: var(--text-sub, #9ca3af); }
.reply-content { font-size: 14px; color: var(--text-main, #1e293b); margin: 4px 0; }
.unread-badge { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid var(--bg-card, #fff); }

.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 16px; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
.quick-reply-box { margin-top: 12px; }

/* Course Invitation Modern Card */
.invitation-card-modern {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin: 10px 0;
  transition: all 0.3s ease;
}

.invitation-card-modern:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.invitation-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-main-text {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #1e293b;
}

.book-icon {
  color: #3b82f6;
  font-size: 18px;
}

.course-highlight {
  color: #3b82f6;
  font-weight: 700;
}

.invitation-op-btns {
  display: flex;
  gap: 10px;
}

.invitation-status-box {
  display: flex;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-pill.is-approved {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-pill.is-rejected {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.delete-btn {
  color: #94a3b8 !important;
}

.delete-btn:hover {
  color: #ef4444 !important;
}

:global(.dark-theme) .invitation-card-modern {
  background: #0f172a;
  border-color: #334155;
}

:global(.dark-theme) .invitation-main-text {
  color: #f1f5f9;
}

:global(.dark-theme) .status-pill.is-approved {
  background: rgba(16, 185, 129, 0.2);
}

:global(.dark-theme) .status-pill.is-rejected {
  background: rgba(239, 68, 68, 0.2);
}
</style>
