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
        <div v-if="submission.score" class="info-item">
          <span class="label">得分:</span>
          <span class="value score">{{ submission.score }}</span>
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
              <div class="q-score-stat" v-if="submission.status === 2">
                <el-tag :type="isStudentCorrect(index, q) ? 'success' : 'danger'" size="small" effect="plain" round>
                   {{ isStudentCorrect(index, q) ? '回答正确' : '回答错误' }}
                </el-tag>
              </div>
            </div>
            <div class="q-content">{{ q.questionContent }}</div>
            
            <div class="student-ans-box">
              <div class="ans-label">您的回答：</div>
              <div class="ans-val" :class="{
                correct: submission.status === 2 && isStudentCorrect(index, q),
                wrong: submission.status === 2 && !isStudentCorrect(index, q)
              }">
                {{ formatStudentAnswer(index, q) || '未作答' }}
              </div>
            </div>

            <!-- 如果已批改，显示正确答案和解析 -->
            <div v-if="submission.status === 2" class="standard-ans-section">
              <div class="standard-ans">
                 <span class="label">正确答案：</span>
                 <span class="val">{{ formatCorrectAnswer(q) }}</span>
              </div>
              <div v-if="q.analysis" class="ans-analysis">
                 <span class="label">题目解析：</span>
                 <span class="val">{{ q.analysis }}</span>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Download,
  ChatDotRound
} from '@element-plus/icons-vue'
import { getStudentSubmission, getLabReportDetail } from '@/api/homework'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const homework = ref({})
const submission = ref({})

// 加载详情
const loadDetail = async () => {
  loading.value = true
  try {
    const studentReportId = route.params.id
    
    // 获取学生提交详情
    const submissionResponse = await getStudentSubmission(studentReportId)
    submission.value = submissionResponse.data || {}

    // 获取作业详情
    const homeworkResponse = await getLabReportDetail(submission.value.reportId)
    homework.value = homeworkResponse.data || {}
  } catch (error) {
    console.error('加载详情失败:', error)
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'success'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    0: '未提交',
    1: '已提交',
    2: '已批改'
  }
  return textMap[status] || '未提交'
}

// 修改提交
const editSubmission = () => {
  ElMessage.info('修改功能开发中')
  // TODO: 实现修改提交功能
}

// 返回
const goBack = () => {
  router.push({ name: 'student_homework' })
}

const questionList = computed(() => {
  const qList = homework.value.questionList || homework.value.questions
  if (!qList) return []
  try {
    const parsed = typeof qList === 'string' ? JSON.parse(qList) : qList
    return parsed.map(q => {
      if (q.questionOptions && typeof q.questionOptions === 'string') {
        try { q.options = JSON.parse(q.questionOptions) } catch(e) { q.options = [] }
      }
      return q
    })
  } catch (e) { return [] }
})

const structuredAnswers = computed(() => {
  if (!submission.value.structuredAnswers) return []
  try {
    return JSON.parse(submission.value.structuredAnswers)
  } catch (e) { return [] }
})

const getQuestionTypeText = (type) => {
  const types = { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题' }
  return types[type] || type
}

const formatStudentAnswer = (idx, q) => {
  const ansObj = structuredAnswers.value[idx]
  if (!ansObj) return ''
  const ans = ansObj.answer
  if (q.questionType === 'JUDGE') {
     if (ans === 'A' || ans === '正确') return 'A. 正确'
     if (ans === 'B' || ans === '错误') return 'B. 错误'
  }
  return ans
}

const formatCorrectAnswer = (q) => {
  const ans = q.correctAnswer || q.answer
  if (q.questionType === 'JUDGE') {
     if (ans === 'A' || ans === '正确') return 'A. 正确'
     if (ans === 'B' || ans === '错误') return 'B. 错误'
  }
  return ans
}

const isStudentCorrect = (idx, q) => {
  const sAns = formatStudentAnswer(idx, q)
  const cAns = formatCorrectAnswer(q)
  return sAns === cAns
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.homework-detail {
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.detail-card {
  margin-top: 20px;
}

.homework-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.homework-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item .label {
  color: #909399;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.info-item .score {
  color: #67c23a;
  font-size: 18px;
  font-weight: 600;
}

.section {
  margin: 24px 0;
}

.section h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.description,
.submission-content p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.submission-content {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.attachment {
  margin-top: 12px;
}

.teacher-feedback {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%);
  border-radius: 12px;
  padding: 20px;
}

.teacher-feedback h3 {
  color: #409eff;
  margin-bottom: 16px;
}

.feedback-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.score-display .label {
  color: #606266;
  font-size: 14px;
}

.score-value {
  color: #67c23a;
  font-size: 32px;
  font-weight: 700;
}

.score-display .total {
  color: #909399;
  font-size: 18px;
}

.comment {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.comment p {
  margin: 0;
  color: #303133;
  line-height: 1.8;
}

.graded-info {
  color: #909399;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.structured-results-section {
  margin-top: 32px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.results-badge {
  display: inline-block;
  padding: 4px 16px;
  background: #3b82f6;
  color: white;
  font-size: 13px;
  font-weight: 700;
  border-radius: 20px;
  margin-bottom: 20px;
}

.result-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #edf2f7;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.q-idx {
  font-weight: 800;
  color: #1e293b;
  font-size: 16px;
}

.q-score-stat {
  margin-left: auto;
}

.q-content {
  font-size: 15px;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 16px;
  font-weight: 500;
}

.student-ans-box {
  background: #f1f5f9;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.ans-label {
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
}

.ans-val {
  font-weight: 700;
  color: #1e293b;
}

.ans-val.correct { color: #10b981; }
.ans-val.wrong { color: #ef4444; }

.standard-ans-section {
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
  margin-top: 12px;
}

.standard-ans, .ans-analysis {
  font-size: 14px;
  line-height: 1.6;
  margin-top: 4px;
}

.standard-ans .label, .ans-analysis .label {
  color: #64748b;
  font-weight: 600;
}

.standard-ans .val {
  color: #10b981;
  font-weight: 700;
}

.ans-analysis .val {
  color: #64748b;
}
</style>
