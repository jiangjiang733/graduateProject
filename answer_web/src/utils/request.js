import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
    baseURL: '/api', // Proxy will handle this
    timeout: 5000
})

// Request interceptor
service.interceptors.request.use(
    config => {
        // Add token if it exists
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = token
        }
        return config
    },
    error => {
        console.error(error)
        return Promise.reject(error)
    }
)

// Response interceptor
service.interceptors.response.use(
    response => {
        const res = response.data
        // Backend returns standard Result object: { code, message, data }
        // Assuming 200/Success is the standard or we check 'code'
        // Based on Controller: Result.success() usually sets code=200 or similar.
        // Let's assume strict check if 'code' exists.

        if (res.code && res.code !== 200 && res.code !== 0) {
            ElMessage({
                message: res.message || 'Error',
                type: 'error',
                duration: 5 * 1000
            })
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res
        }
    },
    error => {
        console.error('err' + error)
        ElMessage({
            message: error.message,
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(error)
    }
)

export default service
