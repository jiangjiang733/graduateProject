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
 * 获取教师所有考试列表
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getExamsByTeacher = (teacherId) => {
  return request.get(`/exam/teacher/${teacherId}`)
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
 * 搜索考试
 * @param {Object} params - 搜索参数 (teacherId, courseId, status, keyword)
 * @returns {Promise}
 */
export const searchExams = (params) => {
  return request.get('/exam/search', { params })
}

/**
 * 取消发布考试
 * @param {number} examId - 考试ID
 * @returns {Promise}
 */
export const unpublishExam = (examId) => {
  return request.put(`/exam/${examId}/unpublish`)
}

/**
 * 退回学生考试
 * @param {number} studentExamId - 学生考试记录ID
 * @returns {Promise}
 */
export const returnStudentExam = (studentExamId) => {
  return request.delete(`/exam/student-exam/${studentExamId}/return`)
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

/**
 * 获取考试学生列表
 * @param {number} examId 
 * @returns 
 */
export const getStudentExams = (examId) => {
  return request.get(`/exam/${examId}/students`)
}

/**
 * 获取学生的所有考试列表（仅限已选课程且已发布）
 * @param {string} studentId
 * @param {string} status
 * @param {string} courseId
 */
export const getStudentExamList = (studentId, status, courseId) => {
  return request.get('/student/exam/list', { params: { studentId, status, courseId } })
}

// Alias for backward compatibility if code uses listStudentExams
export const listStudentExams = getStudentExamList

/**
 * 获取学生待参加的考试详情
 */
export const getExamToTake = (examId, studentId) => {
  return request.get(`/student/exam/${examId}`, { params: { studentId } })
}

/**
 * 提交学生考试
 */
export const submitStudentExam = (examId, data) => {
  return request.post(`/student/exam/${examId}/submit`, data)
}

// 学生端考试接口
export default {
  // 考试管理
  createExam,
  getExamsByCourse,
  getExamsByTeacher,
  getExamsByCourseId,
  getExamDetail,
  updateExam,
  publishExam,
  unpublishExam,
  returnStudentExam,
  deleteExam,
  searchExams,
  getExamStatistics,
  // AI生成
  generateQuestionsWithAi,
  createExamWithAi,
  saveExamQuestions,
  // 试卷批改
  getPendingExams,
  getStudentExamDetail,
  gradeExam,
  getGradingStatistics,
  getStudentExams,
  // 学生端
  getStudentExamList,
  listStudentExams,
  getExamToTake,
  submitStudentExam
}