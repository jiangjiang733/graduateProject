/**
 * 消息相关API接口
 */
import request from './request'

/**
 * 获取消息列表
 * @param {string} teacherId - 教师ID
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getMessageList = (teacherId, params = {}) => {
  return request.get(`/message/teacher/${teacherId}`, { params })
}

/**
 * 标记消息为已读
 * @param {number} messageId - 消息ID
 * @returns {Promise}
 */
export const markAsRead = (messageId) => {
  return request.put(`/message/${messageId}/read`)
}

/**
 * 删除消息
 * @param {number} messageId - 消息ID
 * @returns {Promise}
 */
export const deleteMessage = (messageId) => {
  return request.delete(`/message/${messageId}`)
}

/**
 * 获取未读消息数量
 * @param {string} teacherId - 教师ID
 * @returns {Promise}
 */
export const getUnreadCount = (teacherId) => {
  return request.get(`/message/teacher/${teacherId}/unread-count`)
}

export default {
  getMessageList,
  markAsRead,
  deleteMessage,
  getUnreadCount
}
