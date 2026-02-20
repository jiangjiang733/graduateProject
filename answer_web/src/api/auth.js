import request from '@/utils/request'

export function loginStudent(data) {
    return request({
        url: '/studentLogin',
        method: 'post',
        data
    })
}

export function registerStudent(data) {
    return request({
        url: '/addStudent',
        method: 'post',
        data
    })
}

export function loginTeacher(data) {
    return request({
        url: '/teacher/login',
        method: 'post',
        data
    })
}

export function registerTeacher(data) {
    return request({
        url: '/teacher/register',
        method: 'post',
        data
    })
}
