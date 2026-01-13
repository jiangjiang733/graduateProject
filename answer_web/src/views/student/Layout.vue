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

      <!-- 联系工作人员 -->
      <CustomerService userType="STUDENT" :userId="userStore.userId" />
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
import CustomerService from '@/components/CustomerService.vue'

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
@import '@/assets/css/student/layout.css';
</style>
