<template>
  <div class="dashboard-container">
    <!-- 顶部导航 -->
    <header class="dashboard-header">
      <div class="header-inner">
        <div class="user-profile">
          <div class="avatar-wrapper" @click="$router.push('/student/profile')" style="cursor: pointer;">
            <el-avatar :size="56" :src="userStore.avatarUrl">
              {{ (userStore.userName || 'S').charAt(0) }}
            </el-avatar>
            <div class="status-indicator"></div>
          </div>
          <div class="welcome-text">
            <h2>{{ greetingTime }}，{{ userStore.userName || '同学' }}</h2>
            <p>准备好开始今天的学习了吗？你还有 {{ todoList.length }} 项待办事项。</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="search-wrapper">
            <el-input
                v-model="searchQuery"
                placeholder="搜索课程..."
                class="modern-search"
                @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </header>

    <main class="dashboard-content">
      <!-- 统计指标 -->
      <section class="stats-overview">
        <div class="stat-glass-card clickable" @click="$router.push('/student/courses')">
          <div class="stat-icon" style="color: #6366f1; background-color: #eef2ff">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <span class="value">{{ allCourses.length }}</span>
            <span class="label">在修课程</span>
          </div>
        </div>

        <div class="stat-glass-card clickable" @click="$router.push('/student/homework')">
          <div class="stat-icon" style="color: #f59e0b; background-color: #fffbeb">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <span class="value">{{ todoList.length }}</span>
            <span class="label">待办事项</span>
          </div>
        </div>

        <div class="stat-glass-card clickable" @click="$router.push('/student/messages')">
          <div class="stat-icon" style="color: #10b981; background-color: #ecfdf5">
            <el-icon><Opportunity /></el-icon>
          </div>
          <div class="stat-info">
            <span class="value">{{ activities?.length || 0 }}</span>
            <span class="label">近期动态</span>
          </div>
        </div>
      </section>

      <div class="main-layout">
        <!-- 课程区域 -->
        <section class="course-section">
          <div class="section-header">
            <h3><el-icon><Reading /></el-icon> 最近课程</h3>
            <el-button type="primary" link @click="viewAllCourses">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
          </div>

          <div v-if="loading" class="skeleton-grid">
            <el-skeleton v-for="i in 2" :key="i" animated>
              <template #template>
                <el-skeleton-item variant="image" style="height: 160px; border-radius: 12px" />
                <div style="padding: 14px">
                  <el-skeleton-item variant="h3" style="width: 50%" />
                  <el-skeleton-item variant="text" style="margin-top: 8px" />
                </div>
              </template>
            </el-skeleton>
          </div>

          <div v-else-if="!courses || courses.length === 0" class="empty-box">
            <el-empty description="还没有加入任何课程">
              <el-button type="primary" @click="viewAllCourses" round>去选课</el-button>
            </el-empty>
          </div>

          <div v-else class="course-list">
            <div
                v-for="course in courses.slice(0, 3)"
                :key="course.id"
                class="premium-course-strip"
                @click="continueLearning(course.id)"
            >
              <div class="strip-banner">
                <img :src="course.image" alt="cover" class="rect-img">
                <div class="category-tag">{{ course.classification }}</div>
              </div>
              <div class="strip-content">
                <div class="content-main">
                  <h4 class="course-title">{{ course.courseName }}</h4>
                  <div class="course-info">
                    <div class="info-item">
                      <el-icon><User /></el-icon>
                      <span>{{ course.teacherName }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Clock /></el-icon>
                      <span>最近学习: 刚刚</span>
                    </div>
                  </div>
                </div>
                <div class="content-status">
                  <span class="status-btn">继续学习 <el-icon><ArrowRight /></el-icon></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 侧边栏 -->
        <aside class="sidebar-section">
          <div class="sidebar-card task-card">
            <div class="card-title">
              <h4>待办事项</h4>
              <span class="count-tag">{{ todoList.length }}</span>
            </div>
            <div class="todo-list-modern">
              <div v-for="item in todoList" :key="item.id" class="todo-row">
                <div class="check-box">
                  <el-icon><Edit /></el-icon>
                </div>
                <div class="todo-body">
                  <p class="title">{{ item.title }}</p>
                  <span class="time"><el-icon><Clock /></el-icon> {{ item.deadline }}</span>
                </div>
              </div>
              <div v-if="todoList.length === 0" class="no-tasks">
                <el-empty :image-size="40" description="暂无待办" />
              </div>
            </div>
          </div>

          <div class="sidebar-card quick-links">
            <h4>快速通道</h4>
            <div class="link-grid">
              <div class="link-item"><el-icon><Files /></el-icon><span>资源</span></div>
              <div class="link-item"><el-icon><ChatLineRound /></el-icon><span>讨论</span></div>
              <div class="link-item"><el-icon><TrendCharts /></el-icon><span>成绩</span></div>
              <div class="link-item"><el-icon><QuestionFilled /></el-icon><span>答疑</span></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Search, Reading, User, Clock, ArrowRight,
  Monitor, Timer, Opportunity, Edit, Files,
  ChatLineRound, TrendCharts, QuestionFilled
} from '@element-plus/icons-vue'
import { useStudentDashboard } from '@/assets/js/student/dashboard.js'
import { useUserInfo } from '@/stores/user.js'

const userStore = useUserInfo()

const {
  userInfo,
  searchQuery,
  courses,
  allCourses,
  todoList,
  activities,
  loading,
  handleSearch,
  continueLearning,
  viewAllCourses
} = useStudentDashboard()

const greetingTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 5) return '深夜好'
  if (hour < 11) return '早安'
  if (hour < 13) return '午安'
  if (hour < 18) return '下午好'
  return '晚安'
})
</script>

<style scoped>
.dashboard-container {
  --primary: #6366f1;
  --bg-soft: #f8fafc;
  --text-main: #1e293b;
  --text-soft: #64748b;
  --border-color: #f1f5f9;
  background-color: var(--bg-soft);
}

.dashboard-header {
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 16px 40px;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-profile { display: flex; align-items: center; gap: 16px; }
.avatar-wrapper { position: relative; }
.status-indicator {
  position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
  background: #10b981; border: 2px solid #fff; border-radius: 50%;
}

.welcome-text h2 { margin: 0; font-size: 1.2rem; color: var(--text-main); }
.welcome-text p { margin: 4px 0 0; font-size: 0.9rem; color: var(--text-soft); }

.modern-search { width: 260px; }
.modern-search :deep(.el-input__wrapper) { border-radius: 12px; background: #f1f5f9; box-shadow: none; }

.dashboard-content { max-width: 1200px; margin: 24px auto 0; padding: 0 40px; }

.stats-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.stat-glass-card {
  background: #fff; padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}
.stat-glass-card.clickable { cursor: pointer; }
.stat-glass-card.clickable:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -10px rgba(0,0,0,0.1); }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.stat-info .value { display: block; font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
.stat-info .label { font-size: 0.8rem; color: var(--text-soft); }

.main-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin: 0; }

.course-list { display: flex; flex-direction: column; gap: 16px; }
.premium-course-strip {
  background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  height: 100px;
}
.premium-course-strip:hover { 
  transform: translateX(8px);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05);
  border-color: var(--primary);
}
.strip-banner { width: 140px; height: 100%; position: relative; flex-shrink: 0; }
.strip-banner img { 
  width: 100%; height: 100%; 
  object-fit: cover; 
  border-radius: 12px !important; /* 强制覆盖圆角 */
}
.rect-img {
  border-radius: 12px !important;
}
.category-tag { position: absolute; top: 8px; left: 8px; background: rgba(99, 102, 241, 0.9); backdrop-filter: blur(4px); color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 700; }
.strip-content { flex: 1; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; }
.content-main { flex: 1; }
.course-title { margin: 0 0 6px; font-size: 1rem; font-weight: 800; color: var(--text-main); }
.course-info { display: flex; gap: 20px; }
.info-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-soft); }
.content-status { color: var(--primary); font-size: 0.9rem; font-weight: 600; opacity: 0.8; transition: all 0.2s; }
.premium-course-strip:hover .content-status { opacity: 1; transform: translateX(5px); }
.status-btn { display: flex; align-items: center; gap: 4px; }

.sidebar-card { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid var(--border-color); margin-bottom: 24px; }
.sidebar-card h4 { margin: 0 0 16px; font-size: 1rem; }
.card-title { display: flex; justify-content: space-between; align-items: center; }
.count-tag { background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }

.todo-list-modern { display: flex; flex-direction: column; gap: 12px; }
.todo-row { display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 10px; }
.check-box { width: 32px; height: 32px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6366f1; }
.todo-body .title { margin: 0; font-size: 0.85rem; font-weight: 600; }
.todo-body .time { font-size: 0.7rem; color: #94a3b8; }

.link-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.link-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px; background: #f8fafc; border-radius: 12px; cursor: pointer; }
.link-item:hover { background: #eef2ff; color: #6366f1; }
.link-item span { font-size: 0.7rem; font-weight: 600; }
</style>