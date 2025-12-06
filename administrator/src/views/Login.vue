<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>管理员登录</h2>
        <p>在线教育平台管理系统</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>默认账号: admin / 密码: 123</p>
        <p style="margin-top: 10px; color: #f56c6c; font-size: 11px;">
          ⚠️ 请确保后端服务已启动: http://localhost:8088
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
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
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 3, message: '密码长度至少3位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      console.log('正在登录...', loginForm)
      console.log('API 地址:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api')
      
      const response = await adminLogin(loginForm)
      console.log('登录响应:', response)
      
      if (response.code === 200 && response.data) {
        // 保存 token 和用户信息
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminInfo', JSON.stringify(response.data.adminInfo))
        
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error(response.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败详情:', error)
      
      // 显示更详细的错误信息
      if (error.response) {
        ElMessage.error(`服务器错误: ${error.response.status} - ${error.response.data?.message || '未知错误'}`)
      } else if (error.request) {
        ElMessage.error('网络错误，请检查后端服务是否启动 (http://localhost:8088)')
      } else {
        ElMessage.error(`登录失败: ${error.message}`)
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  color: #303133;
}

.login-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-top: 30px;
}

.login-button {
  width: 100%;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.login-footer p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}
</style>
