<template>
  <div class="schedule-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><Calendar /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">我的课程表</h2>
          <p class="page-subtitle">查看本周课程安排</p>
        </div>
      </div>
      <div class="week-selector">
        <el-button :icon="ArrowLeft" @click="changeWeek(-1)">上一周</el-button>
        <span class="current-week">第 {{ currentWeek }} 周</span>
        <el-button @click="changeWeek(1)">
          下一周
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 课程表 -->
    <el-card class="schedule-card" v-loading="loading">
      <div class="schedule-table">
        <!-- 表头 -->
        <div class="schedule-header">
          <div class="time-column">时间/星期</div>
          <div class="day-column" v-for="day in weekDays" :key="day.value">
            {{ day.label }}
          </div>
        </div>

        <!-- 表体 -->
        <div class="schedule-body">
          <div class="schedule-row" v-for="section in sections" :key="section">
            <div class="time-column">
              <div class="section-number">第{{ section }}节</div>
              <div class="section-time">{{ getSectionTime(section) }}</div>
            </div>
            <div 
              class="day-column" 
              v-for="day in weekDays" 
              :key="`${day.value}-${section}`"
            >
              <div 
                v-if="getCourse(day.value, section)"
                class="course-cell"
                :class="getCourseClass(day.value, section)"
                @click="viewCourseDetail(getCourse(day.value, section))"
              >
                <div class="course-name">{{ getCourse(day.value, section).courseName }}</div>
                <div class="course-location">
                  <el-icon><Location /></el-icon>
                  {{ getCourse(day.value, section).location }}
                </div>
                <div class="course-time">
                  {{ getCourse(day.value, section).startSection }}-{{ getCourse(day.value, section).endSection }}节
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!hasSchedule" description="本周暂无课程安排" :image-size="200" />
    </el-card>

    <!-- 课程详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="课程详情"
      width="600px"
    >
      <div v-if="selectedCourse" class="course-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="课程名称">
            {{ selectedCourse.courseName }}
          </el-descriptions-item>
          <el-descriptions-item label="上课时间">
            {{ getDayName(selectedCourse.dayOfWeek) }} 第{{ selectedCourse.startSection }}-{{ selectedCourse.endSection }}节
          </el-descriptions-item>
          <el-descriptions-item label="上课地点">
            {{ selectedCourse.location }}
          </el-descriptions-item>
          <el-descriptions-item label="周数">
            第{{ selectedCourse.startWeek }}-{{ selectedCourse.endWeek }}周
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button type="primary" @click="goToCourse">进入课程</el-button>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Calendar, ArrowLeft, ArrowRight, Location } from '@element-plus/icons-vue'
import { useSchedule } from '@/assets/js/student/schedule'

const {
  loading,
  currentWeek,
  detailDialogVisible,
  selectedCourse,
  weekDays,
  sections,
  hasSchedule,
  changeWeek,
  getCourse,
  getCourseClass,
  getSectionTime,
  getDayName,
  viewCourseDetail,
  goToCourse
} = useSchedule()
</script>

<style scoped>
@import '@/assets/css/student/schedule.css';
</style>
