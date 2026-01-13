<template>
  <div class="course-invitations modern-page">
    <!-- 头部 -->
    <div class="page-header animate-fade-in">
      <h2>课程邀请</h2>
      <div class="header-actions">
        <el-button class="glass-btn" @click="loadInvitations">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-overview animate-slide-up">
      <div class="stat-card glass-panel" :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'">
        <div class="stat-icon bg-amber-100 text-amber-600">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card glass-panel" :class="{ active: currentTab === 'approved' }" @click="currentTab = 'approved'">
        <div class="stat-icon bg-emerald-100 text-emerald-600">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ approvedCount }}</div>
          <div class="stat-label">已接受</div>
        </div>
      </div>
      <div class="stat-card glass-panel" :class="{ active: currentTab === 'rejected' }" @click="currentTab = 'rejected'">
        <div class="stat-icon bg-red-100 text-red-600">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ rejectedCount }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </div>
    </div>

    <!-- 邀请列表 -->
    <div v-loading="loading" class="invitations-container glass-panel animate-slide-up">
      <el-empty v-if="filteredInvitations.length === 0 && !loading" description="暂无邀请记录" :image-size="120" />
      
      <div v-else class="invitations-grid">
        <div v-for="invitation in filteredInvitations" :key="invitation.id" class="invitation-card">
          <div class="card-header">
            <div class="course-info">
              <h3 class="course-name">{{ invitation.courseName }}</h3>
              <div class="invitation-meta">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatTimeAgo(invitation.applyTime) }}</span>
              </div>
            </div>
            <el-tag :type="getStatusType(invitation.status)" effect="light" round>
              {{ getStatusText(invitation.status) }}
            </el-tag>
          </div>

          <div class="card-body">
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>邀请教师：{{ invitation.teacherName || '未知' }}</span>
            </div>
            <div v-if="invitation.rejectReason" class="reject-reason">
              拒绝原因：{{ invitation.rejectReason }}
            </div>
          </div>

          <div class="card-actions" v-if="invitation.status === 'pending'">
            <el-button type="success" @click="handleAccept(invitation)" :loading="invitation.accepting">
              <el-icon><Check /></el-icon> 接受邀请
            </el-button>
            <el-button type="danger" plain @click="showRejectDialog(invitation)" :loading="invitation.rejecting">
              <el-icon><Close /></el-icon> 拒绝
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝课程邀请" width="500px">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="课程名称">
          <el-input v-model="currentInvitation.courseName" disabled />
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :loading="submitting">
          确定拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Clock, Check, Close, Refresh, Calendar, User } from '@element-plus/icons-vue'
import { useCourseInvitations } from '@/assets/js/student/course-invitations.js'

const {
  loading,
  submitting,
  rejectDialogVisible,
  rejectFormRef,
  currentTab,
  invitations,
  currentInvitation,
  rejectForm,
  rejectRules,
  pendingCount,
  approvedCount,
  rejectedCount,
  filteredInvitations,
  loadInvitations,
  handleAccept,
  showRejectDialog,
  handleReject,
  getStatusType,
  getStatusText,
  formatTimeAgo
} = useCourseInvitations()
</script>

<style scoped>
@import '@/assets/css/student/course-invitations.css';
</style>

