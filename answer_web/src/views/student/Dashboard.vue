<template>
  <div class="dashboard-container">
    <!-- 顶部导航 -->
    <header class="dashboard-header">
      <div class="header-inner">
        <div class="user-profile">
          <div class="avatar-wrapper" @click="$router.push('/student/profile')" style="cursor: pointer;">
            <el-avatar :size="56" :src="userStore.avatarUrl">
              {{ (userStore.userName || 'S').charAt(0) }}
            </el-avatar>
            <div class="status-indicator"></div>
          </div>
          <div class="welcome-text">
            <h2>{{ greetingTime }}，{{ userStore.userName || '同学' }}</h2>
            <p>准备好开始今天的学习了吗？你还有 {{ todoList.length }} 项待办事项。</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="search-wrapper">
            <el-input
                v-model="searchQuery"
                placeholder="搜索课程..."
                class="modern-search"
                @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </header>

    <main class="dashboard-content">
      <!-- 统计指标 -->
      <section class="stats-overview">
        <div class="stat-glass-card clickable" @click="$router.push('/student/courses')">
          <div class="stat-icon" style="color: #6366f1; background-color: #eef2ff">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <span class="value">{{ allCourses.length }}</span>
            <span class="label">在修课程</span>
          </div>
        </div>

        <div class="stat-glass-card clickable" @click="$router.push('/student/homework')">
          <div class="stat-icon" style="color: #f59e0b; background-color: #fffbeb">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <span class="value">{{ todoList.length }}</span>
            <span class="label">待办事项</span>
          </div>
        </div>

        <div class="stat-glass-card clickable" @click="$router.push('/student/messages')">
          <div class="stat-icon" style="color: #10b981; background-color: #ecfdf5">
            <el-icon><Opportunity /></el-icon>
          </div>
          <div class="stat-info">
            <span class="value">{{ activities?.length || 0 }}</span>
            <span class="label">近期动态</span>
          </div>
        </div>
      </section>

      <div class="main-layout">
        <!-- 课程区域 -->
        <section class="course-section">
          <div class="section-header">
            <h3><el-icon><Reading /></el-icon> 最近课程</h3>
            <el-button type="primary" link @click="viewAllCourses">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
          </div>

          <div v-if="loading" class="skeleton-grid">
            <el-skeleton v-for="i in 2" :key="i" animated>
              <template #template>
                <el-skeleton-item variant="image" style="height: 160px; border-radius: 12px" />
                <div style="padding: 14px">
                  <el-skeleton-item variant="h3" style="width: 50%" />
                  <el-skeleton-item variant="text" style="margin-top: 8px" />
                </div>
              </template>
            </el-skeleton>
          </div>

          <div v-else-if="!courses || courses.length === 0" class="empty-box">
            <el-empty description="还没有加入任何课程">
              <el-button type="primary" @click="viewAllCourses" round>去选课</el-button>
            </el-empty>
          </div>

          <div v-else class="course-list">
            <div
                v-for="course in courses.slice(0, 3)"
                :key="course.id"
                class="premium-course-strip"
                @click="continueLearning(course.id)"
            >
              <div class="strip-banner">
                <img :src="course.image" alt="cover" class="rect-img">
                <div class="category-tag">{{ course.classification }}</div>
              </div>
              <div class="strip-content">
                <div class="content-main">
                  <h4 class="course-title">{{ course.courseName }}</h4>
                  <div class="course-info">
                    <div class="info-item">
                      <el-icon><User /></el-icon>
                      <span>{{ course.teacherName }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Clock /></el-icon>
                      <span>最近学习: 刚刚</span>
                    </div>
                  </div>
                </div>
                <div class="content-status">
                  <span class="status-btn">继续学习 <el-icon><ArrowRight /></el-icon></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 侧边栏 -->
        <aside class="sidebar-section">
          <div class="sidebar-card task-card">
            <div class="card-title">
              <h4>待办事项</h4>
              <span class="count-tag">{{ todoList.length }}</span>
            </div>
            <div class="todo-list-modern">
              <div v-for="item in todoList" :key="item.id" class="todo-row">
                <div class="check-box">
                  <el-icon><Edit /></el-icon>
                </div>
                <div class="todo-body">
                  <p class="title">{{ item.title }}</p>
                  <span class="time"><el-icon><Clock /></el-icon> {{ item.deadline }}</span>
                </div>
              </div>
              <div v-if="todoList.length === 0" class="no-tasks">
                <el-empty :image-size="40" description="暂无待办" />
              </div>
            </div>
          </div>

          <div class="sidebar-card quick-links">
            <h4>快速通道</h4>
            <div class="link-grid">
              <div class="link-item"><el-icon><Files /></el-icon><span>资源</span></div>
              <div class="link-item"><el-icon><ChatLineRound /></el-icon><span>讨论</span></div>
              <div class="link-item"><el-icon><TrendCharts /></el-icon><span>成绩</span></div>
              <div class="link-item"><el-icon><QuestionFilled /></el-icon><span>答疑</span></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Search, Reading, User, Clock, ArrowRight,
  Monitor, Timer, Opportunity, Edit, Files,
  ChatLineRound, TrendCharts, QuestionFilled
} from '@element-plus/icons-vue'
import { useStudentDashboard } from '@/assets/js/student/dashboard.js'
import { useUserInfo } from '@/stores/user.js'

const userStore = useUserInfo()

const {
  userInfo,
  searchQuery,
  courses,
  allCourses,
  todoList,
  activities,
  loading,
  handleSearch,
  continueLearning,
  viewAllCourses
} = useStudentDashboard()

const greetingTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 5) return '深夜好'
  if (hour < 11) return '早安'
  if (hour < 13) return '午安'
  if (hour < 18) return '下午好'
  return '晚安'
})
</script>

<style scoped>
@import '@/assets/css/student/dashboard.css';
</style>