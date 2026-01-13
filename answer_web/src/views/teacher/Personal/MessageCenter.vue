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
            <p>从左侧列表选择联系人进行沟通</p>
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
                <div class="reply-content" v-if="item.content">
                  <span v-if="item.content === '[已删除]' || item.content.includes('已删除')" style="color: #94a3b8; font-style: italic;">该评论已被删除</span>
                  <span v-else>{{ item.content }}</span>
                </div>

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
import { onMounted, onUnmounted } from 'vue'
import {
  ChatLineRound, Search, MoreFilled, Picture, Folder, Comment, Bell, ArrowRight, VideoPlay, Star, BellFilled, ChatDotRound
} from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'
import { useMessageCenter } from '@/assets/js/teacher/message-center-logic.js'

const {
  // State
  userStore,
  activeTab,
  activeInteractionType,
  commentSubTab,
  loadingContacts,
  interactionLoading,
  searchKeyword,
  currentChatUser,
  inputMessage,
  messageBox,
  userList,
  currentMessages,
  interactionList,
  chatUnreadTotal,
  interactionUnread,

  // Computed
  filteredUserList,
  interactionTitle,
  filteredInteractionList,
  emptyStateText,

  // Methods
  selectChatUser,
  handleSendMessage,
  isMyMessage,
  handleInteractionDetail,
  toggleQuickReply,
  handleQuickReply,
  handleDeleteComment,
  markAllRead,
  formatTime,
  formatDetailedTime,
  getAvatarUrl,
  initMessageCenter,
  cleanupMessageCenter
} = useMessageCenter()

onMounted(() => {
  initMessageCenter()
})

onUnmounted(() => {
  cleanupMessageCenter()
})
</script>

<style scoped>
@import '@/assets/css/teacher/message-center.css';
</style>