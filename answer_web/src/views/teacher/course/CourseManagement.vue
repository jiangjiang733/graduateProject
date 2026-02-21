<template>
  <div class="course-management">
    <!-- 控制面板 -->
    <div class="teacher-course-controls">
      <!-- 状态过滤 -->
      <div class="filter-tabs-modern">
        <el-radio-group v-model="currentFilter" @change="handleFilterChange">
          <el-radio-button value="all">
            <el-icon><Folder /></el-icon> 全部 ({{ stats.totalCourses || 0 }})
          </el-radio-button>
          <el-radio-button value="publish">
            <el-icon><VideoPlay /></el-icon> 已发布 ({{ stats.activeCourses || 0 }})
          </el-radio-button>
          <el-radio-button value="draft">
            <el-icon><Document /></el-icon> 草稿 ({{ stats.draftCourses || 0 }})
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="stats-pill">共 {{ pagination.total || 0 }} 门课程</div>
      <div style="flex:1;" />

      <!-- 搜索 -->
      <div class="search-bar-modern">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索课程名称…"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          clearable
          @clear="handleClearSearch"
        />
        <el-button type="primary" @click="handleSearch" class="search-btn-modern">搜索</el-button>
      </div>

      <!-- 创建 -->
      <el-button type="primary" @click="createCourse" class="create-btn-modern">
        <el-icon><Plus /></el-icon> 创建课程
      </el-button>
    </div>

    <!-- 内容包装器 -->
    <div class="course-content-wrapper">
      <!-- 骨架屏 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <template v-else>
        <!-- 可滚动区域 -->
        <div class="course-scroll-area">
          <!-- 课程卡片网格 -->
          <div v-if="courses.length > 0" class="course-grid">
            <div
              v-for="(course, index) in courses"
              :key="course.id"
              class="course-card-modern"
              @click="viewCourseDetail(course)"
            >
              <!-- 顶部图片/渐变区 -->
              <div class="card-top" :class="'card-color-' + (index % 4)">
                <div v-if="course.image" class="card-top-bg"
                  :style="{ backgroundImage: 'url(' + getCourseImage(course.image) + ')' }" />
                <div v-if="course.image" class="card-top-overlay" />

                <div class="card-top-content">
                  <div class="card-top-header">
                    <!-- 课程码 -->
                    <div class="course-code-pill">{{ course.courseCode || '——' }}</div>

                    <!-- 下拉菜单（阻止冒泡） -->
                    <div @click.stop>
                      <el-dropdown @command="(cmd) => handleDropdownCommand(cmd, course)">
                        <el-icon class="more-icon"><MoreFilled /></el-icon>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="edit">
                              <el-icon><Edit /></el-icon> 编辑课程
                            </el-dropdown-item>
                            <el-dropdown-item command="view">
                              <el-icon><View /></el-icon> 进入课堂
                            </el-dropdown-item>
                            <el-dropdown-item command="toggle-state" divided>
                              {{ course.state === 1 ? '设为草稿' : '立即发布' }}
                            </el-dropdown-item>
                            <el-dropdown-item command="copy-code">复制课程码</el-dropdown-item>
                            <el-dropdown-item command="delete" divided>
                              <span style="color:#f56c6c;">删除课程</span>
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>

                  <!-- 底部：发布状态 + 课程名 -->
                  <div>
                    <div class="card-state-badge" :class="course.state === 1 ? 'published' : 'draft'">
                      {{ course.state === 1 ? '已发布' : '草稿' }}
                    </div>
                    <h3 class="card-course-title">{{ course.courseName || course.name }}</h3>
                  </div>
                </div>
              </div>

              <!-- 底部信息区 -->
              <div class="card-bottom">
                <!-- 选课人数 + 状态行 -->
                <div class="card-status-row">
                  <div class="enrolled-count">
                    <el-icon><User /></el-icon>
                    {{ course.studentCount ?? '—' }} 人选修
                  </div>
                  <div class="status-badge-new" :class="getCourseStatus(course).class">
                    {{ getCourseStatus(course).text }}
                  </div>
                </div>

                <!-- 课程简介 -->
                <div class="card-desc" v-if="course.courseDescription || course.description">
                  {{ course.courseDescription || course.description }}
                </div>
                <div class="card-desc" v-else style="color:#cbd5e1;">暂无课程简介</div>

                <!-- 排课信息（仅有数据时显示） -->
                <div class="schedule-blocks" v-if="course.schedules && course.schedules.length > 0">
                  <div v-for="(sch, i) in course.schedules.slice(0,2)" :key="i" class="sch-item">
                    <div class="sch-time">
                      <el-icon><Calendar /></el-icon>
                      {{ getDayName(sch.dayOfWeek) }} 第{{ sch.startSection }}-{{ sch.endSection }}节
                    </div>
                    <div class="sch-loc">
                      <el-icon><Location /></el-icon>
                      {{ sch.location }}
                    </div>
                  </div>
                </div>

                <!-- 课程有效期 -->
                <div class="course-date-range" v-if="course.startTime || course.endTime">
                  <el-icon><Clock /></el-icon>
                  <span v-if="course.startTime && course.endTime">
                    {{ formatDate(course.startTime) }} 至 {{ formatDate(course.endTime) }}
                  </span>
                  <span v-else-if="course.startTime">
                    开始: {{ formatDate(course.startTime) }}
                  </span>
                  <span v-else-if="course.endTime">
                    截止: {{ formatDate(course.endTime) }}
                  </span>
                </div>

                <!-- 操作按钮 -->
                <div class="card-action-row">
                  <el-button class="btn-detail" @click.stop="goClassroom(course)">
                    <el-icon><Monitor /></el-icon> 进入课堂
                  </el-button>
                  <el-button class="btn-edit" @click.stop="editCourse(course)">
                    <el-icon><Edit /></el-icon> 编辑
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <el-empty
            v-if="courses.length === 0"
            :description="getEmptyDescription()"
            :image-size="200"
          />

          <!-- 分页 — 固定在底部右侧 -->
          <div v-if="pagination.total > 0" class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[ 4,8,12,16,20]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useCourseManagement } from '@/assets/js/teacher/course-management.js'
import {
  Search, Plus, Folder, VideoPlay, Document, View, Edit,
  MoreFilled, User, Calendar, Location, Monitor, Clock
} from '@element-plus/icons-vue'

const {
  courses,
  loading,
  searchKeyword,
  currentFilter,
  stats,
  pagination,
  handleSearch,
  handleClearSearch,
  handleFilterChange,
  handlePageChange,
  handleSizeChange,
  getCourseImage,
  getCourseStatus,
  formatDate,
  viewCourseDetail,
  goClassroom,
  editCourse,
  createCourse,
  handleDropdownCommand,
} = useCourseManagement()

const getEmptyDescription = () => {
  if (currentFilter.value === 'draft') return '暂无草稿课程，点击右上角创建课程'
  if (currentFilter.value === 'publish') return '暂无已发布课程，请先发布课程'
  return '暂无课程，点击右上角创建课程'
}

const getDayName = (day) => {
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return days[day] || ''
}
</script>

<style scoped>
@import '@/assets/css/teacher/course-management.css';
</style>
