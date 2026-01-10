import request from '@/api/request'

export const getMessageList = (receiverId, receiverType = 'TEACHER', params = {}) => {
  return request.get(`/message/${receiverType}/${receiverId}`, { params })
}

export const markAsRead = (messageId, receiverId, receiverType) => {
  return request.put(`/message/${messageId}/read`, null, {
    params: { receiverId, receiverType }
  })
}
export const deleteMessage = (messageId, receiverId, receiverType) => {
  return request.delete(`/message/${messageId}`, {
    params: { receiverId, receiverType }
  })
}

export const getUnreadCount = (receiverId, receiverType = 'TEACHER') => {
  return request.get(`/message/${receiverType}/${receiverId}/unread-count`)
}

export default {
  getMessageList,
  markAsRead,
  deleteMessage,
  getUnreadCount
}
