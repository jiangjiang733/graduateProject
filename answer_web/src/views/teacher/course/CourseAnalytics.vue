<template>
  <div class="course-analytics modern-page">
    <!-- 页面头部 -->
    <div class="page-header animate-fade-in">
      <div class="header-content">
        <h1 class="page-title">课程数据分析</h1>
        <p class="page-subtitle">深入了解您的课程表现和学生参与度</p>
      </div>
      <div class="header-actions">
        <el-button class="glass-btn" @click="refreshData">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button class="glass-btn primary" @click="exportReport">
           <el-icon><Download /></el-icon> 导出报告
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-section glass-panel animate-slide-up">
       <el-select 
         v-model="selectedCourseId" 
         placeholder="选择要分析的课程"
         class="glass-select"
         size="large"
         @change="handleCourseChange"
       >
         <el-option
           v-for="course in courses"
           :key="course.id"
           :label="course.courseName"
           :value="course.id"
         />
       </el-select>
       <el-date-picker
         v-model="dateRange"
         type="daterange"
         range-separator="至"
         start-placeholder="开始日期"
         end-placeholder="结束日期"
         class="glass-date-picker"
         size="large"
         @change="handleDateChange"
       />
    </div>

    <div v-if="selectedCourseId" class="analytics-content">
      <!-- 关键指标卡片 -->
      <div class="metrics-grid">
        <div class="metric-card glass-panel" v-for="(metric, idx) in metrics" :key="idx">
          <div class="metric-icon-box" :class="metric.colorClass">
            <el-icon><component :is="metric.icon" /></el-icon>
          </div>
          <div class="metric-info">
             <div class="label">{{ metric.label }}</div>
             <div class="value">{{ metric.value }}</div>
             <div class="trend" :class="{ positive: metric.isPositive, negative: !metric.isPositive }">
               <el-icon><component :is="metric.isPositive ? 'Top' : 'Bottom'" /></el-icon>
               {{ metric.trend }}
             </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-card glass-panel span-2">
           <div class="chart-header">
             <h3>学习进度概览</h3>
             <div class="chart-actions">
               <el-radio-group v-model="progressViewType" size="small">
                 <el-radio-button label="chapter">按章节</el-radio-button>
                 <el-radio-button label="student">按学生</el-radio-button>
               </el-radio-group>
             </div>
           </div>
           <div class="chart-body" ref="progressChartRef"></div>
        </div>

        <div class="chart-card glass-panel">
           <div class="chart-header">
             <h3>学生成绩分布</h3>
           </div>
           <div class="chart-body" ref="scoreDistributionChartRef"></div>
        </div>
        
        <div class="chart-card glass-panel">
           <div class="chart-header">
             <h3>活跃度趋势</h3>
           </div>
           <div class="chart-body" ref="activityChartRef"></div>
        </div>
      </div>

      <!-- 学生详情表格 -->
      <div class="table-section glass-panel">
        <div class="table-header">
           <h3>学生详情列表</h3>
           <el-input 
             v-model="studentSearchKeyword" 
             placeholder="搜索学生姓名/学号" 
             prefix-icon="Search"
             class="glass-input-small"
             style="width: 240px"
           />
        </div>
        <el-table 
          :data="filteredStudentData" 
          style="width: 100%" 
          class="glass-table"
          v-loading="loadingStudentData"
        >
          <el-table-column prop="studentName" label="学生姓名" width="120">
            <template #default="{ row }">
              <div class="student-name-cell">
                 <el-avatar :size="30" class="student-avatar">{{ row.studentName.charAt(0) }}</el-avatar>
                 {{ row.studentName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column label="学习进度" min-width="180">
            <template #default="{ row }">
              <div class="progress-cell">
                <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" :stroke-width="8" />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="totalStudyTime" label="学习时长" width="120">
             <template #default="{ row }">{{ row.totalStudyTime }}h</template>
          </el-table-column>
          <el-table-column label="最后活跃" width="150">
             <template #default="{ row }">{{ formatRelativeTime(row.lastActiveTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
             <template #default="{ row }">
               <el-tag :type="getStatusType(row.status)" size="small" effect="dark" round>
                 {{ getStatusText(row.status) }}
               </el-tag>
             </template>
          </el-table-column>
        </el-table>
      </div>

    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-content glass-panel">
        <el-icon size="64" class="empty-icon"><DataAnalysis /></el-icon>
        <h3>请选择一个课程查看分析</h3>
        <p>选择上方的课程以获取详尽的数据报表</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 
  Refresh, Download, User, Check, Star, TrendCharts, 
  DataAnalysis, Top, Bottom, Search
} from '@element-plus/icons-vue'
import { getCourseList, getCourseAnalytics, getTeacherStudents } from '@/api/course.js'
import { formatRelativeTime } from '@/utils/date.js'
import '@/assets/css/teacher/modern-theme.css'

// State
const courses = ref([])
const selectedCourseId = ref('')
const dateRange = ref([])
const progressViewType = ref('chapter')
const studentSearchKeyword = ref('')
const loadingStudentData = ref(false)

// Chart Refs
const progressChartRef = ref(null)
const scoreDistributionChartRef = ref(null)
const activityChartRef = ref(null)
let progressChart = null
let scoreChart = null
let activityChart = null

// Data
const analytics = ref({
  totalStudents: 0,
  newStudentsThisWeek: 0,
  completionRate: 0,
  avgEngagement: 0
})
const studentData = ref([])

// Metrics Computed
const metrics = computed(() => [
  { 
    label: '总学生数', 
    value: analytics.value.totalStudents, 
    icon: 'User', 
    colorClass: 'bg-blue',
    trend: '+12%',
    isPositive: true
  },
  { 
    label: '课程完成率', 
    value: analytics.value.completionRate + '%', 
    icon: 'Check', 
    colorClass: 'bg-emerald',
    trend: '+5%',
    isPositive: true
  },
  { 
    label: '平均参与度', 
    value: analytics.value.avgEngagement, 
    icon: 'TrendCharts', 
    colorClass: 'bg-purple',
    trend: '-2%',
    isPositive: false
  },
  { 
    label: '课程评分', 
    value: '4.8', 
    icon: 'Star', 
    colorClass: 'bg-amber',
    trend: '+0.2',
    isPositive: true
  }
])

const filteredStudentData = computed(() => {
  if (!studentSearchKeyword.value) return studentData.value
  const lower = studentSearchKeyword.value.toLowerCase()
  return studentData.value.filter(s => 
    s.studentName.toLowerCase().includes(lower) || 
    s.studentId.includes(lower)
  )
})

// Methods
const loadCourses = async () => {
  // Mock course loading for demo if API fails or is empty, to show UI
  courses.value = [
    { id: '1', courseName: '计算机网络基础' },
    { id: '2', courseName: '高级Web开发' },
    { id: '3', courseName: '数据结构与算法' }
  ]
  selectedCourseId.value = '1' // Default select first
  handleCourseChange('1')
}

const handleCourseChange = (val) => {
  // Simulate data fetch
  loadingStudentData.value = true
  setTimeout(() => {
    // Mock Analytics Data
    analytics.value = {
      totalStudents: 128,
      newStudentsThisWeek: 12,
      completionRate: 68,
      avgEngagement: 85
    }
    
    // Mock Student Data
    studentData.value = Array.from({ length: 15 }).map((_, i) => ({
      studentName: `学生 ${i + 1}`,
      studentId: `202300${i + 1}`,
      progress: Math.floor(Math.random() * 100),
      totalStudyTime: (Math.random() * 50).toFixed(1),
      lastActiveTime: Date.now() - Math.floor(Math.random() * 1000000000),
      status: Math.random() > 0.3 ? 'active' : 'inactive'
    }))
    
    loadingStudentData.value = false
    
    nextTick(() => {
       initCharts()
    })
  }, 800)
}

const initCharts = () => {
    // 1. Progress Chart (Bar)
    if (progressChartRef.value) {
      if (progressChart) progressChart.dispose()
      progressChart = echarts.init(progressChartRef.value)
      progressChart.setOption({
        color: ['#10b981'],
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: ['第一章', '第二章', '第三章', '第四章', '第五章', '第六章'] },
        yAxis: { type: 'value' },
        series: [{
          name: '平均进度',
          type: 'bar',
          barWidth: '40%',
          data: [90, 85, 70, 60, 40, 20],
          itemStyle: { borderRadius: [4, 4, 0, 0] }
        }]
      })
    }

    // 2. Score Distribution (Pie)
    if (scoreDistributionChartRef.value) {
      if (scoreChart) scoreChart.dispose()
      scoreChart = echarts.init(scoreDistributionChartRef.value)
      scoreChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
          name: '成绩分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' }
          },
          data: [
            { value: 40, name: '优秀 (90+)', itemStyle: { color: '#10b981' } },
            { value: 30, name: '良好 (80-89)', itemStyle: { color: '#3b82f6' } },
            { value: 20, name: '及格 (60-79)', itemStyle: { color: '#fbbf24' } },
            { value: 10, name: '不及格 (<60)', itemStyle: { color: '#ef4444' } }
          ]
        }]
      })
    }
    
    // 3. Activity Trend (Line)
    if (activityChartRef.value) {
      if (activityChart) activityChart.dispose()
      activityChart = echarts.init(activityChartRef.value)
      activityChart.setOption({
        color: ['#8b5cf6'],
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { 
          type: 'category', 
          boundaryGap: false,
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] 
        },
        yAxis: { type: 'value' },
        series: [{
          name: '活跃人数',
          type: 'line',
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.01)' }
            ])
          },
          data: [30, 45, 42, 60, 55, 30, 40]
        }]
      })
    }
}

// Helpers
const getProgressColor = (val) => {
  if (val >= 80) return '#10b981'
  if (val >= 60) return '#3b82f6'
  return '#ef4444'
}

const getStatusType = (status) => status === 'active' ? 'success' : 'info'
const getStatusText = (status) => status === 'active' ? '活跃' : '离线'

onMounted(() => {
  loadCourses()
  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  progressChart?.resize()
  scoreChart?.resize()
  activityChart?.resize()
}

</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.filter-section {
  padding: 24px;
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 columns */
  gap: 24px;
  margin-bottom: 32px;
}

.metric-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s;
}

.metric-card:hover { transform: translateY(-4px); }

.metric-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); }
.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
.bg-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3); }
.bg-amber { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }

.metric-info .label { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
.metric-info .value { font-size: 28px; font-weight: 800; color: #1f2937; line-height: 1.2; }
.metric-info .trend { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  font-size: 12px; 
  font-weight: 600; 
  margin-top: 4px; 
}
.trend.positive { color: #10b981; }
.trend.negative { color: #ef4444; }

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.span-2 { grid-column: span 2; }

.chart-card {
  padding: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #374151; }

.chart-body {
  height: 300px;
  width: 100%;
}

/* Table */
.table-section {
  padding: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 { margin: 0; font-size: 18px; color: #374151; }

.student-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #374151;
}

.student-avatar {
  background-color: #dbeafe;
  color: #2563eb;
  font-weight: 700;
}

@media (max-width: 1280px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}

@media (max-width: 640px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .filter-section { flex-direction: column; }
}
</style>