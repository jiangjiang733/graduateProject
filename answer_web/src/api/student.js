/**
 * 学生相关API接口
 */
import request from './request'

/**
 * 学生登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise}
 */
export const login = (username, password) => {
  return request.post('/studentLogin', {
    studentsUsername: username,
    studentsPassword: password
  })
}

/**
 * 学生注册
 * @param {Object} studentData - 学生数据
 * @returns {Promise}
 */
export const register = (studentData) => {
  return request.post('/addStudent', {
    studentsUsername: studentData.username,
    studentsPassword: studentData.password,
    studentsEmail: studentData.email
  })
}

/**
 * 获取学生个人信息
 */
export const getProfile = (studentId) => {
  return request.get(`/student/profile/${studentId}`)
}

/**
 * 更新学生个人信息
 */
export const updateProfile = (studentId, profileData) => {
  return request.put(`/student/profile/${studentId}`, profileData)
}

/**
 * 修改学生密码
 */
export const updatePassword = (studentId, pwdData) => {
  return request.put(`/student/password/${studentId}`, pwdData)
}

/**
 * 上传学生头像
 */
export const uploadAvatar = (studentId, file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return request.post(`/student/avatar/${studentId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取学生统计信息
 */
export const getStatistics = (studentId) => {
  return request.get(`/student/statistics/${studentId}`)
}

export default {
  login,
  register,
  getProfile,
  updateProfile,
  updatePassword,
  uploadAvatar,
  getStatistics
}
