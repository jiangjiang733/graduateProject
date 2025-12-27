<template>
  <div class="exam-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><Edit /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">考试管理</h2>
          <p class="page-subtitle">创建考试、管理试题、查看成绩</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="showCreateDialog" class="create-btn">
        <el-icon><Plus /></el-icon>
        创建考试
      </el-button>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="课程">
          <el-select v-model="filterForm.courseId" placeholder="选择课程" style="width: 200px" @change="loadExams">
            <el-option label="全部课程" value="" />
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" style="width: 150px" @change="loadExams">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="进行中" value="ONGOING" />
            <el-option label="已结束" value="ENDED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索考试标题"
            style="width: 250px"
            clearable
            @keyup.enter="loadExams"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadExams">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 考试列表 -->
    <div v-loading="loading" class="exam-list">
      <el-empty v-if="exams.length === 0" description="暂无考试，点击右上角创建考试" :image-size="200" />
      
      <el-card
        v-for="exam in exams"
        :key="exam.examId"
        class="exam-card"
        shadow="hover"
      >
        <div class="exam-header">
          <div class="exam-title-section">
            <h3 class="exam-title">{{ exam.examTitle }}</h3>
            <el-tag :type="getStatusType(exam.statusText || exam.status)" size="small">
              {{ getStatusText(exam.statusText || exam.status) }}
            </el-tag>
          </div>
          <div class="exam-actions">
            <el-button size="small" @click="viewExam(exam)">查看详情</el-button>
            <el-button size="small" type="primary" @click="viewScores(exam)">查看成绩</el-button>
            <el-button size="small" @click="editExam(exam)" v-if="exam.status === 'DRAFT'">编辑</el-button>
            <el-button size="small" type="success" @click="publishExam(exam)" v-if="exam.status === 'DRAFT'">发布</el-button>
            <el-button size="small" type="danger" @click="deleteExam(exam)">删除</el-button>
          </div>
        </div>

        <div class="exam-content">
          <div class="exam-info">
            <div class="info-item">
              <el-icon><Reading /></el-icon>
              <span>课程：{{ exam.courseName }}</span>
            </div>
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span>时长：{{ exam.duration }}分钟</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>开始：{{ formatDate(exam.startTime) }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>结束：{{ formatDate(exam.endTime) }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>参考：{{ exam.submittedCount || 0 }} / {{ exam.totalStudents || 0 }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑考试对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑考试' : '创建考试'"
      width="700px"
      :close-on-click-modal="false"
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="saveAsDraft" :loading="submitting">保存草稿</el-button>
        <el-button type="primary" @click="submitExam" :loading="submitting">创建并发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  Plus,
  Edit,
  Search,
  Reading,
  Clock,
  Calendar,
  User
} from '@element-plus/icons-vue'
import { useExamManagement } from '@/assets/js/teacher/exam-management.js'

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
/* @import '@/assets/css/teacher/exam-management.css'; */
</style>
