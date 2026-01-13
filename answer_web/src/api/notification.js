import request from '@/api/request'

/**
 * 获取教师端系统通知
 */
export const getTeacherNotifications = (params) => {
    return request.get('/notification/teacher', { params })
}

/**
 * 获取学生端系统通知
 */
export const getStudentNotifications = (params) => {
    return request.get('/notification/student', { params })
}

export default {
    getTeacherNotifications,
    getStudentNotifications
}
