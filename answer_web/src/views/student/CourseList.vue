<template>
  <div class="course-list-page">
    <!-- 顶部轻量化 Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="breadcrumb-nav">
            <span class="root">学习中心</span>
            <el-icon><ArrowRight /></el-icon>
            <span class="current">课程探索</span>
          </div>
          <h1 class="main-title">发现属于你的新领域</h1>
        </div>

        <div class="header-right">
          <div class="modern-search-box">
            <el-input
                v-model="searchQuery"
                placeholder="搜索感兴趣的课程、教师..."
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
          <h3 class="filter-title">专业分类</h3>
          <div class="chip-group">
            <div
                v-for="item in categories"
                :key="item.value"
                class="tag-chip"
                :class="{ active: filters.category === item.value }"
                @click="filters.category = item.value; handleFilterChange()"
            >
              {{ item.label }}
            </div>
          </div>
        </div>

        <div class="filter-divider"></div>

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
          <el-empty description="暂时没有符合条件的课程" />
        </div>

        <div v-else class="course-grid">
          <div
              v-for="course in courses"
              :key="course.id"
              class="course-card-premium"
              @click="goToCourseDetail(course.id)"
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

              <p class="course-desc">
                {{ course.courseDescription || course.description || '探索核心知识点，通过实战案例快速掌握专业技能。' }}
              </p>


              <div class="card-footer">
                <el-button
                    type="primary"
                    class="action-btn"
                    :loading="course.enrolling"
                    :disabled="isEnrollButtonDisabled(course)"
                    @click.stop="handleEnroll(course)"
                >
                  {{ getEnrollButtonText(course) }}
                </el-button>
                <el-button link class="more-btn" @click.stop="goToCourseDetail(course.id)">
                  详情 <el-icon><ArrowRight /></el-icon>
                </el-button>
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
  difficulties,
  sortOptions,
  handleSearch,
  handleFilterChange,
  handlePageChange,
  goToCourseDetail,
  handleEnroll,
  getEnrollButtonText,
  isEnrollButtonDisabled,
  getCourseImage,
  getTeacherAvatar,
  formatDate
} = useCourseList()
</script>

<style scoped>
@import '@/assets/css/student/course-list.css';
</style>