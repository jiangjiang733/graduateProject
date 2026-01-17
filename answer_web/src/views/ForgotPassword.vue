<template>
  <div class="forgot-password-page">
    <div class="forgot-card">
      <div class="back-btn" @click="router.push('/login')">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回登录</span>
      </div>
      
      <h2 class="forgot-title">重置密码</h2>
      <p class="forgot-subtitle">请输入您的邮箱地址，我们将发送验证码</p>

      <el-form ref="forgotFormRef" :model="forgotForm" class="forgot-form">
        <!-- 步骤1: 输入邮箱 -->
        <div v-if="currentStep === 1">
          <el-form-item label="" prop="email">
            <el-input 
              v-model="forgotForm.email" 
              placeholder="请输入注册邮箱"
              size="large"
              :prefix-icon="Message"
            />
          </el-form-item>
          
          <el-button 
            type="primary" 
            class="submit-btn" 
            @click="sendCode"
            :loading="sending"
            :disabled="!forgotForm.email"
          >
            {{ sending ? '发送中...' : '发送验证码' }}
          </el-button>
        </div>

        <!-- 步骤2: 验证码和新密码 -->
        <div v-if="currentStep === 2">
          <el-form-item label="" prop="code">
            <el-input 
              v-model="forgotForm.code" 
              placeholder="请输入6位验证码"
              size="large"
              maxlength="6"
              :prefix-icon="Key"
            >
              <template #append>
                <el-button 
                  :disabled="countdown > 0" 
                  @click="sendCode"
                  link
                >
                  {{ countdown > 0 ? `${countdown}秒后重试` : '重新发送' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="" prop="newPassword">
            <el-input 
              v-model="forgotForm.newPassword" 
              type="password"
              placeholder="请输入新密码（至少6位）"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item label="" prop="confirmPassword">
            <el-input 
              v-model="forgotForm.confirmPassword" 
              type="password"
              placeholder="请再次确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-button 
            type="primary" 
            class="submit-btn" 
            @click="resetPassword"
            :loading="resetting"
          >
            {{ resetting ? '重置中...' : '重置密码' }}
          </el-button>
        </div>
      </el-form>

      <div class="step-indicator">
        <div class="step" :class="{ active: currentStep >= 1 }">1</div>
        <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
        <div class="step" :class="{ active: currentStep >= 2 }">2</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Message, Key, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const currentStep = ref(1)
const sending = ref(false)
const resetting = ref(false)
const countdown = ref(0)
const forgotFormRef = ref()

const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 发送验证码
const sendCode = async () => {
  if (!forgotForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(forgotForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }

  sending.value = true
  
  try {
    // TODO: 调用后端API发送验证码
    // const response = await axios.post('/api/forgot-password/send-code', {
    //   email: forgotForm.email
    // })
    
    // 模拟发送
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('验证码已发送到您的邮箱')
    currentStep.value = 2
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error(error.response?.data?.message || '发送失败，请重试')
  } finally {
    sending.value = false
  }
}

// 重置密码
const resetPassword = async () => {
  if (!forgotForm.code) {
    ElMessage.warning('请输入验证码')
    return
  }

  if (!forgotForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }

  if (forgotForm.newPassword.length < 6) {
    ElMessage.warning('密码长度至少为6位')
    return
  }

  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  resetting.value = true

  try {
    // TODO: 调用后端API重置密码
    // const response = await axios.post('/api/forgot-password/reset', {
    //   email: forgotForm.email,
    //   code: forgotForm.code,
    //   newPassword: forgotForm.newPassword
    // })

    // 模拟重置
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('密码重置成功，请使用新密码登录')
    
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error(error.response?.data?.message || '重置失败，请重试')
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(30, 60, 114, 0.95) 0%, rgba(42, 82, 152, 0.9) 50%, rgba(122, 168, 209, 0.85) 100%),
    url('https://images.unsplash.com/photo-1517842645767-c639042777db?w=1920&q=80') center/cover;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.forgot-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  position: relative;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2a5298;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  transition: color 0.3s;
}

.back-btn:hover {
  color: #1e3c72;
}

.forgot-title {
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0 0 8px 0;
  text-align: center;
}

.forgot-subtitle {
  font-size: 14px;
  color: #8E8E93;
  text-align: center;
  margin: 0 0 32px 0;
}

.forgot-form {
  margin-bottom: 32px;
}

.forgot-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.forgot-form :deep(.el-input__wrapper:hover) {
  border-color: #2a5298;
}

.forgot-form :deep(.el-input__wrapper.is-focus) {
  border-color: #2a5298;
  box-shadow: 0 0 0 2px rgba(42, 82, 152, 0.2);
}

.submit-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
  border: none;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(42, 82, 152, 0.3);
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.step {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F2F2F7;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
}

.step.active {
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(42, 82, 152, 0.3);
}

.step-line {
  width: 60px;
  height: 3px;
  background: #F2F2F7;
  border-radius: 2px;
  transition: all 0.3s;
}

.step-line.active {
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
}
</style>
