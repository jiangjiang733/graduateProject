<template>
  <div class="student-dashboard modern-page">
    <!-- Welcome Header with Quick Actions -->
    <div class="welcome-header glass-panel animate-fade-in">
      <div class="header-left">
        <h2 class="greeting">早安，{{ studentInfo.username || '同学' }}！👋</h2>
        <p class="subtitle">今天是 {{ currentDate }}，又是充满希望的一天。</p>
      </div>
      <div class="header-right">
        <!-- Quick Actions -->
        <div class="quick-action" @click="$router.push('/student/courses')">
          <div class="action-icon bg-blue-50 text-blue-500"><el-icon><Reading /></el-icon></div>
          <span>课程中心</span>
        </div>
        <div class="quick-action" @click="$router.push('/student/homework')">
          <div class="action-icon bg-green-50 text-green-500"><el-icon><EditPen /></el-icon></div>
          <span>我的作业</span>
        </div>
        <div class="quick-action" @click="$router.push('/student/exams')">
          <div class="action-icon bg-purple-50 text-purple-500"><el-icon><Timer /></el-icon></div>
          <span>考试安排</span>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <!-- MAIN COLUMN (Left, 70%) -->
      <div class="main-content">
        
        <!-- Stats Overview -->
        <div class="stats-overview animate-slide-up">
           <div class="stat-box">
              <div class="stat-val">{{ stats.courseCount || 0 }}</div>
              <div class="stat-label">在修课程</div>
           </div>
           <div class="stat-divider"></div>
           <div class="stat-box">
              <div class="stat-val warning">{{ stats.homeworkCount || 0 }}</div>
              <div class="stat-label">待交作业</div>
           </div>
           <div class="stat-divider"></div>
           <div class="stat-box">
              <div class="stat-val danger">{{ stats.examCount || 0 }}</div>
              <div class="stat-label">近期考试</div>
           </div>
        </div>

        <!-- My Courses Grid -->
        <div class="section-block animate-slide-up" style="animation-delay: 0.1s">
          <div class="block-header">
            <h3>正在学习 <span class="highlight-count">({{ myCourses.length }})</span></h3>
            <el-button link type="primary" @click="$router.push('/student/courses')">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
          </div>
          
          <div v-if="myCourses.length === 0" class="empty-state-large">
             <el-empty description="暂无课程，快去加入吧！" :image-size="140" />
             <el-button type="primary" @click="$router.push('/student/courses')">去选课</el-button>
          </div>

          <div v-else class="rich-course-grid">
            <div v-for="course in displayedCourses" :key="course.course_id || course.id" class="rich-course-card" @click="$router.push(`/student/course/${course.course_id || course.id}`)">
               <div class="card-cover">
                 <img :src="getCourseCover(course.courseImage || course.courscImage || course.image)" @error="handleImageError" />
                 <div class="course-tag">{{ course.classification || '必修' }}</div>
               </div>
               <div class="card-body">
                 <h4 class="course-title" :title="course.courseName || course.course_name">{{ course.courseName || course.course_name }}</h4>
                 <div class="teacher-info">
                    <el-icon><User /></el-icon> {{ course.teacherName }}
                 </div>
                 <div class="card-footer">
                   <el-button type="primary" size="small" round class="start-btn">进入课程</el-button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SIDE COLUMN (Right, 30%) -->
      <div class="sidebar-content animate-slide-up" style="animation-delay: 0.2s">
        
        <!-- Todo Timeline -->
        <div class="sidebar-widget glass-panel">
           <div class="widget-header">
             <h3>学习任务</h3>
             <span class="badge">{{ pendingHomeworks.length + upcomingExams.length }}</span>
           </div>
           
           <div v-if="pendingHomeworks.length === 0 && upcomingExams.length === 0" class="empty-widget">
             <el-icon size="40" color="#e0e0e0"><CircleCheck /></el-icon>
             <p>太棒了，没有待办任务！</p>
           </div>

           <div v-else class="todo-list">
             <!-- Exams First -->
             <div v-for="exam in upcomingExams" :key="'exam'+exam.examId" class="todo-item exam-item">
               <div class="todo-icon bg-red-50 text-red-500"><el-icon><Timer /></el-icon></div>
               <div class="todo-content">
                 <div class="todo-title">考试: {{ exam.examTitle }}</div>
                 <div class="todo-meta text-danger">时间: {{ formatTime(exam.startTime) }}</div>
               </div>
               <el-button link type="primary" size="small" @click="$router.push(`/student/exam/${exam.examId}/take`)">去考试</el-button>
             </div>

             <!-- Homeworks -->
             <div v-for="hw in pendingHomeworks" :key="'hw'+hw.reportId" class="todo-item hw-item">
               <div class="todo-icon bg-blue-50 text-blue-500"><el-icon><EditPen /></el-icon></div>
               <div class="todo-content">
                 <div class="todo-title">作业: {{ hw.reportTitle }}</div>
                 <div class="todo-meta">截止: {{ formatTime(hw.deadline) }}</div>
               </div>
               <el-button link type="primary" size="small" @click="$router.push(`/student/homework/${hw.reportId}/submit`)">提交</el-button>
             </div>
           </div>
        </div>

        <!-- Weekly Calendar / Motivational Quote -->
        <div class="sidebar-widget glass-panel">
           <div class="widget-header">
             <h3>每日金句</h3>
           </div>
           <div class="quote-card">
              <div class="quote-text">“学而时习之，不亦说乎？”</div>
              <div class="quote-author">—— 孔子</div>
           </div>
        </div>

        <div class="help-card" @click="handleAIChat">
           <div class="help-icon"><el-icon size="24"><Service /></el-icon></div>
           <div class="help-text">
             <h4>有困惑？</h4>
             <p>咨询老师</p>
           </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Reading, EditPen, Timer, ChatDotRound, User, ArrowRight, CircleCheck, Service, Cpu } from '@element-plus/icons-vue'
import { getStudentJoinedCourses } from '@/api/course'
import { getStudentLabReports } from '@/api/homework'
import { getStudentExamList } from '@/api/exam'
import { API_BASE_URL } from '@/api/request'
import '@/assets/css/teacher/modern-theme.css'

const router = useRouter()
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
const myCourses = ref([])

// 限制首页最多显示3个课程
const displayedCourses = computed(() => {
  return myCourses.value.slice(0, 3)
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  const sid = studentInfo.value.studentsId || localStorage.getItem('s_id')
  if (!sid) return

  // Load Joined Courses (Real Data)
  try {
     const courseRes = await getStudentJoinedCourses(sid)
     if (courseRes.success || courseRes.code === 200) {
        myCourses.value = courseRes.data || []
        // Debug Log
        console.log('Joined Courses Data:', myCourses.value)
        stats.value.courseCount = myCourses.value.length
     }
  } catch(e) { console.error('Failed to load courses:', e) }

  // Load Homework
  try {
     const hwRes = await getStudentLabReports(sid)
     if (hwRes.success) {
        const list = hwRes.data || []
        pendingHomeworks.value = list.filter(h => h.status === 0).slice(0, 3)
        stats.value.homeworkCount = list.filter(h => h.status === 0).length
     }
  } catch(e) { console.error(e) }

  // Load Exams
  try {
     const examRes = await getStudentExamList(sid, 'ONGOING') 
     if (examRes.success || examRes.code === 200) {
         const list = examRes.data || []
         upcomingExams.value = list.slice(0, 3)
         stats.value.examCount = list.length
     }
  } catch(e) { console.error(e) }
}

const getCourseCover = (img) => {
    // Debug: 查看图片路径
    console.log('Course Image Field:', img)
    console.log('API_BASE_URL:', API_BASE_URL)
    
    if (!img) {
        console.log('No image, using placeholder')
        return 'https://via.placeholder.com/400x200?text=Course'
    }
    if (img.startsWith('http')) {
        console.log('Using full URL:', img)
        return img
    }
    
    const backendUrl = 'http://localhost:8088'
    const fullUrl = `${backendUrl}${img}`
    console.log('Constructed URL:', fullUrl)
    return fullUrl
}

const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x200?text=Course'
}

const formatTime = (t) => {
  if (!t) return ''
  return new Date(t).toLocaleDateString()
}

const handleAIChat = () => {
  router.push('/student/messages')
}
</script>

<style scoped>
@import '@/assets/css/student/dashboard.css';

/* Fallback styles for Mini Course List */
.course-list-mini {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}
.mini-course-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  align-items: center;
}
.mini-course-item:hover {
  background: rgba(0,0,0,0.03);
}
.course-thumb {
  width: 80px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
}
.course-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.course-mini-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.c-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-meta {
  color: #666;
}

/* Dark mode overrides (Assuming html.dark is set on root) */
:global(html.dark) .c-title {
   color: #e5e7eb;
}
:global(html.dark) .c-meta {
   color: #9ca3af;
}
:global(html.dark) .mini-course-item:hover {
   background: rgba(255,255,255,0.05);
}
:global(html.dark) .course-thumb {
   background: #374151;
}

</style>
