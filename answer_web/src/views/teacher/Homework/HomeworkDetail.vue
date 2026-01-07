<template>
  <div class="homework-detail modern-page">
    <div class="page-header glass-panel animate-slide-up">
      <div class="header-left">
        <el-button link @click="router.back()">
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

    <div class="detail-container">
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Document, Check, CircleClose } from '@element-plus/icons-vue'
import { getLabReportDetail, updateLabReport } from '@/api/homework.js'
import { formatRelativeTime } from '@/utils/date.js'
import '@/assets/css/teacher/modern-theme.css'

const route = useRoute()
const router = useRouter()
const homework = ref({})
const loading = ref(false)

const loadDetail = async () => {
    loading.value = true
    try {
        const id = route.params.id
        const response = await getLabReportDetail(id)
        if (response.success) {
            homework.value = response.data
        }
    } catch (error) {
        ElMessage.error('获取详情失败')
    } finally {
        loading.value = false
    }
}

const descriptionLines = computed(() => {
    if (!homework.value.reportDescription) return ['暂无描述内容']
    return homework.value.reportDescription.split('\n')
})

const submitPercentage = computed(() => {
    if (!homework.value.totalStudents) return 0
    return Math.round((homework.value.submittedCount / homework.value.totalStudents) * 100)
})

const getStatusType = (status) => {
    const types = { 1: 'success', 2: 'info', 0: 'warning' }
    return types[status] || 'info'
}

const getStatusText = (status) => {
    const texts = { 1: '正在进行', 2: '已截止', 0: '草稿' }
    return texts[status] || '未知'
}

const questionList = computed(() => {
    const qList = homework.value.questionList || homework.value.questions
    if (!qList) return []
    try {
        return typeof qList === 'string' ? JSON.parse(qList) : qList
    } catch (e) {
        console.error('解析题目失败', e)
        return []
    }
})

const getQuestionTypeText = (type) => {
    const types = { 
        1: '单选题', 'SINGLE': '单选题',
        2: '多选题', 'MULTIPLE': '多选题',
        3: '判断题', 'JUDGE': '判断题',
        4: '填空题', 'COMPLETION': '填空题',
        5: '简答题', 'ESSAY': '简答题'
    }
    return types[type] || type || '未知'
}

const getQuestionTypeTag = (type) => {
    const maps = { SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info' }
    return maps[type] || ''
}

const parseOptions = (json) => {
    try {
        return typeof json === 'string' ? JSON.parse(json) : json
    } catch(e) { return [] }
}

const isCorrect = (opt, idx, q) => {
    const ans = q.correctAnswer || q.answer
    if (!ans) return false
    const ansStr = String(ans)
    const char = String.fromCharCode(65 + idx)
    return ansStr.includes(char) || ansStr === String(idx)
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}

const editHomework = () => {
    router.push(`/teacher/homework`) // Back to list where edit dialog is managed
}

const goToGrading = () => {
    router.push(`/teacher/homework/${homework.value.reportId}/grade`)
}

const closeHomework = async () => {
    try {
        await ElMessageBox.confirm('确定要提前截止该作业吗？', '操作确认')
        const formData = new FormData()
        formData.append('status', 2)
        const response = await updateLabReport(homework.value.reportId, formData)
        if (response.success) {
            ElMessage.success('作业已截止')
            loadDetail()
        }
    } catch (e) {}
}

onMounted(loadDetail)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.page-title { font-size: 20px; font-weight: 800; color: #1f2937; margin: 0; }

.detail-container {
  display: flex;
  gap: 24px;
}

.left-section { flex: 1; min-width: 0; }
.right-section { width: 340px; display: flex; flex-direction: column; gap: 24px; }

.detail-card { padding: 32px; }
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-title { font-size: 18px; font-weight: 700; color: #374151; margin: 0; }

.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
.info-item { font-size: 14px; }
.info-item .label { color: #6b7280; }
.info-item .value { color: #111827; font-weight: 600; }

.description-content {
  background: #f9fafb;
  padding: 24px;
  border-radius: 12px;
  line-height: 1.8;
  color: #374151;
}

.question-header {
  font-weight: 700;
  color: #2563eb;
  margin-top: 16px;
}

.attachment-box {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px dashed #7dd3fc;
}

/* Stats Card */
.stats-card { padding: 24px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
.stat-box {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
}
.stat-num { font-size: 24px; font-weight: 800; color: #1e40af; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }

.progress-wrap { margin-top: 16px; }
.progress-info { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #475569; }

/* Questions Preview */
.questions-preview-section {
    margin-top: 40px;
}

.q-detail-item {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
}

.q-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.q-num {
    font-weight: 800;
    color: #3b82f6;
    font-size: 16px;
}

.q-score {
    font-size: 12px;
    color: #94a3b8;
}

.q-item-content {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.6;
    margin-bottom: 16px;
}

.q-item-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.opt-line {
    padding: 10px 16px;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 13px;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 8px;
}

.opt-line.correct {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
}

.correct-icon {
    margin-left: auto;
    color: #22c55e;
}

.q-item-analysis {
    background: #fffcf0;
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
}

.analysis-label {
    font-size: 12px;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 4px;
}

.analysis-text {
    font-size: 13px;
    color: #d97706;
}
</style>
