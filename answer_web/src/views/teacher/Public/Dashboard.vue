<template>
  <div class="dashboard-container">
    <!-- 背景装饰：采用更柔和的流体感，降低干扰 -->
    <div class="bg-decoration">
      <div class="fluid-blob blob-1"></div>
      <div class="fluid-blob blob-2"></div>
    </div>

    <div class="dashboard-content">
      <!-- 顶部欢迎语 -->
      <header class="welcome-header">
        <h1 class="welcome-title">欢迎回来，教师工作台</h1>
        <p class="welcome-subtitle">{{ currentTime }} · 保持卓越教学状态</p>
      </header>

      <!-- 统计卡片区域 -->
      <section class="stats-grid">
        <div v-for="(stat, index) in statCards" :key="index" class="stat-card glass-morph">
          <div class="stat-icon-wrapper" :style="{ background: stat.glowColor }">
            <el-icon :size="24" :style="{ color: stat.iconColor }">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ stat.label }}</span>
            <div class="stat-main">
              <span class="stat-value">
                <count-to :startVal="0" :endVal="stat.value" :duration="2000" :decimals="stat.decimals || 0"></count-to>
              </span>
              <span class="stat-trend" :class="stat.trendUp ? 'up' : 'down'">
                <el-icon size="14"><Top v-if="stat.trendUp" /><Bottom v-else /></el-icon>
                {{ stat.trend }}
              </span>
            </div>
            <div class="stat-desc" :style="{ color: stat.iconColor }">
              {{ stat.desc }}
            </div>
          </div>
        </div>
      </section>

      <div class="dashboard-main-layout">
        <!-- 左侧：课程管理 -->
        <div class="main-left">
          <div class="section-header">
            <h3 class="section-title">进行中的课程</h3>
            <button class="text-btn" @click="$router.push('/teacher/course')">查看全部</button>
          </div>

          <div class="courses-grid">
            <div v-for="course in recentCourses" :key="course.id" class="course-card-ios glass-morph">
              <div class="course-visual">
                <img :src="getCourseImage(course.image)" alt="cover" class="rect-course-img" />
                <div class="course-status-tag">授课中</div>
                <div class="course-visual-overlay"></div>
              </div>
              <div class="course-details">
                <h4 class="course-name">{{ course.courseName }}</h4>
                <div class="course-stats">
                  <span><el-icon size="14"><User /></el-icon> {{ course.studentCount || 0 }} 学生</span>
                  <span><el-icon size="14"><Reading /></el-icon> {{ course.chapterCount || 0 }} 章节</span>
                </div>
                <button class="ios-action-btn" @click="viewCourse(course)">
                  管理课程 <el-icon size="16"><ArrowRight /></el-icon>
                </button>
              </div>
            </div>

            <!-- 新增入口：仅在课程数量少于 2 时显示 -->
            <div v-if="recentCourses.length < 2" class="add-card-ios glass-morph" @click="$router.push('/teacher/course/create')">
              <div class="plus-circle">
                <el-icon :size="28"><Plus /></el-icon>
              </div>
              <span class="add-text">导入新课程</span>
            </div>
          </div>
        </div>

        <!-- 右侧：动态广场 -->
        <div class="main-right">
          <div class="section-header">
            <h3 class="section-title">动态广场</h3>
            <button class="text-btn mini" @click="refreshActivity">
              <el-icon size="14"><Refresh /></el-icon> 刷新
            </button>
          </div>

          <div class="activity-plaza glass-morph">
            <!-- 统计图 -->
            <div class="chart-container">
              <div class="chart-header">
                <div class="chart-label">近期活跃趋势</div>
                <div class="chart-total">{{ totalActivities }} 条动态</div>
              </div>
              <div class="activity-chart" ref="activityChartRef"></div>
            </div>

            <!-- 动态列表：实时反馈后端数据，最多显示 3 条 -->
            <div class="timeline-ios">
              <div v-for="(msg, i) in recentMessages.slice(0, 3)" :key="i" class="timeline-item">
                <div class="timeline-avatar-wrapper">
                  <div class="timeline-avatar" :style="{ backgroundColor: getAvatarColor(msg.studentName) }">
                    {{ msg.studentName?.charAt(0) || 'U' }}
                  </div>
                  <div class="avatar-glow" :style="{ backgroundColor: getAvatarColor(msg.studentName) }"></div>
                </div>
                <div class="timeline-body">
                  <div class="timeline-header">
                    <span class="student-name">{{ msg.studentName }}</span>
                    <span class="time-stamp">{{ formatTime(msg.time) }}</span>
                  </div>
                  <p class="timeline-text">
                    <span class="msg-type" :class="msg.type">{{ msg.type === 'homework' ? '作业提交' : msg.type === 'comment' ? '课堂评论' : '系统通知' }}</span>
                    {{ msg.content }}
                  </p>
                </div>
              </div>
              <div v-if="recentMessages.length === 0" class="empty-state">
                <el-icon size="24"><Message /></el-icon>
                <p>暂无最新动态</p>
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
import {
  User, TrendCharts, EditPen, ChatDotRound, Top, Bottom, MoreFilled,
  Reading, ArrowRight, Plus, Clock, Refresh, Message
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)
const activityChartRef = ref(null)
let activityChart = null

const currentTime = computed(() => {
  const d = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
})

const statistics = ref({
  studentCount: 0,
  courseCount: 0,
  pendingHomeworkCount: 0,
  ongoingExamCount: 0
})
const recentCourses = ref([])
const recentMessages = ref([])

const statCards = computed(() => [
  {
    label: '活跃学生',
    value: statistics.value.studentCount,
    icon: 'User',
    glowColor: 'rgba(0, 122, 255, 0.12)',
    iconColor: '#007AFF',
    trend: '12%',
    trendUp: true,
    desc: '本月新增活跃用户'
  },
  {
    label: '进行中课程',
    value: statistics.value.courseCount,
    icon: 'Reading',
    glowColor: 'rgba(52, 199, 89, 0.12)',
    iconColor: '#34C759',
    trend: '2.4%',
    trendUp: true,
    desc: '较上月增长'
  },
  {
    label: '待批改作业',
    value: statistics.value.pendingHomeworkCount,
    icon: 'EditPen',
    glowColor: 'rgba(255, 149, 0, 0.12)',
    iconColor: '#FF9500',
    trend: '需处理',
    trendUp: false,
    desc: '24小时内截止'
  },
  {
    label: '进行中考试',
    value: statistics.value.ongoingExamCount,
    icon: 'TrendCharts',
    glowColor: 'rgba(175, 82, 222, 0.12)',
    iconColor: '#AF52DE',
    trend: '实时',
    trendUp: true,
    desc: '当前正在进行'
  }
])

// 计算总动态数
const totalActivities = computed(() => {
  return recentMessages.value.length
})

// 生成头像颜色
const getAvatarColor = (name) => {
  if (!name) return '#007AFF'
  const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FF2D55']
  const charCode = name.charCodeAt(0)
  return colors[charCode % colors.length]
}

// 刷新动态
const refreshActivity = () => {
  fetchDashboardData()
  // 添加刷新动画效果
  if (activityChartRef.value) {
    activityChartRef.value.style.animation = 'refresh-pulse 0.6s ease'
    setTimeout(() => {
      activityChartRef.value.style.animation = ''
    }, 600)
  }
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    if(!teacherId) return

    const response = await getDashboardData(teacherId)
    if (response.code === 200 && response.data) {
      const { statistics: stats, recentCourses: courses, recentMessages: msgs } = response.data
      statistics.value = {
        studentCount: stats?.studentCount || 0,
        pendingHomeworkCount: stats?.pendingHomeworkCount || 0,
        courseCount: stats?.courseCount || 0,
        ongoingExamCount: stats?.ongoingExamCount || 0
      }
      recentCourses.value = courses || []
      recentMessages.value = msgs || []
      initActivityChart()
    }
  } catch (error) {
    console.error('Dashboard data error:', error)
  } finally {
    loading.value = false
  }
}

const initActivityChart = () => {
  nextTick(() => {
    if (!activityChartRef.value) return
    if (activityChart) activityChart.dispose()

    activityChart = echarts.init(activityChartRef.value)
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return `${d.getMonth() + 1}/${d.getDate()}`
    })

    const chartData = days.map(day => {
      return recentMessages.value.filter(msg => {
        const msgDate = new Date(msg.time)
        return `${msgDate.getMonth() + 1}/${msgDate.getDate()}` === day
      }).length
    })

    activityChart.setOption({
      grid: { top: 10, right: 10, bottom: 20, left: 30 },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8E8E93', fontSize: 11, fontWeight: 500 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.08)' } },
        axisLabel: { color: '#8E8E93', fontSize: 11, fontWeight: 500 },
        axisLine: { show: false },
        axisTick: { show: false },
        min: 0
      },
      series: [{
        data: chartData,
        type: 'line',
        smooth: 0.6,
        symbol: 'circle',
        symbolSize: 6,
        symbolHoverSize: 8,
        lineStyle: { width: 3, color: '#007AFF' },
        itemStyle: { color: '#FFFFFF', borderColor: '#007AFF', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 122, 255, 0.2)' },
            { offset: 1, color: 'rgba(0, 122, 255, 0.02)' }
          ])
        },
        emphasis: {
          lineStyle: { width: 4 },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 122, 255, 0.3)' }
        }
      }]
    })
  })
}

const getCourseImage = (image) => {
  if (!image) return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400'
  return image.startsWith('http') ? image : `http://localhost:8088${image}`
}

const viewCourse = (course) => router.push({ path: '/teacher/course/' + course.id })

const formatTime = (timeStr) => {
  if(!timeStr) return ''
  const date = new Date(timeStr)
  const diff = new Date() - date
  if(diff < 60000) return '刚刚'
  if(diff < 3600000) return Math.floor(diff/60000) + '分钟前'
  if(diff < 86400000) return Math.floor(diff/3600000) + '小时前'
  return `${date.getMonth()+1}/${date.getDate()}`
}

onMounted(() => {
  fetchDashboardData()
  window.addEventListener('resize', () => activityChart?.resize())
})
onBeforeUnmount(() => {
  activityChart?.dispose()
  window.removeEventListener('resize', () => activityChart?.resize())
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  padding: 32px;
  background: linear-gradient(180deg, #F8F9FF 0%, #F2F2F7 100%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* 增强玻璃拟态：更接近 iOS 真实质感 */
.glass-morph {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.glass-morph:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  border-color: rgba(255, 255, 255, 0.8);
}

/* 背景装饰优化 */
.bg-decoration {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
}
.fluid-blob {
  position: absolute;
  filter: blur(160px);
  opacity: 0.15;
  border-radius: 50%;
  animation: blob-float 25s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);
}
@keyframes blob-float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 50px) scale(1.15); }
}
.blob-1 {
  width: 900px; height: 900px;
  background: linear-gradient(135deg, #007AFF 0%, #5E5CE6 100%);
  top: -400px; right: -300px;
}
.blob-2 {
  width: 700px; height: 700px;
  background: linear-gradient(135deg, #34C759 0%, #007AFF 100%);
  bottom: -250px; left: -200px;
}

.dashboard-content {
  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
}

/* Header 优化 */
.welcome-header { margin-bottom: 40px; }
.welcome-title {
  font-size: 32px;
  font-weight: 800;
  color: #1C1C1E;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}
.welcome-subtitle {
  font-size: 17px;
  color: #636366;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.welcome-subtitle::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: #007AFF;
  border-radius: 2px;
}

/* Stats Grid 优化 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
  margin-bottom: 40px;
}
.stat-card {
  padding: 28px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

/* 统计卡片装饰 */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(30%, -30%);
  z-index: 0;
}

.stat-card:hover {
  transform: translateY(-8px);
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
}
.stat-info {
  flex: 1;
  position: relative;
  z-index: 1;
}
.stat-label {
  font-size: 13px;
  color: #8E8E93;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  display: block;
}
.stat-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1C1C1E;
  letter-spacing: -0.5px;
}
.stat-trend {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(52, 199, 89, 0.1);
}
.stat-trend.up {
  color: #34C759;
  background: rgba(52, 199, 89, 0.1);
}
.stat-trend.down {
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.1);
}
.stat-desc {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
  margin: 0;
}

/* Main Layout 优化 */
.dashboard-main-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 36px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0;
  letter-spacing: -0.3px;
}
.text-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 12px;
}
.text-btn.mini {
  font-size: 13px;
  padding: 4px 8px;
}
.text-btn:hover {
  opacity: 0.8;
  background: rgba(0, 122, 255, 0.08);
}

/* Course Cards Grid 优化 */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 32px;
}
.course-card-ios {
  padding: 18px;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.course-card-ios:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}

/* 课程图片区域优化 */
.course-visual {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px !important;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #E5E5EA 0%, #F2F2F7 100%);
  margin-bottom: 16px;
}
.course-visual-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.1) 100%);
  z-index: 1;
}
.rect-course-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: 18px !important;
  display: block;
  transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.course-card-ios:hover .rect-course-img {
  transform: scale(1.08);
}

.course-status-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(52, 199, 89, 0.95);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
}

.course-details {
  padding: 0 4px;
}
.course-name {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 12px;
  letter-spacing: -0.2px;
  line-height: 1.3;
}
.course-stats {
  display: flex;
  gap: 24px;
  color: #636366;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
  align-items: center;
}
.course-stats span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ios-action-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #007AFF 0%, #0062CC 100%);
  color: #FFFFFF;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.2);
}
.ios-action-btn:hover {
  background: linear-gradient(135deg, #0062CC 0%, #0052B3 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
}

.add-card-ios {
  aspect-ratio: 16 / 14;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #8E8E93;
  cursor: pointer;
  border: 2px dashed rgba(0,0,0,0.1);
  transition: all 0.3s;
}
.add-card-ios:hover {
  border-color: #007AFF;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.06);
  transform: translateY(-4px);
}
.plus-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.add-card-ios:hover .plus-circle {
  background: rgba(0, 122, 255, 0.1);
  transform: scale(1.1);
}
.add-text {
  font-size: 16px;
  font-weight: 600;
}

/* Timeline/Activity Plaza 优化 */
.activity-plaza {
  padding: 32px;
  height: 100%;
  box-sizing: border-box;
}
.chart-container {
  margin-bottom: 32px;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.chart-label {
  font-size: 14px;
  font-weight: 700;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.chart-total {
  font-size: 13px;
  font-weight: 600;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}
.activity-chart {
  height: 200px;
  width: 100%;
}

/* 刷新动画 */
@keyframes refresh-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.timeline-ios {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.timeline-item {
  display: flex;
  gap: 20px;
  position: relative;
  padding-bottom: 28px;
}
.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 22px;
  top: 50px;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, rgba(0, 122, 255, 0.2) 0%, rgba(0, 122, 255, 0) 100%);
}
.timeline-avatar-wrapper {
  position: relative;
}
.timeline-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.avatar-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.2;
  filter: blur(12px);
  border-radius: 16px;
  z-index: 1;
}
.timeline-body {
  flex: 1;
  padding-top: 2px;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  align-items: center;
}
.student-name {
  font-weight: 700;
  color: #1C1C1E;
  font-size: 16px;
}
.time-stamp {
  font-size: 12px;
  color: #8E8E93;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 8px;
  border-radius: 8px;
}
.timeline-text {
  font-size: 15px;
  color: #48484A;
  line-height: 1.6;
  margin: 0;
  font-weight: 500;
}
.msg-type {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  margin-right: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.msg-type.homework {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}
.msg-type.comment {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}
.msg-type.system {
  background: rgba(175, 82, 222, 0.1);
  color: #AF52DE;
}

.empty-state {
  text-align: center;
  color: #8E8E93;
  padding: 40px 0;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-state p {
  margin: 0;
  opacity: 0.8;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .dashboard-main-layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-container {
    padding: 24px 20px;
  }
  .welcome-title {
    font-size: 26px;
  }
  .courses-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .activity-plaza {
    padding: 24px;
  }
}
</style>