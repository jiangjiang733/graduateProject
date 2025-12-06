<template>
  <div class="student-dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>你好，{{ userInfo.username || '同学' }} 👋</h1>
        <p>准备好开始今天的学习了吗？你还有 {{ todoList.length }} 项待办事项。</p>
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

    <div class="dashboard-layout">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <!-- 我的课程 -->
        <div class="section-container">
          <div class="section-header">
            <h2>
              <el-icon><Reading /></el-icon>
              最近课程
            </h2>
            <el-button link type="primary" @click="viewAllCourses">查看全部</el-button>
          </div>
          
          <div v-if="loading" class="loading-skeleton">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="courses.length === 0" class="empty-state">
            <el-empty description="还没有加入任何课程">
              <el-button type="primary" @click="viewAllCourses">去选课</el-button>
            </el-empty>
          </div>
          
          <div v-else class="course-grid">
            <div 
              v-for="course in courses" 
              :key="course.id" 
              class="course-card"
              @click="continueLearning(course.id)"
            >
              <div class="course-cover">
                <img :src="course.image || 'https://placeholder.com/300x200'" :alt="course.courseName">
                <span class="course-tag">{{ course.classification || '综合' }}</span>
              </div>
              <div class="course-info">
                <h3 class="course-title" :title="course.courseName">{{ course.courseName }}</h3>
                <div class="course-teacher">
                  <el-icon><User /></el-icon>
                  {{ course.teacherName || '未知教师' }}
                </div>
                <div class="course-progress">
                  <div class="progress-text">
                    <span>学习进度</span>
                    <span>{{ course.progress }}%</span>
                  </div>
                  <el-progress 
                    :percentage="course.progress" 
                    :show-text="false" 
                    :stroke-width="6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="section-container">
          <div class="section-header">
            <h2>
              <el-icon><Clock /></el-icon>
              最近活动
            </h2>
          </div>
          <el-card class="activity-card" shadow="hover">
            <el-timeline class="activity-timeline">
              <el-timeline-item
                v-for="activity in activities"
                :key="activity.id"
                :timestamp="activity.timestamp"
                :color="activity.color"
              >
                <div class="activity-content">
                  <h4>{{ activity.content }}</h4>
                  <p>{{ activity.type === 'homework' ? '作业提交' : '课程学习' }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>
      </div>

      <!-- 右侧侧边栏 -->
      <div class="sidebar">
        <!-- 待办事项 -->
        <el-card class="todo-card" shadow="hover">
          <template #header>
            <div class="section-header" style="margin-bottom: 0;">
              <h3>待办事项</h3>
              <el-tag type="danger" effect="dark" round size="small">{{ todoList.length }}</el-tag>
            </div>
          </template>
          <div class="todo-list">
            <div 
              v-for="item in todoList" 
              :key="item.id" 
              class="todo-item"
              :class="{ urgent: item.urgent }"
            >
              <div class="todo-icon">
                <el-icon v-if="item.type === 'homework'"><Edit /></el-icon>
                <el-icon v-else-if="item.type === 'exam'"><document /></el-icon>
                <el-icon v-else><collection /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-title" :title="item.title">{{ item.title }}</div>
                <div class="todo-deadline">截止: {{ item.deadline }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 日历 -->
        <el-card class="calendar-card" shadow="hover">
          <el-calendar v-model="currentDate" class="mini-calendar" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Search, Reading, User, Clock, Edit, Document, Collection 
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
</style>
