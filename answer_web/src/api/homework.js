/**
 * 作业/实验报告相关API接口
 */
import request from './request'
import axios from 'axios'
import { API_BASE_URL } from './request'

/**
 * 发布实验报告/作业
 * @param {FormData} formData - 表单数据（包含所有字段和文件）
 * @returns {Promise}
 */
export const createLabReport = (formData) => {
  return request.post('/lab-report', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 更新作业
 * @param {number} reportId - 报告ID
 * @param {FormData} formData - 表单数据
 * @returns {Promise}
 */
export const updateLabReport = (reportId, formData) => {
  return request.put(`/lab-report/${reportId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取课程实验报告/作业列表
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getCourseLabReportList = (courseId) => {
  return request.get(`/lab-report/course/${courseId}`)
}

// 别名，保持向后兼容
export const getLabReportsByCourse = getCourseLabReportList

/**
 * 获取教师实验报告/作业列表
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getLabReportsByTeacher = (teacherId) => {
  return request.get(`/lab-report/teacher/${teacherId}`)
}

/**
 * 获取实验报告详情
 * @param {number} reportId - 实验报告ID
 * @returns {Promise}
 */
export const getLabReportDetail = (reportId) => {
  return request.get(`/lab-report/${reportId}`)
}

/**
 * 获取实验报告提交列表
 * @param {number} reportId - 实验报告ID
 * @returns {Promise}
 */
export const getSubmissions = (reportId) => {
  return request.get(`/lab-report/${reportId}/submissions`)
}

/**
 * 批改实验报告
 * @param {number} studentReportId - 学生实验报告ID
 * @param {Object} gradingData - 批改数据
 * @returns {Promise}
 */
export const gradeLabReport = (studentReportId, gradingData) => {
  return request.put(`/lab-report/grade/${studentReportId}`, gradingData)
}

/**
 * 删除实验报告
 * @param {number} reportId - 实验报告ID
 * @returns {Promise}
 */
export const deleteLabReport = (reportId) => {
  return request.delete(`/lab-report/${reportId}`)
}

// ==================== 学生端接口 ====================

/**
 * 学生提交实验报告
 * @param {number} reportId - 实验报告ID
 * @param {Object} submissionData - 提交数据
 * @param {File} attachment - 附件文件
 * @returns {Promise}
 */
export const submitLabReport = (reportId, submissionData, attachment) => {
  const formData = new FormData()
  formData.append('reportId', reportId)
  formData.append('studentId', submissionData.studentId)
  formData.append('studentName', submissionData.studentName)
  formData.append('content', submissionData.content)

  if (attachment) {
    formData.append('attachment', attachment)
  }

  return request.post('/lab-report/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取学生的实验报告列表
 * @param {string} studentId - 学生ID
 * @returns {Promise}
 */
export const getStudentLabReports = (studentId) => {
  return request.get(`/lab-report/student/${studentId}`)
}

/**
 * 获取学生提交详情
 * @param {number} studentReportId - 学生报告ID
 * @returns {Promise}
 */
export const getStudentSubmission = (studentReportId) => {
  return request.get(`/lab-report/submission/${studentReportId}`)
}

/**
 * 更新学生提交
 * @param {number} studentReportId - 学生报告ID
 * @param {string} content - 内容
 * @param {File} attachment - 附件文件
 * @returns {Promise}
 */
export const updateSubmission = (studentReportId, content, attachment) => {
  const formData = new FormData()
  formData.append('content', content)

  if (attachment) {
    formData.append('attachment', attachment)
  }

  return request.put(`/lab-report/submission/${studentReportId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export default {
  // 教师端
  createLabReport,
  updateLabReport,
  getCourseLabReportList,
  getLabReportsByCourse,
  getLabReportDetail,
  getSubmissions,
  gradeLabReport,
  deleteLabReport,
  // 学生端
  submitLabReport,
  getStudentLabReports,
  getStudentSubmission,
  updateSubmission
}
