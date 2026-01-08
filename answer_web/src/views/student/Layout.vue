<template>
  <div class="modern-layout">
    <el-container class="layout-container">
      <!-- 顶部 Header & Nav -->
      <el-header class="top-header glass-panel">
        <div class="header-inner">
          <!-- Logo -->
          <div class="brand" @click="router.push('/student/dashboard')">
            <div class="logo-box" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);">
              <el-icon :size="20"><School /></el-icon>
            </div>
            <h1 class="brand-text">智慧学习平台</h1>
          </div>

          <!-- 顶部水平菜单 -->
          <nav class="top-nav">
            <div 
              v-for="item in menuItems" 
              :key="item.path"
              class="nav-item"
              :class="{ active: isActive(item.path) }"
              @click="navigate(item.path)"
            >
              <el-icon :size="16" class="nav-icon"><component :is="item.icon" /></el-icon>
              <span class="nav-label">{{ item.label }}</span>
            </div>
          </nav>

          <!-- 右侧操作区 -->
          <div class="header-actions">
            <!-- 搜索框 -->
            <!-- 通知 / 答疑入口 -->
            <div class="action-btn" @click="$router.push('/student/messages')" title="我的消息">
              <el-badge :value="2" class="notification-badge" is-dot>
                <el-icon :size="20"><Bell /></el-icon>
              </el-badge>
            </div>

            <!-- 用户下拉 -->
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-profile">
                <el-avatar :size="36" :src="userStore.avatarUrl" class="user-avatar" style="background: #e0e7ff; color: #4f46e5;">
                   {{ userStore.userName ? userStore.userName.charAt(0) : 'S' }}
                </el-avatar>
                <div class="user-info">
                  <span class="user-name">{{ userStore.userName || '同学' }}</span>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </div>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="modern-dropdown">
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>账户设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="main-content">
        <!-- 页面标题/面包屑 -->


        <!-- 路由视图 -->
        <div class="content-view animate-slide-up">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import '@/assets/css/teacher/modern-theme.css' // Reuse general modern styles
import {
  School, HomeFilled, Reading, EditPen, Collection, ChatDotRound,
  Search, ArrowDown, User, Setting, SwitchButton, ArrowRight, Bell
} from '@element-plus/icons-vue'

import { useUserInfo } from '@/stores/user.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserInfo()

const currentRouteName = computed(() => route.meta.title || '学生中心')

const menuItems = [
  { path: '/student/dashboard', label: '主页', icon: 'HomeFilled' },
  { path: '/student/courses', label: '课程中心', icon: 'Reading' },
  { path: '/student/homework', label: '我的作业', icon: 'EditPen' },
  { path: '/student/exams', label: '在线考试', icon: 'Collection' },
]

const isActive = (path) => {
  return route.path.startsWith(path)
}

const navigate = (path) => {
  router.push(path)
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.clear()
      router.push('/login')
      ElMessage.success('已退出登录')
    })
  } else if (command === 'profile') {
    router.push('/student/profile')
  }
}
</script>

<style scoped>
.modern-layout {
  min-height: 100vh;
  position: relative;
}

.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.top-header {
  height: 72px;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 40px;
  border-radius: 0 0 24px 24px;
  border-top: none;
  background-color: rgba(255, 255, 255, 0.7);
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1440px;
  margin: 0 auto;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 200px;
}

.logo-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand-text {
  font-size: 18px;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
  background: linear-gradient(90deg, #1f2937, #4b5563);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Nav */
.top-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #3b82f6; /* Blue for students */
}

.nav-item.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.nav-icon { margin-top: -1px; }

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 200px;
  transition: all 0.3s;
}

.search-box:focus-within {
  background: white;
  width: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
  margin-left: 8px;
  color: #374151;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #1f2937;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.2s;
}

.user-profile:hover { background: rgba(255, 255, 255, 0.5); }

.user-avatar { border: 2px solid white; }

.user-info { display: flex; align-items: center; gap: 4px; }
.user-name { font-size: 14px; font-weight: 600; color: #374151; }

.main-content {
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.page-header { margin-bottom: 32px; }

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
  margin-bottom: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
  letter-spacing: -0.5px;
}

.flex-between { display: flex; justify-content: space-between; align-items: center; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-slide-up { animation: slideUp 0.5s ease-out 0.1s backwards; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) {
  .top-header { padding: 0 20px; }
  .logo-box, .brand-text { display: none; }
  .brand { min-width: auto; }
  .search-box { display: none; }
  .main-content { padding: 24px; }
}
</style>
