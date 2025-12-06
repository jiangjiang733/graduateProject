<template>
  <div class="message-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><ChatDotRound /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">学生留言</h2>
          <p class="page-subtitle">查看和回复学生留言</p>
        </div>
      </div>
      <div class="header-actions">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="badge-item">
          <el-button @click="loadMessages">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-radio-group v-model="filterStatus" @change="loadMessages">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button :label="0">未读</el-radio-button>
        <el-radio-button :label="1">已读</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 消息列表 -->
    <div v-loading="loading" class="message-list">
      <el-empty v-if="messages.length === 0" description="暂无留言" :image-size="200" />
      
      <el-card
        v-for="message in messages"
        :key="message.messageId"
        class="message-card"
        :class="{ 'unread': message.isRead === 0 }"
        shadow="hover"
      >
        <div class="message-header">
          <div class="message-user">
            <el-avatar :size="40">{{ message.studentName?.charAt(0) || 'S' }}</el-avatar>
            <div class="user-info">
              <div class="user-name">{{ message.studentName }}</div>
              <div class="message-time">{{ formatDate(message.createTime) }}</div>
            </div>
          </div>
          <div class="message-actions">
            <el-tag v-if="message.isRead === 0" type="warning" size="small">未读</el-tag>
            <el-button size="small" @click="markRead(message)" v-if="message.isRead === 0">
              标记已读
            </el-button>
            <el-button size="small" type="danger" @click="deleteMsg(message)">
              删除
            </el-button>
          </div>
        </div>

        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-meta" v-if="message.courseName">
            <el-icon><Reading /></el-icon>
            <span>课程：{{ message.courseName }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadMessages"
        @current-change="loadMessages"
      />
    </div>
  </div>
</template>

<script setup>
import { ChatDotRound, Refresh, Reading } from '@element-plus/icons-vue'
import { useMessageCenter } from '@/assets/js/teacher/message-center.js'

const {
  loading,
  messages,
  unreadCount,
  filterStatus,
  currentPage,
  pageSize,
  total,
  loadMessages,
  markRead,
  deleteMsg,
  formatDate
} = useMessageCenter()
</script>

<style scoped>
@import '@/assets/css/teacher/message-center.css';
</style>
