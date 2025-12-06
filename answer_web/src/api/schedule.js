/**
 * 课程时间表相关API接口
 */
import request from './request'

/**
 * 添加课程时间
 * @param {Object} schedule - 时间表数据
 * @returns {Promise}
 */
export const addSchedule = (schedule) => {
  return request.post('/course/schedule', schedule)
}

/**
 * 获取课程的所有时间安排
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getCourseSchedules = (courseId) => {
  return request.get(`/course/schedule/${courseId}`)
}

/**
 * 获取学生的课程表
 * @param {string} studentId - 学生ID
 * @param {number} week - 周数
 * @returns {Promise}
 */
export const getStudentSchedule = (studentId, week = 1) => {
  return request.get(`/course/schedule/student/${studentId}`, { params: { week } })
}

/**
 * 更新课程时间
 * @param {number} scheduleId - 时间表ID
 * @param {Object} schedule - 时间表数据
 * @returns {Promise}
 */
export const updateSchedule = (scheduleId, schedule) => {
  return request.put(`/course/schedule/${scheduleId}`, schedule)
}

/**
 * 删除课程时间
 * @param {number} scheduleId - 时间表ID
 * @returns {Promise}
 */
export const deleteSchedule = (scheduleId) => {
  return request.delete(`/course/schedule/${scheduleId}`)
}

/**
 * 检查时间冲突
 * @param {Object} schedule - 时间表数据
 * @returns {Promise}
 */
export const checkConflict = (schedule) => {
  return request.post('/course/schedule/check-conflict', schedule)
}

export default {
  addSchedule,
  getCourseSchedules,
  getStudentSchedule,
  updateSchedule,
  deleteSchedule,
  checkConflict
}
