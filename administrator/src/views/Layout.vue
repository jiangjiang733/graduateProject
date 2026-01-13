<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <div class="logo-icon">A</div>
        <h3>管理系统</h3>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        
        <el-menu-item index="/students">
          <el-icon><User /></el-icon>
          <span>学生管理</span>
        </el-menu-item>
        
        <el-menu-item index="/teachers">
          <el-icon><UserFilled /></el-icon>
          <span>教师管理</span>
        </el-menu-item>
        
        <el-menu-item index="/announcements">
          <el-icon><Bell /></el-icon>
          <span>公告管理</span>
        </el-menu-item>
        
        <el-menu-item index="/sensitive-words">
          <el-icon><Warning /></el-icon>
          <span>敏感词管理</span>
        </el-menu-item>
        
        <el-menu-item index="/chats">
          <el-icon><ChatDotRound /></el-icon>
          <span>咨询反馈</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <div class="user-avatar">
                 <el-icon><Avatar /></el-icon>
              </div>
              <span class="user-name">{{ adminInfo?.username || '管理员' }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, User, UserFilled, Bell, Warning, Avatar, CaretBottom, SwitchButton, ChatDotRound } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const adminInfo = ref<any>(null)

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': '首页概览',
    '/students': '学生用户管理',
    '/teachers': '教师用户管理',
    '/announcements': '公告信息管理',
    '/sensitive-words': '系统敏感词库',
    '/chats': '咨询反馈中心'
  }
  return titles[route.path] || '管理系统'
})

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '系统提示', {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning',
        roundButton: true
      })
      
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminInfo')
      ElMessage.success('已安全退出登录')
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}

onMounted(() => {
  const info = localStorage.getItem('adminInfo')
  if (info) {
    adminInfo.value = JSON.parse(info)
  }
})
</script>

<style scoped>
@import '@/assets/css/variables.css';
@import '@/assets/css/layout.css';
</style>
