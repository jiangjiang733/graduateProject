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

              <div class="card-meta">
                <div class="meta-item"><el-icon><Reading /></el-icon>{{ course.chapterCount }} 课时</div>
              </div>

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
.course-list-page {
  --primary: #4f46e5;
  --bg-main: #ffffff;
  --bg-sub: #f8fafc;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --border: #e2e8f0;

  background-color: var(--bg-main);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* 顶部 Header 重构 */
.page-header {
  border-bottom: 1px solid var(--border);
  padding: 40px 0;
  background: linear-gradient(to bottom, #f8faff, #ffffff);
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 12px;
}

.main-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -1px;
}

.modern-search-box {
  width: 380px;
}

.modern-search-box :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 10px 16px;
  background: #fff;
  box-shadow: 0 4px 10px -2px rgba(0,0,0,0.05) !important;
}

.modern-search-box :deep(.el-input-group__append) {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0 12px 12px 0;
  font-weight: 600;
}

/* 布局容器 */
.main-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 32px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 48px;
}

@media (max-width: 1024px) {
  .main-container { grid-template-columns: 1fr; }
}

/* 侧边筛选 */
.filter-panel {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.filter-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chip-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-chip {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  background: #f1f5f9;
  color: var(--text-main);
}

.tag-chip.active {
  background: var(--primary);
  color: white;
}

.filter-divider {
  height: 1px;
  background: var(--border);
  margin: 32px 0;
}

.select-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sort-radios {
  display: flex;
  flex-direction: column;
}

/* 课程网格 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}

.course-card-premium {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.course-card-premium:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
  border-color: #6366f133;
}

.card-cover-wrapper {
  height: 160px;
  position: relative;
  overflow: hidden;
}

.card-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}

.course-card-premium:hover .card-cover-wrapper img {
  transform: scale(1.08);
}

.type-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-main);
}

.hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.course-card-premium:hover .hover-overlay {
  opacity: 1;
}

.card-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.course-title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.4;
  height: 2.8rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-instructor {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 16px;
}

.course-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.meta-item {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  flex: 1;
  border-radius: 10px;
  font-weight: 700;
  height: 40px;
}

.more-btn {
  font-weight: 700;
  color: var(--text-main);
}

.pagination-wrapper {
  margin-top: 60px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--border);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--primary);
  border-color: var(--primary);
}
</style>