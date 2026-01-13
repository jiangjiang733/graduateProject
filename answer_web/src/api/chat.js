import request from './request'
export const sendChatMessage = (data) => {
    return request.post('/chat/send', data)
}
export const getChatHistory = (params) => {
    return request.get('/chat/history', { params })
}

export const getChatContacts = (userType, userId) => {
    return request.get(`/chat/contacts/${userType}/${userId}`)
}

/**
 * 获取基于课程关联的活跃联系人（教师找学生，学生找教师）
 */
export const getActiveContacts = (userType, userId) => {
    return request.get(`/chat/active-contacts/${userType}/${userId}`)
}

/**
 * 标记聊天已读
 */
export const markChatRead = (params) => {
    return request.post('/chat/read', null, { params })
}

/**
 * 获取总未读私信数
 */
export const getChatUnreadCount = (userType, userId) => {
    return request.get(`/chat/unread-count/${userType}/${userId}`)
}

/**
 * 获取管理员对话信息
 */
export const getAdminChatInfo = (userType, userId) => {
    return request.get(`/chat/admin-info/${userType}/${userId}`)
}

export default {
    sendChatMessage,
    getChatHistory,
    getChatContacts,
    getActiveContacts,
    markChatRead,
    getChatUnreadCount,
    getAdminChatInfo
}
