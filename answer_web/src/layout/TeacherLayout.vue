<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar glass">
      <div class="sidebar-logo">
        <div class="logo-icon-bg">
          <span style="color: white; font-size: 26px; line-height: 1;">📖</span>
        </div>
        <h1 class="logo-text">智慧教学平台</h1>
      </div>
      <nav class="nav-menu">
        <router-link to="/teacher/dashboard" class="nav-item">
          <i class="icon">🏠</i> Dashboard
        </router-link>
        <router-link to="/teacher/courses" class="nav-item">
          <i class="icon">👨‍🏫</i> My Courses
        </router-link>
        <router-link to="/teacher/question-bank" class="nav-item">
          <i class="icon">❓</i> Question Bank
        </router-link>
        <router-link to="/teacher/exams" class="nav-item">
          <i class="icon">📝</i> Exam Mgmt
        </router-link>
        <router-link to="/teacher/students" class="nav-item">
          <i class="icon">👨‍🎓</i> Students
        </router-link>
      </nav>
      <div class="user-profile">
        <div class="avatar">T</div>
        <div class="info">
          <span>{{ user.teacherUsername }}</span>
          <small>Teacher</small>
        </div>
        <button class="logout-btn" @click="handleLogout">🚪</button>
      </div>
    </aside>

   
    <main class="main-content">
      <header class="top-bar glass">
        <h3>Teacher Workspace</h3>
        <div class="actions">
          <button class="icon-btn">🔔</button>
          <button class="icon-btn">⚙️</button>
        </div>
      </header>
      <div class="content-view">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref({})

onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    user.value = JSON.parse(userData)
  }
})

const handleLogout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-page);
  overflow: hidden;
}

.sidebar {
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-right: 1px solid rgba(255, 255, 255, 0.4);
  z-index: 20;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 2rem 1rem;
  margin-bottom: 1rem;
}

.logo-icon-bg {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #4A7AFF, #2563EB);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2563EB;
  margin: 0;
  letter-spacing: 0.05em;
}

.nav-menu {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  color: #94A3B8;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.02);
  color: #64748B;
  transform: scale(1.05);
}

.nav-item.router-link-active {
  background: #2563EB;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  border-left: none; /* remove the old border styling */
}

.nav-item .icon {
  margin-right: 1rem;
}

.user-profile {
  padding: 1rem;
  display: flex;
  align-items: center;
  border-top: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.2);
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--secondary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin-right: 1rem;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info span {
  font-weight: 500;
  color: var(--text-primary);
}

.info small {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text-secondary);
  transition: color 0.3s;
}

.logout-btn:hover {
  color: var(--secondary-color);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.top-bar {
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  z-index: 10;
}

.top-bar h3 {
  margin: 0;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  margin-left: 1rem;
  cursor: pointer;
}

.content-view {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Route transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
