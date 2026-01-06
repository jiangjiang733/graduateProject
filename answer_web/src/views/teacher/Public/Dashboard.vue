<template>
  <div class="dashboard-animate">
    <!-- 统计卡片区域 -->
    <section class="stats-grid">
      <div v-for="(stat, index) in statCards" :key="index" class="stat-card glass-panel">
        <div class="stat-bg-blob" :class="stat.colorClass"></div>
        <div class="stat-header">
          <div class="stat-icon-box" :class="stat.bgClass">
            <el-icon :size="24" :class="stat.textClass"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-trend">
            <el-icon><Top /></el-icon> {{ stat.trend }}
          </div>
        </div>
        <div class="stat-content">
          <h3 class="stat-label">{{ stat.label }}</h3>
          <p class="stat-value">
            <count-to :startVal="0" :endVal="stat.value" :duration="2000" :decimals="stat.decimals || 0"></count-to>
            <span v-if="stat.suffix" class="stat-suffix">{{ stat.suffix }}</span>
          </p>
        </div>
      </div>
    </section>

    <div class="dashboard-main-grid">
      <!-- 左侧：课程列表 -->
      <div class="courses-section">
        <h3 class="section-title">进行中的课程</h3>
        <div class="courses-grid">
          <div v-for="course in recentCourses" :key="course.id" class="course-card glass-panel">
            <div class="course-cover">
              <img :src="getCourseImage(course.image)" alt="course cover" />
              <div class="course-badge">进行中</div>
              <button class="course-menu-btn">
                <el-icon><MoreFilled /></el-icon>
              </button>
            </div>
            <div class="course-info">
              <h4 class="course-title" :title="course.courseName">{{ course.courseName }}</h4>
              <div class="course-meta">
                <span class="meta-item"><el-icon><User /></el-icon> {{ course.studentCount || 0 }} 位学生</span>
                <span class="meta-item"><el-icon><Reading /></el-icon> {{ course.chapterCount || 0 }} 章节</span>
              </div>
              <button class="manage-btn" @click="viewCourse(course)">
                管理 <el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>

          <!-- 添加课程占位符 -->
          <div class="add-course-card glass-panel" @click="$router.push('/teacher/course/create')">
            <el-icon :size="32" class="add-icon"><Plus /></el-icon>
            <p>从资源库导入课程</p>
          </div>
        </div>
      </div>


         <!-- 动态广场 -->
         <div class="activity-section glass-panel">
            <h3 class="section-title">
              <el-icon class="text-blue-500"><Clock /></el-icon> 动态广场
            </h3>

            <div class="activity-chart" ref="activityChartRef" style="height: 200px; width: 100%; margin-bottom: 16px;"></div>

            <div class="activity-list">
              <div v-if="recentMessages.length > 0">
                 <div v-for="(msg, i) in recentMessages" :key="i" class="activity-item">
                   <div class="activity-icon-box bg-blue-100">
                     <el-icon class="text-blue-600"><ChatDotRound /></el-icon>
                   </div>
                   <div class="activity-content">
                     <p class="activity-title">{{ msg.studentName }} {{ msg.title || '' }}</p>
                     <p class="activity-desc">{{ msg.content }}</p>
                     <p class="activity-time">{{ formatTime(msg.time) }}</p>
                   </div>
                 </div>
              </div>
            </div>
         </div>
      </div>
    </div>

</template>

<script setup>
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { CountTo } from 'vue3-count-to'
import * as echarts from 'echarts'
import { getDashboardData } from '@/api/dashboard.js'
import '@/assets/css/teacher/modern-theme.css'
import {
  User, TrendCharts, EditPen, ChatDotRound, Top, MoreFilled,
  Reading, ArrowRight, Plus, Clock, Bell, Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)


const activityChartRef = ref(null)
let activityChart = null


const statistics = ref({
  studentCount: 0,
  courseCount: 0,
  pendingHomeworkCount: 0,
  ongoingExamCount: 0
})
const recentCourses = ref([])
const recentMessages = ref([])
const todoList = ref([])

// 统计卡片配置
const statCards = computed(() => [
  {
    label: '活跃学生',
    value: statistics.value.studentCount,
    icon: 'User',
    colorClass: 'bg-blue-500',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-600',
    trend: '+12.5%'
  },
  {
    label: '进行中课程',
    value: statistics.value.courseCount,
    icon: 'Reading',
    colorClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-600',
    trend: '+2.4%'
  },
  {
    label: '待批改作业',
    value: statistics.value.pendingHomeworkCount,
    icon: 'EditPen',
    colorClass: 'bg-amber-500',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-600',
    trend: '需处理'
  },
  {
    label: '进行中考试',
    value: statistics.value.ongoingExamCount,
    icon: 'TrendCharts',
    colorClass: 'bg-purple-500',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-600',
    trend: '进行中'
  }
])

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    if(!teacherId) return;

    const response = await getDashboardData(teacherId)
    if (response.code === 200 && response.data) {
      if (response.data.statistics) {
        statistics.value = {
          studentCount: response.data.statistics.studentCount || 0,
          pendingHomeworkCount: response.data.statistics.pendingHomeworkCount || 0,
          courseCount: response.data.statistics.courseCount || 0,
          ongoingExamCount: response.data.statistics.ongoingExamCount || 0
        }
      }
      recentCourses.value = response.data.recentCourses || []
      recentMessages.value = response.data.recentMessages || []
      todoList.value = response.data.todoList || []

      initActivityChart()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const initActivityChart = () => {
    nextTick(() => {
        if (!activityChartRef.value) return
        if (activityChart) activityChart.dispose()

        activityChart = echarts.init(activityChartRef.value)
        const date = new Date()
        const days = []
        for(let i=6; i>=0; i--) {
            const d = new Date(date)
            d.setDate(d.getDate() - i)
            days.push((d.getMonth()+1) + '-' + d.getDate())
        }

        // 基于真实消息统计最近7天的动态
        const chartData = days.map(dayStr => {
            const count = recentMessages.value.filter(msg => {
                const msgDate = new Date(msg.time);
                const compareStr = (msgDate.getMonth() + 1) + '-' + msgDate.getDate();
                return compareStr === dayStr;
            }).length;
            return count;
        });

        activityChart.setOption({
            color: ['#3b82f6'],
            tooltip: { trigger: 'axis' },
            grid: { top: '10%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: days },
            yAxis: { type: 'value', minInterval: 1 },
            series: [{
                name: '作业提交',
                type: 'line',
                smooth: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
                    ])
                },
                data: chartData
            }]
        })
    })
}

const getCourseImage = (image) => {
  if (!image) return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400'
  if (image.startsWith('http')) return image
  return `http://localhost:8088${image}`
}

const viewCourse = (course) => {
  router.push({ path: '/teacher/course/' + course.id })
}

const getTodoIcon = (type) => {
    if(type === 'homework') return 'EditPen'
    if(type === 'course_approval') return 'User'
    return 'Bell'
}

const getTodoClass = (type) => {
    if(type === 'homework') return 'bg-amber-100 text-amber-600'
    if(type === 'course_approval') return 'bg-blue-100 text-blue-600'
    return 'bg-gray-100 text-gray-600'
}
const formatTime = (timeStr) => {
    if(!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    if(diff < 60000) return '刚刚'
    if(diff < 3600000) return Math.floor(diff/60000) + '分钟前'
    if(diff < 86400000) return Math.floor(diff/3600000) + '小时前'
    return (date.getMonth()+1) + '-' + date.getDate()
}

onMounted(() => {
  fetchDashboardData()
  window.addEventListener('resize', () => activityChart && activityChart.resize())
})

onBeforeUnmount(() => {
    if(activityChart) activityChart.dispose()
})
</script>

<style scoped>
.dashboard-animate {
  animation: slide-up 0.5s ease-out;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-bg-blob {
  position: absolute;
  top: 0;
  right: 0;
  width: 96px;
  height: 96px;
  filter: blur(40px);
  opacity: 0.2;
  margin-right: -24px;
  margin-top: -24px;
  border-radius: 50%;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.stat-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
}

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.stat-value {
  font-size: 30px;
  font-weight: 900;
  color: #1f2937;
  margin: 0;
}

/* 主区域 Grid */
.dashboard-main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
}


.courses-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.course-card {
  overflow: hidden;
  transition: all 0.5s;
}

.course-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.course-cover {
  height: 160px;
  position: relative;
  overflow: hidden;
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s;
}

.course-card:hover .course-cover img {
  transform: scale(1.1);
}

.course-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: 20px;
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.course-menu-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.course-card:hover .course-menu-btn {
  opacity: 1;
}

.course-info {
  padding: 20px;
}

.course-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.manage-btn {
  width: 100%;
  background: transparent;
  border: none;
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 0;
  transition: gap 0.3s;
}

.manage-btn:hover {
  gap: 8px;
}

.add-course-card {
  border: 2px dashed rgba(16, 185, 129, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 280px; /* approx height of course card */
}

.add-course-card:hover {
  background-color: rgba(16, 185, 129, 0.05);
  border-color: #10b981;
}

.add-icon {
  color: #9ca3af;
  transition: color 0.3s;
}

.add-course-card:hover .add-icon,
.add-course-card:hover p {
  color: #10b981;
}

.add-course-card p {
  font-size: 14px;
  font-weight: 700;
  color: #9ca3af;
  margin: 0;
}

/* Right Section */
.right-section {
    display: flex;
    flex-direction: column;
}

/* Todo List */
.todo-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.todo-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    gap: 12px;
}
.todo-item:hover {
    background: #f3f4f6;
}
.todo-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
}
.todo-info {
    flex: 1;
}
.todo-title {
    font-size: 14px; font-weight: 600; color: #374151;
}
.todo-desc {
    font-size: 12px; color: #6b7280;
}

/* Activity Plaza */
.activity-section {
  padding: 24px;
}

.activity-list {
  position: relative;
  padding-left: 20px;
  border-left: 2px solid rgba(243, 244, 246, 0.5); /* line */
}

.activity-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}

.activity-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-left: -41px; /* Align with line */
  z-index: 2;
  transition: transform 0.3s;
}

.activity-item:hover .activity-icon-box {
  transform: scale(1.1);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 700;
  color: #1f2937;
  font-size: 14px;
  margin: 0 0 2px 0;
}

.activity-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.activity-time {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 4px;
}

/* Utilities */
.text-blue-500 { color: #3b82f6; }
.text-blue-600 { color: #2563eb; }
.bg-blue-100 { background-color: #dbeafe; }


.bg-emerald-100 { background-color: #d1fae5; }
.bg-emerald-500 { background-color: #10b981; }

.text-amber-500 { color: #f59e0b; }
.text-amber-600 { color: #d97706; }
.bg-amber-100 { background-color: #fef3c7; }
.bg-amber-500 { background-color: #f59e0b; }

.text-purple-600 { color: #7c3aed; }
.bg-purple-100 { background-color: #ede9fe; }
.bg-purple-500 { background-color: #8b5cf6; }

.text-gray-600 { color: #4b5563; }
.bg-gray-100 { background-color: #f3f4f6; }

.mb-6 { margin-bottom: 24px; }

@media (max-width: 1280px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .dashboard-main-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .stats-grid { grid-template-columns: 1fr; }
  .courses-grid { grid-template-columns: 1fr; }
}
</style>