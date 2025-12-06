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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, ArrowLeft, ArrowRight, Location } from '@element-plus/icons-vue'
import { getStudentSchedule } from '@/api/schedule.js'

const router = useRouter()
const loading = ref(false)
const currentWeek = ref(1)
const scheduleData = ref({})
const detailDialogVisible = ref(false)
const selectedCourse = ref(null)

const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const sectionTimes = {
  1: '08:00-08:45',
  2: '08:55-09:40',
  3: '10:00-10:45',
  4: '10:55-11:40',
  5: '14:00-14:45',
  6: '14:55-15:40',
  7: '16:00-16:45',
  8: '16:55-17:40',
  9: '19:00-19:45',
  10: '19:55-20:40',
  11: '20:50-21:35',
  12: '21:45-22:30'
}

const hasSchedule = computed(() => {
  return Object.keys(scheduleData.value).length > 0
})

// 加载课程表
const loadSchedule = async () => {
  loading.value = true
  try {
    console.log('=== 开始加载学生课程表 ===')
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
    console.log('学生ID:', studentId)
    console.log('当前周数:', currentWeek.value)
    
    if (!studentId) {
      ElMessage.warning('请先登录')
      loading.value = false
      return
    }
    
    const response = await getStudentSchedule(studentId, currentWeek.value)
    console.log('课程表响应:', response)
    
    if (response.success) {
      scheduleData.value = response.data || {}
      console.log('课程表数据:', scheduleData.value)
      console.log('课程数量:', Object.keys(scheduleData.value).length)
    } else {
      console.error('获取课程表失败:', response.message)
      ElMessage.error(response.message || '获取课程表失败')
    }
  } catch (error) {
    console.error('加载课程表失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    ElMessage.error('加载课程表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
    console.log('=== 课程表加载完成 ===')
  }
}

// 切换周数
const changeWeek = (offset) => {
  const newWeek = currentWeek.value + offset
  if (newWeek < 1 || newWeek > 20) {
    ElMessage.warning('周数范围为1-20周')
    return
  }
  currentWeek.value = newWeek
  loadSchedule()
}

// 获取课程
const getCourse = (day, section) => {
  if (!scheduleData.value[day]) return null
  if (!scheduleData.value[day][section]) return null
  return scheduleData.value[day][section]
}

// 获取课程样式类
const getCourseClass = (day, section) => {
  const course = getCourse(day, section)
  if (!course) return ''
  
  // 如果是跨节次的课程，只在第一节显示
  if (course.startSection !== section) {
    return 'course-hidden'
  }
  
  const span = course.endSection - course.startSection + 1
  return `course-span-${span}`
}

// 获取节次时间
const getSectionTime = (section) => {
  return sectionTimes[section] || ''
}

// 获取星期名称
const getDayName = (day) => {
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return days[day] || ''
}

// 查看课程详情
const viewCourseDetail = (course) => {
  if (!course) return
  selectedCourse.value = course
  detailDialogVisible.value = true
}

// 进入课程
const goToCourse = () => {
  if (selectedCourse.value && selectedCourse.value.courseId) {
    router.push(`/student/course/${selectedCourse.value.courseId}`)
  }
}

onMounted(() => {
  loadSchedule()
})
</script>

<style scoped>
.schedule-page {
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  margin-bottom: 28px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #409eff 0%, #1e6fd9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: 0.3px;
}

.page-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.week-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-week {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  min-width: 100px;
  text-align: center;
}

.schedule-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.08);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
}

.schedule-table {
  width: 100%;
  border: 2px solid rgba(64, 158, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.schedule-header {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  background: linear-gradient(135deg, #f8f9fb 0%, #f0f3f7 100%);
  border-bottom: 2px solid rgba(64, 158, 255, 0.1);
}

.schedule-header .time-column,
.schedule-header .day-column {
  padding: 16px;
  text-align: center;
  font-weight: 700;
  font-size: 15px;
  color: #1f2937;
  border-right: 1px solid rgba(64, 158, 255, 0.1);
}

.schedule-header .day-column:last-child {
  border-right: none;
}

.schedule-body {
  background: white;
}

.schedule-row {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.schedule-row:last-child {
  border-bottom: none;
}

.time-column {
  padding: 12px;
  text-align: center;
  border-right: 1px solid rgba(64, 158, 255, 0.1);
  background: linear-gradient(135deg, #fafbfc 0%, #f8f9fb 100%);
}

.section-number {
  font-weight: 700;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.section-time {
  font-size: 12px;
  color: #6b7280;
}

.day-column {
  padding: 8px;
  border-right: 1px solid rgba(64, 158, 255, 0.1);
  min-height: 80px;
  position: relative;
}

.day-column:last-child {
  border-right: none;
}

.course-cell {
  padding: 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #409eff;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.course-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.course-name {
  font-weight: 700;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-location {
  font-size: 12px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.course-time {
  font-size: 11px;
  color: #6b7280;
}

.course-span-2 {
  grid-row: span 2;
}

.course-span-3 {
  grid-row: span 3;
}

.course-span-4 {
  grid-row: span 4;
}

.course-hidden {
  display: none;
}

.course-detail {
  padding: 20px 0;
}
</style>
