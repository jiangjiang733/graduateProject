/**
 * 课程评论相关API接口
 */
import request from './request'
export const addComment = (commentData) => {
  return request.post('/course/comment', commentData)
}
export const getChapterComments = (chapterId) => {
  return request.get(`/course/comment/chapter/${chapterId}`)
}

export const getCourseComments = (courseId) => {
  return request.get(`/course/comment/course/${courseId}`)
}
export const getRecentComments = (courseId, limit = 10) => {
  return request.get(`/course/comment/recent/${courseId}`, {
    params: { limit }
  })
}

export const getTeacherComments = (teacherId, params) => {
  return request.get(`/course/comment/teacher/${teacherId}`, { params })
}

export const deleteComment = (commentId) => {
  return request.delete(`/course/comment/${commentId}`)
}

export default {
  addComment,
  getChapterComments,
  getCourseComments,
  getRecentComments,
  getTeacherComments,
  deleteComment
}
