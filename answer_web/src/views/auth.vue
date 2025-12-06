<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoginComponent from './login.vue'
import RegisterComponent from './register.vue'
import '../assets/css/index/auth.css'

const route = useRoute()
const isLogin = ref(true) // 控制显示登录还是注册

// 初始化时根据路由设置显示状态
onMounted(() => {
  isLogin.value = route.name === 'login'
})

// 切换登录/注册状态
const toggleAuthMode = () => {
  isLogin.value = !isLogin.value
}
</script>

<template>
  <div class="auth-container">
    <!-- 左侧欢迎文字区域 -->
    <div class="welcome-section">
      <h1 class="welcome-title">欢迎使用智慧教学平台</h1>
      <p class="welcome-subtitle">
        连接师生，赋能教育，打造智能化教学新体验。<br>
        让知识传递更高效，让学习过程更精彩。
      </p>
    </div>
    
    <div class="auth-card" :class="{ 'login-active': isLogin, 'register-active': !isLogin }">
      <!-- 登录部分 -->
      <div class="auth-section login-section" :class="{ 'slide-down': !isLogin }">
        <LoginComponent />
      </div>
      <!-- 注册部分 -->
      <div class="auth-section register-section" :class="{ 'slide-up': !isLogin }">
        <RegisterComponent />
      </div>
    </div>
    
    <!-- 右下角切换按钮 -->
    <div class="auth-toggle-btn" @click="toggleAuthMode">
      <span v-if="isLogin">立即注册</span>
      <span v-else>已有账号？登录</span>
      <div class="toggle-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>