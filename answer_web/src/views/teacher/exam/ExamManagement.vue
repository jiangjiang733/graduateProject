<template>
  <div class="exam-management modern-page">
    <!-- 页面头部 -->
    <div class="page-header animate-fade-in">
      <div class="header-actions">
        <!-- 统计或额外操作 -->
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section glass-panel animate-slide-up">
      <div class="filter-container">
        <div class="filter-left">
           <div class="filter-item">
             <span class="filter-label">课程</span>
             <el-select 
               v-model="filterForm.courseId" 
               placeholder="全部课程" 
               class="glass-select stylish-select" 
               @change="loadExams"
               clearable
             >
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.courseName || course.name"
                :value="course.id"
              />
             </el-select>
           </div>
           <div class="filter-item">
             <span class="filter-label">状态</span>
             <el-select 
               v-model="filterForm.status" 
               placeholder="全部状态" 
               class="glass-select stylish-select" 
               @change="loadExams"
               clearable
             >
              <el-option label="草稿" value="DRAFT" />
              <el-option label="已发布" value="PUBLISHED" />
              <el-option label="进行中" value="ONGOING" />
              <el-option label="已结束" value="ENDED" />
             </el-select>
           </div>
        </div>
        
        <div class="filter-right">
          <div class="search-box">
             <el-input
              v-model="filterForm.keyword"
              placeholder="搜索..."
              class="glass-input stylish-input"
              clearable
              @keyup.enter="loadExams"
            >
              <template #prefix>
                <el-icon class="search-icon"><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <el-button class="glass-btn primary search-btn" @click="loadExams">
             搜索
          </el-button>
          <el-button class="glass-btn create-btn" type="primary" @click="showCreateDialog">
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.filter-section {
  padding: 16px 24px;
  margin-bottom: 24px;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-left, .filter-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}


:deep(.stylish-select .el-input__wrapper),
:deep(.stylish-input .el-input__wrapper) {
  background-color: rgba(243, 244, 246, 0.8) !important;
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.3s;
  border-radius: 8px;
  padding: 4px 12px;
}

:deep(.stylish-select .el-input__wrapper:hover),
:deep(.stylish-input .el-input__wrapper:hover) {
  background-color: white !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
}

:deep(.stylish-select .el-input__wrapper.is-focus),
:deep(.stylish-input .el-input__wrapper.is-focus) {
  background-color: white !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important; /* Soft Emerald */
  border-color: rgba(16, 185, 129, 0.5);
}

.search-box {
  width: 260px;
}

.create-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  padding: 10px 20px;
  font-weight: 600;
  transition: transform 0.2s;
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.create-btn :deep(.el-icon) {
  margin-right: 4px;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-card {
  padding: 20px;
  transition: all 0.3s;
  border: 1px solid rgba(255,255,255,0.5);
}
.list-card:hover { 
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title { font-size: 18px; font-weight: 700; color: #374151; margin: 0; }

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  color: #6b7280;
  font-size: 13px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Utilities */
.animate-slide-up { animation: slideUp 0.5s ease-out forwards; opacity: 0; transform: translateY(20px); }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
</style>
