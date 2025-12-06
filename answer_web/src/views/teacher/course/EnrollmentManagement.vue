<template>
  <div class="enrollment-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><UserFilled /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">报名管理</h2>
          <p class="page-subtitle">审核和管理学生报名申请</p>
        </div>
      </div>
    </div>

    <!-- 课程选择和统计 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form :inline="true">
            <el-form-item label="选择课程">
              <el-select 
                v-model="selectedCourseId" 
                placeholder="请选择课程" 
                style="width: 300px" 
                @change="loadEnrollments"
                clearable
              >
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.courseName || course.name"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="12">
          <div class="stats-row">
            <el-statistic title="待审核" :value="statistics.pending" />
            <el-statistic title="已通过" :value="statistics.approved" />
            <el-statistic title="已拒绝" :value="statistics.rejected" />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 状态筛选 -->
    <el-card class="filter-card" shadow="never" v-if="selectedCourseId">
      <el-radio-group v-model="currentStatus" @change="filterEnrollments">
        <el-radio-button value="all">
          全部 ({{ enrollments.length }})
        </el-radio-button>
        <el-radio-button value="pending">
          <el-icon><Clock /></el-icon>
          待审核 ({{ statistics.pending }})
        </el-radio-button>
        <el-radio-button value="approved">
          <el-icon><CircleCheck /></el-icon>
          已通过 ({{ statistics.approved }})
        </el-radio-button>
        <el-radio-button value="rejected">
          <el-icon><CircleClose /></el-icon>
          已拒绝 ({{ statistics.rejected }})
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 报名列表 -->
    <div v-loading="loading" class="enrollment-list">
      <el-empty v-if="!selectedCourseId" description="请先选择课程" :image-size="200" />
      <el-empty v-else-if="filteredEnrollments.length === 0 && !loading" description="暂无报名记录" :image-size="200" />
      
      <el-card 
        v-else
        v-for="enrollment in paginatedEnrollments" 
        :key="enrollment.id"
        class="enrollment-card"
        shadow="hover"
      >
        <div class="enrollment-header">
          <div class="student-info">
            <el-avatar :size="50" :src="enrollment.studentAvatar">
              {{ enrollment.studentName?.charAt(0) || 'S' }}
            </el-avatar>
            <div class="student-details">
              <h3 class="student-name">{{ enrollment.studentName }}</h3>
              <div class="student-meta">
                <span><el-icon><User /></el-icon> 学号：{{ enrollment.studentId }}</span>
                <span v-if="enrollment.studentEmail">
                  <el-icon><Message /></el-icon> {{ enrollment.studentEmail }}
                </span>
              </div>
            </div>
          </div>
          <div class="enrollment-status">
            <el-tag 
              :type="getStatusType(enrollment.status)" 
              size="large"
              effect="dark"
            >
              {{ getStatusText(enrollment.status) }}
            </el-tag>
          </div>
        </div>

        <div class="enrollment-info">
          <div class="info-item">
            <span class="info-label">申请时间：</span>
            <span class="info-value">{{ formatDate(enrollment.applyTime) }}</span>
          </div>
          <div class="info-item" v-if="enrollment.reviewTime">
            <span class="info-label">审核时间：</span>
            <span class="info-value">{{ formatDate(enrollment.reviewTime) }}</span>
          </div>
          <div class="info-item" v-if="enrollment.rejectReason">
            <span class="info-label">拒绝原因：</span>
            <span class="info-value reject-reason">{{ enrollment.rejectReason }}</span>
          </div>
        </div>

        <div class="enrollment-actions" v-if="enrollment.status === 'pending'">
          <el-button 
            type="success" 
            @click="handleApprove(enrollment)"
            :loading="enrollment.approving"
          >
            <el-icon><CircleCheck /></el-icon>
            通过
          </el-button>
          <el-button 
            type="danger" 
            @click="handleReject(enrollment)"
            :loading="enrollment.rejecting"
          >
            <el-icon><CircleClose /></el-icon>
            拒绝
          </el-button>
        </div>
      </el-card>

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
  </div>
</template>

<script setup>
import { 
  UserFilled, User, Message, Clock, CircleCheck, CircleClose 
} from '@element-plus/icons-vue'
import { useEnrollmentManagement } from '@/assets/js/teacher/enrollment-management.js'

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
  filterEnrollments,
  handlePageChange,
  handleSizeChange,
  handleApprove,
  handleReject,
  submitReject,
  getStatusType,
  getStatusText,
  formatDate
} = useEnrollmentManagement()
</script>

<style scoped>
@import '@/assets/css/teacher/enrollment-management.css';
</style>
