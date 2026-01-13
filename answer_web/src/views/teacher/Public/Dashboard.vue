<template>
  <div class="dashboard-container">
    <!-- 背景装饰：采用更柔和的流体感，降低干扰 -->
    <div class="bg-decoration">
      <div class="fluid-blob blob-1"></div>
      <div class="fluid-blob blob-2"></div>
    </div>

    <div class="dashboard-content">
      <!-- 顶部欢迎语 -->
      <header class="welcome-header">
        <h1 class="welcome-title">欢迎回来，教师工作台</h1>
        <p class="welcome-subtitle">{{ currentTime }} · 保持卓越教学状态</p>
      </header>

      <!-- 统计卡片区域 -->
      <section class="stats-grid">
        <div v-for="(stat, index) in statCards" :key="index" class="stat-card glass-morph">
          <div class="stat-icon-wrapper" :style="{ background: stat.glowColor }">
            <el-icon :size="24" :style="{ color: stat.iconColor }">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ stat.label }}</span>
            <div class="stat-main">
              <span class="stat-value">
                <count-to :startVal="0" :endVal="stat.value" :duration="2000" :decimals="stat.decimals || 0"></count-to>
              </span>
              <span class="stat-trend" :class="stat.trendUp ? 'up' : 'down'">
                <el-icon size="14"><Top v-if="stat.trendUp" /><Bottom v-else /></el-icon>
                {{ stat.trend }}
              </span>
            </div>
            <div class="stat-desc" :style="{ color: stat.iconColor }">
              {{ stat.desc }}
            </div>
          </div>
        </div>
      </section>

      <div class="dashboard-main-layout">
        <!-- 左侧：课程管理 -->
        <div class="main-left">
          <div class="section-header">
            <h3 class="section-title">进行中的课程</h3>
            <button class="text-btn" @click="$router.push('/teacher/courses')">查看全部</button>
          </div>

          <div class="courses-grid">
            <div v-for="course in recentCourses" :key="course.id" class="course-card-ios glass-morph">
              <div class="course-visual">
                <img :src="getCourseImage(course.image)" alt="cover" class="rect-course-img" />
                <div class="course-status-tag">授课中</div>
                <div class="course-visual-overlay"></div>
              </div>
              <div class="course-details">
                <h4 class="course-name">{{ course.courseName }}</h4>
                <div class="course-stats">
                  <span><el-icon size="14"><User /></el-icon> {{ course.studentCount || 0 }} 学生</span>
                  <span><el-icon size="14"><Reading /></el-icon> {{ course.chapterCount || 0 }} 章节</span>
                </div>
                <button class="ios-action-btn" @click="viewCourse(course)">
                  管理课程 <el-icon size="16"><ArrowRight /></el-icon>
                </button>
              </div>
            </div>

            <!-- 新增入口：仅在课程数量少于 2 时显示 -->
            <div v-if="recentCourses.length < 2" class="add-card-ios glass-morph" @click="$router.push('/teacher/course/create')">
              <div class="plus-circle">
                <el-icon :size="28"><Plus /></el-icon>
              </div>
              <span class="add-text">导入新课程</span>
            </div>
          </div>
        </div>

        <!-- 右侧：动态广场 -->
        <div class="main-right">
          <div class="section-header">
            <h3 class="section-title">动态广场</h3>
            <button class="text-btn mini" @click="refreshActivity">
              <el-icon size="14"><Refresh /></el-icon> 刷新
            </button>
          </div>

          <div class="activity-plaza glass-morph">
            <!-- 统计图 -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-label">近期活跃趋势</div>
                <div class="chart-total">{{ totalActivities }} 条动态</div>
              </div>
              <div class="activity-chart" ref="activityChartRef"></div>
            </div>

            <!-- 动态列表：实时反馈后端数据，最多显示 3 条 -->
            <div class="timeline-ios">
              <div v-for="(msg, i) in recentMessages.slice(0, 3)" :key="i" class="timeline-item">
                <div class="timeline-avatar-wrapper">
                  <!-- 使用学生真实头像 -->
                  <el-avatar 
                    :size="48" 
                    :src="getStudentAvatar(msg.studentAvatar)" 
                    class="timeline-avatar-real"
                  >
                    <div class="timeline-avatar-fallback" :style="{ backgroundColor: getAvatarColor(msg.studentName) }">
                      {{ msg.studentName?.charAt(0) || 'U' }}
                    </div>
                  </el-avatar>
                  <div class="avatar-glow" :style="{ backgroundColor: getAvatarColor(msg.studentName) }"></div>
                </div>
                <div class="timeline-body">
                  <div class="timeline-header">
                    <span class="student-name">{{ msg.studentName }}</span>
                    <span class="time-stamp">{{ formatSmartTime(msg.time) }}</span>
                  </div>
                  <p class="timeline-text">
                    {{ getActionText(msg.type, msg.content) }}
                  </p>
                </div>
              </div>
              <div v-if="recentMessages.length === 0" class="empty-state">
                <el-icon size="24"><Message /></el-icon>
                <p>暂无最新动态</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CountTo } from 'vue3-count-to'
import {
  User, TrendCharts, EditPen, ChatDotRound, Top, Bottom, MoreFilled,
  Reading, ArrowRight, Plus, Clock, Refresh, Message
} from '@element-plus/icons-vue'
import { useTeacherDashboard } from '@/assets/js/teacher/dashboard.js'

const {
  loading,
  activityChartRef,
  currentTime,
  statistics,
  recentCourses,
  recentMessages,
  statCards,
  totalActivities,
  getAvatarColor,
  refreshActivity,
  getCourseImage,
  getStudentAvatar,
  getActionText,
  viewCourse,
  formatSmartTime
} = useTeacherDashboard()
</script>

<style scoped>
@import '@/assets/css/teacher/dashboard.css';
</style>
