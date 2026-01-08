<template>
  <div class="enrollment-management modern-page">
    <!-- 头部区域 -->
    <div class="page-header animate-fade-in">
      <div class="header-actions">
        <!-- 课程选择 -->
        <el-select 
          v-model="selectedCourseId" 
          placeholder="全部课程" 
          class="course-select glass-select"
          size="large"
          @change="loadEnrollments"
          clearable
        >
          <el-option label="全部课程" :value="''" />
          <el-option
            v-for="course in courses"
            :key="course.id"
            :label="course.courseName || course.name"
            :value="course.id"
          />
        </el-select>
        <el-button class="glass-btn primary-glass-btn" @click="inviteDialogVisible = true">
           <el-icon><Plus /></el-icon> 邀请学生
        </el-button>
        <el-button class="glass-btn" @click="loadEnrollments">
           <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview animate-slide-up">
       <div class="stat-card glass-panel" :class="{ active: currentStatus === 'pending' }" @click="currentStatus = 'pending'">
          <div class="stat-icon bg-amber-100 text-amber-600">
             <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
             <div class="stat-value">{{ statistics.pending }}</div>
             <div class="stat-label">待审核</div>
          </div>
       </div>
       <div class="stat-card glass-panel" :class="{ active: currentStatus === 'approved' }" @click="currentStatus = 'approved'">
          <div class="stat-icon bg-emerald-100 text-emerald-600">
             <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
             <div class="stat-value">{{ statistics.approved }}</div>
             <div class="stat-label">已通过</div>
          </div>
       </div>
       <div class="stat-card glass-panel" :class="{ active: currentStatus === 'rejected' }" @click="currentStatus = 'rejected'">
          <div class="stat-icon bg-red-100 text-red-600">
             <el-icon><Close /></el-icon>
          </div>
          <div class="stat-info">
             <div class="stat-value">{{ statistics.rejected }}</div>
             <div class="stat-label">已拒绝</div>
          </div>
       </div>
       <div class="stat-card glass-panel" :class="{ active: currentStatus === 'all' }" @click="currentStatus = 'all'">
          <div class="stat-icon bg-blue-100 text-blue-600">
             <el-icon><List /></el-icon>
          </div>
          <div class="stat-info">
             <div class="stat-value">{{ enrollments.length }}</div>
             <div class="stat-label">全部申请</div>
          </div>
       </div>
    </div>

    <!-- 报名列表 -->
    <div v-loading="loading" class="enrollment-list-container glass-panel animate-slide-up" style="animation-delay: 0.1s">
      <!-- 列表头部 -->
      <div class="list-header">
         <h3>申请列表</h3>
         <div class="list-filters">
            <el-input 
               v-model="searchKeyword" 
               placeholder="搜索学生姓名/课程..." 
               prefix-icon="Search"
               class="glass-input-small"
            />
         </div>
      </div>

      <el-empty v-if="paginatedEnrollments.length === 0 && !loading" description="暂无相关记录" :image-size="120" />
      
      <div v-else class="enrollment-grid">
         <div 
           v-for="enrollment in paginatedEnrollments" 
           :key="enrollment.id"
           class="student-card"
         >
            <div class="card-header">
               <div class="student-avatar-box">
                  <el-avatar :size="48" :src="enrollment.studentAvatar" class="student-avatar">
                     {{ enrollment.studentName?.charAt(0) || 'S' }}
                  </el-avatar>
                  <div class="status-dot" :class="enrollment.status"></div>
               </div>
               <div class="student-main-info">
                  <div class="student-name">{{ enrollment.studentName }}</div>
                  <div class="student-id">ID: {{ enrollment.studentId }}</div>
               </div>
            </div>
            
            <div class="card-body">
               <div class="info-row">
                  <el-icon><Reading /></el-icon>
                  <span class="course-name" :title="enrollment.courseName">申请课程：{{ enrollment.courseName }}</span>
               </div>
               <div class="info-row">
                  <el-icon><Time /></el-icon>
                  <span>{{ formatTimeAgo(enrollment.applyTime) }}</span>
               </div>
               <div class="reject-reason-box" v-if="enrollment.status === 'rejected'">
                  拒绝原因: {{ enrollment.rejectReason }}
               </div>
            </div>

            <div class="card-actions" v-if="enrollment.status === 'pending'">
               <el-button 
                 class="action-btn pass" 
                 :loading="enrollment.approving"
                 @click="handleApprove(enrollment)"
               >
                 通过
               </el-button>
               <el-button 
                 class="action-btn reject" 
                 :loading="enrollment.rejecting"
                 @click="handleReject(enrollment)"
               >
                 拒绝
               </el-button>
            </div>
            <div class="card-status-badge" v-else>
               <el-tag :type="getStatusType(enrollment.status)" effect="light" round>
                  {{ getStatusText(enrollment.status) }}
               </el-tag>
               <el-button 
                 v-if="enrollment.status === 'approved'" 
                 type="danger" 
                 link 
                 size="small" 
                 @click="handleRemoveStudent(enrollment)"
                 style="margin-left: 8px"
               >
                 <el-icon><Delete /></el-icon> 移除
               </el-button>
            </div>
         </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredEnrollments.length > pageSize" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredEnrollments.length"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝报名申请"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="学生姓名">
          <el-input v-model="currentEnrollment.studentName" disabled />
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject" :loading="submitting">
          确定拒绝
        </el-button>
      </template>
    </el-dialog>
    <!-- 邀请学生对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请学生加入课程" width="500px">
      <el-form :model="inviteForm" :rules="inviteRules" ref="inviteFormRef" label-width="100px">
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="inviteForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生账户" prop="studentId">
          <el-input v-model="inviteForm.studentId" placeholder="请输入学生的用户名或 ID 账户" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInvite" :loading="inviteSubmitting">
          确定邀请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { 
  UserFilled, User, Message, Clock, CircleCheck, CircleClose,
  Refresh, Check, Close, List, Search, Reading, Timer as Time, Plus, Delete
} from '@element-plus/icons-vue'
import { useEnrollmentManagement } from '@/assets/js/teacher/enrollment-management.js'
import '@/assets/css/teacher/modern-theme.css'

const {
  loading,
  submitting,
  rejectDialogVisible,
  courses,
  enrollments,
  filteredEnrollments,
  paginatedEnrollments,
  selectedCourseId,
  currentStatus,
  currentPage,
  pageSize,
  statistics,
  currentEnrollment,
  rejectForm,
  rejectRules,
  rejectFormRef,
  loadEnrollments,
  handlePageChange,
  handleSizeChange,
  handleApprove,
  handleReject,
  submitReject,
  getStatusType,
  getStatusText,
  formatDate,
  searchKeyword,
  formatTimeAgo,
  // 补全缺失的导出变量
  inviteDialogVisible,
  inviteForm,
  inviteRules,
  inviteFormRef,
  inviteSubmitting,
  submitInvite,
  handleRemoveStudent,
  getStudentAvatar,
  getStudentInitial
} = useEnrollmentManagement()
</script>

<style scoped>
@import '@/assets/css/teacher/enrollment-management.css';
</style>
