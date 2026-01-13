<template>
  <div class="homework-detail modern-page">
    <div class="page-header glass-panel animate-slide-up">
      <div class="header-left">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回列表
        </el-button>
        <h1 class="page-title">{{ homework.reportTitle || '作业详情' }}</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" class="glass-btn primary" @click="editHomework">
          <el-icon><Edit /></el-icon> 编辑作业
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-container">
      <div class="left-section">
        <!-- 基本信息卡片 -->
        <div class="detail-card glass-panel animate-slide-up" style="animation-delay: 0.1s">
          <div class="card-title-row">
            <h2 class="section-title">作业要求</h2>
            <el-tag :type="getStatusType(homework.status)" effect="dark" round>
               {{ getStatusText(homework.status) }}
            </el-tag>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">所属课程：</span>
              <span class="value">{{ homework.courseName }}</span>
            </div>
            <div class="info-item">
              <span class="label">截止时间：</span>
              <span class="value">{{ formatDate(homework.deadline) }}</span>
            </div>
            <div class="info-item">
              <span class="label">总分：</span>
              <span class="value">{{ homework.totalScore }} 分</span>
            </div>
          </div>

          <el-divider />

          <div class="description-content">
            <p v-for="(line, index) in descriptionLines" :key="index" :class="{ 'question-header': line.startsWith('【') }">
              {{ line }}
            </p>
          </div>

          <div v-if="homework.attachmentUrl" class="attachment-box">
             <el-icon><Document /></el-icon>
             <span class="file-name">附件已上传</span>
             <el-link :href="`/api/${homework.attachmentUrl}`" target="_blank" type="primary">点击查阅</el-link>
          </div>

          <!-- 结构化题目预览 -->
          <div v-if="questionList?.length > 0" class="questions-preview-section">
            <el-divider><el-icon><List /></el-icon> 试题列表</el-divider>
            <div v-for="(q, index) in questionList" :key="index" class="q-detail-item">
              <div class="q-item-header">
                <span class="q-num">{{ index + 1 }}</span>
                <el-tag size="small" :type="getQuestionTypeTag(q.questionType)">{{ getQuestionTypeText(q.questionType) }}</el-tag>
                <span class="q-score">({{ q.score }}分)</span>
              </div>
              <div class="q-item-content">{{ q.questionContent }}</div>
              
              <!-- 选项列表 -->
              <div v-if="['SINGLE', 'MULTIPLE'].includes(q.questionType)" class="q-item-options">
                <div v-for="(opt, oIdx) in parseOptions(q.questionOptions)" :key="oIdx" class="opt-line" :class="{correct: isCorrect(opt, oIdx, q)}">
                  <span class="opt-label">{{ String.fromCharCode(65+oIdx) }}</span>
                  <span class="opt-text">{{ opt.text || opt }}</span>
                  <el-icon v-if="isCorrect(opt, oIdx, q)" class="correct-icon"><Check /></el-icon>
                </div>
              </div>
              <!-- 判断题 -->
              <div v-else-if="q.questionType === 'JUDGE'" class="q-item-options">
                  <div class="opt-line" :class="{correct: q.correctAnswer === 'A' || q.correctAnswer === '正确' || q.answer === '正确'}">
                    <span class="opt-label">A</span>
                    <span class="opt-text">正确</span>
                    <el-icon v-if="q.correctAnswer === 'A' || q.correctAnswer === '正确' || q.answer === '正确'" class="correct-icon"><Check /></el-icon>
                  </div>
                  <div class="opt-line" :class="{correct: q.correctAnswer === 'B' || q.correctAnswer === '错误' || q.answer === '错误'}">
                    <span class="opt-label">B</span>
                    <span class="opt-text">错误</span>
                    <el-icon v-if="q.correctAnswer === 'B' || q.correctAnswer === '错误' || q.answer === '错误'" class="correct-icon"><Check /></el-icon>
                  </div>
              </div>

              <div class="q-item-analysis" v-if="q.analysis">
                <div class="analysis-label">【解析】</div>
                <div class="analysis-text">{{ q.analysis }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <!-- 统计信息 -->
        <div class="stats-card glass-panel animate-slide-up" style="animation-delay: 0.2s">
          <h2 class="section-title">提交统计</h2>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">{{ homework.submittedCount || 0 }}</div>
              <div class="stat-label">已提交</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">{{ homework.totalStudents || 0 }}</div>
              <div class="stat-label">总人数</div>
            </div>
          </div>
          <div class="progress-wrap">
             <div class="progress-info">
               <span>提交进度</span>
               <span>{{ submitPercentage }}%</span>
             </div>
             <el-progress :percentage="submitPercentage" :show-text="false" stroke-width="12" />
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="actions-card glass-panel animate-slide-up" style="animation-delay: 0.3s">
          <h2 class="section-title">快速操作</h2>
          <div class="action-buttons">
            <el-button class="full-btn" @click="goToGrading">
              <el-icon><Check /></el-icon> 进入批改系统
            </el-button>
            <el-button class="full-btn warning" @click="closeHomework" v-if="homework.status === 1">
              <el-icon><CircleClose /></el-icon> 提前截止作业
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowLeft,
  Edit,
  Document,
  Check,
  CircleClose,
  List
} from '@element-plus/icons-vue'
import { useHomeworkDetail } from '@/assets/js/teacher/homework-detail'

const {
  homework,
  loading,
  descriptionLines,
  submitPercentage,
  getStatusType,
  getStatusText,
  questionList,
  getQuestionTypeText,
  getQuestionTypeTag,
  parseOptions,
  isCorrect,
  formatDate,
  editHomework,
  goToGrading,
  closeHomework
} = useHomeworkDetail()
</script>

<style scoped>
@import '@/assets/css/teacher/homework-detail.css';
</style>
