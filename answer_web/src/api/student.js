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

export default {
  login,
  register
}
