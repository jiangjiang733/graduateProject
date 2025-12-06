<template>
  <div class="course-list-page">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-header">
        <h2>全部课程</h2>
        <div class="search-input">
          <el-input
            v-model="searchQuery"
            placeholder="搜索感兴趣的课程..."
            prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">专业分类：</span>
        <div class="filter-options">
          <span 
            v-for="item in categories" 
            :key="item.value"
            class="filter-tag"
            :class="{ active: filters.category === item.value }"
            @click="filters.category = item.value; handleFilterChange()"
          >
            {{ item.label }}
          </span>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">难度等级：</span>
        <div class="filter-options">
          <span 
            v-for="item in difficulties" 
            :key="item.value"
            class="filter-tag"
            :class="{ active: filters.difficulty === item.value }"
            @click="filters.difficulty = item.value; handleFilterChange()"
          >
            {{ item.label }}
          </span>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">排序方式：</span>
        <div class="filter-options">
          <span 
            v-for="item in sortOptions" 
            :key="item.value"
            class="filter-tag"
            :class="{ active: filters.sort === item.value }"
            @click="filters.sort = item.value; handleFilterChange()"
          >
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- 课程列表 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="4" animated count="4" />
    </div>

    <div v-else-if="courses.length === 0" class="empty-state">
      <el-empty description="没有找到相关课程" />
    </div>

    <div v-else class="course-grid">
      <div 
        v-for="course in courses" 
        :key="course.id" 
        class="course-card"
      >
        <div class="course-cover" @click="goToCourseDetail(course.id)">
          <img :src="getCourseImage(course.image)" :alt="course.courseName">
          <span class="course-badge">{{ course.classification || '综合' }}</span>
          <span v-if="course.state === 1" class="course-status-badge">已发布</span>
        </div>
        <div class="course-content">
          <h3 class="course-title" :title="course.courseName" @click="goToCourseDetail(course.id)">
            {{ course.courseName }}
          </h3>
          <div class="course-teacher">
            <el-icon><User /></el-icon>
            {{ course.teacherName || '未知教师' }}
          </div>
          <div class="course-description">
            {{ course.courseDescription || course.description || '暂无描述' }}
          </div>
          <div class="course-meta">
            <div class="course-info-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(course.createTime) }}</span>
            </div>
            <div class="course-info-item">
              <el-icon><Reading /></el-icon>
              <span>{{ course.chapterCount || 0 }}章节</span>
            </div>
          </div>
          <div class="course-actions">
            <el-button 
              type="primary" 
              :loading="course.enrolling"
              :disabled="isEnrollButtonDisabled(course)"
              @click.stop="handleEnroll(course)"
            >
              {{ getEnrollButtonText(course) }}
            </el-button>
            <el-button @click.stop="goToCourseDetail(course.id)">
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { Search, User, StarFilled, Clock, Reading } from '@element-plus/icons-vue'
import { useCourseList } from '@/assets/js/student/course-list.js'

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
  formatDate
} = useCourseList()
</script>

<style scoped>
@import '@/assets/css/student/course-list.css';
</style>
