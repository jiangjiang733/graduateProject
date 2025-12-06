/**
 * 教师相关API接口
 */
import request from './request'
import axios from 'axios'
import { API_BASE_URL } from './request'

/**
 * 教师登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise}
 */
export const login = (username, password) => {
  return request.post('/teacher/login', {
    teacherUsername: username,
    teacherPassword: password
  })
}

/**
 * 教师注册
 * @param {Object} userData - 用户数据
 * @returns {Promise}
 */
export const register = (userData) => {
  return request.post('/teacher/register', {
    teacherUsername: userData.username,
    teacherPassword: userData.password,
    teacherEmail: userData.email,
    teacherDepartment: userData.department,
    teacherLevel: userData.level
  })
}

/**
 * 获取教师信息
 * @param {number} teacherId - 教师ID
 * @returns {Promise}
 */
export const getProfile = (teacherId) => {
  return request.get(`/teacher/profile/${teacherId}`)
}

/**
 * 更新教师信息
 * @param {number} teacherId - 教师ID
 * @param {Object} profileData - 个人信息
 * @returns {Promise}
 */
export const updateProfile = (teacherId, profileData) => {
  return request.put(`/teacher/profile/${teacherId}`, {
    teacherEmail: profileData.email,
    teacherDepartment: profileData.department,
    teacherLevel: profileData.level,
    teacherPhone: profileData.phone
  })
}

/**
 * 修改密码
 * @param {number} teacherId - 教师ID
 * @param {Object} passwordData - 密码数据
 * @returns {Promise}
 */
export const updatePassword = (teacherId, passwordData) => {
  return request.put(`/teacher/password/${teacherId}`, {
    oldPassword: passwordData.oldPassword,
    newPassword: passwordData.newPassword
  })
}

/**
 * 上传头像
 * @param {number} teacherId - 教师ID
 * @param {File} file - 头像文件
 * @returns {Promise}
 */
export const uploadAvatar = (teacherId, file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  
  // 获取token
  const token = localStorage.getItem('token') ||
                localStorage.getItem('teacherToken') || 
                localStorage.getItem('t_token')
  
  return axios.post(`${API_BASE_URL}/teacher/avatar/${teacherId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  })
}

export default {
  login,
  register,
  getProfile,
  updateProfile,
  updatePassword,
  uploadAvatar
}
