<template>
  <div class="login-container">
    <!-- 动态背景装饰 -->
    <div class="bg-decorations">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-card glass-panel animate-fade-in">
      <div class="login-header">
        <div class="logo-box">
          <el-icon :size="32" color="#fff"><Management /></el-icon>
        </div>
        <h2>智慧教育管理后台</h2>
        <p>Intelligent Education Administration</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        label-position="top"
      >
        <el-form-item prop="username">
          <label class="custom-label">管理员账号</label>
          <el-input
            v-model="loginForm.username"
            placeholder="Username"
            size="large"
            prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <label class="custom-label">安全密码</label>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Password"
            size="large"
            prefix-icon="Lock"
            show-password
            class="custom-input"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item class="submit-item">
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button gradient-btn"
            @click="handleLogin"
          >
            进入管理系统
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="account-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>演示账号: admin / 123</span>
        </div>
        <div class="status-check">
          <div class="indicator pulse"></div>
          <span>后台服务已就绪</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Management, InfoFilled } from '@element-plus/icons-vue'
import { adminLogin } from '@/api/auth'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123'
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入安全密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    loading.value = true
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    const response = await adminLogin(loginForm)
    if (response.code === 200 && response.data) {
      // 存储认证信息
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('adminInfo', JSON.stringify(response.data.adminInfo))
      
      ElMessage({
        message: '认证成功，正在进入系统...',
        type: 'success'
      })
      
      // 立即执行跳转
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } else {
      ElMessage.error(response.message || '凭证校验失败')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    if (error === false) return // 表单验证失败
    ElMessage.error('通讯异常，请确认后端服务状态')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  overflow: hidden;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 动态背景装饰 - 纯蓝色系 */
.bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: #bae6fd;
  top: -100px;
  right: -50px;
}

.circle-2 {
  width: 500px;
  height: 500px;
  background: #7dd3fc;
  bottom: -150px;
  left: -100px;
  animation-delay: -5s;
}

.circle-3 {
  width: 300px;
  height: 300px;
  background: #38bdf8;
  top: 40%;
  left: 20%;
  animation-delay: -10s;
  opacity: 0.3;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(60px, 40px) scale(1.05); }
}

/* 登录卡片 - 白霜玻璃效果 */
.login-card {
  width: 440px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  z-index: 10;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-box {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2);
}

.login-header h2 {
  color: #0f172a;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.login-header p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}

.login-form {
  margin-top: 20px;
}

.custom-label {
  display: block;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  margin-left: 4px;
}

/* Element Plus 样式覆盖 */
:deep(.custom-input .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: none !important;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 6px 12px;
  transition: all 0.3s;
}

:deep(.custom-input .el-input__wrapper:hover) {
  border-color: #0ea5e9;
  background: #fff;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #0ea5e9;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1) !important;
}

:deep(.custom-input .el-input__inner) {
  color: #1e293b;
  font-weight: 500;
}

:deep(.custom-input .el-input__inner::placeholder) {
  color: #94a3b8;
}

:deep(.el-input__prefix-icon) {
  color: #64748b;
}

.submit-item {
  margin-top: 32px;
}

.gradient-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(90deg, #0ea5e9, #2563eb);
  border: none;
  border-radius: 14px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 1px;
  color: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
  background: linear-gradient(90deg, #0284c7, #1d4ed8);
}

.gradient-btn:active {
  transform: translateY(0);
}

.login-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.account-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.status-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #059669;
  font-size: 12px;
  font-weight: 600;
}

.indicator {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.animate-fade-in {
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
