
import request from './request'

/**
 * 获取教师主页数据（包含所有数据）
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getDashboardData = (teacherId) => {
  return request.get('/teacher/dashboard', {
    params: { teacherId }
  })
}

/**
 * 获取统计数据
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getStatistics = (teacherId) => {
  return request.get('/teacher/statistics', {
    params: { teacherId }
  })
}

/**
 * 获取最近课程
 * @param {string} teacherId - 教师ID
 * @param {number} limit - 数量限制
 * @returns {Promise}
 */
export const getRecentCourses = (teacherId, limit = 5) => {
  return request.get('/teacher/recent-courses', {
    params: { teacherId, limit }
  })
}

/**
 * 获取待办事项
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getTodoList = (teacherId) => {
  return request.get('/teacher/todo-list', {
    params: { teacherId }
  })
}

/**
 * 获取最近留言
 * @param {string} teacherId - 教师ID
 * @param {number} limit - 数量限制
 * @returns {Promise}
 */
export const getRecentMessages = (teacherId, limit = 5) => {
  return request.get('/teacher/recent-messages', {
    params: { teacherId, limit }
  })
}

/**
 * 获取本周课程表
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getWeekSchedule = (teacherId) => {
  return request.get('/teacher/week-schedule', {
    params: { teacherId }
  })
}

export default {
  getDashboardData,
  getStatistics,
  getRecentCourses,
  getTodoList,
  getRecentMessages,
  getWeekSchedule
}
