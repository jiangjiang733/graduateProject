<template>
  <div class="student-layout">
    <el-container>
      <el-header class="app-header">
        <div class="header-content">
          <div class="brand" @click="router.push('/student/dashboard')">
            <el-icon class="brand-icon"><School /></el-icon>
            <span class="brand-text">智慧学习平台</span>
          </div>
          
          <el-menu
            mode="horizontal"
            :default-active="activeMenu"
            class="nav-menu"
            router
            :ellipsis="false"
          >
            <el-menu-item index="/student/dashboard">主页</el-menu-item>
            <el-menu-item index="/student/courses">课程中心</el-menu-item>
            <el-menu-item index="/student/homework">我的作业</el-menu-item>
            <el-menu-item index="/student/exams">在线考试</el-menu-item>
          </el-menu>
          
          <div class="header-right">
            <el-button circle text>
              <el-icon><Bell /></el-icon>
            </el-button>
            
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-profile">
                <el-avatar :size="32" :src="userInfo.avatar || 'https://placeholder.com/32'">
                  {{ userInfo.username ? userInfo.username.charAt(0) : 'S' }}
                </el-avatar>
                <span class="username">{{ userInfo.username || '同学' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      
      <el-footer class="app-footer">
        <p>© 2023 智慧学习平台 - All Rights Reserved</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { School, Bell, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const activeMenu = computed(() => route.path)

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
.student-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #409EFF;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  font-size: 20px;
  font-weight: 600;
}

.nav-menu {
  border-bottom: none;
  background-color: transparent;
  flex: 1;
  justify-content: center;
}

.nav-menu :deep(.el-menu-item) {
  font-size: 16px;
  color: #606266;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: #409EFF;
  font-weight: 600;
  border-bottom: 2px solid #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  width: 100%;
  min-height: calc(100vh - 60px - 60px);
}

.app-footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px 0;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
