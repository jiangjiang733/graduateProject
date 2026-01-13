<template>
  <div class="modern-layout">
    <el-container class="layout-container">
      <el-header class="top-header glass-panel">
        <div class="header-inner">
          <div class="brand" @click="$router.push('/teacher/dashboard')">
            <div class="logo-box">
              <el-icon :size="20"><Reading /></el-icon>
            </div>
            <h1 class="brand-text">智慧课堂</h1>
          </div>
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
            <div class="search-box glass-input">
              <el-icon class="search-icon"><Search /></el-icon>
              <input type="text" placeholder="快速查找..." class="search-input" />
            </div>

            <!-- 通知 / 答疑入口 -->
            <div class="action-btn" @click="$router.push('/teacher/messages')" title="消息与答疑">
              <el-badge :value="teacherStore.unreadCount" :hidden="teacherStore.unreadCount === 0" class="notification-badge">
                <el-icon :size="20"><Bell /></el-icon>
              </el-badge>
            </div>

            <!-- 用户下拉 -->
            <el-dropdown trigger="click" @command="handleUserCommand">
              <div class="user-profile">
                <el-avatar :size="36" :src="teacherStore.avatarUrl" class="user-avatar">
                   {{ teacherStore.teacherName?.charAt(0) || '教' }}
                </el-avatar>
                <div class="user-info">
                  <span class="user-name">{{ teacherStore.teacherName }}</span>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </div>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="modern-dropdown">
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>系统设置
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
      <CustomerService userType="TEACHER" :userId="teacherStore.teacherId" />
    </el-container>
  </div>
</template>

<script setup>
import {
  Reading, Odometer, User, EditPen, ChatDotRound, 
  Setting, ArrowRight, Search, Bell, Plus, ArrowDown, SwitchButton,
  Collection, List, Folder
} from '@element-plus/icons-vue'
import { useTeacherLayout } from '@/assets/js/teacher/layout.js'
import '@/assets/css/teacher/modern-theme.css'
import CustomerService from '@/components/CustomerService.vue'

const {
  teacherStore,
  menuItems,
  isActive,
  navigate,
  handleUserCommand,
  fetchUnreadCount,
  currentRouteName,
  showQuickCreate
} = useTeacherLayout()
</script>

<style scoped>
@import '@/assets/css/teacher/layout.css';
</style>
