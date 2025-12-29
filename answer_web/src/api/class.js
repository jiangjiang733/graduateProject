/**
 * 班级管理相关API接口
 */
import request from './request'

/**
 * 创建班级
 * @param {Object} classData - 班级数据
 * @returns {Promise}
 */
export const createClass = (classData) => {
  return request.post('/class', classData)
}

/**
 * 获取课程班级列表
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getClassesByCourseId = (courseId) => {
  return request.get(`/class/course/${courseId}`)
}

// 别名，保持向后兼容
export const getClassesByCourse = getClassesByCourseId

/**
 * 获取班级学生列表
 * @param {number} classId - 班级ID
 * @returns {Promise}
 */
export const getClassStudents = (classId) => {
  return request.get(`/class/${classId}/students`)
}

/**
 * 移除学生
 */
export const removeStudent = (classId, studentId) => {
  return request.delete(`/class/${classId}/student/${studentId}`)
}

/**
 * 获取学生学习进度
 * @param {string} studentId - 学生ID
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getStudentProgress = (studentId, courseId) => {
  return request.get(`/class/student/${studentId}/progress`, {
    params: { courseId }
  })
}

/**
 * 更新班级信息
 * @param {number} classId - 班级ID
 * @param {Object} classData - 班级数据
 * @returns {Promise}
 */
export const updateClass = (classId, classData) => {
  return request.put(`/class/${classId}`, classData)
}

/**
 * 删除班级
 * @param {number} classId - 班级ID
 * @returns {Promise}
 */
export const deleteClass = (classId) => {
  return request.delete(`/class/${classId}`)
}

/**
 * 添加学生到班级
 * @param {number} classId - 班级ID
 * @param {string} studentId - 学生ID
 * @returns {Promise}
 */
export const addStudent = (classId, studentId) => {
  return request.post(`/class/${classId}/student/${studentId}`)
}

/**
 * 批量添加学生
 * @param {number} classId - 班级ID
 * @param {Array<string>} studentIds - 学生ID列表
 * @returns {Promise}
 */
export const batchAddStudents = (classId, studentIds) => {
  return request.post(`/class/${classId}/students/batch`, { studentIds })
}

/**
 * 获取班级详情
 * @param {number} classId - 班级ID
 * @returns {Promise}
 */
export const getClassDetail = (classId) => {
  return request.get(`/class/${classId}`)
}

export default {
  createClass,
  getClassesByCourse,
  getClassesByCourseId,
  getClassStudents,
  removeStudent,
  getStudentProgress,
  updateClass,
  deleteClass,
  addStudent,
  batchAddStudents,
  getClassDetail
}
