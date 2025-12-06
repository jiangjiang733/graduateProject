/**
 * 公告管理 API
 */
import request from './request'

export interface Announcement {
  id: number
  title: string
  content: string
  type: string // 'SYSTEM' | 'NOTICE' | 'URGENT'
  target: string // 'ALL' | 'STUDENT' | 'TEACHER'
  status: number // 0: 草稿, 1: 已发布
  publishTime?: string
  createTime?: string
  updateTime?: string
}

export interface AnnouncementListParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  type?: string
  target?: string
  status?: number
}

/**
 * 获取公告列表
 */
export const getAnnouncementList = (params: AnnouncementListParams): Promise<any> => {
  return request.get('/admin/announcements', { params })
}

/**
 * 获取公告详情
 */
export const getAnnouncementDetail = (id: number): Promise<any> => {
  return request.get(`/admin/announcements/${id}`)
}

/**
 * 创建公告
 */
export const createAnnouncement = (data: Partial<Announcement>): Promise<any> => {
  return request.post('/admin/announcements', data)
}

/**
 * 更新公告
 */
export const updateAnnouncement = (id: number, data: Partial<Announcement>): Promise<any> => {
  return request.put(`/admin/announcements/${id}`, data)
}

/**
 * 删除公告
 */
export const deleteAnnouncement = (id: number): Promise<any> => {
  return request.delete(`/admin/announcements/${id}`)
}

/**
 * 发布公告
 */
export const publishAnnouncement = (id: number): Promise<any> => {
  return request.put(`/admin/announcements/${id}/publish`)
}

/**
 * 撤回公告
 */
export const withdrawAnnouncement = (id: number): Promise<any> => {
  return request.put(`/admin/announcements/${id}/withdraw`)
}
