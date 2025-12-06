<template>
  <div class="student-homework">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <div class="header-text">
          <h1>我的作业</h1>
          <p>查看和提交课程作业</p>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部状态" style="width: 150px" @change="filterHomeworks">
            <el-option label="全部" :value="null" />
            <el-option label="未提交" :value="0" />
            <el-option label="已提交" :value="1" />
            <el-option label="已批改" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索作业标题"
            style="width: 250px"
            clearable
            @input="filterHomeworks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 作业列表 -->
    <div v-loading="loading" class="homework-list">
      <el-empty v-if="filteredHomeworks.length === 0" description="暂无作业" :image-size="200" />
      
      <el-card
        v-for="homework in filteredHomeworks"
        :key="homework.reportId"
        class="homework-card"
        shadow="hover"
      >
        <div class="homework-header">
          <div class="homework-title-section">
            <h3 class="homework-title">{{ homework.reportTitle }}</h3>
            <el-tag :type="getStatusType(homework.status)" size="small">
              {{ getStatusText(homework.status) }}
            </el-tag>
          </div>
          <div class="homework-actions">
            <el-button
              v-if="!homework.studentReportId"
              type="primary"
              size="small"
              @click="goToSubmit(homework)"
            >
              提交作业
            </el-button>
            <el-button
              v-else
              size="small"
              @click="viewDetail(homework)"
            >
              查看详情
            </el-button>
          </div>
        </div>

        <div class="homework-content">
          <div class="homework-info">
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>截止时间: {{ formatDate(homework.deadline) }}</span>
              <el-tag v-if="isOverdue(homework.deadline) && !homework.studentReportId" type="danger" size="small">
                已逾期
              </el-tag>
            </div>
            <div class="info-item">
              <el-icon><Star /></el-icon>
              <span>总分: {{ homework.totalScore }}</span>
            </div>
            <div v-if="homework.score" class="info-item">
              <el-icon><Trophy /></el-icon>
              <span>得分: {{ homework.score }}</span>
            </div>
            <div v-if="homework.submitTime" class="info-item">
              <el-icon><Clock /></el-icon>
              <span>提交时间: {{ formatDate(homework.submitTime) }}</span>
            </div>
          </div>

          <div class="homework-description">
            <p>{{ homework.reportDescription }}</p>
          </div>

          <div v-if="homework.teacherComment" class="teacher-comment">
            <div class="comment-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>教师评语</span>
            </div>
            <p>{{ homework.teacherComment }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document,
  Search,
  Calendar,
  Star,
  Trophy,
  Clock,
  ChatDotRound
} from '@element-plus/icons-vue'
import { getStudentLabReports } from '@/api/homework'

const router = useRouter()
const loading = ref(false)
const homeworks = ref([])
const filterStatus = ref(null)
const searchKeyword = ref('')

// 从localStorage获取学生信息
const studentInfo = JSON.parse(localStorage.getItem('student') || '{}')

// 过滤后的作业列表
const filteredHomeworks = computed(() => {
  let result = homeworks.value

  // 按状态过滤
  if (filterStatus.value !== null) {
    result = result.filter(hw => {
      const status = hw.status || 0
      return status === filterStatus.value
    })
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(hw =>
      hw.reportTitle.toLowerCase().includes(keyword) ||
      hw.reportDescription.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 加载作业列表
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

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 判断是否逾期
const isOverdue = (deadline) => {
  if (!deadline) return false
  return new Date(deadline) < new Date()
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

// 去提交作业
const goToSubmit = (homework) => {
  router.push({
    name: 'student_homework_submit',
    params: { id: homework.reportId }
  })
}

// 查看详情
const viewDetail = (homework) => {
  router.push({
    name: 'student_homework_detail',
    params: { id: homework.studentReportId }
  })
}

// 过滤作业
const filterHomeworks = () => {
  // 触发计算属性重新计算
}

onMounted(() => {
  loadHomeworks()
})
</script>

<style scoped>
.student-homework {
  padding: 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.header-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.homework-list {
  display: grid;
  gap: 16px;
}

.homework-card {
  transition: all 0.3s;
}

.homework-card:hover {
  transform: translateY(-2px);
}

.homework-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.homework-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.homework-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.homework-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.homework-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.info-item .el-icon {
  color: #909399;
}

.homework-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.teacher-comment {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-weight: 600;
  margin-bottom: 8px;
}

.teacher-comment p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
