<template>
  <div class="teacher-layout">
    <el-container class="layout-container">
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-content">
          <div class="logo">
            <el-icon class="logo-icon" color="#409EFF"><School /></el-icon>
            <span class="logo-text">教师端---智慧教学平台</span>
          </div>
          
          <!-- 顶部水平菜单 -->
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            class="top-menu"
            :ellipsis="false"
            router
          >
            <el-menu-item index="/teacher/dashboard">
              <el-icon><Odometer /></el-icon>
              <span>首页概览</span>
            </el-menu-item>

            <el-sub-menu index="teaching">
              <template #title>
                <el-icon><Reading /></el-icon>
                <span>教学管理</span>
              </template>
              <el-menu-item index="/teacher/courses">我的课程</el-menu-item>
              <el-menu-item index="/teacher/classes">班级管理</el-menu-item>
              <el-menu-item index="/teacher/enrollments">报名审核</el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="exam">
              <template #title>
                <el-icon><EditPen /></el-icon>
                <span>考试作业</span>
              </template>
              <el-menu-item index="/teacher/exams">考试管理</el-menu-item>
              <el-menu-item index="/teacher/homework">作业管理</el-menu-item>
            </el-sub-menu>

            <el-menu-item index="/teacher/analytics">
               <el-icon><DataLine /></el-icon>
               <span>数据分析</span>
            </el-menu-item>
          </el-menu>

          <!-- 右侧用户信息 -->
          <div class="header-right">
            <!-- 互动消息铃铛 -->
            <el-dropdown @command="handleMessageCommand" class="message-dropdown">
              <div class="action-item">
                <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="item">
                  <el-icon size="20"><Bell /></el-icon>
                </el-badge>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="messages">
                    <el-icon><Message /></el-icon>
                    消息通知
                  </el-dropdown-item>
                  <el-dropdown-item command="comments">
                    <el-icon><ChatDotRound /></el-icon>
                    评论管理
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- 用户头像和姓名 -->
            <el-dropdown @command="handleUserCommand">
              <span class="user-dropdown">
                <el-avatar 
                  :size="32" 
                  :src="teacherStore.avatarUrl" 
                  style="margin-right: 8px;"
                >
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span class="username">{{ teacherStore.teacherName }}</span>
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <!-- 主要内容区域 -->
      <el-main class="main-content">
        <!-- 面包屑导航 -->
        <div class="breadcrumb-container">
           <el-breadcrumb separator="/">
             <el-breadcrumb-item :to="{ path: '/teacher/dashboard' }">首页</el-breadcrumb-item>
             <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
           </el-breadcrumb>
        </div>

        <router-view v-slot="{ Component }">
           <component :is="Component" />
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTeacherStore } from '@/stores/teacher.js'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()

const activeMenu = computed(() => route.path)
const currentRouteName = computed(() => route.meta.title || '当前页面')

// 未读消息数量
const unreadCount = ref(0)

onMounted(() => {
  // 获取未读消息数量
  loadUnreadCount()
})

// 加载未读消息数量
const loadUnreadCount = async () => {
  try {
    // 这里可以调用API获取未读消息数量
    // const response = await getUnreadMessageCount()
    // unreadCount.value = response.data || 0
    unreadCount.value = 3 // 临时数据
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 处理消息相关命令
const handleMessageCommand = (command) => {
  if (command === 'messages') {
    router.push('/teacher/messages')
  } else if (command === 'comments') {
    router.push('/teacher/comments')
  }
}

// 处理用户相关命令
const handleUserCommand = (command) => {
  if (command === 'logout') {
    // 使用store的清除方法
    teacherStore.clearTeacherInfo()
    
    ElMessage.success('已退出登录')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/teacher/profile')
  }
}
</script>

<style scoped>
.teacher-layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  background-color: #f5f7fa;
}

.layout-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.header-content {
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 40px;
  min-width: 200px;
}

.logo-icon {
  font-size: 28px;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}

.top-menu {
  flex: 1;
  border-bottom: none;
  background-color: transparent;
}

:deep(.el-menu--horizontal > .el-menu-item),
:deep(.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
  height: 60px;
  line-height: 60px;
  border-bottom: 2px solid transparent;
  color: #606266;
  font-size: 15px;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active),
:deep(.el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title) {
  border-bottom: 2px solid #409EFF;
  color: #409EFF !important;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 25px;
  margin-left: 20px;
}

.message-dropdown {
  cursor: pointer;
}

.action-item {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  transition: color 0.3s;
  padding: 8px;
  border-radius: 4px;
}

.action-item:hover {
  color: #409EFF;
  background-color: #f0f9ff;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
  transition: color 0.3s;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-dropdown:hover {
  color: #409EFF;
  background-color: #f0f9ff;
}

.username {
  font-weight: 500;
  font-size: 14px;
}

.main-content {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.breadcrumb-container {
  margin-bottom: 20px;
  padding: 0 4px;
}
</style>
