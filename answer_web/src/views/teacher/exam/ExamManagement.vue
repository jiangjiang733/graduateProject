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
            v-model="examForm.timeRange"
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

        <el-form-item label="及格分 (60%)" prop="passScore">
          <el-input-number v-model="examForm.passScore" disabled />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button @click="saveAsDraft" :loading="submitting">
            {{ isEdit ? '保存修改' : '保存草稿' }}
          </el-button>
          <el-button type="primary" @click="submitExam" :loading="submitting">
            {{ isEdit ? '确定发布' : '确定并发布' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  Plus, Search, Reading, Clock, Calendar, User
} from '@element-plus/icons-vue'
import { useExamManagement } from '@/assets/js/teacher/exam-management'

const {
  loading,
  dialogVisible,
  isEdit,
  submitting,
  formRef,
  courses,
  exams,
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
@import '@/assets/css/teacher/exam-management.css';
</style>
