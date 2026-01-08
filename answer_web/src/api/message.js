/**
 * 获取消息列表
 * @param {string} receiverId - 接收者ID
 * @param {string} (receiverType='TEACHER') - 接收者类型 (STUDENT/TEACHER)
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getMessageList = (receiverId, receiverType = 'TEACHER', params = {}) => {
  return request.get(`/message/${receiverType}/${receiverId}`, { params })
}

/**
 * 标记消息为已读
 * @param {number} messageId - 消息ID
 * @param {string} receiverId - 接收者ID
 * @param {string} receiverType - 接收者类型
 * @returns {Promise}
 */
export const markAsRead = (messageId, receiverId, receiverType) => {
  return request.put(`/message/${messageId}/read`, null, {
    params: { receiverId, receiverType }
  })
}

/**
 * 删除消息
 * @param {number} messageId - 消息ID
 * @param {string} receiverId - 接收者ID
 * @param {string} receiverType - 接收者类型
 * @returns {Promise}
 */
export const deleteMessage = (messageId, receiverId, receiverType) => {
  return request.delete(`/message/${messageId}`, {
    params: { receiverId, receiverType }
  })
}

/**
 * 获取未读消息数量
 * @param {string} receiverId - 接收者ID
 * @param {string} receiverType - 接收者类型
 * @returns {Promise}
 */
export const getUnreadCount = (receiverId, receiverType = 'TEACHER') => {
  return request.get(`/message/${receiverType}/${receiverId}/unread-count`)
}

export default {
  getMessageList,
  markAsRead,
  deleteMessage,
  getUnreadCount
}
