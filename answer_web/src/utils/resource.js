/**
 * 资源URL处理工具函数
 */

const BASE_URL = 'http://localhost:8088'

/**
 * 获取课程图片URL
 * @param {string} image - 图片路径
 * @returns {string} 完整的图片URL
 */
export const getCourseImage = (image) => {
  if (!image) return 'https://via.placeholder.com/400x180?text=Course'
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }
  return `${BASE_URL}${image}`
}

/**
 * 获取用户头像URL
 * @param {string} avatar - 头像路径
 * @returns {string} 完整的头像URL
 */
export const getUserAvatar = (avatar) => {
  if (!avatar) return 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9636ef921315944d5671d8.png'
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  return `${BASE_URL}${avatar}`
}

/**
 * 获取媒体文件URL
 * @param {string} url - 媒体文件路径
 * @returns {string} 完整的媒体文件URL
 */
export const getMediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${BASE_URL}${url}`
}

/**
 * 获取文件下载URL
 * @param {string} url - 文件路径
 * @returns {string} 完整的下载URL
 */
export const getDownloadUrl = (url) => {
  return getMediaUrl(url)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名
 */
export const getFileExtension = (filename) => {
  if (!filename) return ''
  return filename.split('.').pop().toLowerCase()
}

/**
 * 判断是否为图片文件
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为图片
 */
export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const ext = getFileExtension(filename)
  return imageExtensions.includes(ext)
}

/**
 * 判断是否为视频文件
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为视频
 */
export const isVideoFile = (filename) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
  const ext = getFileExtension(filename)
  return videoExtensions.includes(ext)
}

/**
 * 判断是否为PDF文件
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为PDF
 */
export const isPdfFile = (filename) => {
  const ext = getFileExtension(filename)
  return ext === 'pdf'
}

export default {
  getCourseImage,
  getUserAvatar,
  getMediaUrl,
  getDownloadUrl,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isPdfFile
}