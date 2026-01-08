<template>
  <div class="student-exam-list-container">

    <div class="filter-header animate-fade-in">
      <div class="header-content">
        <h2 class="page-title">我的考试安排</h2>
        <div class="filter-controls">
          <el-form :inline="true" class="modern-inline-form">
            <el-form-item>
              <el-select v-model="filterStatus" placeholder="考试状态" class="refined-select" @change="handleFilterChange">
                <el-option label="全部状态" value="" />
                <el-option label="进行中" value="ONGOING" />
                <el-option label="待开始" value="PUBLISHED" />
                <el-option label="已结束" value="ENDED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input
                  v-model="searchKeyword"
                  placeholder="搜索考试名称、课程或教师..."
                  class="refined-input"
                  clearable
                  @input="handleFilterChange"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- Exam Grid Area -->
    <div v-loading="loading" class="exam-content-area">
      <div v-if="filteredExams.length === 0 && !loading" class="empty-state animate-scale-up">
        <el-empty description="暂无相关考试计划" :image-size="160" />
      </div>

      <div v-else class="exam-grid-container">
        <div class="exam-grid">
          <div
              v-for="(exam, index) in paginatedExams"
              :key="exam.examId"
              class="exam-card-wrapper animate-slide-up"
              :style="{ 'animation-delay': `${index * 0.08}s` }"
          >
            <div class="exam-card" :class="getStatusClass(exam)">
              <!-- Subtle Status Accent Line -->
              <div class="card-accent-line"></div>

              <div class="card-main">
                <div class="card-top">
                  <div class="subject-info">
                    <span class="course-label">{{ exam.courseName || '通识课程' }}</span>
                    <h3 class="exam-name">{{ exam.examTitle }}</h3>
                  </div>
                  <el-tag :type="getStatusType(exam)" effect="plain" class="modern-status-tag">
                    {{ getStatusText(exam) }}
                  </el-tag>
                </div>

                <div class="spec-matrix">
                  <div class="spec-node">
                    <div class="node-icon"><el-icon><Calendar /></el-icon></div>
                    <div class="node-data">
                      <span class="node-label">开始时间</span>
                      <span class="node-value">{{ formatTimeShort(exam.startTime) }}</span>
                    </div>
                  </div>
                  <div class="spec-node">
                    <div class="node-icon"><el-icon><Timer /></el-icon></div>
                    <div class="node-data">
                      <span class="node-label">限时</span>
                      <span class="node-value">{{ exam.duration }}min</span>
                    </div>
                  </div>
                  <div class="spec-node">
                    <div class="node-icon"><el-icon><Trophy /></el-icon></div>
                    <div class="node-data">
                      <span class="node-label">满分</span>
                      <span class="node-value text-primary">{{ exam.totalScore }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-bottom">
                <div class="valid-period">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatRange(exam.startTime, exam.endTime) }}</span>
                </div>
                <el-button
                    :type="getButtonType(exam)"
                    class="entry-button"
                    :disabled="!canStart(exam)"
                    @click="handleStartExam(exam)"
                    size="large"
                >
                  {{ getActionButtonText(exam) }}
                  <el-icon class="el-icon--right" v-if="getStatus(exam) === 'ONGOING' && !exam.isSubmitted"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Section -->
        <div class="pagination-footer animate-fade-in" v-if="filteredExams.length > 0">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[6, 12, 18, 24]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredExams.length"
              background
              @size-change="handlePageChange"
              @current-change="handlePageChange"
              class="custom-pagination"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Notebook, Calendar, Timer, Trophy, ArrowRight, Clock } from '@element-plus/icons-vue'
import { getStudentExamList } from '@/api/exam'

const router = useRouter()
const loading = ref(false)
const exams = ref([])
const filterStatus = ref('')
const searchKeyword = ref('')
const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')

// Pagination State
const currentPage = ref(1)
const pageSize = ref(6)

const loadExams = async () => {
  if (!studentId) {
    ElMessage.warning('身份信息已失效，请重新登录')
    return
  }

  loading.value = true
  try {
    const params = filterStatus.value || null
    const res = await getStudentExamList(studentId, params, null)
    if (res.success || res.code === 200) {
      exams.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取考试列表失败')
    }
  } catch (error) {
    ElMessage.error('网络连接异常，请检查网络')
  } finally {
    loading.value = false
  }
}


const handleFilterChange = () => {
  currentPage.value = 1
  loadExams()
}
const handlePageChange = () => {

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const filteredExams = computed(() => {
  let result = exams.value
  if (searchKeyword.value) {
    const lower = searchKeyword.value.toLowerCase()
    result = result.filter(e =>
        (e.examTitle && e.examTitle.toLowerCase().includes(lower)) ||
        (e.courseName && e.courseName.toLowerCase().includes(lower))
    )
  }
  return result
})
const paginatedExams = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredExams.value.slice(start, end)
})

const getStatusClass = (exam) => {
  if (exam.isSubmitted) return 'state-finished'
  const status = getStatus(exam)
  if (status === 'ONGOING') return 'state-active'
  if (status === 'NOT_STARTED') return 'state-pending'
  return 'state-over'
}

const getStatusType = (exam) => {
  if (exam.isSubmitted) return 'success'
  const status = getStatus(exam)
  if (status === 'ONGOING') return 'danger'
  if (status === 'NOT_STARTED') return 'primary'
  return 'info'
}

const getButtonType = (exam) => {
  if (exam.isSubmitted) return 'success'
  const status = getStatus(exam)
  if (status === 'ONGOING') return 'primary'
  return 'info'
}

const getStatusText = (exam) => {
  if (exam.isSubmitted) return '已交卷'
  const status = getStatus(exam)
  if (status === 'ONGOING') return '正在进行'
  if (status === 'NOT_STARTED') return '未开始'
  return '已逾期'
}

const getStatus = (exam) => {
  const now = new Date().getTime()
  const start = new Date(exam.startTime).getTime()
  const end = new Date(exam.endTime).getTime()
  if (now < start) return 'NOT_STARTED'
  if (now > end) return 'ENDED'
  return 'ONGOING'
}

const canStart = (exam) => {
  if (exam.isSubmitted) return true
  const status = getStatus(exam)
  return status === 'ONGOING'
}

const getActionButtonText = (exam) => {
  if (exam.isSubmitted) return exam.studentScore !== null ? '查看成绩' : '回顾试卷'
  const status = getStatus(exam)
  if (status === 'NOT_STARTED') return '尚未开启'
  if (status === 'ENDED') return '缺考'
  return '立即进入'
}

const formatTimeShort = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatRange = (start, end) => {
  return `${formatTime(start)} ~ ${formatTime(end)}`
}

const handleStartExam = (exam) => {
  const path = exam.isSubmitted ? `/student/exam/${exam.examId}/result` : `/student/exam/${exam.examId}/take`
  router.push(path)
}

onMounted(() => {
  loadExams()
})
</script>

<style scoped>
/* Base Theme & Layout */
.student-exam-list-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 30px 20px;
  min-height: 100vh;
  background-color: #f8fafc;
}

/* Header & Filters */
.filter-header {
  margin-bottom: 40px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 50px;
  height: 5px;
  background: #3b82f6;
  border-radius: 2px;
}

.modern-inline-form {
  display: flex;
  gap: 16px;
  align-items: center;
}

.modern-inline-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

/* 修正：显著加宽输入框和选择框 */
.refined-select {
  width: 180px;
}

.refined-input {
  width: 380px; /* 增加宽度以容纳更多搜索内容 */
}

.refined-select :deep(.el-input__wrapper),
.refined-input :deep(.el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 16px;
  height: 44px; /* 增加高度更显大气 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refined-select :deep(.el-input__wrapper).is-focus,
.refined-input :deep(.el-input__wrapper).is-focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

/* Grid Layout */
.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 28px;
}

/* Modern Card Styling */
.exam-card {
  background: #ffffff;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.exam-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  border-color: #3b82f644;
}

/* Top Accent Line */
.card-accent-line {
  height: 5px;
  width: 100%;
  background: #e2e8f0;
}

.state-active .card-accent-line { background: linear-gradient(90deg, #f87171, #ef4444); }
.state-pending .card-accent-line { background: linear-gradient(90deg, #60a5fa, #3b82f6); }
.state-finished .card-accent-line { background: linear-gradient(90deg, #34d399, #10b981); }

/* Card Main Area */
.card-main {
  padding: 28px;
  flex-grow: 1;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.course-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
  letter-spacing: 0.8px;
}

.exam-name {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.modern-status-tag {
  border-radius: 10px;
  font-weight: 800;
  height: 28px;
  padding: 0 12px;
  border: none;
  background-color: #f1f5f9;
}

/* Info Matrix */
.spec-matrix {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.spec-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #f8fafc;
  padding: 14px 10px;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.exam-card:hover .spec-node {
  background: #fff;
  border-color: #f1f5f9;
}

.node-icon {
  font-size: 20px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.node-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 2px;
}

.node-value {
  font-size: 14px;
  font-weight: 800;
  color: #334155;
}

.text-primary { color: #3b82f6; }

/* Bottom Action Area */
.card-bottom {
  padding: 20px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #fcfcfd;
  border-top: 1px solid #f1f5f9;
}

.valid-period {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  background: #fff;
  padding: 6px;
  border-radius: 10px;
  border: 1px dashed #e2e8f0;
}

.entry-button {
  width: 100%;
  border-radius: 14px;
  font-weight: 800;
  height: 50px;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  transition: all 0.3s;
}

.entry-button:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

/* Pagination Footer */
.pagination-footer {
  margin-top: 48px;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.custom-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #3b82f6;
  color: #fff;
  font-weight: 700;
}

.custom-pagination :deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.custom-pagination :deep(.el-pagination.is-background .el-pager li:hover) {
  color: #3b82f6;
  border-color: #3b82f6;
}


@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}


@media (max-width: 850px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .refined-input {
    width: 100%;
  }
  .refined-select {
    width: 140px;
  }
  .modern-inline-form {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>