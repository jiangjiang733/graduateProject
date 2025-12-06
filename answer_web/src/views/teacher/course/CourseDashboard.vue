<template>
  <div class="course-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <h1 class="page-title">课程管理数据</h1>
      <p class="page-subtitle">管理您的所有课程，查看统计数据和最新动态</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card total-courses" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-number">{{ stats.totalCourses }}</div>
            <div class="stat-label">总课程数</div>
            <div class="stat-change">
              <el-icon color="#67c23a"><TrendCharts /></el-icon>
              <span class="change-text">+{{ stats.newCoursesThisMonth || 0 }} 本月</span>
            </div>
          </div>
          <div class="stat-icon">
            <el-icon color="#409eff" size="48"><Document /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card active-courses" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-number">{{ stats.activeCourses }}</div>
            <div class="stat-label">已发布课程</div>
            <div class="stat-change">
              <el-icon color="#67c23a"><Check /></el-icon>
              <span class="change-text">{{ activeCoursesPercent }}% 发布率</span>
            </div>
          </div>
          <div class="stat-icon">
            <el-icon color="#67c23a" size="48"><VideoPlay /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card total-chapters" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-number">{{ stats.totalChapters }}</div>
            <div class="stat-label">总章节数</div>
            <div class="stat-change">
              <el-icon color="#e6a23c"><Folder /></el-icon>
              <span class="change-text">平均 {{ avgChaptersPerCourse }} 章节/课程</span>
            </div>
          </div>
          <div class="stat-icon">
            <el-icon color="#e6a23c" size="48"><Folder /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card total-students" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-number">{{ stats.totalStudents }}</div>
            <div class="stat-label">学生总数</div>
            <div class="stat-change">
              <el-icon color="#f56c6c"><User /></el-icon>
              <span class="change-text">平均 {{ avgStudentsPerCourse }} 人/课程</span>
            </div>
          </div>
          <div class="stat-icon">
            <el-icon color="#f56c6c" size="48"><User /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-card class="action-card" shadow="hover">
        <div class="action-header">
          <h3>快速操作</h3>
        </div>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="createCourse">
            <el-icon><Plus /></el-icon>
            创建新课程
          </el-button>
          <el-button type="success" size="large" @click="manageCourses">
            <el-icon><Setting /></el-icon>
            管理课程
          </el-button>
          <el-button type="info" size="large" @click="viewAnalytics">
            <el-icon><DataAnalysis /></el-icon>
            数据分析
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 最近课程 -->
    <div class="recent-courses">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>最近课程</h3>
            <el-button type="primary" link @click="manageCourses">查看全部</el-button>
          </div>
        </template>
        
        <div v-if="loadingCourses" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="recentCourses.length === 0" class="empty-state">
          <el-empty description="暂无课程" :image-size="120">
            <el-button type="primary" @click="createCourse">创建第一个课程</el-button>
          </el-empty>
        </div>
        
        <div v-else class="course-list">
          <div 
            v-for="course in recentCourses" 
            :key="course.id"
            class="course-item"
            @click="viewCourse(course)"
          >
            <div class="course-cover">
              <img :src="getCourseImage(course.image)" :alt="course.courseName" />
            </div>
            <div class="course-info">
              <h4 class="course-title">{{ course.courseName }}</h4>
              <p class="course-description">{{ course.courseDescription || '暂无描述' }}</p>
              <div class="course-meta">
                <el-tag :type="course.state === 1 ? 'success' : 'info'" size="small">
                  {{ course.state === 1 ? '已发布' : '草稿' }}
                </el-tag>
                <span class="course-date">{{ formatDate(course.createTime) }}</span>
              </div>
            </div>
            <div class="course-actions">
              <el-button size="small" type="primary" @click.stop="editCourse(course)">
                编辑
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import {
  Document, VideoPlay, Folder, User, TrendCharts, Check, Plus,
  Setting, DataAnalysis, Edit
} from '@element-plus/icons-vue'
import { getCourseImage } from '@/utils/resource.js'
import { formatDate } from '@/utils/date.js'
import { useCourseDashboard } from '@/assets/js/teacher/course-dashboard.js'

const {
  stats,
  recentCourses,
  loadingCourses,
  activeCoursesPercent,
  avgChaptersPerCourse,
  avgStudentsPerCourse,
  createCourse,
  manageCourses,
  viewAnalytics,
  viewCourse,
  editCourse
} = useCourseDashboard()
</script>

<style scoped>
@import '@/assets/css/teacher/course-dashboard.css';
</style>