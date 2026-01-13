<template>
  <div class="message-center modern-page">
    <div class="chat-container glass-panel">
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
              placeholder="搜索联系人..."
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
                  <span class="name">{{ teacher.contactName }}{{ teacher.contactType === 'TEACHER' ? ' 老师' : '' }}</span>
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
              <el-icon class="icon-box bg-purple"><Message /></el-icon>
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
                  <span class="name">{{ currentChatTeacher.contactName }}{{ currentChatTeacher.contactType === 'TEACHER' ? ' 老师' : '' }}</span>
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
                   placeholder="请输入消息内容..."
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
             <h3>我的对话</h3>
             <p>从左侧选择一个联系人开始沟通</p>
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
                       <span v-if="item.content === '[已删除]' || item.content.includes('已删除')" style="color: #94a3b8; font-style: italic;">该评论已被删除</span>
                       <span v-else>{{ item.content }}</span>
                     </div>
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
import {
  ChatLineRound, Search, MoreFilled, Picture, Folder, Microphone, 
  ChatDotRound, Comment, Bell, BellFilled, ArrowRight, Document, Message
} from '@element-plus/icons-vue'
import { useStudentMessageCenter } from '@/assets/js/student/message-center.js'

const {
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
} = useStudentMessageCenter()
</script>

<style scoped>
@import '@/assets/css/student/message-center.css';
</style>

