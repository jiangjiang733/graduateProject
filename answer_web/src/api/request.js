
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// API基础URL
const API_BASE_URL = 'http://localhost:8088/api'

// 创建axios实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    // 从localStorage获取token（按优先级查找）
    const token = localStorage.getItem('token') ||
                  localStorage.getItem('teacherToken') || 
                  localStorage.getItem('t_token') || 
                  localStorage.getItem('s_token')
    
    // 如果token存在，添加到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    // 直接返回响应数据
    return response.data
  },
  error => {
    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未认证，清除token并跳转到登录页
          localStorage.removeItem('teacherId')
          localStorage.removeItem('t_id')
          localStorage.removeItem('token')
          localStorage.removeItem('teacherToken')
          localStorage.removeItem('t_token')
          localStorage.removeItem('s_id')
          localStorage.removeItem('s_token')
          localStorage.removeItem('status')
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
          break
          
        case 403:
          // 无权限
          ElMessage.error('无权限访问该资源')
          break
          
        case 404:
          // 资源不存在
          ElMessage.error('请求的资源不存在')
          break
          
        case 500:
          // 服务器错误
          ElMessage.error('服务器错误，请稍后重试')
          break
          
        default:
          // 其他错误
          ElMessage.error(data?.message || '请求失败，请重试')
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      // 发送请求时出了点问题
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

/**
 * 导出request实例
 */
export default request

/**
 * 导出API基础URL，供其他地方使用
 */
export { API_BASE_URL }
