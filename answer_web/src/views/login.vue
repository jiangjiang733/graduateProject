<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useLoginStore } from '../stores/login'
import '../assets/css/index/login.css'
import { useRouter, useRoute } from "vue-router"
import { watch } from "vue"
import ImageCaptcha from '../components/ImageCaptcha.vue'
import { ElMessage } from 'element-plus'

const { activeTab, form, loading, onSubmit, loginClick: storeLoginClick, setActiveTab, rem } = useLoginStore()
const router = useRouter()
const route = useRoute()
const captchaRef = ref(null)
const showPassword = ref(false)
// 包装登录函数以验证验证码
const loginClick = () => {
  if (!form.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  
  if (!captchaRef.value.validate(form.captcha)) {
    ElMessage.error('验证码错误')
    captchaRef.value.refreshCaptcha()
    form.captcha = ''
    return
  }
  
  storeLoginClick()
}

// 在组件挂载时读取路由状态
onMounted(() => {
  nextTick(() => {
    // 优先从 history.state 读取角色信息
    if (history.state && history.state.role) {
      setActiveTab(history.state.role)
    }
  })
})

// 监听路由变化，处理后续导航
watch(() => route.fullPath, () => {
  nextTick(() => {
    if (history.state && history.state.role) {
      setActiveTab(history.state.role)
    }
  })
})


</script>
<template>
  <div class="login-component">
    <form class="auth-form" @submit.prevent="onSubmit">
      <h3 class="form-title">欢迎回来</h3>
      <div class="tabs">
        <button type="button" class="tab" :class="{ active: activeTab === 'teacher' }" @click="setActiveTab('teacher')">教师登录</button>
        <button type="button" class="tab" :class="{ active: activeTab === 'student' }" @click="setActiveTab('student')">学生登录</button>
      </div>
      <div class="input-group">
        <input v-model="form.username" placeholder="请输入账号" />
      </div>
      <div class="input-group">
        <input v-model="form.password"  :type="showPassword ? 'text' : 'password'" placeholder="请输入密码"  />
        <span class="eye-icon" @click="showPassword = !showPassword">
          <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 2.99m-4.08-4.08A3 3 0 1 1 10.56 10.56"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </span>      </div>
      <div class="input-group captcha-group">
        <input v-model="form.captcha" placeholder="请输入验证码" maxlength="4" class="captcha-input" />
        <ImageCaptcha ref="captchaRef" :width="100" :height="38" />
      </div>
      <div class="forgot-rem">
        <RouterLink to="/forgotPassword" class="forgot">忘记密码?</RouterLink>
        <el-checkbox  v-model="rem" :label="rem===true?'忘记账号':'记住账号'" size="large" />
      </div>
      <button 
        type="submit" 
        class="btn btn-primary full" 
        @click="loginClick()" 
        :disabled="loading"
      >
        <span v-if="loading">
          <i class="el-icon-loading"></i> 登录中...
        </span>
        <span v-else>登录</span>
      </button>
      <el-button 
        style="height:46px;border-radius: 30px;text-decoration: none;color: white;font-size:16px"  
        class="btn btn-primary full" 
        @click="router.push('/')"
        :disabled="loading"
      >回到首页</el-button>
      <div class="social-wrap">
        <span class="muted ">欢迎使用教学系统</span>
      </div>
    </form>
  </div>
</template>

