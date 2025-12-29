<template>
  <div class="dashboard-container">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1 class="welcome-title">你好，{{ userInfo.username || '同学' }} 👋</h1>
        <p class="welcome-subtitle">准备好开始今天的学习了吗？你还有 {{ todoList.length }} 项待办事项。</p>
      </div>
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索课程..."
          prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- 统计行 (新增，使用 Mock 数据或从 activities 提取) -->
    <div class="statistics-row">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon course-icon"><el-icon><Reading /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ courses.length }}</div>
            <div class="stat-label">在修课程</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-icon homework-icon"><el-icon><Edit /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ todoList.length }}</div>
            <div class="stat-label">待办事项</div>
          </div>
        </div>
      </div>
      <!-- 更多统计项可扩展 -->
    </div>

    <div class="content-row">
      <!-- 左侧主内容：课程列表 -->
      <div class="section-card">
        <div class="card-header">
          <div class="card-title">
            <el-icon><Reading /></el-icon>
            最近课程
          </div>
          <el-button link type="primary" class="card-action" @click="viewAllCourses">查看全部</el-button>
        </div>
        
        <div v-if="loading" class="loading-skeleton">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="courses.length === 0" class="empty-state">
          <el-empty description="还没有加入任何课程">
            <el-button type="primary" @click="viewAllCourses">去选课</el-button>
          </el-empty>
        </div>
        
        <div v-else class="course-list">
          <div 
            v-for="course in courses" 
            :key="course.id" 
            class="course-item"
            @click="continueLearning(course.id)"
          >
            <div class="course-cover">
              <img :src="course.image || 'https://placeholder.com/300x200'" :alt="course.courseName">
            </div>
            <div class="course-info">
              <div class="course-name" :title="course.courseName">{{ course.courseName }}</div>
              <div class="course-meta">
                <span><el-icon><User /></el-icon> {{ course.teacherName || '未知教师' }}</span>
                <span>{{ course.classification || '综合' }}</span>
              </div>
              <div class="course-progress">
                <el-progress 
                  :percentage="course.progress" 
                  :stroke-width="6"
                  style="width: 100px"
                />
                <span class="text-xs text-gray-500">{{ course.progress }}%</span>
              </div>
            </div>
            <div class="course-action">
               <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧侧边栏：待办事项 -->
      <div class="sidebar-column">
        <div class="section-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon><List /></el-icon>
              待办事项
              <el-tag type="danger" round size="small" style="margin-left: 8px">{{ todoList.length }}</el-tag>
            </div>
          </div>
          <div class="todo-list">
            <div 
              v-for="item in todoList" 
              :key="item.id" 
              class="todo-item"
            >
              <div class="todo-icon">
                <el-icon v-if="item.type === 'homework'"><Edit /></el-icon>
                <el-icon v-else-if="item.type === 'exam'"><Document /></el-icon>
                <el-icon v-else><Collection /></el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title" :title="item.title">{{ item.title }}</div>
                <div class="todo-desc">截止: {{ item.deadline }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Search, Reading, User, Clock, Edit, Document, Collection, List, ArrowRight
} from '@element-plus/icons-vue'
import { useStudentDashboard } from '@/assets/js/student/dashboard.js'

const {
  userInfo,
  searchQuery,
  currentDate,
  courses,
  todoList,
  activities,
  loading,
  handleSearch,
  continueLearning,
  viewAllCourses
} = useStudentDashboard()
</script>

<style scoped>
@import '@/assets/css/student/dashboard.css';

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
