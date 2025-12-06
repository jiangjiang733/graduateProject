/**
 * 认证相关 API
 */
import request from './request'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  code: number
  message: string
  data: {
    token: string
    adminInfo: {
      id: number
      username: string
      email?: string
      role: string
    }
  }
}

/**
 * 管理员登录
 */
export const adminLogin = (data: LoginRequest): Promise<any> => {
  return request.post('/admin/login', data)
}

/**
 * 管理员登出
 */
export const adminLogout = (): Promise<any> => {
  return request.post('/admin/logout')
}

/**
 * 获取管理员信息
 */
export const getAdminInfo = (): Promise<any> => {
  return request.get('/admin/info')
}
