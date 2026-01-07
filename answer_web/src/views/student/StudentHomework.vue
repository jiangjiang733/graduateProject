<template>
  <div class="homework-page-container">
    <!-- 顶部 Header：保持与课程列表、主页一致 -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="main-title">作业与测评</h1>
        </div>

        <div class="header-right">
          <div class="search-box-wrapper">
            <el-input
                v-model="searchKeyword"
                placeholder="搜索作业名称..."
                clearable
                @input="filterHomeworks"
                class="modern-search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 现代化过滤器栏 -->
      <section class="toolbar-section">
        <div class="status-filters">
          <div
              class="filter-tab"
              :class="{ active: filterStatus === null }"
              @click="filterStatus = null; filterHomeworks()"
          >
            全部 <span>{{ homeworks.length }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 0 }"
              @click="filterStatus = 0; filterHomeworks()"
          >
            待提交 <span>{{ getCountByStatus(0) }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 1 }"
              @click="filterStatus = 1; filterHomeworks()"
          >
            待批改 <span>{{ getCountByStatus(1) }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 2 }"
              @click="filterStatus = 2; filterHomeworks()"
          >
            已完成 <span>{{ getCountByStatus(2) }}</span>
          </div>
        </div>
      </section>

      <!-- 作业列表 -->
      <div v-loading="loading" class="homework-list-section">
        <div v-if="filteredHomeworks.length === 0" class="empty-placeholder">
          <el-empty description="暂时没有找到相关作业" :image-size="160" />
        </div>

        <div v-else class="homework-grid">
          <div
              v-for="homework in filteredHomeworks"
              :key="homework.reportId"
              class="homework-card"
          >
            <div class="card-top">
              <div class="tag-row">
                <el-tag :type="getStatusType(homework.status)" effect="light" class="status-tag">
                  <span class="dot"></span>
                  {{ getStatusText(homework.status) }}
                </el-tag>
                <div v-if="isOverdue(homework.deadline) && !homework.studentReportId" class="overdue-label">
                  <el-icon><Warning /></el-icon> 已逾期
                </div>
              </div>
              <h3 class="homework-title" :title="homework.reportTitle">{{ homework.reportTitle }}</h3>
            </div>

            <div class="card-mid">
              <div class="info-item" :class="{ 'text-danger': isOverdue(homework.deadline) }">
                <el-icon><Calendar /></el-icon>
                <span>截止: {{ formatDate(homework.deadline) }}</span>
              </div>
              <div class="info-item">
                <el-icon><Collection /></el-icon>
                <span>满分: {{ homework.totalScore }} 分</span>
              </div>
              <div v-if="homework.score" class="info-item highlight-score">
                <el-icon><Trophy /></el-icon>
                <span>最终得分: <strong>{{ homework.score }}</strong></span>
              </div>
            </div>

            <div class="card-bottom">
              <div class="description-preview">
                {{ homework.reportDescription || '点击查看作业详情及具体要求...' }}
              </div>

              <!-- 教师评语缩略提示 -->
              <div v-if="homework.teacherComment" class="comment-tip">
                <el-icon><ChatDotRound /></el-icon> 教师已批阅并留下评语
              </div>

              <div class="actions">
                <el-button
                    v-if="!homework.studentReportId"
                    type="primary"
                    class="btn-submit"
                    @click="goToSubmit(homework)"
                >
                  提交作业
                </el-button>
                <el-button
                    v-else
                    class="btn-detail"
                    @click="viewDetail(homework)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, Calendar, Trophy, Collection, ArrowRight, Warning, ChatDotRound, Clock
} from '@element-plus/icons-vue'
import { getStudentLabReports } from '@/api/homework'

const router = useRouter()
const loading = ref(false)
const homeworks = ref([])
const filterStatus = ref(null)
const searchKeyword = ref('')

onMounted(() => {
  loadHomeworks()
})

const loadHomeworks = async () => {
  loading.value = true
  try {
    const studentInfo = JSON.parse(localStorage.getItem('student') || '{}')
    const studentId = studentInfo.studentsId || studentInfo.id || localStorage.getItem('s_id')

    if (!studentId) {
      ElMessage.warning('未能获取学生信息，请重新登录')
      return
    }
    const response = await getStudentLabReports(String(studentId))
    if (response) {
      homeworks.value = response.data || (Array.isArray(response) ? response : [])
    }
  } catch (error) {
    ElMessage.error('获取作业列表失败')
  } finally {
    loading.value = false
  }
}

const filteredHomeworks = computed(() => {
  let result = homeworks.value
  if (filterStatus.value !== null) {
    result = result.filter(hw => (hw.status || 0) === filterStatus.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(hw => hw.reportTitle.toLowerCase().includes(kw))
  }
  return result
})

const getCountByStatus = (status) => {
  return homeworks.value.filter(hw => (hw.status || 0) === status).length
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '待提交', 1: '待批改', 2: '已批改' }
  return map[status] || '待提交'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const isOverdue = (deadline) => {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

const goToSubmit = (hw) => router.push({ name: 'student_homework_submit', params: { id: hw.reportId } })
const viewDetail = (hw) => router.push({ name: 'student_homework_detail', params: { id: hw.studentReportId } })
const filterHomeworks = () => {}
</script>

<style scoped>
.homework-page-container {
  --primary-color: #4f46e5;
  --bg-color: #f8fafc;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --border-color: #e2e8f0;

  background-color: var(--bg-color);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Header 部分与之前主页同步 */
.page-header {
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 32px 0;
}

.header-content {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 8px;
}

.main-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -1px;
}

.modern-search {
  width: 300px;
}

.modern-search :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 8px 16px;
  background: #f1f5f9;
  box-shadow: none !important;
}

/* 状态切换栏 */
.main-content {
  max-width: 1240px;
  margin: 0 auto;
  padding: 1px;
}

.toolbar-section {
  margin-bottom: 32px;
}

.status-filters {
  display: flex;
  gap: 12px;
}

.filter-tab {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tab span {
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--text-sub);
}

.filter-tab:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.filter-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.filter-tab.active span {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 作业卡片网格 */
.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .homework-grid { grid-template-columns: 1fr; }
}

.homework-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.homework-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: rgba(79, 70, 229, 0.3);
}

.card-top {
  margin-bottom: 20px;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-tag {
  border-radius: 8px;
  font-weight: 700;
  padding: 4px 12px;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  margin-right: 6px;
  vertical-align: middle;
}

.overdue-label {
  font-size: 12px;
  color: #ef4444;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.homework-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 中间属性区 */
.card-mid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 14px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-sub);
}

.info-item.text-danger { color: #ef4444; font-weight: 600; }

.highlight-score {
  grid-column: span 2;
  color: #10b981;
}

.highlight-score strong { font-size: 1.1rem; }

/* 底部操作区 */
.card-bottom {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.description-preview {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.comment-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #0369a1;
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.actions {
  margin-top: auto;
  display: flex;
  gap: 12px;
}

.btn-submit {
  flex: 2;
  border-radius: 12px;
  font-weight: 700;
  height: 44px;
  background: var(--primary-color);
  border: none;
}

.btn-detail {
  flex: 1;
  border-radius: 12px;
  font-weight: 700;
  height: 44px;
}

.pagination-wrapper {
  margin-top: 48px;
  display: flex;
  justify-content: center;
}
</style>