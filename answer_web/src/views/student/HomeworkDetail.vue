<template>
  <div class="homework-detail">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">作业详情</span>
      </template>
    </el-page-header>

    <el-card v-loading="loading" class="detail-card" shadow="never">
      <!-- 作业基本信息 -->
      <div class="homework-header">
        <h2>{{ homework.reportTitle }}</h2>
        <el-tag :type="getStatusType(submission.status)" size="large">
          {{ getStatusText(submission.status) }}
        </el-tag>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">截止时间:</span>
          <span class="value">{{ formatDate(homework.deadline) }}</span>
        </div>
        <div class="info-item">
          <span class="label">总分:</span>
          <span class="value">{{ homework.totalScore }}</span>
        </div>
        <div class="info-item">
          <span class="label">提交时间:</span>
          <span class="value">{{ formatDate(submission.submitTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">得分:</span>
          <span class="value score">{{ liveScore }}</span>
          <el-tag v-if="submission.status !== 2" type="info" size="small" style="margin-left: 8px">自动预评分</el-tag>
        </div>
      </div>

      <el-divider />

      <!-- 作业要求 -->
      <div class="section">
        <h3>作业要求</h3>
        <p class="description">{{ homework.reportDescription }}</p>
        <div v-if="homework.attachmentUrl" class="attachment">
          <el-link :href="`/api/${homework.attachmentUrl}`" target="_blank" type="primary">
            <el-icon><Download /></el-icon>
            下载作业附件
          </el-link>
        </div>
      </div>

      <el-divider />

      <!-- 我的提交 -->
      <div class="section">
        <h3>我的提交</h3>
        <div class="submission-content">
          <p>{{ submission.content }}</p>
        </div>
        <div v-if="submission.attachmentUrl" class="attachment">
          <el-link :href="`/api/${submission.attachmentUrl}`" target="_blank" type="primary">
            <el-icon><Download /></el-icon>
            下载我的附件
          </el-link>
        </div>

        <!-- 结构化题目回答预览 -->
        <div v-if="questionList?.length > 0" class="structured-results-section">
          <div class="results-badge">在线题目明细</div>
          <div v-for="(q, index) in questionList" :key="index" class="result-item">
            <div class="q-header">
              <span class="q-idx">{{ index + 1 }}.</span>
              <el-tag size="small">{{ getQuestionTypeText(q.questionType) }}</el-tag>
              <div class="q-score-stat" v-if="submission.status === 2 || ['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.questionType)">
                <el-tag :type="isStudentCorrect(index, q) ? 'success' : 'danger'" size="small" effect="plain" round>
                   {{ isStudentCorrect(index, q) ? '回答正确' : '回答错误' }}
                </el-tag>
              </div>
            </div>
            <div class="q-content">{{ q.questionContent }}</div>
            
            <!-- 选项列表 -->
            <div v-if="['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.questionType)" class="options-display">
              <div v-for="(opt, oIdx) in (q.options || [])" :key="oIdx" 
                class="opt-item"
                :class="{
                  'is-student': isOptionSelectedByStudent(index, q, oIdx),
                  'is-correct': isOptionCorrect(q, oIdx) && (submission.status === 2 || true)
                }"
              >
                <div class="opt-col">
                   <span class="opt-label">{{ String.fromCharCode(65 + oIdx) }}.</span>
                   <span class="opt-text">{{ opt.text || opt }}</span>
                </div>
                <div class="opt-tags">
                   <el-tag v-if="isOptionSelectedByStudent(index, q, oIdx)" size="small" :type="isOptionCorrect(q, oIdx) ? 'success' : 'danger'">
                     您的选择
                   </el-tag>
                   <el-tag v-if="isOptionCorrect(q, oIdx)" size="small" type="success" effect="dark" style="margin-left: 4px">
                     正确答案
                   </el-tag>
                </div>
              </div>
              <!-- 判断题特殊处理 -->
              <div v-if="q.questionType === 'JUDGE'" class="judge-options">
                 <div class="opt-item" :class="{'is-student': getRawStudentAnswer(index) === 'A', 'is-correct': q.correctAnswer === 'A'}">
                   <span>A. 正确</span>
                   <el-tag v-if="getRawStudentAnswer(index) === 'A'" size="small">您的选择</el-tag>
                 </div>
                 <div class="opt-item" :class="{'is-student': getRawStudentAnswer(index) === 'B', 'is-correct': q.correctAnswer === 'B'}">
                   <span>B. 错误</span>
                   <el-tag v-if="getRawStudentAnswer(index) === 'B'" size="small">您的选择</el-tag>
                 </div>
              </div>
            </div>

            <div v-if="q.questionType === 'ESSAY'" class="student-ans-box">
              <div class="ans-label">您的回答：</div>
              <div class="ans-val">{{ formatStudentAnswer(index, q) || '未作答' }}</div>
            </div>

            <!-- 解析区 -->
            <div v-if="submission.status === 2 || ['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.questionType)" class="standard-ans-section">
              <div v-if="q.analysis" class="ans-analysis">
                 <div class="analysis-header">
                   <el-icon><InfoFilled /></el-icon> 答案解析
                 </div>
                 <div class="analysis-body">{{ q.analysis }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 教师评语 -->
      <div v-if="submission.status === 2" class="section">
        <el-divider />
        <div class="teacher-feedback">
          <h3>
            <el-icon><ChatDotRound /></el-icon>
            教师评语
          </h3>
          <div class="feedback-content">
            <div class="score-display">
              <span class="label">得分:</span>
              <span class="score-value">{{ submission.score }}</span>
              <span class="total">/ {{ homework.totalScore }}</span>
            </div>
            <div class="comment">
              <p>{{ submission.teacherComment }}</p>
            </div>
            <div class="graded-info">
              <span>批改时间: {{ formatDate(submission.gradedTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button @click="goBack">返回列表</el-button>
        <el-button
          v-if="submission.status === 1"
          type="primary"
          @click="editSubmission"
        >
          修改提交
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Download, ChatDotRound, InfoFilled } from '@element-plus/icons-vue'
import { useHomeworkDetail } from '@/assets/js/student/homework-detail.js'

const {
  loading,
  homework,
  submission,
  questionList,
  liveScore,
  formatDate,
  getStatusType,
  getStatusText,
  editSubmission,
  goBack,
  getQuestionTypeText,
  formatStudentAnswer,
  isStudentCorrect,
  getRawStudentAnswer,
  isOptionSelectedByStudent,
  isOptionCorrect
} = useHomeworkDetail()
</script>

<style scoped>
@import '@/assets/css/student/homework-detail.css';
</style>

