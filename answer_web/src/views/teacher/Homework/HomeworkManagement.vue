<template>
  <div class="homework-management modern-page">
    <!-- 页面头部 -->


    <!-- 筛选和搜索 -->
    <div class="filter-section glass-panel animate-slide-up">
      <el-form :inline="true" class="glass-form">
        <el-form-item label="课程">
          <el-select v-model="filterForm.courseId" placeholder="选择课程" class="glass-select" @change="loadHomeworks">
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
          <el-select v-model="filterForm.status" placeholder="选择状态" class="glass-select" @change="loadHomeworks">
            <el-option label="全部" value="" />
            <el-option label="进行中" :value="1" />
            <el-option label="已截止" :value="2" />
            <el-option label="草稿" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索作业标题"
            class="glass-input"
            clearable
            @keyup.enter="loadHomeworks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button class="glass-btn" @click="loadHomeworks">搜索</el-button>
        </el-form-item>
        <el-form-item>
          <el-button class="glass-btn primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon> 发布作业
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 作业列表 -->
    <div v-loading="loading" class="content-list animate-slide-up" style="animation-delay: 0.1s">
      <div v-if="homeworks.length === 0" class="empty-state glass-panel">
        <el-empty description="暂无作业，点击上方发布作业" :image-size="200" />
      </div>
      
      <div
        v-for="homework in homeworks"
        :key="homework.id"
        class="list-card glass-panel"
      >
        <div class="card-header">
          <div class="title-section">
            <h3 class="card-title">{{ homework.title }}</h3>
            <el-tag :type="getStatusType(homework.status)" effect="dark" round size="small">
              {{ getStatusText(homework.status) }}
            </el-tag>
          </div>
          <div class="card-actions">
            <el-button link type="primary" @click="viewHomework(homework)">详情</el-button>
            <el-button link type="primary" @click="gradeHomework(homework)">批改</el-button>
            <el-button link type="warning" @click="editHomework(homework)">编辑</el-button>
            <el-button link type="danger" @click="deleteHomeworkItem(homework)">删除</el-button>
          </div>
        </div>

        <div class="card-content">
          <div class="info-row">
            <div class="info-item">
              <el-icon><Reading /></el-icon>
              <span>{{ homework.courseName }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>截止: {{ formatDate(homework.deadline) }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>提交: {{ homework.submittedCount || 0 }}/{{ homework.totalStudents || 0 }}</span>
            </div>
          </div>
          <p class="description-text">
            {{ homework.description || '暂无描述' }}
          </p>
          <div class="progress-bar">
             <el-progress 
               :percentage="getSubmitProgress(homework)" 
               :color="getProgressColor(homework)"
               :stroke-width="6"
             />
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑作业对话框 (保持 Element Plus Dialog 但加点样式) -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑作业' : '发布作业'"
      width="700px"
      :close-on-click-modal="false"
      class="glass-dialog"
    >
      <el-form ref="formRef" :model="homeworkForm" :rules="rules" label-width="100px">
        <el-form-item label="题目名称" prop="title">
          <el-input v-model="homeworkForm.title" placeholder="请输入题目名称 (如: 实验一 进程调度算法)" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="homeworkForm.courseId" placeholder="选择作业所属课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="题目要求" prop="description">
          <div class="description-header">
            <el-button link type="primary" @click="openQuestionBank">
              <el-icon><List /></el-icon> 从题库导入题目
            </el-button>
          </div>
          <el-input
            v-model="homeworkForm.description"
            type="textarea"
            :rows="6"
            placeholder="请输入题目详细要求、实验步骤或内容描述..."
            maxlength="1000"
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
              <div class="el-upload__tip">支持上传内容补充文件 (可选)</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button @click="saveAsDraft" :loading="submitting">保存草稿</el-button>
          <el-button type="primary" @click="submitHomework" :loading="submitting">发布作业</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 题目选择对话框 -->
    <el-dialog
      v-model="bankDialogVisible"
      title="从题库选择题目"
      width="850px"
      append-to-body
      class="glass-dialog"
    >
      <div class="bank-search">
        <el-input v-model="bankSearchKeyword" placeholder="搜索题目内容..." @keyup.enter="searchBank">
          <template #append>
            <el-button @click="searchBank"><el-icon><Search /></el-icon></el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="bankQuestions" v-loading="bankLoading" height="400px" @selection-change="handleBankSelection">
        <el-table-column type="selection" width="55" />
        <el-table-column label="题目内容" min-width="400">
          <template #default="{row}">
            <div class="question-preview">{{ row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{row}">
            <el-tag size="small">{{ getQuestionTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="100">
          <template #default="{row}">
            <el-rate v-model="row.difficulty" disabled />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <span class="selected-count">已选 {{ selectedQuestions.length }} 题</span>
          <el-button @click="bankDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImportQuestions" :disabled="selectedQuestions.length === 0">确认导入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  Plus, Document, Search, Reading, Calendar, User, Check, List
} from '@element-plus/icons-vue'
import { useHomeworkManagement } from '@/assets/js/teacher/homework-management.js'
import '@/assets/css/teacher/modern-theme.css'

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
  bankDialogVisible,
  bankLoading,
  bankQuestions,
  bankSearchKeyword,
  selectedQuestions,
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
  getProgressColor,
  openQuestionBank,
  searchBank,
  handleBankSelection,
  confirmImportQuestions,
  getQuestionTypeText
} = useHomeworkManagement()
</script>

<style scoped>
.description-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}
.bank-search {
  margin-bottom: 16px;
}
.question-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.selected-count {
  margin-right: 20px;
  color: #606266;
  font-size: 14px;
}
/* Existing styles... */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title { font-size: 24px; font-weight: 800; color: #1f2937; margin: 0; }
.page-subtitle { color: #6b7280; font-size: 14px; margin: 4px 0 0; }

.filter-section {
  padding: 20px;
  margin-bottom: 24px;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-card {
  padding: 20px;
  transition: all 0.3s;
}
.list-card:hover { transform: translateY(-3px); }

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

.info-row {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  color: #6b7280;
  font-size: 13px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.description-text {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.progress-bar {
  max-width: 300px;
}
</style>
