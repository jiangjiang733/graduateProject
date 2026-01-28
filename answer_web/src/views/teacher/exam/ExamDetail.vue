<template>
  <div class="exam-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>{{ exam.examTitle }}</h2>
      <div class="header-actions">
        <el-button type="success" @click="viewScores">查看成绩</el-button>
        <el-button v-if="exam.status === 0 || String(exam.status).toUpperCase() === 'DRAFT'" type="primary" @click="publishExam">发布考试</el-button>
        <el-button v-if="exam.status === 1 || String(exam.status).toUpperCase() === 'PUBLISHED'" type="warning" @click="unpublishExam">取消发布</el-button>
        <el-button @click="editExam">编辑考试</el-button>
        <el-button type="danger" @click="deleteExam">删除考试</el-button>
      </div>
    </div>

    <!-- 考试信息卡片 -->
    <el-card class="exam-info-card" v-loading="loading">
      <template #header>
        <span>考试信息</span>
        <el-tag :type="getStatusType(exam.status)" style="margin-left: 10px">
          {{ getStatusText(exam.status) }}
        </el-tag>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="考试标题">{{ exam.examTitle }}</el-descriptions-item>
        <el-descriptions-item label="所属课程">{{ exam.courseName }}</el-descriptions-item>
        <el-descriptions-item label="考试时长">{{ exam.duration }} 分钟</el-descriptions-item>
        <el-descriptions-item label="总分">{{ exam.totalScore }} 分</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ exam.passScore }} 分</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDate(exam.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDate(exam.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="参考人数">
          {{ exam.submittedCount || 0 }} / {{ exam.totalStudents || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="考试说明" :span="2">
          {{ exam.examDescription || '暂无说明' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 试题列表 -->
    <el-card class="questions-card">
      <template #header>
        <div class="card-header">
          <span>试题列表（共 {{ questions.length }} 题）</span>
          <el-button type="primary" size="small" @click="manageQuestions">管理试题</el-button>
        </div>
      </template>
      
      <div v-if="questions.length === 0" class="empty-state">
        <el-empty description="暂无试题">
          <el-button type="primary" @click="manageQuestions">添加试题</el-button>
        </el-empty>
      </div>
      
      <div v-else class="questions-list">
        <div 
          v-for="(question, index) in questions" 
          :key="question.questionId"
          class="question-item"
        >
          <div class="question-header">
            <span class="question-number">第 {{ index + 1 }} 题</span>
            <el-tag :type="getQuestionTypeColor(question.questionType)" size="small">
              {{ getQuestionTypeName(question.questionType) }}
            </el-tag>
            <span class="question-score">{{ question.score }} 分</span>
          </div>
          
          <div class="question-content">
            <p class="question-text">{{ formatQuestionContent(question) }}</p>
            
            <div v-if="question.questionOptions" class="question-options">
              <div 
                v-for="(option, optIndex) in parseOptions(question.questionOptions)" 
                :key="optIndex"
                class="option-item"
              >
                <span class="opt-prefix">{{ String.fromCharCode(65 + optIndex) }}.</span>
                {{ typeof option === 'object' ? option.text : option }}
              </div>
            </div>
            
            <div class="question-answer" :class="{ 'is-multi': ['SINGLE', 'MULTIPLE'].includes(question.questionType) }">
              <strong>正确答案：</strong>
              <span class="correct-answer">{{ formatAnswer(question) }}</span>
            </div>
            
            <div v-if="question.analysis" class="question-analysis">
              <strong>解析：</strong>{{ question.analysis }}
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 编辑考试对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑考试"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="考试标题" prop="examTitle">
          <el-input v-model="editForm.examTitle" placeholder="请输入考试标题" maxlength="100" show-word-limit />
        </el-form-item>
        
        <el-form-item label="考试时间" prop="timeRange">
          <el-date-picker
            v-model="editForm.timeRange"
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
          <el-input-number v-model="editForm.duration" :min="10" :max="300" />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>
        
        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="editForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        
        <el-form-item label="及格分">
          <el-input-number :model-value="calculatedPassScore" disabled />
          <span style="margin-left: 8px; color: #909399;">（自动计算为总分的60%）</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveExamEdit" :loading="submitting">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useExamDetail } from '@/assets/js/teacher/exam-detail.js'

const router = useRouter()
const route = useRoute()

const {
  loading,
  exam,
  questions,
  unpublishExam,
  goBack,
  editExam,
  publishExam,
  deleteExam,
  parseOptions,
  formatQuestionContent,
  formatAnswer,
  formatDate,
  getStatusType,
  getStatusText,
  getQuestionTypeName,
  getQuestionTypeColor,
  // 编辑考试弹窗相关
  editDialogVisible,
  editForm,
  editFormRef,
  editRules,
  calculatedPassScore,
  saveExamEdit,
  submitting
} = useExamDetail()

// 查看成绩页面
const viewScores = () => {
  router.push(`/teacher/exam/${route.params.id}/scores`)
}

// 管理试题
const manageQuestions = () => {
  router.push(`/teacher/exam/${route.params.id}/questions`)
}
</script>

<style scoped>
@import '@/assets/css/teacher/exam-detail.css';

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Element Plus 组件暗黑模式 */
.dark-theme :deep(.el-card) {
  background: #1e293b;
  border-color: #334155;
}

.dark-theme :deep(.el-card__header) {
  background: #0f172a;
  border-bottom-color: #334155;
  color: #f1f5f9;
}

.dark-theme :deep(.el-descriptions__label) {
  color: #94a3b8;
}

.dark-theme :deep(.el-descriptions__content) {
  color: #f1f5f9;
}

.dark-theme :deep(.el-descriptions__cell) {
  border-color: #334155;
}

.dark-theme :deep(.el-empty__description) {
  color: #94a3b8;
}
</style>
