/**
 * 敏感词管理 API
 */
import request from './request'

export interface SensitiveWord {
  id: number
  word: string
  category?: string // 'PROFANITY' | 'POLITICAL' | 'VIOLENCE' | 'OTHER'
  level?: number // 1: 轻度, 2: 中度, 3: 严重
  action?: string // 'REPLACE' | 'BLOCK' | 'WARN'
  replacement?: string
  status: number // 0: 禁用, 1: 启用
  createTime?: string
  updateTime?: string
}

export interface SensitiveWordListParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  category?: string
  level?: number
  status?: number
}

/**
 * 获取敏感词列表
 */
export const getSensitiveWordList = (params: SensitiveWordListParams): Promise<any> => {
  return request.get('/admin/sensitive-words', { params })
}

/**
 * 获取敏感词详情
 */
export const getSensitiveWordDetail = (id: number): Promise<any> => {
  return request.get(`/admin/sensitive-words/${id}`)
}

/**
 * 创建敏感词
 */
export const createSensitiveWord = (data: Partial<SensitiveWord>): Promise<any> => {
  return request.post('/admin/sensitive-words', data)
}

/**
 * 更新敏感词
 */
export const updateSensitiveWord = (id: number, data: Partial<SensitiveWord>): Promise<any> => {
  return request.put(`/admin/sensitive-words/${id}`, data)
}

/**
 * 删除敏感词
 */
export const deleteSensitiveWord = (id: number): Promise<any> => {
  return request.delete(`/admin/sensitive-words/${id}`)
}

/**
 * 批量删除敏感词
 */
export const batchDeleteSensitiveWords = (ids: number[]): Promise<any> => {
  return request.post('/admin/sensitive-words/batch-delete', { ids })
}

/**
 * 批量导入敏感词
 */
export const importSensitiveWords = (data: { words: string[]; category: string; level: number }): Promise<any> => {
  return request.post('/admin/sensitive-words/import', data)
}

/**
 * 启用/禁用敏感词
 */
export const toggleSensitiveWordStatus = (id: number, status: number): Promise<any> => {
  return request.put(`/admin/sensitive-words/${id}/status`, { status })
}

/**
 * 测试文本是否包含敏感词
 */
export const testSensitiveWord = (text: string): Promise<any> => {
  return request.post('/admin/sensitive-words/test', { text })
}
