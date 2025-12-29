<template>
  <div class="student-homework modern-page">
    <!-- 页面头部 -->


    <!-- 筛选器 -->
    <div class="filter-section glass-panel animate-slide-up">
      <el-form :inline="true" class="glass-form">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部状态" class="glass-select" @change="filterHomeworks">
            <el-option label="全部" :value="null" />
            <el-option label="未提交" :value="0" />
            <el-option label="已提交" :value="1" />
            <el-option label="已批改" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索作业标题..."
            class="glass-input"
            clearable
            @input="filterHomeworks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <!-- 作业列表 -->
    <div v-loading="loading" class="content-list animate-slide-up" style="animation-delay: 0.1s">
      <div v-if="filteredHomeworks.length === 0" class="empty-state glass-panel">
         <el-empty description="暂无作业" :image-size="200" />
      </div>
      
      <div
        v-for="homework in filteredHomeworks"
        :key="homework.reportId"
        class="list-card glass-panel"
      >
        <div class="card-header">
          <div class="title-section">
            <h3 class="card-title">{{ homework.reportTitle }}</h3>
            <el-tag :type="getStatusType(homework.status)" effect="dark" round size="small">
              {{ getStatusText(homework.status) }}
            </el-tag>
          </div>
          <div class="card-actions">
            <el-button
              v-if="!homework.studentReportId"
              type="primary"
              class="glass-btn primary"
              @click="goToSubmit(homework)"
            >
              提交作业
            </el-button>
            <el-button
              v-else
              class="glass-btn"
              @click="viewDetail(homework)"
            >
              查看详情
            </el-button>
          </div>
        </div>

        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>截止: {{ formatDate(homework.deadline) }}</span>
              <el-tag v-if="isOverdue(homework.deadline) && !homework.studentReportId" type="danger" size="small" effect="plain" class="ml-2">
                已逾期
              </el-tag>
            </div>
            <div class="info-item">
              <el-icon><Star /></el-icon>
              <span>总分: {{ homework.totalScore }}</span>
            </div>
            <div v-if="homework.score" class="info-item highlight">
              <el-icon><Trophy /></el-icon>
              <span>得分: {{ homework.score }}</span>
            </div>
            <div v-if="homework.submitTime" class="info-item">
              <el-icon><Clock /></el-icon>
              <span>提交于: {{ formatDate(homework.submitTime) }}</span>
            </div>
          </div>

          <div class="description-preview">
            <p v-for="(line, index) in getDescriptionLines(homework.reportDescription)" :key="index" :class="{ 'question-header': line.startsWith('【') }">
              {{ line }}
            </p>
          </div>

          <div v-if="homework.teacherComment" class="teacher-feedback">
            <div class="feedback-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>教师评语</span>
            </div>
            <p>{{ homework.teacherComment }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document, Search, Calendar, Star, Trophy, Clock, ChatDotRound
} from '@element-plus/icons-vue'
import { getStudentLabReports } from '@/api/homework'
import '@/assets/css/teacher/modern-theme.css'

const router = useRouter()
const loading = ref(false)
const homeworks = ref([])
const filterStatus = ref(null)
const searchKeyword = ref('')

const studentInfo = JSON.parse(localStorage.getItem('student') || '{}')

// Mock Data for Demo (remove when real API is confirmed working)
onMounted(() => {
  loadHomeworks()
})

const loadHomeworks = async () => {
  loading.value = true
  try {
    const studentId = localStorage.getItem('studentId') || studentInfo.studentsId || studentInfo.id
    if (!studentId) {
      ElMessage.warning('未能获取学生信息，请重新登录')
      return
    }
    const response = await getStudentLabReports(studentId)
    if (response.success) {
      homeworks.value = response.data || []
    }
  } catch (error) {
    console.error('加载作业失败:', error)
    ElMessage.error('加载作业失败')
  } finally {
    loading.value = false
  }
}

/*
const loadHomeworks = async () => {
  loading.value = true
  try {
    const response = await getStudentLabReports(studentInfo.studentsId)
    homeworks.value = response.data || []
  } catch (error) {
    console.error('加载作业失败:', error)
    ElMessage.error('加载作业失败')
  } finally {
    loading.value = false
  }
}
*/

const filteredHomeworks = computed(() => {
  let result = homeworks.value
  if (filterStatus.value !== null) {
    result = result.filter(hw => (hw.status || 0) === filterStatus.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(hw =>
      hw.reportTitle.toLowerCase().includes(keyword) ||
      (hw.reportDescription && hw.reportDescription.toLowerCase().includes(keyword))
    )
  }
  return result
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const isOverdue = (deadline) => {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

const getStatusType = (status) => {
  const typeMap = { 0: 'info', 1: 'warning', 2: 'success' }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = { 0: '未提交', 1: '已提交', 2: '已批改' }
  return textMap[status] || '未提交'
}

const goToSubmit = (homework) => {
  router.push({ name: 'student_homework_submit', params: { id: homework.reportId } })
}

const viewDetail = (homework) => {
  router.push({ name: 'student_homework_detail', params: { id: homework.studentReportId } })
}

const getDescriptionLines = (desc) => {
  if (!desc) return ['暂无描述']
  // Split and limit preview
  const lines = desc.split('\n')
  return lines.slice(0, 5).concat(lines.length > 5 ? ['...'] : [])
}

const filterHomeworks = () => {}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title { font-size: 24px; font-weight: 800; color: #1f2937; margin: 0; }
.page-subtitle { color: #6b7280; font-size: 14px; margin: 4px 0 0; }

.filter-section { padding: 20px; margin-bottom: 24px; }

.content-list { display: flex; flex-direction: column; gap: 16px; }

.list-card { padding: 24px; transition: all 0.3s; }
.list-card:hover { transform: translateY(-3px); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.title-section { display: flex; align-items: center; gap: 12px; }
.card-title { font-size: 18px; font-weight: 700; color: #374151; margin: 0; }

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 14px;
}

.info-item { display: flex; align-items: center; gap: 8px; }
.info-item.highlight { color: #10b981; font-weight: 600; }

.description-text { color: #4b5563; line-height: 1.6; margin-bottom: 20px; }

.teacher-feedback {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #bae6fd;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0284c7;
  font-weight: 700;
  margin-bottom: 8px;
}
</style>
