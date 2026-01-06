/**
 * 课程资源相关API
 */
import request from './request'

/**
 * 获取课程资源列表
 * @param {string} courseId - 课程ID
 */
export const getCourseResources = (courseId) => {
    return request.get(`/course/resource/list/${courseId}`)
}

/**
 * 上传资源
 * @param {FormData} formData - 包含 courseId, title, uploaderId, uploaderName, file
 */
export const uploadResource = (formData) => {
    return request.post('/course/resource/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

/**
 * 删除资源
 * @param {number} id - 资源ID
 */
export const deleteResource = (id) => {
    return request.delete(`/course/resource/${id}`)
}

/**
 * 记录下载
 * @param {number} id - 资源ID
 */
export const recordDownload = (id) => {
    return request.post(`/course/resource/download/${id}`)
}

export default {
    getCourseResources,
    uploadResource,
    deleteResource,
    recordDownload
}
