<template>
  <div class="dashboard-container" v-loading="loading">
    <div class="bg-decoration">
      <div class="fluid-blob blob-1"></div>
      <div class="fluid-blob blob-2"></div>
    </div>

    <div class="dashboard-content">
      <!-- 统计卡片区域 -->
      <section class="stats-row">
        <div v-for="(stat, index) in statCards" :key="index" class="stat-box">
          <div class="stat-header">
            <span class="stat-label">{{ stat.label }}</span>
            <el-icon class="stat-icon-top"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number">
              <count-to :startVal="0" :endVal="stat.value" :duration="1500"></count-to>
            </span>
            <div class="stat-trend" :class="stat.trendUp ? 'up' : 'down'">
              <el-icon><CaretTop v-if="stat.trendUp" /><CaretBottom v-else /></el-icon>
              {{ stat.trend }}
            </div>
          </div>
        </div>
      </section>

      <!-- 中下部分：数据分析和待办事项并排 -->
      <div class="bottom-grid">
        <!-- 左侧：数据分析 -->
        <section class="analysis-section">
          <div class="analysis-header">
            <div>
              <h3 class="section-title">成绩统计分析</h3>
              <p class="section-subtitle">最新考试：{{ analysisData.examName }} (及格标准: 60%)</p>
            </div>
            <div class="analysis-controls">
              <el-select 
                v-model="selectedCourseId" 
                placeholder="选择课程" 
                class="course-select"
                size="default"
              >
                <el-option
                  v-for="item in courseOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button :icon="Refresh" circle @click="updateAnalysis" />
            </div>
          </div>
          
          <div class="analysis-card">
            <!-- Charts Section -->
            <div class="charts-row">
              <div class="chart-container">
                <div class="chart-title">成绩分布</div>
                <div ref="scoreDistChartRef" class="chart-body"></div>
              </div>
            </div>
            
            <div v-if="!analysisData.examName" class="empty-chart">暂无数据</div>
          </div>
        </section>


        <!-- 右侧：待办事项 -->
        <section class="todo-section">
          <h3 class="section-title">待办事项</h3>
          
          <!-- 有待办事项时显示列表 -->
          <div v-if="todoItems && todoItems.length > 0" class="todo-list">
            <div v-for="(todo, i) in todoItems" :key="i" class="todo-item animate-slide-in" :style="{ animationDelay: i * 0.1 + 's' }">
              <div class="todo-icon" :class="getTodoIconClass(todo.type)">
                <el-icon>
                  <EditPen v-if="todo.type === 'homework'" />
                  <User v-else-if="todo.type === 'profile'" />
                  <Document v-else-if="todo.type === 'document'" />
                  <Bell v-else-if="todo.type === 'notification'" />
                  <Calendar v-else />
                </el-icon>
              </div>
              <div class="todo-info">
                <h4 class="todo-title">{{ todo.title || todo.content }}</h4>
                <p class="todo-desc" v-if="todo.description">{{ todo.description }}</p>
                <p class="todo-date" v-if="todo.deadline">截止日期：{{ formatDate(todo.deadline) }}</p>
              </div>
              <el-button link type="primary" class="todo-btn" @click="handleTodoClick(todo)">
                {{ todo.buttonText || '处理' }}
              </el-button>
            </div>
          </div>
          
          <!-- 无待办事项时显示空状态 -->
          <div v-else class="todo-empty">
            <el-icon class="empty-icon"><CircleCheck /></el-icon>
            <p class="empty-text">暂无待办事项</p>
            <p class="empty-subtext">所有任务已完成，继续保持！</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { CountTo } from 'vue3-count-to'
import * as echarts from 'echarts'
import { 
  Calendar, 
  UserFilled, 
  Reading, 
  EditPen, 
  TrendCharts, 
  CaretTop, 
  CaretBottom,
  User,
  Document,
  Bell,
  CircleCheck,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { useTeacherDashboard } from '@/assets/js/teacher/dashboard.js'

const router = useRouter()
const {
  loading,

  statCards,
  todoItems,
  analysisData,
  selectedCourseId,
  courseOptions,
  updateAnalysis
} = useTeacherDashboard()

// Chart Refs
const scoreDistChartRef = ref(null)
let scoreDistChart = null

const initCharts = () => {
  if (scoreDistChartRef.value) {
    scoreDistChart = echarts.init(scoreDistChartRef.value)
  }
}

const updateCharts = () => {
    if (!scoreDistChart) return

    // 检查是否有真实数据
    let dist = analysisData.value.scoreDistribution || [0, 0, 0, 0]
    const hasRealData = dist.reduce((a, b) => a + b, 0) > 0
    const rawTotal = analysisData.value.participantCount || 0
    
    // 如果没有真实分布数据，则根据平均分模拟生成
    // 满足用户需求："没有数据的时候显示模拟数据"
    const isDemo = !hasRealData
    
    if (isDemo) {
        const total = rawTotal > 0 ? rawTotal : 50 // 如果连人数都没有，假定50人
        const avg = parseFloat(analysisData.value.averageScore) || 75
        
        // 模拟分布逻辑 (4个类别)
        let simDist = [0, 0, 0, 0]
        if (avg >= 90) simDist = [5, 10, 30, 55] // 优秀
        else if (avg >= 75) simDist = [10, 15, 50, 25] // 良好
        else if (avg >= 65) simDist = [15, 30, 45, 10] // 及格
        else simDist = [40, 35, 20, 5] // 较差
        
        // 转换为具体数值
        dist = simDist.map(p => Math.round(total * (p / 100)))
    }

    // 柱状图配置 (成绩分布)
    const optionScore = {
        title: { 
            text: isDemo ? '示例数据' : '', 
            textStyle: { fontSize: 12, color: '#ccc', fontWeight: 'normal' },
            right: 0, top: 0
        },
        tooltip: { 
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            textStyle: { color: '#333' }
        },
        grid: { 
            left: '3%', 
            right: '4%', 
            bottom: '5%', 
            top: '15%',
            containLabel: true 
        },
        xAxis: { 
            type: 'category', 
            data: ['不及格(<60%)', '及格(60%-70%)', '良好(70%-90%)', '优秀(≥90%)'],
            axisTick: { alignWithLabel: true },
            axisLabel: { 
                interval: 0,
                color: '#64748b',
                fontSize: 11
            },
            axisLine: { lineStyle: { color: '#e2e8f0' } }
        },
        yAxis: { 
            type: 'value',
            axisLabel: { color: '#64748b' },
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
        },
        series: [{
            name: '人数',
            type: 'bar',
            barWidth: '40%',
            data: dist,
            itemStyle: { 
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#60a5fa' },
                    { offset: 1, color: '#3b82f6' }
                ]),
                borderRadius: [4, 4, 0, 0] 
            },
            label: {
                show: true,
                position: 'top',
                color: '#64748b'
            }
        }]
    }

    scoreDistChart.setOption(optionScore)
}


watch(analysisData, () => {
    nextTick(() => {
        updateCharts()
    })
}, { deep: true })

onMounted(() => {
    nextTick(() => {
        initCharts()
        updateCharts()
        window.addEventListener('resize', handleResize)
    })
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    scoreDistChart?.dispose()
})

const handleResize = () => {
    scoreDistChart?.resize()
}

// 获取待办事项图标样式类
const getTodoIconClass = (type) => {
  const classMap = {
    'homework': 'todo-icon-homework',
    'profile': 'todo-icon-profile',
    'document': 'todo-icon-document',
    'notification': 'todo-icon-notification'
  }
  return classMap[type] || ''
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) {
    return `${Math.abs(days)}天后`
  } else if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 处理待办事项点击
const handleTodoClick = (todo) => {
  console.log('处理待办事项:', todo)
  
  switch (todo.type) {
    case 'homework':
      // 跳转到作业批改页面
      if (todo.homeworkId) {
        router.push(`/teacher/homework/${todo.homeworkId}`)
      } else {
        router.push('/teacher/homework')
      }
      break
    case 'profile':
      // 跳转到个人信息页面
      router.push('/teacher/profile')
      break
    case 'document':
      // 跳转到文档管理页面
      if (todo.documentId) {
        router.push(`/teacher/document/${todo.documentId}`)
      }
      break
    case 'notification':
      // 跳转到消息中心
      router.push('/teacher/message-center')
      break
    default:
      // 默认跳转
      if (todo.link) {
        router.push(todo.link)
      }
  }
}
</script>

<style scoped>
@import '@/assets/css/teacher/dashboard.css';

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stat-icon-top {
  font-size: 20px;
  color: #3b82f6;
  opacity: 0.2;
}

.animate-slide-in {
  animation: slideIn 0.5s ease backwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.todo-btn {
  margin-left: auto;
}

.chart-tip {
  margin-top: 20px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}
</style>


