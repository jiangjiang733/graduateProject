
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
 * 审核报名申请（教师或学生）
 * @param {number} enrollmentId - 报名ID
 * @param {string} statusOrTeacherId - 状态或教师ID
 * @param {string} statusOrReason - 状态或原因
 * @param {string} reason - 原因（拒绝时需要）
 * @returns {Promise}
 */
export const reviewEnrollment = (enrollmentId, statusOrTeacherId, statusOrReason = '', reason = '') => {
  // Flexible parameter handling
  // If called with 2-3 params: (enrollmentId, status, reason?) - Student review
  // If called with 4 params: (enrollmentId, teacherId, status, reason) - Teacher review

  let teacherId = null
  let status = statusOrTeacherId
  let finalReason = statusOrReason

  // Check if second parameter looks like a status (approved/rejected) or teacherId (number/string ID)
  if (statusOrReason && (statusOrReason === 'approved' || statusOrReason === 'rejected' || statusOrReason === 'pending')) {
    // 4 parameter call: (enrollmentId, teacherId, status, reason)
    teacherId = statusOrTeacherId
    status = statusOrReason
    finalReason = reason
  }
  // else: 2-3 parameter call, statusOrTeacherId is already the status

  const config = teacherId ? { params: { teacherId } } : {}

  return request.put(`/enrollment/${enrollmentId}/review`, {
    status,
    reason: finalReason
  }, config)
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
  return request.post('/enrollment/direct-enroll', null, {
    params: { studentId, courseId }
  })
}

/**
 * 学生审核报名邀请（接受/拒绝教师邀请）
 * @param {number} enrollmentId - 报名ID
 * @param {string} status - 状态 (approved/rejected)
 * @param {string} reason - 原因（拒绝时需要）
 * @returns {Promise}
 */
export const studentReviewEnrollment = (enrollmentId, status, reason = '') => {
  return request.put(`/enrollment/${enrollmentId}/student-review`, {
    status,
    reason
  })
}

export default {
  applyEnrollment,
  getStudentEnrollments,
  getCourseEnrollments,
  getTeacherEnrollments,
  reviewEnrollment,
  cancelEnrollment,
  checkEnrollmentStatus,
  directEnroll,
  studentReviewEnrollment
}
