<template>
  <div class="dashboard modern-page">
    <div class="welcome-section">
      <h2 class="welcome-title">欢迎回来，管理员</h2>
      <p class="welcome-desc">这里是您的系统概览</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="6" v-for="(stat, index) in statItems" :key="index">
        <el-card class="stat-card" :class="stat.class" shadow="hover">
          <div class="stat-content">
            <div class="stat-text">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">
                <span class="number">{{ stat.value }}</span>
                <span class="unit" v-if="stat.unit">{{ stat.unit }}</span>
              </div>
            </div>
            <div class="stat-icon-wrapper">
              <el-icon class="stat-icon"><component :is="stat.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :span="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <h3><el-icon><TrendCharts /></el-icon> 数据趋势</h3>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
             <div class="card-header">
               <h3><el-icon><PieChart /></el-icon> 用户分布</h3>
             </div>
          </template>
          <div class="chart-container" ref="pieChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <div class="section-title">快速操作</div>
    <div class="quick-actions-grid">
      <div 
        class="action-card" 
        v-for="(action, index) in quickActions" 
        :key="index"
        @click="$router.push(action.path)"
      >
        <div class="action-icon" :style="{ background: action.color }">
          <el-icon><component :is="action.icon" /></el-icon>
        </div>
        <div class="action-info">
          <span class="action-name">{{ action.name }}</span>
          <span class="action-desc">{{ action.desc }}</span>
        </div>
        <el-icon class="action-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from 'vue'
import { 
  User, UserFilled, Bell, Warning, 
  TrendCharts, PieChart, ArrowRight,
  DataAnalysis, Reading
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const stats = reactive({
  studentCount: 156,
  teacherCount: 23,
  announcementCount: 12,
  sensitiveWordCount: 89
})

const statItems = reactive([
  { label: '学生总数', value: 156, icon: 'User', class: 'blue-gradient', unit: '' },
  { label: '教师总数', value: 23, icon: 'UserFilled', class: 'purple-gradient', unit: '' },
  { label: '公告总数', value: 12, icon: 'Bell', class: 'teal-gradient', unit: '' },
  { label: '敏感词库', value: 89, icon: 'Warning', class: 'red-gradient', unit: '' }
])

const quickActions = [
  { name: '管理学生', desc: '查看和管理学生信息', icon: 'User', path: '/students', color: 'rgba(59, 130, 246, 0.1)' },
  { name: '管理教师', desc: '查看和管理教师信息', icon: 'UserFilled', path: '/teachers', color: 'rgba(139, 92, 246, 0.1)' },
  { name: '发布公告', desc: '发布系统通知公告', icon: 'Bell', path: '/announcements', color: 'rgba(16, 185, 129, 0.1)' },
  { name: '敏感词管理', desc: '维护系统过滤词库', icon: 'Warning', path: '/sensitive-words', color: 'rgba(239, 68, 68, 0.1)' }
]

const chartPeriod = ref('week')
const trendChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)

const initCharts = () => {
    if (!pieChartRef.value || !trendChartRef.value) return

    // Pie Chart
    const pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [
            {
                name: '用户构成',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
                data: [
                    { value: 156, name: '学生', itemStyle: { color: '#60a5fa' } },
                    { value: 23, name: '教师', itemStyle: { color: '#a78bfa' } },
                    { value: 5, name: '管理员', itemStyle: { color: '#fcd34d' } }
                ]
            }
        ]
    })

    // Trend Chart
    const trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
        grid: { top: 30, right: 30, bottom: 30, left: 40 },
        tooltip: { trigger: 'axis' },
        xAxis: { 
            type: 'category', 
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280' }
        },
        yAxis: { 
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } }
        },
        series: [
            {
                data: [120, 200, 150, 80, 70, 110, 130],
                type: 'line',
                smooth: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                    ])
                },
                itemStyle: { color: '#3b82f6' }
            }
        ]
    })

    window.addEventListener('resize', () => {
        pieChart.resize()
        trendChart.resize()
    })
}

const loadStats = async () => {
  // TODO: Call API
  if (statItems[0]) statItems[0].value = 156
  if (statItems[1]) statItems[1].value = 23
  if (statItems[2]) statItems[2].value = 12
  if (statItems[3]) statItems[3].value = 89
}

onMounted(() => {
  loadStats()
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 32px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.welcome-section {
  margin-bottom: 32px;
}
.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.welcome-desc {
  color: #64748b;
  font-size: 16px;
}

.stat-card {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  height: 140px;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 10px;
}

.stat-text {
  z-index: 10;
}

.stat-label {
  font-size: 15px;
  color: #fff;
  opacity: 0.9;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  color: #fff;
  display: flex;
  align-items: baseline;
}

.stat-value .number {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
}

.stat-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.stat-icon {
  font-size: 24px;
  color: #fff;
}

.blue-gradient { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.purple-gradient { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.teal-gradient { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.red-gradient { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

.chart-card {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 40px 0 20px;
  display: flex;
  align-items: center;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.action-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.action-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #3b82f6;
}
.action-card:nth-child(2) .action-icon { color: #8b5cf6; }
.action-card:nth-child(3) .action-icon { color: #10b981; }
.action-card:nth-child(4) .action-icon { color: #ef4444; }

.action-info {
  flex: 1;
}

.action-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #64748b;
}

.action-arrow {
  color: #cbd5e1;
  transition: transform 0.3s;
}

.action-card:hover .action-arrow {
  color: #3b82f6;
  transform: translateX(3px);
}
</style>
