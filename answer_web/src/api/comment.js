/**
 * 课程评论相关API接口
 */
import request from './request'

/**
 * 发布评论
 * @param {Object} commentData - 评论数据
 * @returns {Promise}
 */
export const addComment = (commentData) => {
  return request.post('/course/comment', commentData)
}

/**
 * 获取章节评论列表（树形结构）
 * @param {number} chapterId - 章节ID
 * @returns {Promise}
 */
export const getChapterComments = (chapterId) => {
  return request.get(`/course/comment/chapter/${chapterId}`)
}

/**
 * 获取课程评论列表
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getCourseComments = (courseId) => {
  return request.get(`/course/comment/course/${courseId}`)
}

/**
 * 获取最新评论
 * @param {string} courseId - 课程ID
 * @param {number} limit - 数量限制
 * @returns {Promise}
 */
export const getRecentComments = (courseId, limit = 10) => {
  return request.get(`/course/comment/recent/${courseId}`, {
    params: { limit }
  })
}

/**
 * 删除评论
 * @param {number} commentId - 评论ID
 * @returns {Promise}
 */
export const deleteComment = (commentId) => {
  return request.delete(`/course/comment/${commentId}`)
}

export default {
  addComment,
  getChapterComments,
  getCourseComments,
  getRecentComments,
  deleteComment
}
