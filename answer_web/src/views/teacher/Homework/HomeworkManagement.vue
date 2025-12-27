<template>
  <div class="homework-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">作业管理</h2>
          <p class="page-subtitle">发布作业、批改作业、查看统计</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="showCreateDialog" class="create-btn">
        <el-icon><Plus /></el-icon>
        发布作业
      </el-button>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="课程">
          <el-select v-model="filterForm.courseId" placeholder="选择课程" style="width: 200px" @change="loadHomeworks">
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
          <el-select v-model="filterForm.status" placeholder="选择状态" style="width: 150px" @change="loadHomeworks">
            <el-option label="全部" value="" />
            <el-option label="进行中" value="ONGOING" />
            <el-option label="已截止" value="CLOSED" />
            <el-option label="草稿" value="DRAFT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索作业标题"
            style="width: 250px"
            clearable
            @keyup.enter="loadHomeworks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadHomeworks">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 作业列表 -->
    <div v-loading="loading" class="homework-list">
      <el-empty v-if="homeworks.length === 0" description="暂无作业，点击右上角发布作业" :image-size="200" />
      
      <el-card
        v-for="homework in homeworks"
        :key="homework.id"
        class="homework-card"
        shadow="hover"
      >
        <div class="homework-header">
          <div class="homework-title-section">
            <h3 class="homework-title">{{ homework.title }}</h3>
            <el-tag :type="getStatusType(homework.status)" size="small">
              {{ getStatusText(homework.status) }}
            </el-tag>
          </div>
          <div class="homework-actions">
            <el-button size="small" @click="viewHomework(homework)">查看详情</el-button>
            <el-button size="small" type="primary" @click="gradeHomework(homework)">批改作业</el-button>
            <el-button size="small" @click="editHomework(homework)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteHomeworkItem(homework)">删除</el-button>
          </div>
        </div>

        <div class="homework-content">
          <div class="homework-info">
            <div class="info-item">
              <el-icon><Reading /></el-icon>
              <span>课程：{{ homework.courseName }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>截止时间：{{ formatDate(homework.deadline) }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>提交：{{ homework.submittedCount || 0 }} / {{ homework.totalStudents || 0 }}</span>
            </div>
            <div class="info-item">
              <el-icon><Check /></el-icon>
              <span>已批改：{{ homework.gradedCount || 0 }}</span>
            </div>
          </div>
          <div class="homework-description">
            {{ homework.description || '暂无描述' }}
          </div>
        </div>

        <div class="homework-footer">
          <div class="progress-section">
            <span class="progress-label">提交进度</span>
            <el-progress
              :percentage="getSubmitProgress(homework)"
              :color="getProgressColor(homework)"
              :stroke-width="8"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑作业对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑作业' : '发布作业'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="homeworkForm" :rules="rules" label-width="100px">
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="homeworkForm.courseId" placeholder="选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="作业描述" prop="description">
          <el-input
            v-model="homeworkForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入作业描述和要求"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="homeworkForm.deadline"
            type="datetime"
            placeholder="选择截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="homeworkForm.totalScore" :min="1" :max="100" />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="5"
          >
            <el-button size="small">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持上传最多5个文件，每个文件不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="saveAsDraft" :loading="submitting">保存草稿</el-button>
        <el-button type="primary" @click="submitHomework" :loading="submitting">发布作业</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  Plus,
  Document,
  Search,
  Reading,
  Calendar,
  User,
  Check
} from '@element-plus/icons-vue'
import { useHomeworkManagement } from '@/assets/js/teacher/homework-management.js'

const {
  loading,
  dialogVisible,
  isEdit,
  submitting,
  formRef,
  courses,
  homeworks,
  filterForm,
  homeworkForm,
  fileList,
  rules,
  loadHomeworks,
  showCreateDialog,
  handleFileChange,
  saveAsDraft,
  submitHomework,
  viewHomework,
  gradeHomework,
  editHomework,
  deleteHomeworkItem,
  getStatusType,
  getStatusText,
  formatDate,
  getSubmitProgress,
  getProgressColor
} = useHomeworkManagement()
</script>

<style scoped>
/* @import '@/assets/css/teacher/homework-management.css'; */
</style>
