
import request from './request'
export const getCourseChapters = (courseId) => {
  return request.get(`/course/chapter/list/${courseId}`)
}

export const getChapterDetail = (chapterId) => {
  return request.get(`/course/chapter/${chapterId}`)
}

export default {
  getCourseChapters,
  getChapterDetail
}
