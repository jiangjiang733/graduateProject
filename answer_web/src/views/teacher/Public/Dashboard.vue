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
            <div class="stat-icon-wrap" :class="getStatIconClass(index)">
              <el-icon><component :is="getStatIcon(index, stat.icon)" /></el-icon>
            </div>
            <el-icon class="stat-more"><MoreFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-number">
              <count-to :startVal="0" :endVal="stat.value" :duration="1500"></count-to>
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-icon style="color: #f97316; font-size: 20px;"><Calendar /></el-icon>
              <h3 class="section-title" style="margin-bottom: 0;">待办事项</h3>
            </div>
          </div>
          
          <!-- 待办事项列表 -->
          <div class="todo-list">
            <!-- 列表项 -->
            <template v-if="displayTodos.length > 0">
              <div v-for="(todo, i) in displayTodos" :key="i" class="todo-item animate-slide-in" :style="{ animationDelay: i * 0.1 + 's' }" :class="{ 'todo-completed': todo.completed, 'todo-system': !todo.isCustom, 'todo-custom': todo.isCustom }">
                <!-- 只有自定义待办才有复选框 -->
                <div v-if="todo.isCustom" class="todo-checkbox" :class="getCheckboxColor(todo, i)" @click="toggleTodo(todo)">
                  <el-icon v-if="todo.completed" color="#fff"><Select /></el-icon>
                </div>
                <!-- 系统待办显示提示图标 -->
                <div v-else class="todo-system-icon">
                  <el-icon color="#f97316"><Bell /></el-icon>
                </div>
                <div class="todo-info" :class="{ 'is-completed': todo.completed }">
                  <h4 class="todo-title">{{ todo.title || todo.content }}</h4>
                  <p class="todo-date">
                    <el-icon><Clock /></el-icon> 
                    {{ todo.isCustom ? '自定义待办' : '系统待办' }}
                  </p>
                </div>
                <!-- Delete Custom Todo -->
                <el-button v-if="todo.isCustom" link type="danger" @click.stop="deleteCustomTodo(todo, i)">删除</el-button>
                <el-button v-else link type="primary" class="todo-btn" @click.stop="handleTodoClick(todo)">
                  {{ todo.buttonText || '处理' }}
                </el-button>
              </div>
            </template>
            <!-- 空状态 -->
            <div v-else class="todo-empty">
              <el-icon class="empty-icon"><CircleCheck /></el-icon>
              <p class="empty-text">暂无待办事项</p>
              <p class="empty-subtext">所有任务已完成，继续保持！</p>
            </div>
            
            <!-- 添加新待办按钮 -->
            <div class="add-todo-btn" @click="addTodoVisible = true">
              <el-icon><Plus /></el-icon> 添加新待办
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 添加待办弹窗 -->
    <el-dialog v-model="addTodoVisible" title="新建待办" width="400px" destroy-on-close>
      <el-input 
        v-model="newTodoText" 
        placeholder="请输入待办事项内容..." 
        clearable 
        @keyup.enter="confirmAddTodo"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addTodoVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddTodo">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { CountTo } from 'vue3-count-to'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
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
  Download,
  MoreFilled,
  VideoPlay,
  DocumentChecked,
  Medal,
  Select,
  Clock,
  Plus
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

// ----- 自定义待办事项逻辑 -----
const localTodos = ref([])
const addTodoVisible = ref(false)
const newTodoText = ref('')

// Component onMounted retrieve from localStorage
onMounted(() => {
  const saved = localStorage.getItem('teacher_local_todos')
  if (saved) {
    try {
      localTodos.value = JSON.parse(saved)
    } catch(e) {}
  }
})

// watch and save to local
watch(localTodos, (newVal) => {
  localStorage.setItem('teacher_local_todos', JSON.stringify(newVal))
}, { deep: true })

const displayTodos = computed(() => {
  let arr = [...(todoItems.value || [])]
  arr.forEach(t => { if(t.completed === undefined) t.completed = false })
  
  // 过滤掉已完成的系统待办（系统待办完成后自动删除）
  const filteredSystemTodos = arr.filter(t => !t.isCustom && !t.completed)
  
  return [...filteredSystemTodos, ...localTodos.value]
})

const getCheckboxColor = (todo, index) => {
  if (todo.completed) return 'checkbox-red'
  if (todo.type === 'homework' || index % 3 === 0) return 'checkbox-red'
  if (todo.type === 'profile' || index % 3 === 1) return 'checkbox-orange'
  return 'checkbox-gray'
}

const toggleTodo = (todo) => {
  todo.completed = !todo.completed
}

const confirmAddTodo = () => {
  if (!newTodoText.value.trim()) {
    ElMessage.warning('请输入待办内容')
    return
  }
  localTodos.value.push({
    title: newTodoText.value.trim(),
    isCustom: true,
    completed: false
  })
  newTodoText.value = ''
  addTodoVisible.value = false
  ElMessage.success('添加成功')
}

const deleteCustomTodo = (todo, idx) => {
  const indexInLocal = localTodos.value.findIndex(t => t === todo)
  if(indexInLocal !== -1) {
    localTodos.value.splice(indexInLocal, 1)
  }
}
// ----- 自定义待办事项结束 -----

const getStatIconClass = (index) => {
  const classes = ['icon-blue', 'icon-purple', 'icon-orange', 'icon-green']
  return classes[index % 4]
}

const getStatIcon = (index, originalIcon) => {
  const icons = ['User', 'VideoPlay', 'DocumentChecked', 'Medal']
  return icons[index % 4] || originalIcon
}

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
                color: '#3b82f6', // Solid blue color
                borderRadius: [8, 8, 0, 0] 
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


