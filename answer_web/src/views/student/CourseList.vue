<template>
  <div class="course-list-page">
    <!-- 顶部轻量化 Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="breadcrumb-nav">
            <span class="root">学习中心</span>
            <el-icon><ArrowRight /></el-icon>
            <span class="current">我的课程</span>
          </div>
          <h1 class="main-title">开启你的知识之旅</h1>
        </div>

        <div class="header-right">
          <div class="modern-search-box">
            <el-input
                v-model="searchQuery"
                placeholder="搜索课程..."
                @keyup.enter="handleSearch"
                clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
              <template #append>
                <el-button @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </header>

    <main class="main-container">
      <!-- 现代化筛选控制台 -->
      <aside class="filter-panel">
        <div class="filter-section">
          <h3 class="filter-title">专业筛选</h3>
          <div class="chip-group">
            <div
                v-for="item in categories"
                :key="item.value"
                class="tag-chip"
                :class="{ active: filters.major === item.value }"
                @click="filters.major = item.value; handleFilterChange()"
            >
              {{ item.label }}
            </div>
          </div>
        </div>

        <div class="filter-divider"></div>

        <div class="filter-section">
          <h3 class="filter-title">课程类型</h3>
          <div class="chip-group">
            <div
                v-for="item in classifications"
                :key="item.value"
                class="tag-chip"
                :class="{ active: filters.classification === item.value }"
                @click="filters.classification = item.value; handleFilterChange()"
            >
              {{ item.label }}
            </div>
          </div>
        </div>

      </aside>

      <!-- 课程展示区 -->
      <section class="course-content">
        <div v-if="loading" class="loading-grid">
          <el-skeleton v-for="i in 6" :key="i" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: 160px; border-radius: 12px" />
              <div style="padding: 16px 0">
                <el-skeleton-item variant="h3" style="width: 50%" />
                <el-skeleton-item variant="text" style="margin-top: 10px" />
              </div>
            </template>
          </el-skeleton>
        </div>

        <div v-else-if="courses.length === 0" class="empty-state">
          <el-empty description="暂无课程" />
        </div>

        <div v-else class="course-grid">
          <div
              v-for="course in courses"
              :key="course.id"
              class="course-card-premium"
              :class="{ 'not-joined': !course.isJoined }"
              @click="course.isJoined ? goToLearn(course.id) : null"
          >
            <div class="card-cover-wrapper">
              <img :src="getCourseImage(course.image)" :alt="course.courseName" />
              <span class="type-tag">{{ course.classification }}</span>
              <div class="hover-overlay">
                <el-button type="primary" circle size="large">
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
              </div>
            </div>

            <div class="card-info">
              <h4 class="course-title">{{ course.courseName }}</h4>

              <div class="course-instructor">
                <el-avatar :size="20" :src="getTeacherAvatar(course.teacherAvatar)" />
                <span>{{ course.teacherName || '主讲教师' }}</span>
              </div>

              <div class="course-meta">
                <span class="major-label"><el-icon><Collection /></el-icon> {{ course.major }}</span>
              </div>


              <div class="card-footer">
                <!-- 已加入课程 -->
                <template v-if="course.isJoined">
                  <el-button type="primary" class="action-btn" @click.stop="goToLearn(course.id)">
                    进入学习
                  </el-button>
                  <el-button link class="more-btn" @click.stop="goToCourseDetail(course.id)">
                    详情 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </template>

                <!-- 审核中 -->
                <template v-else-if="course.enrollmentStatus === 'pending'">
                  <el-button type="warning" class="action-btn" disabled>
                    审核中...
                  </el-button>
                  <el-button link class="more-btn" @click.stop="goToCourseDetail(course.id)">
                    详情 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </template>

                <!-- 未加入 -->
                <template v-else>
                  <el-button type="success" class="action-btn" @click.stop="applyToCourse(course)">
                    申请加入
                  </el-button>
                  <el-button link class="more-btn" @click.stop="goToCourseDetail(course.id)">
                    详情 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              background
              @current-change="handlePageChange"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import {
  Search, User, Clock, Reading, ArrowRight, VideoPlay, Collection
} from '@element-plus/icons-vue'
import { useCourseList } from '@/assets/js/student/course-list.js'

/**
 * 核心逻辑由 useCourseList 驱动，确保后端数据响应
 */
const {
  courses,
  loading,
  searchQuery,
  currentPage,
  pageSize,
  total,
  filters,
  categories,
  classifications,
  sortOptions,
  handleSearch,
  handleFilterChange,
  handlePageChange,
  goToCourseDetail,
  goToLearn,
  applyToCourse,
  getCourseImage,
  getTeacherAvatar,
  formatDate
} = useCourseList()
</script>

<style scoped>
@import '@/assets/css/student/course-list.css';
</style>