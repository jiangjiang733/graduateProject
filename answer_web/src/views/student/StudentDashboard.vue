<template>
  <div class="student-dashboard modern-page">
    <!-- Welcome Section -->
    <div class="welcome-banner glass-panel animate-fade-in">
      <div class="welcome-text">
        <h2>早安，{{ studentInfo.username || '同学' }}！</h2>
        <p>今天是 {{ currentDate }}，准备好开启今天的学习旅程了吗？</p>
      </div>
      <div class="welcome-img">
        <!-- Optional Illustration -->
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid animate-slide-up">
      <div class="stat-card glass-panel" @click="$router.push('/student/courses')">
        <div class="stat-icon bg-blue-100 text-blue-500">
          <el-icon><Reading /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.courseCount || 0 }}</span>
          <span class="stat-label">在修课程</span>
        </div>
      </div>
      
      <div class="stat-card glass-panel" @click="$router.push('/student/homework')">
        <div class="stat-icon bg-green-100 text-green-500">
          <el-icon><EditPen /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.homeworkCount || 0 }}</span>
          <span class="stat-label">待交作业</span>
        </div>
      </div>
      
      <div class="stat-card glass-panel" @click="$router.push('/student/exams')">
        <div class="stat-icon bg-purple-100 text-purple-500">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.examCount || 0 }}</span>
          <span class="stat-label">近期考试</span>
        </div>
      </div>
      
      <div class="stat-card glass-panel" @click="$router.push('/student/messages')">
        <div class="stat-icon bg-orange-100 text-orange-500">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.messageCount || 0 }}</span>
          <span class="stat-label">未读消息</span>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Left: Recent Tasks -->
      <div class="main-column">
        <!-- Upcoming Exams -->
        <div class="section-card glass-panel animate-slide-up" style="animation-delay: 0.1s">
          <div class="section-header">
            <h3>近期考试</h3>
            <el-link type="primary" @click="$router.push('/student/exams')">查看全部</el-link>
          </div>
          
          <div v-if="upcomingExams.length === 0" class="empty-placeholder">
            <el-empty description="暂无近期考试" :image-size="100" />
          </div>
          <div v-else class="task-list">
             <div v-for="exam in upcomingExams" :key="exam.examId" class="task-item">
               <div class="task-icon"><el-icon><Timer /></el-icon></div>
               <div class="task-info">
                 <div class="task-title">{{ exam.examTitle }}</div>
                 <div class="task-meta">{{ exam.courseName }} | {{ formatTime(exam.startTime) }}</div>
               </div>
               <el-button size="small" type="primary" plain round @click="$router.push(`/student/exam/${exam.examId}/take`)">
                 去考试
               </el-button>
             </div>
          </div>
        </div>

        <!-- Pending Homework -->
        <div class="section-card glass-panel animate-slide-up" style="animation-delay: 0.2s">
          <div class="section-header">
            <h3>待办作业</h3>
            <el-link type="primary" @click="$router.push('/student/homework')">查看全部</el-link>
          </div>
          
           <div v-if="pendingHomeworks.length === 0" class="empty-placeholder">
            <el-empty description="暂无待办作业" :image-size="100" />
          </div>
          <div v-else class="task-list">
             <div v-for="hw in pendingHomeworks" :key="hw.reportId" class="task-item">
               <div class="task-icon homework"><el-icon><EditPen /></el-icon></div>
               <div class="task-info">
                 <div class="task-title">{{ hw.reportTitle }}</div>
                 <div class="task-meta">截止: {{ formatTime(hw.deadline) }}</div>
               </div>
               <el-button size="small" type="primary" round @click="$router.push(`/student/homework/${hw.reportId}/submit`)">
                 去提交
               </el-button>
             </div>
          </div>
        </div>
      </div>

      <!-- Right: Course Progress or Schedule -->
      <div class="side-column animate-slide-up" style="animation-delay: 0.3s">
        <div class="section-card glass-panel">
          <div class="section-header">
            <h3>我的课程</h3>
            <el-link type="primary" @click="$router.push('/student/courses')">全部</el-link>
          </div>
          <div class="course-list-mini">
             <!-- Placeholder for courses -->
             <div v-for="i in 3" :key="i" class="mini-course-item">
               <div class="course-thumb"></div>
               <div class="course-mini-info">
                 <div class="c-title">示例课程 {{ i }}</div>
                 <el-progress :percentage="30 + i * 20" :stroke-width="6" />
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Reading, EditPen, Timer, ChatDotRound } from '@element-plus/icons-vue'
import { getStudentLabReports } from '@/api/homework'
import { getStudentExamList } from '@/api/exam'
import '@/assets/css/teacher/modern-theme.css'

const studentInfo = ref(JSON.parse(localStorage.getItem('student') || '{}'))
const currentDate = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })

const stats = ref({
  courseCount: 0,
  homeworkCount: 0,
  examCount: 0,
  messageCount: 0
})

const upcomingExams = ref([])
const pendingHomeworks = ref([])

onMounted(async () => {
  loadData()
})

const loadData = async () => {
  const sid = studentInfo.value.studentsId || localStorage.getItem('s_id')
  if (!sid) return

  // Load Homework
  try {
     const hwRes = await getStudentLabReports(sid)
     if (hwRes.success) {
        const list = hwRes.data || []
        pendingHomeworks.value = list.filter(h => h.status === 0).slice(0, 3)
        stats.value.homeworkCount = list.filter(h => h.status === 0).length
     }
  } catch(e) { console.error(e) }
  try {
     const examRes = await getStudentExamList(sid, 'ONGOING') 
     if (examRes.success || examRes.code === 200) {
         const list = examRes.data || []
         upcomingExams.value = list.slice(0, 3)
         stats.value.examCount = list.length
     }
  } catch(e) { console.error(e) }
  
  stats.value.courseCount = 5 
}

const formatTime = (t) => {
  if (!t) return ''
  return new Date(t).toLocaleDateString()
}
</script>

<style scoped>
@import '@/assets/css/student/dashboard.css';
</style>
