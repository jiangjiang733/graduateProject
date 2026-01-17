<script setup lang="ts">
import { ref } from 'vue'
import { useLoginStore } from '../stores/login'
import '../assets/css/index/login.css'
import { useRouter } from "vue-router"
import { watch } from "vue"
import ImageCaptcha from '../components/ImageCaptcha.vue'
import { ElMessage } from 'element-plus'

const { activeTab, form, loading, onSubmit, loginClick: storeLoginClick, setActiveTab, rem } = useLoginStore()
const router = useRouter()
const captchaRef = ref(null)

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

// 监听路由变化，根据路由状态切换角色（隐藏参数方式）
watch(() => router.currentRoute.value, (newRoute) => {
  // 通过路由状态(history.state)获取角色信息，URL中不显示参数
  if (history.state && history.state.role) {
    setActiveTab(history.state.role)
  }
}, { immediate: true })

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
        <input v-model="form.username" placeholder="请输入工号/学号" />
      </div>
      <div class="input-group">
        <input v-model="form.password" type="password" placeholder="请输入密码"  />
      </div>
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

