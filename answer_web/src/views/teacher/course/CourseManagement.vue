<template>
  <div class="course-management">
    <div class="course-header">
      <div class="search-input">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索课程" 
          prefix-icon="Search"
          @keyup.enter="handleSearch"
          clearable
          @clear="handleSearch"
        />
        <el-button @click="handleSearch" style="margin-left: 8px;">搜索</el-button>
      </div>
      <el-button type="primary" @click="createCourse">
        <el-icon><Plus /></el-icon>
        创建课程
      </el-button>
    </div>

    <!-- 筛选和统计栏 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-container">
        <div class="filter-tabs">
          <el-radio-group v-model="currentFilter" @change="handleFilterChange">
            <el-radio-button value="draft">
              <el-icon><Document /></el-icon>
              草稿 ({{ stats.draftCourses }})
            </el-radio-button>
            <el-radio-button value="published">
              <el-icon><VideoPlay /></el-icon>
              已发布 ({{ stats.activeCourses }})
            </el-radio-button>
            <el-radio-button value="all">
              <el-icon><Folder /></el-icon>
              全部 ({{ stats.totalCourses }})
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="stats-info">
          <el-tag type="info" size="large">共 {{ pagination.total }} 门课程</el-tag>
        </div>
      </div>
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
    <!-- 课程列表 -->
    <div v-if="!loading && courses.length > 0" class="course-grid">
      <el-card 
        v-for="course in courses" 
        :key="course.id"
        class="course-card" 
        shadow="hover"
      >
        <template #header>
          <div class="course-header-content">
            <div class="course-header-title">{{ course.courseName || course.name }}</div>
            <el-tag 
              :type="course.state === 1 ? 'success' : 'info'" 
              size="small"
            >
              {{ course.state === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </div>
        </template>
        <div class="course-content">
          <img
            :src="getCourseImage(course.image)"
            :alt="course.courseName || course.name"
            class="course-image"
          />
          <div class="course-info">
            <div class="course-description">{{ course.courseDescription || course.description || '暂无描述' }}</div>
            <div class="course-meta">
              <div class="meta-row">
                <el-icon><User /></el-icon>
                <span>教师：{{ course.teacherName }}</span>
              </div>
              <div class="meta-row">
                <el-icon><Key /></el-icon>
                <span>课程码：{{ course.courseCode || '未设置' }}</span>
              </div>
              <div class="meta-row">
                <el-icon><Calendar /></el-icon>
                <span>创建：{{ formatDate(course.createTime) }}</span>
              </div>
              <div v-if="course.startTime && course.endTime" class="meta-row">
                <el-icon><Clock /></el-icon>
                <span>课程时间：{{ formatDate(course.startTime) }} 至 {{ formatDate(course.endTime) }}</span>
              </div>
              <div v-if="course.major" class="meta-row">
                <el-icon><School /></el-icon>
                <span>专业：{{ course.major }}</span>
              </div>
              <div v-if="course.classification" class="meta-row">
                <el-icon><Collection /></el-icon>
                <span>分类：{{ course.classification }}</span>
              </div>
            </div>
          </div>
          <div class="course-actions">
            <el-button size="small" @click.stop="viewCourseDetail(course)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button size="small" type="primary" @click.stop="editCourse(course)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleDropdownCommand(command, course)">
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="toggle-state">
                    {{ course.state === 1 ? '设为草稿' : '发布课程' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="copy-code">复制课程码</el-dropdown-item>
                  <el-dropdown-item command="export" disabled>导出课程</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <span style="color: #f56c6c;">删除课程</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && courses.length === 0" :description="getEmptyDescription()" :image-size="200" />

    <!-- 分页 -->
    <div v-if="!loading && pagination.total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[3, 6, 12, 24]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { useCourseManagement } from '@/assets/js/teacher/course-management.js'

const {
  courses,
  loading,
  searchKeyword,
  currentFilter,
  stats,
  pagination,
  activeCourses,
  totalChapters,
  handleSearch,
  handleFilterChange,
  handlePageChange,
  handleSizeChange,
  getCourseImage,
  viewCourseDetail,
  editCourse,
  createCourse,
  handleDropdownCommand,
  formatDate
} = useCourseManagement()

// 根据当前筛选状态显示不同的空状态提示
const getEmptyDescription = () => {
  if (currentFilter.value === 'draft') {
    return '暂无草稿课程，点击右上角创建课程'
  } else if (currentFilter.value === 'published') {
    return '暂无已发布课程，请先发布课程'
  } else {
    return '暂无课程，点击右上角创建课程'
  }
}
</script>

<style scoped>
@import '@/assets/css/teacher/course-management.css';
</style>
