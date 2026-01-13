<template>
  <div class="chat-management modern-page">
    <div class="chat-sidebar card-panel">
      <div class="sidebar-header">
        <h2>消息中心</h2>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索联系人..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>

      <div class="contact-list custom-scrollbar" v-loading="searching">
        <div
          v-for="item in filteredContacts"
          :key="item.contactId"
          class="contact-item"
          :class="{ active: activeChat?.contactId === item.contactId }"
          @click="selectContact(item)"
        >
          <el-badge :value="item.unreadCount" :hidden="item.unreadCount === 0" class="avatar-badge">
            <el-avatar :size="45" :src="getAvatar(item.contactAvatar)">
              {{ item.contactName?.charAt(0) }}
            </el-avatar>
          </el-badge>
          <div class="contact-info">
            <div class="contact-name-row">
              <span class="contact-name">{{ item.contactName }}</span>
              <span class="contact-role" :class="item.contactType.toLowerCase()">
                {{ item.contactType === 'TEACHER' ? '教师' : '学生' }}
              </span>
            </div>
            <div class="contact-last-msg">{{ item.lastMessage || '暂无消息' }}</div>
          </div>
        </div>
        
        <el-empty v-if="filteredContacts.length === 0" description="暂无联系人" />
      </div>
    </div>

    <div class="chat-main card-panel">
      <template v-if="activeChat">
        <header class="chat-header">
          <el-avatar :size="40" :src="getAvatar(activeChat.contactAvatar)">
            {{ activeChat.contactName?.charAt(0) }}
          </el-avatar>
          <div class="header-user-info">
            <span class="name">{{ activeChat.contactName }}</span>
            <span class="status">在线对话</span>
          </div>
        </header>

        <div class="message-list custom-scrollbar" ref="messageBox" v-loading="loading">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="{ me: msg.senderType === 'ADMIN' }"
          >
            <el-avatar :size="35" :src="msg.senderType === 'ADMIN' ? '' : getAvatar(activeChat.contactAvatar)">
              {{ msg.senderType === 'ADMIN' ? '管' : activeChat.contactName?.charAt(0) }}
            </el-avatar>
            <div class="msg-content">
              <div class="msg-bubble">
                {{ msg.content }}
              </div>
              <span class="msg-time">{{ formatTime(msg.createTime) }}</span>
            </div>
          </div>
        </div>

        <footer class="chat-input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="输入回复内容，按 Enter 发送..."
            resize="none"
            @keydown.enter.prevent="handleSend"
          />
          <el-button type="primary" @click="handleSend" :disabled="!inputText.trim()">
            发送
          </el-button>
        </footer>
      </template>

      <div v-else class="empty-chat">
        <el-icon><ChatDotRound /></el-icon>
        <p>选择一个联系人开始对话</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Search, ChatDotRound } from '@element-plus/icons-vue'
import { useChatManagement } from '@/assets/js/chat-management'

const {
  searchKeyword,
  filteredContacts,
  activeChat,
  messages,
  inputText,
  loading,
  searching,
  messageBox,
  loadContacts,
  selectContact,
  handleSend,
  formatTime,
  getAvatar,
  refreshUnreadCount,
  refreshHistory
} = useChatManagement()

let timer: any = null

onMounted(() => {
  loadContacts()
  refreshUnreadCount()
  
  // 轮询新消息
  timer = setInterval(() => {
    refreshUnreadCount()
    loadContacts(false) // 静默刷新联系人摘要
    if (activeChat.value) {
       refreshHistory(activeChat.value)
    }
  }, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
@import '@/assets/css/chat-management.css';
</style>
