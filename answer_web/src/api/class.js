
import request from './request'

export const createClass = (classData) => {
  return request.post('/class', classData)
}

export const getClassesByCourseId = (courseId) => {
  return request.get(`/class/course/${courseId}`)
}

// 别名，保持向后兼容
export const getClassesByCourse = getClassesByCourseId

export const getClassStudents = (classId) => {
  return request.get(`/class/${classId}/students`)
}

export const removeStudent = (classId, studentId) => {
  return request.delete(`/class/${classId}/student/${studentId}`)
}

export const getStudentProgress = (studentId, courseId) => {
  return request.get(`/class/student/${studentId}/progress`, {
    params: { courseId }
  })
}

export const updateClass = (classId, classData) => {
  return request.put(`/class/${classId}`, classData)
}

export const deleteClass = (classId) => {
  return request.delete(`/class/${classId}`)
}

export const addStudent = (classId, studentId) => {
  return request.post(`/class/${classId}/student/${studentId}`)
}

export const batchAddStudents = (classId, studentIds) => {
  return request.post(`/class/${classId}/students/batch`, { studentIds })
}

export const getClassDetail = (classId) => {
  return request.get(`/class/${classId}`)
}

export default {
  createClass,
  getClassesByCourse,
  getClassesByCourseId,
  getClassStudents,
  removeStudent,
  getStudentProgress,
  updateClass,
  deleteClass,
  addStudent,
  batchAddStudents,
  getClassDetail
}
