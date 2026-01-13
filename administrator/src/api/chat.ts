import request from './request'

/**
 * 发送私信
 */
export const sendMessage = (data: any) => {
    return request.post('/chat/send', data)
}

/**
 * 获取聊天历史
 */
export const getChatHistory = (params: any) => {
    return request.get('/chat/history', { params })
}

/**
 * 获取联系人列表
 */
export const getContacts = (type: string, userId: string | number) => {
    return request.get(`/chat/contacts/${type}/${userId}`)
}

/**
 * 获取活跃联系人
 */
export const getActiveContacts = (type: string, userId: string | number) => {
    return request.get(`/chat/active-contacts/${type}/${userId}`)
}

/**
 * 标记已读
 */
export const markRead = (params: any) => {
    return request.post('/chat/read', null, { params })
}

/**
 * 获取总未读数
 */
export const getUnreadCount = (type: string, userId: string | number) => {
    return request.get(`/chat/unread-count/${type}/${userId}`)
}
