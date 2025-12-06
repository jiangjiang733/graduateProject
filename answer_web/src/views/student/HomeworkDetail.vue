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
</style>
