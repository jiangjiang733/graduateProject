/**
 * 用户管理 API
 */
import request from './request'

export interface Student {
  id: number
  studentId: string
  studentName: string
  email?: string
  phone?: string
  major?: string
  grade?: string
  status: number
  createTime?: string
}

export interface Teacher {
  id: number
  teacherId: string
  teacherName: string
  email?: string
  phone?: string
  department?: string
  title?: string
  status: number
  createTime?: string
}

export interface UserListParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export const getStudentList = (params: UserListParams): Promise<any> => {
  return request.get('/admin/students', { params })
}

/**
 * 获取学生详情
 */
export const getStudentDetail = (id: number): Promise<any> => {
  return request.get(`/admin/students/${id}`)
}

/**
 * 创建学生
 */
export const createStudent = (data: Partial<Student>): Promise<any> => {
  return request.post('/admin/students', data)
}

/**
 * 更新学生信息
 */
export const updateStudent = (id: number, data: Partial<Student>): Promise<any> => {
  return request.put(`/admin/students/${id}`, data)
}

/**
 * 删除学生
 */
export const deleteStudent = (id: number): Promise<any> => {
  return request.delete(`/admin/students/${id}`)
}

/**
 * 批量删除学生
 */
export const batchDeleteStudents = (ids: number[]): Promise<any> => {
  return request.post('/admin/students/batch-delete', { ids })
}

/**
 * 启用/禁用学生账号
 */
export const toggleStudentStatus = (id: number, status: number): Promise<any> => {
  return request.put(`/admin/students/${id}/status`, { status })
}

/**
 * 重置学生密码
 */
export const resetStudentPassword = (id: number): Promise<any> => {
  return request.put(`/admin/students/${id}/reset-password`)
}

// ==================== 教师管理 ====================

/**
 * 获取教师列表
 */
export const getTeacherList = (params: UserListParams): Promise<any> => {
  return request.get('/admin/teachers', { params })
}

/**
 * 获取教师详情
 */
export const getTeacherDetail = (id: number): Promise<any> => {
  return request.get(`/admin/teachers/${id}`)
}

/**
 * 创建教师
 */
export const createTeacher = (data: Partial<Teacher>): Promise<any> => {
  return request.post('/admin/teachers', data)
}

/**
 * 更新教师信息
 */
export const updateTeacher = (id: number, data: Partial<Teacher>): Promise<any> => {
  return request.put(`/admin/teachers/${id}`, data)
}

/**
 * 删除教师
 */
export const deleteTeacher = (id: number): Promise<any> => {
  return request.delete(`/admin/teachers/${id}`)
}

/**
 * 批量删除教师
 */
export const batchDeleteTeachers = (ids: number[]): Promise<any> => {
  return request.post('/admin/teachers/batch-delete', { ids })
}

/**
 * 启用/禁用教师账号
 */
export const toggleTeacherStatus = (id: number, status: number): Promise<any> => {
  return request.put(`/admin/teachers/${id}/status`, { status })
}

/**
 * 重置教师密码
 */
export const resetTeacherPassword = (id: number): Promise<any> => {
  return request.put(`/admin/teachers/${id}/reset-password`)
}
