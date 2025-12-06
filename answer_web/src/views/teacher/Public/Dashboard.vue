<template>
  <div class="dashboard-container">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">欢迎回来，{{ teacherName }}老师 👋</h1>
          <p class="welcome-subtitle">今天也要元气满满地教学哦！</p>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon course-icon">
              <el-icon :size="40"><Reading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.courseCount || 0 }}</div>
              <div class="stat-label">课程总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon student-icon">
              <el-icon :size="40"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.studentCount || 0 }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon homework-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pendingHomeworkCount || 0 }}</div>
              <div class="stat-label">待批改作业</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon message-icon">
              <el-icon :size="40"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.unreadMessageCount || 0 }}</div>
              <div class="stat-label">待处理留言</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="content-row">
      <!-- 左侧列 -->
      <el-col :xs="24" :md="16">
        <!-- 最近课程 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近课程</span>
              <el-button text type="primary" @click="$router.push('/teacher/courses')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div v-if="recentCourses.length > 0" class="course-list">
            <div 
              v-for="course in recentCourses" 
              :key="course.id" 
              class="course-item"
              @click="viewCourse(course)"
            >
              <div class="course-cover">
                <img :src="getCourseImage(course.image)" alt="课程封面" />
              </div>
              <div class="course-info">
                <div class="course-name">{{ course.courseName || course.name }}</div>
                <div class="course-meta">
                  <span><el-icon><User /></el-icon> {{ course.studentCount || 0 }}人</span>
                  <span><el-icon><Document /></el-icon> {{ course.chapterCount || 0 }}章节</span>
                </div>
              </div>
              <div class="course-action">
                <el-button type="primary" size="small">进入课程</el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无课程" />
        </el-card>

        <!-- 待办事项 -->
        <el-card class="section-card" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">待办事项</span>
            </div>
          </template>
          
          <div v-if="todoList.length > 0" class="todo-list">
            <div 
              v-for="(todo, index) in todoList" 
              :key="index" 
              class="todo-item"
            >
              <div class="todo-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title">{{ todo.title }}</div>
                <div class="todo-desc">{{ todo.description }}</div>
              </div>
              <div class="todo-count">
                <el-tag type="warning">{{ todo.count }}项</el-tag>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无待办事项" />
        </el-card>
      </el-col>

      <!-- 右侧列 -->
      <el-col :xs="24" :md="8">
        <!-- 快速入口 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <span class="card-title">快速入口</span>
          </template>
          
          <div class="quick-actions">
            <el-button class="action-btn" @click="$router.push('/teacher/course/create')">
              <el-icon><Plus /></el-icon>
              <span>创建课程</span>
            </el-button>
            <el-button class="action-btn" @click="$router.push('/teacher/homework')">
              <el-icon><Document /></el-icon>
              <span>发布作业</span>
            </el-button>
            <el-button class="action-btn" @click="$router.push('/teacher/exams')">
              <el-icon><Edit /></el-icon>
              <span>创建考试</span>
            </el-button>
            <el-button class="action-btn" @click="$router.push('/teacher/classes')">
              <el-icon><User /></el-icon>
              <span>班级管理</span>
            </el-button>
          </div>
        </el-card>

        <!-- 最近留言 -->
        <el-card class="section-card" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近留言</span>
              <el-button text type="primary" @click="$router.push('/teacher/messages')">
                查看全部
              </el-button>
            </div>
          </template>
          
          <div v-if="recentMessages.length > 0" class="message-list">
            <div v-for="(message, index) in recentMessages" :key="index" class="message-item">
              <el-avatar :size="40">{{ message.studentName?.charAt(0) || 'S' }}</el-avatar>
              <div class="message-content">
                <div class="message-name">{{ message.studentName }}</div>
                <div class="message-text">{{ message.content }}</div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无留言" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, User, Document, ChatDotRound, ArrowRight, Plus, Edit } from '@element-plus/icons-vue'
import { getDashboardData } from '@/api/dashboard.js'
import { getCourseList } from '@/api/course.js'

const router = useRouter()

const teacherName = ref(localStorage.getItem('teacherName') || '教师')
const loading = ref(false)

const statistics = ref({
  courseCount: 0,
  studentCount: 0,
  pendingHomeworkCount: 0,
  unreadMessageCount: 0
})

const recentCourses = ref([])
const todoList = ref([])
const recentMessages = ref([])

const fetchDashboardData = async () => {
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    if (!teacherId) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }

    loading.value = true
    
    try {
      // 尝试调用Dashboard API
      const response = await getDashboardData(teacherId)
      
      if (response.code === 200 && response.data) {
        // 更新统计数据
        if (response.data.statistics) {
          statistics.value = {
            courseCount: response.data.statistics.courseCount || 0,
            studentCount: response.data.statistics.studentCount || 0,
            pendingHomeworkCount: response.data.statistics.pendingHomeworkCount || 0,
            unreadMessageCount: response.data.statistics.unreadMessageCount || 0
          }
        }
        
        // 更新最近课程
        recentCourses.value = response.data.recentCourses || []
        
        // 更新待办事项
        todoList.value = response.data.todoList || []
        
        // 更新最近留言
        recentMessages.value = response.data.recentMessages || []
      }
    } catch (dashboardError) {
      console.log('Dashboard API不可用，使用课程列表API获取数据')
      
      // 如果Dashboard API失败，直接调用课程列表API获取最近3条课程
      try {
        const courseResponse = await getCourseList({
          pageNumber: 1,
          pageSize: 100,
          teacherId: teacherId
        })
        
        if (courseResponse.success && courseResponse.data) {
          // 获取所有课程，按创建时间倒序排序，取前3条
          const allCourses = courseResponse.data.list || []
          recentCourses.value = allCourses
            .sort((a, b) => {
              const dateA = new Date(a.createTime || 0)
              const dateB = new Date(b.createTime || 0)
              return dateB - dateA // 倒序：最新的在前
            })
            .slice(0, 3) // 只取前3条
          
          // 更新课程统计
          statistics.value.courseCount = allCourses.length
        }
      } catch (courseError) {
        console.error('获取课程列表失败:', courseError)
      }
    }
  } catch (error) {
    console.error('获取Dashboard数据失败:', error)
    // 失败时使用空数据，不影响页面显示
    statistics.value = {
      courseCount: 0,
      studentCount: 0,
      pendingHomeworkCount: 0,
      unreadMessageCount: 0
    }
    recentCourses.value = []
    todoList.value = []
    recentMessages.value = []
  } finally {
    loading.value = false
  }
}

const getCourseImage = (image) => {
  if (!image) return 'https://via.placeholder.com/80x60?text=Course'
  if (image.startsWith('http')) return image
  return `http://localhost:8088${image}`
}

const viewCourse = (course) => {
  router.push({
    path: '/teacher/course/' + course.id
  })
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  color: white;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.statistics-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.student-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.homework-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.message-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.content-row {
  margin-top: 24px;
}

.section-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
}

.course-item:hover {
  background-color: #ecf5ff;
  transform: translateX(4px);
}

.course-cover {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-info {
  flex: 1;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.course-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #909399;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.todo-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-content {
  flex: 1;
}

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.todo-desc {
  font-size: 12px;
  color: #909399;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.message-content {
  flex: 1;
}

.message-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.message-text {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
