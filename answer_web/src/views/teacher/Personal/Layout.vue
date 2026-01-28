<template>
  <div class="modern-layout">
    <div class="layout-wrapper">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-header cursor-pointer" @click="navigate('/teacher/profile')">
          <el-avatar :size="64" :src="teacherStore.avatarUrl" class="user-avatar transition-all">
            {{ teacherStore.teacherName?.charAt(0) || '教' }}
          </el-avatar>
          <div class="user-meta">
            <h2 class="user-name">{{ teacherStore.teacherName }}</h2>
            <span class="user-role">教师</span>
          </div>
        </div>

        <nav class="side-nav">
          <div 
            v-for="item in menuItems" 
            :key="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="navigate(item.path)"
          >
            <div class="nav-item-content">
              <el-badge 
                v-if="item.label === '消息中心'" 
                :value="teacherStore.unreadCount" 
                :hidden="teacherStore.unreadCount <= 0"
                class="menu-badge"
              >
                <el-icon :size="20" class="nav-icon"><component :is="item.icon" /></el-icon>
              </el-badge>
              <el-icon v-else :size="20" class="nav-icon"><component :is="item.icon" /></el-icon>
              <span class="nav-label">{{ item.label }}</span>
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="nav-item logout" @click="handleUserCommand('logout')">
            <el-icon :size="20"><SwitchButton /></el-icon>
            <span class="nav-label">退出系统</span>
          </div>
        </div>
      </aside>

      <!-- 全局主题切换按钮 (右上角固定) -->
      <div class="global-theme-toggle" @click="settingsStore.theme = settingsStore.theme === 'dark' ? 'light' : 'dark'">
        <el-tooltip :content="settingsStore.theme === 'dark' ? '切换浅色模式' : '切换深色模式'" placement="left">
          <div class="toggle-btn">
            <el-icon v-if="settingsStore.theme === 'dark'"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- 主内容区 -->
      <main class="main-wrapper">
        <div class="content-view animate-slide-up">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- 联系工作人员 -->
    <CustomerService userType="TEACHER" :userId="teacherStore.teacherId" />
  </div>
</template>

<script setup>
import {
  Reading, Odometer, User, EditPen, ChatDotRound, 
  Setting, ArrowRight, Search, Bell, Plus, ArrowDown, SwitchButton,
  Collection, List, Folder, UserFilled, Checked, Sunny, Moon
} from '@element-plus/icons-vue'
import { useTeacherLayout } from '@/assets/js/teacher/layout.js'
import CustomerService from '@/components/CustomerService.vue'

const {
  teacherStore,
  settingsStore,
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
