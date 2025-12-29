import request from './request'

// 获取题目列表
export function getQuestionList(params) {
    return request({
        url: '/question/list',
        method: 'get',
        params
    })
}

// 获取题目详情
export function getQuestionDetail(id) {
    return request({
        url: `/question/${id}`,
        method: 'get'
    })
}

// 创建题目
export function createQuestion(data) {
    return request({
        url: '/question/create',
        method: 'post',
        data
    })
}

// 更新题目
export function updateQuestion(data) {
    return request({
        url: '/question/update',
        method: 'put',
        data
    })
}

// 删除题目
export function deleteQuestion(id) {
    return request({
        url: `/question/${id}`,
        method: 'delete'
    })
}

// 根据课程获取题目(组卷用)
export function getQuestionsByCourse(courseId, type) {
    return request({
        url: `/question/by-course/${courseId}`,
        method: 'get',
        params: { type }
    })
}
