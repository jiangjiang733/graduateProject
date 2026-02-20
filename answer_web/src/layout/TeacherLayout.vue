<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar glass">
      <div class="logo">
        <h2>Teacher Hub</h2>
      </div>
      <nav class="nav-menu">
        <router-link to="/teacher/dashboard" class="nav-item">
          <i class="icon">📊</i> Dashboard
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

    <!-- Main Content -->
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
  background-color: var(--bg-color);
  overflow: hidden;
}

.sidebar {
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--glass-border);
  z-index: 20;
}

.logo {
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.logo h2 {
  margin: 0;
  font-size: 1.5rem;
  background: linear-gradient(to right, var(--secondary-color), var(--accent-color)); /* Different gradient for teacher */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.nav-item:hover, .nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(236, 72, 153, 0.1), transparent);
  border-left: 3px solid var(--secondary-color);
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
  padding: 2rem;
  overflow-y: auto;
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
