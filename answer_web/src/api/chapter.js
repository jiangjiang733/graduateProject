/**
 * 课程章节相关API接口
 */
import request from './request'

/**
 * 获取课程章节列表
 * @param {string} courseId - 课程ID
 * @returns {Promise}
 */
export const getCourseChapters = (courseId) => {
  return request.get(`/course/chapter/list/${courseId}`)
}

/**
 * 获取章节详情
 * @param {number} chapterId - 章节ID
 * @returns {Promise}
 */
export const getChapterDetail = (chapterId) => {
  return request.get(`/course/chapter/${chapterId}`)
}

export default {
  getCourseChapters,
  getChapterDetail
}
