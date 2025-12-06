/**
 * 课程相关API接口 - 修复版
 */
import request from './request'
import axios from 'axios'
import { API_BASE_URL } from './request'

// ==================== 课程管理 API ====================

/**
 * 创建课程
 */
export const createCourse = async (courseData) => {
  const formData = new FormData()
  formData.append('courseName', courseData.courseName)
  formData.append('teacherId', courseData.teacherId)
  formData.append('teacherName', courseData.teacherName)

  if (courseData.courseDescription) formData.append('courseDescription', courseData.courseDescription)
  if (courseData.major) formData.append('major', courseData.major)
  if (courseData.classification) formData.append('classification', courseData.classification)
  if (courseData.startTime) formData.append('startTime', courseData.startTime)
  if (courseData.endTime) formData.append('endTime', courseData.endTime)
  if (courseData.creatorUsername) formData.append('creatorUsername', courseData.creatorUsername)
  if (courseData.image) formData.append('image', courseData.image)

  const token = localStorage.getItem('token') || localStorage.getItem('teacherToken') || localStorage.getItem('t_token')

  try {
    // 修复：只保留 Authorization，让 axios 自动处理 Content-Type
    const response = await axios.post(`${API_BASE_URL}/course`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    return response.data
  } catch (error) {
    console.error('创建课程失败:', error)
    throw error
  }
}

/**
 * 获取课程列表
 */
export const getCourseList = (params = {}) => request.get('/course', { params })

/**
 * 获取课程详情
 */
export const getCourseDetail = (courseId) => request.get(`/course/${courseId}`)

/**
 * 更新课程信息
 */
export const updateCourse = async (courseId, courseData) => {
  const formData = new FormData()
  formData.append('teacherId', courseData.teacherId)

  if (courseData.courseName) formData.append('courseName', courseData.courseName)
  if (courseData.courseDescription) formData.append('courseDescription', courseData.courseDescription)
  if (courseData.major) formData.append('major', courseData.major)
  if (courseData.classification) formData.append('classification', courseData.classification)
  if (courseData.startTime) formData.append('startTime', courseData.startTime)
  if (courseData.endTime) formData.append('endTime', courseData.endTime)
  if (courseData.image) formData.append('image', courseData.image)

  const token = localStorage.getItem('token') || localStorage.getItem('teacherToken') || localStorage.getItem('t_token')

  try {
    // 修复：只保留 Authorization
    const response = await axios.put(`${API_BASE_URL}/course/${courseId}`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    return response.data
  } catch (error) {
    console.error('更新课程失败:', error)
    throw error
  }
}

/**
 * 删除课程
 */
export const deleteCourse = (courseId, teacherId) => request.delete(`/course/${courseId}`, { params: { teacherId } })

/**
 * 搜索课程
 */
export const searchCourses = (searchData) => request.post('/course/search', searchData)

/**
 * 切换课程状态
 */
export const toggleCourseState = (courseId, teacherId, state) => request.put(`/course/${courseId}/state`, null, { params: { teacherId, state } })

/**
 * 验证权限
 */
export const checkCoursePermission = (courseId, userId) => request.get(`/course/${courseId}/check-permission`, { params: { userId } })

/**
 * 获取课程统计信息
 */
export const getCourseStats = (teacherId) => request.get('/course/stats', { params: { teacherId } })

/**
 * 获取课程详细分析数据
 */
export const getCourseAnalytics = (courseId) => request.get(`/course/analytics/${courseId}`)

/**
 * 获取课程学生列表
 */
export const getCourseStudents = (courseId, params = {}) => request.get(`/course/analytics/${courseId}/students`, { params })

/**
 * 获取教师所有课程的学生数据
 */
export const getTeacherStudents = (teacherId, params = {}) => request.get(`/course/analytics/teacher/${teacherId}/students`, { params })

/**
 * 获取课程活跃度数据
 */
export const getCourseActivity = (courseId, days = 30) => request.get(`/course/analytics/${courseId}/activity`, { params: { days } })

/**
 * 学生加入课程
 */
export const joinCourse = (studentId, courseId) => request.post('/course/analytics/join', null, { params: { studentId, courseId } })

/**
 * 更新学生学习进度
 */
export const updateStudentProgress = (studentId, courseId, progress, studyTime = 0) => 
  request.post('/course/analytics/progress', null, { params: { studentId, courseId, progress, studyTime } })


// ==================== 章节管理 API (重点修复区域) ====================

export const getCourseChapters = (courseId) => request.get(`/course/chapter/list/${courseId}`)

export const getChapterDetail = (chapterId) => request.get(`/course/chapter/${chapterId}`)

/**
 * 创建文件夹章节
 */
export const createFolderChapter = (chapterData) => {
  const formData = new FormData()
  formData.append('courseId', chapterData.courseId)
  formData.append('title', chapterData.title)
  formData.append('order', chapterData.order)
  if (chapterData.parentId) formData.append('parentId', chapterData.parentId)

  // 修复：完全移除 headers 配置
  return axios.post(`${API_BASE_URL}/course/chapter/folder`, formData)
}

/**
 * 创建视频章节 (此处是你报错的根源)
 */
export const createVideoChapter = (chapterData) => {
  const formData = new FormData()
  formData.append('courseId', chapterData.courseId)
  formData.append('title', chapterData.title)
  formData.append('order', chapterData.order)

  if (chapterData.parentId) formData.append('parentId', chapterData.parentId)

  if (chapterData.video) {
    // 打印日志以便调试
    console.log('正在上传视频:', chapterData.video.name, chapterData.video.size)
    formData.append('video', chapterData.video)
  }

  // 修复：完全移除 headers 配置，浏览器会自动添加 boundary
  return axios.post(`${API_BASE_URL}/course/chapter/video`, formData)
}

/**
 * 创建PDF章节
 */
export const createPdfChapter = (chapterData) => {
  const formData = new FormData()
  formData.append('courseId', chapterData.courseId)
  formData.append('title', chapterData.title)
  formData.append('order', chapterData.order)

  if (chapterData.parentId) formData.append('parentId', chapterData.parentId)
  if (chapterData.pdf) formData.append('pdf', chapterData.pdf)
  return axios.post(`${API_BASE_URL}/course/chapter/pdf`, formData)
}

/**
 * 创建文本章节
 */
export const createTextChapter = (chapterData) => {
  const formData = new FormData()
  formData.append('courseId', chapterData.courseId)
  formData.append('title', chapterData.title)
  formData.append('order', chapterData.order)

  if (chapterData.parentId) formData.append('parentId', chapterData.parentId)
  if (chapterData.content) formData.append('content', chapterData.content)
  return axios.post(`${API_BASE_URL}/course/chapter/text`, formData)
}

/**
 * 创建混合章节
 */
export const createMixedChapter = (chapterData) => {
  const formData = new FormData()
  formData.append('courseId', chapterData.courseId)
  formData.append('title', chapterData.title)
  formData.append('order', chapterData.order)

  if (chapterData.parentId) formData.append('parentId', chapterData.parentId)
  if (chapterData.video) formData.append('video', chapterData.video)
  if (chapterData.pdf) formData.append('pdf', chapterData.pdf)
  if (chapterData.content) formData.append('content', chapterData.content)

  // 修复：完全移除 headers 配置
  return axios.post(`${API_BASE_URL}/course/chapter/mixed`, formData)
}

export const deleteChapter = (chapterId) => request.delete(`/course/chapter/${chapterId}`)

export const updateChapter = (chapterId, userId, updateData) => request.put(`/course/chapter/${chapterId}`, updateData, { params: { userId } })

export const updateChapterCover = (chapterId, userId, coverImage) => {
  const formData = new FormData()
  formData.append('cover', coverImage)

  // 修复：移除 headers
  return axios.post(`${API_BASE_URL}/course/chapter/${chapterId}/cover`, formData, { params: { userId } })
}

export const moveChapter = (chapterId, userId, newParentId, newOrder) => request.post(`/course/chapter/${chapterId}/move`, null, { params: { userId, newParentId, newOrder } })

export const batchUpdateChapterOrder = (userId, updates) => request.post('/course/chapter/batch-order', { userId, updates })

// ==================== 视频管理 API ====================

export const getVideoList = async () => {
  try {
    const chapters = await request.get('/course/chapter/list')
    return chapters.filter(ch => ch.type === 'VIDEO' || ch.videoUrl)
  } catch (error) {
    console.error('获取视频列表失败:', error)
    throw error
  }
}

export const getVideoStreamUrl = (chapterId) => `${API_BASE_URL}/video/stream/${chapterId}`

export default {
  createCourse, getCourseList, getCourseDetail, updateCourse, deleteCourse, searchCourses, toggleCourseState, checkCoursePermission, getCourseStats,
  getCourseChapters, getChapterDetail, createFolderChapter, createVideoChapter, createPdfChapter, createTextChapter, createMixedChapter,
  deleteChapter, updateChapter, updateChapterCover, moveChapter, batchUpdateChapterOrder, getVideoList, getVideoStreamUrl,
  getCourseAnalytics, getCourseStudents, getTeacherStudents, getCourseActivity, joinCourse, updateStudentProgress
}