/**
 * 考试相关API接口
 */
import request from './request'


/**
 * 创建考试
 * @param {Object} examData - 考试数据
 * @returns {Promise}
 */
export const createExam = (examData) => {
  return request.post('/exam', examData)
}

/**
 * 获取课程考试列表
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getExamsByCourse = (courseId) => {
  return request.get(`/exam/course/${courseId}`)
}

/**
 * 获取课程考试列表（别名）
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getExamsByCourseId = (courseId) => {
  return request.get(`/exam/course/${courseId}`)
}

/**
 * 获取考试详情（包含试题）
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const getExamDetail = (examId) => {
  return request.get(`/exam/${examId}`)
}
/**
 * AI生成题目（仅生成，不保存）
 * @param {Object} params - 生成参数
 * @returns {Promise}
 */
export const generateQuestionsWithAi = (params) => {
  return request.post('/exam/ai/generate', params)
}

/**
 * AI创建考试（生成题目并创建考试）
 * @param {Object} examData - 考试数据
 * @returns {Promise}
 */
export const createExamWithAi = (examData) => {
  return request.post('/exam/ai', examData)
}
/**
 * 保存考试试题
 * @param {number} examId - 考试ID
 * @param {Array} questions - 题目列表
 * @returns {Promise}
 */
export const saveExamQuestions = (examId, questions) => {
  return request.post(`/exam/${examId}/questions`, questions)
}

/**
 * 更新考试
 * @param {number} examId - 考试ID
 * @param {Object} examData - 考试数据
 * @returns {Promise}
 */
export const updateExam = (examId, examData) => {
  return request.put(`/exam/${examId}`, examData)
}

/**
 * 发布考试
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const publishExam = (examId) => {
  return request.put(`/exam/${examId}/publish`)
}

/**
 * 删除考试
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const deleteExam = (examId) => {
  return request.delete(`/exam/${examId}`)
}

/**
 * 获取考试统计
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const getExamStatistics = (examId) => {
  return request.get(`/exam/${examId}/statistics`)
}
/**
 * 获取待批改试卷列表
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const getPendingExams = (examId) => {
  return request.get(`/exam/grading/${examId}/pending`)
}

/**
 * 获取学生试卷详情
 * @param {number} studentExamId - 学生试卷ID
 * @returns {Promise}
 */
export const getStudentExamDetail = (studentExamId) => {
  return request.get(`/exam/grading/submission/${studentExamId}`)
}

/**
 * 批改试卷
 * @param {number} studentExamId - 学生试卷ID
 * @param {Object} gradingData - 批改数据
 * @returns {Promise}
 */
export const gradeExam = (studentExamId, gradingData) => {
  return request.put(`/exam/grading/${studentExamId}`, gradingData)
}

/**
 * 获取考试批改统计
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const getGradingStatistics = (examId) => {
  return request.get(`/exam/grading/${examId}/statistics`)
}

export default {
  // 考试管理
  createExam,
  getExamsByCourse,
  getExamsByCourseId,
  getExamDetail,
  updateExam,
  publishExam,
  deleteExam,
  getExamStatistics,
  // AI生成
  generateQuestionsWithAi,
  createExamWithAi,
  saveExamQuestions,
  // 试卷批改
  getPendingExams,
  getStudentExamDetail,
  gradeExam,
  getGradingStatistics
}
