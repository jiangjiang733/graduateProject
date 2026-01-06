/**
 * 课程报名相关API接口
 */
import request from './request'

/**
 * 学生申请报名课程
 * @param {Object} enrollmentData - 报名数据
 * @returns {Promise}
 */
export const applyEnrollment = (enrollmentData) => {
  return request.post('/enrollment/apply', enrollmentData)
}

/**
 * 获取学生的报名列表
 * @param {string} studentId - 学生ID
 * @returns {Promise}
 */
export const getStudentEnrollments = (studentId) => {
  return request.get(`/enrollment/student/${studentId}`)
}

/**
 * 获取课程的报名列表（教师用）
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getCourseEnrollments = (courseId) => {
  return request.get(`/enrollment/course/${courseId}`)
}

/**
 * 获取教师所有课程的报名列表
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getTeacherEnrollments = (teacherId) => {
  return request.get(`/enrollment/teacher/${teacherId}`)
}

/**
 * 教师审核报名申请
 * @param {number} enrollmentId - 报名ID
 * @param {string} status - 状态 (approved/rejected)
 * @param {string} reason - 原因（拒绝时需要）
 * @returns {Promise}
 */
export const reviewEnrollment = (enrollmentId, status, reason = '') => {
  return request.put(`/enrollment/${enrollmentId}/review`, {
    status,
    reason
  })
}

/**
 * 取消报名
 * @param {number} enrollmentId - 报名ID
 * @returns {Promise}
 */
export const cancelEnrollment = (enrollmentId) => {
  return request.delete(`/enrollment/${enrollmentId}`)
}

/**
 * 检查学生是否已报名某课程
 * @param {string} studentId - 学生ID
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const checkEnrollmentStatus = (studentId, courseId) => {
  return request.get('/enrollment/check', {
    params: { studentId, courseId }
  })
}

/**
 * 教师直接添加学生
 */
export const directEnroll = (studentId, courseId) => {
  const formData = new FormData()
  formData.append('studentId', studentId)
  formData.append('courseId', courseId)
  return request.post('/enrollment/direct-enroll', formData)
}

export default {
  applyEnrollment,
  getStudentEnrollments,
  getCourseEnrollments,
  getTeacherEnrollments,
  reviewEnrollment,
  cancelEnrollment,
  checkEnrollmentStatus,
  directEnroll
}
