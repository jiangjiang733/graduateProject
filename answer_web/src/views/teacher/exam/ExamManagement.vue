<template>
  <div class="exam-management modern-page">
    <!-- 页面头部 -->
    <div class="page-header animate-fade-in">
      <div class="header-actions">
        <!-- 统计或额外操作 -->
      </div>
    </div>

    <!-- 筛选和搜索控制栏 -->
    <div class="filter-section animate-slide-up">
      <div class="glass-panel filter-wrapper">
        <div class="filter-left">
          <div class="filter-group">
            <div class="filter-item">
              <label>关联课程</label>
              <el-select 
                v-model="filterForm.courseId" 
                placeholder="选择课程" 
                class="premium-select" 
                @change="loadExams"
                clearable
              >
                <template #prefix>
                  <el-icon><Reading /></el-icon>
                </template>
                <el-option label="全部课程" value="" />
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.courseName || course.name"
                  :value="course.id"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <label>考试状态</label>
              <el-select 
                v-model="filterForm.status" 
                placeholder="全部状态" 
                class="premium-select" 
                @change="loadExams"
                clearable
              >
                <template #prefix>
                  <el-icon><Clock /></el-icon>
                </template>
                <el-option label="全部状态" value="" />
                <el-option label="草稿" value="DRAFT" />
                <el-option label="已发布" value="PUBLISHED" />
                <el-option label="进行中" value="ONGOING" />
                <el-option label="已结束" value="ENDED" />
              </el-select>
            </div>
          </div>
        </div>
        
        <div class="filter-right">
          <div class="search-group">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索考试标题或内容..."
              class="premium-search"
              clearable
              @keyup.enter="loadExams"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button class="search-btn" @click="loadExams" type="primary">
              搜索
            </el-button>
          </div>
          <div class="divider"></div>
          <el-button class="create-btn" type="success" @click="showCreateDialog">
            <el-icon><Plus /></el-icon> 创建考试
          </el-button>
        </div>
      </div>
    </div>

    <!-- 考试列表 -->
    <div v-loading="loading" class="content-list animate-slide-up" style="animation-delay: 0.1s">
      <div v-if="exams.length === 0" class="empty-state glass-panel">
        <el-empty description="暂无考试数据" :image-size="200" />
      </div>

      <div
        v-for="exam in exams"
        :key="exam.examId"
        class="list-card glass-panel"
      >
        <div class="card-header">
          <div class="title-section">
            <h3 class="card-title">{{ exam.examTitle }}</h3>
            <el-tag :type="getStatusType(exam.statusText || exam.status)" effect="dark" round size="small">
              {{ getStatusText(exam.statusText || exam.status) }}
            </el-tag>
          </div>
          <div class="card-actions">
             <el-button link type="primary" @click="viewExam(exam)">详情</el-button>
             <el-button link type="success" @click="viewScores(exam)">成绩</el-button>
             <el-button link type="primary" @click="manageQuestions(exam)">试题</el-button>
             <template v-if="exam.status === 'DRAFT'">
               <el-button link type="warning" @click="editExam(exam)">编辑</el-button>
               <el-button link type="primary" @click="publishExam(exam)">发布</el-button>
             </template>
             <el-button link type="danger" @click="deleteExam(exam)">删除</el-button>
          </div>
        </div>

        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <el-icon><Reading /></el-icon>
              <span>{{ exam.courseName }}</span>
            </div>
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span>{{ exam.duration }} 分钟</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(exam.startTime) }} - {{ formatDate(exam.endTime) }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>参考: {{ exam.submittedCount || 0 }}/{{ exam.totalStudents || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑考试对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑考试' : '创建考试'"
      width="700px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <el-form ref="formRef" :model="examForm" :rules="rules" label-width="100px">
        <el-form-item label="考试标题" prop="examTitle">
          <el-input v-model="examForm.examTitle" placeholder="请输入考试标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="examForm.courseId" placeholder="选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="考试时间" prop="timeRange">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="考试时长" prop="duration">
          <el-input-number v-model="examForm.duration" :min="10" :max="300" />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>

        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="examForm.totalScore" :min="1" :max="100" />
        </el-form-item>

        <el-form-item label="及格分" prop="passScore">
          <el-input-number v-model="examForm.passScore" :min="0" :max="100" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button @click="saveAsDraft" :loading="submitting">保存草稿</el-button>
          <el-button type="primary" @click="submitExam" :loading="submitting">创建并发布</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  Plus, Edit, Search, Reading, Clock, Calendar, User
} from '@element-plus/icons-vue'
import { useExamManagement } from '@/assets/js/teacher/exam-management.js'
import '@/assets/css/teacher/modern-theme.css'

const {
  loading,
  dialogVisible,
  isEdit,
  submitting,
  formRef,
  courses,
  exams,
  timeRange,
  filterForm,
  examForm,
  rules,
  loadExams,
  showCreateDialog,
  saveAsDraft,
  submitExam,
  viewExam,
  manageQuestions,
  viewScores,
  editExam,
  publishExam,
  deleteExam,
  getStatusType,
  getStatusText,
  formatDate
} = useExamManagement()
</script>

<style scoped>
.exam-management {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.filter-section {
  margin-bottom: 32px;
}

.filter-wrapper {
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
}

.filter-left {
  flex: 1;
}

.filter-group {
  display: flex;
  gap: 24px;
  align-items: center;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 2px;
}

/* Premium Inputs & Selects */
:deep(.premium-select) {
  width: 180px;
}

:deep(.premium-select .el-input__wrapper),
:deep(.premium-search .el-input__wrapper) {
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 8px 16px;
  transition: all 0.3s;
}

:deep(.premium-select .el-input__wrapper:hover),
:deep(.premium-search .el-input__wrapper:hover) {
  background-color: #e2e8f0 !important;
}

:deep(.premium-select .el-input__wrapper.is-focus),
:deep(.premium-search .el-input__wrapper.is-focus) {
  background-color: white !important;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-group {
  display: flex;
  gap: 8px;
}

.premium-search {
  width: 300px;
}

.search-btn {
  border-radius: 12px;
  padding: 0 24px;
  font-weight: 600;
  background: #1f2937;
  border: none;
}

.search-btn:hover {
  background: #111827;
}

.divider {
  width: 1px;
  height: 32px;
  background: #e2e8f0;
}

.create-btn {
  border-radius: 12px;
  padding: 0 24px;
  height: 42px;
  font-weight: 700;
  background: #10b981;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
}

.create-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
}

.content-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 24px;
}

.list-card {
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  border: 1px solid #f1f5f9;
}

.list-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: #10b981;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 14px;
}

.info-item .el-icon {
  font-size: 18px;
  color: #94a3b8;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 80px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
}

/* Utilities */
.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .filter-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-right {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-right {
    flex-direction: column;
    align-items: stretch;
  }
  .search-group {
    flex-direction: column;
  }
  .premium-search, .premium-select {
    width: 100%;
  }
}
</style>
