/**
 * 用户反馈工具函数
 * 提供统一的消息提示、确认对话框、加载状态等交互反馈
 */

import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

/**
 * 成功消息提示
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
export function showSuccess(message, duration = 3000) {
  ElMessage({
    message: message,
    type: 'success',
    duration: duration,
    showClose: true,
    grouping: true,
  })
}

/**
 * 错误消息提示
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
export function showError(message, duration = 3000) {
  ElMessage({
    message: message,
    type: 'error',
    duration: duration,
    showClose: true,
    grouping: true,
  })
}

/**
 * 警告消息提示
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
export function showWarning(message, duration = 3000) {
  ElMessage({
    message: message,
    type: 'warning',
    duration: duration,
    showClose: true,
    grouping: true,
  })
}

/**
 * 信息消息提示
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
export function showInfo(message, duration = 3000) {
  ElMessage({
    message: message,
    type: 'info',
    duration: duration,
    showClose: true,
    grouping: true,
  })
}

/**
 * 确认对话框
 * @param {string} message - 消息内容
 * @param {string} title - 标题
 * @param {object} options - 其他选项
 * @returns {Promise}
 */
export function showConfirm(message, title = '提示', options = {}) {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    ...options,
  })
}

/**
 * 删除确认对话框
 * @param {string} message - 消息内容
 * @returns {Promise}
 */
export function showDeleteConfirm(message = '此操作将永久删除该数据，是否继续？') {
  return ElMessageBox.confirm(message, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    confirmButtonClass: 'el-button--danger',
  })
}

/**
 * 提示对话框
 * @param {string} message - 消息内容
 * @param {string} title - 标题
 * @param {object} options - 其他选项
 * @returns {Promise}
 */
export function showAlert(message, title = '提示', options = {}) {
  return ElMessageBox.alert(message, title, {
    confirmButtonText: '确定',
    type: 'info',
    ...options,
  })
}

/**
 * 输入对话框
 * @param {string} message - 消息内容
 * @param {string} title - 标题
 * @param {object} options - 其他选项
 * @returns {Promise}
 */
export function showPrompt(message, title = '请输入', options = {}) {
  return ElMessageBox.prompt(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '输入不能为空',
    ...options,
  })
}

/**
 * 通知提示
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 * @param {string} type - 类型 (success/warning/info/error)
 * @param {number} duration - 显示时长（毫秒）
 */
export function showNotification(title, message, type = 'info', duration = 4500) {
  ElNotification({
    title: title,
    message: message,
    type: type,
    duration: duration,
    position: 'top-right',
  })
}

/**
 * 成功通知
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 */
export function notifySuccess(title, message) {
  showNotification(title, message, 'success')
}

/**
 * 错误通知
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 */
export function notifyError(title, message) {
  showNotification(title, message, 'error')
}

/**
 * 警告通知
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 */
export function notifyWarning(title, message) {
  showNotification(title, message, 'warning')
}

/**
 * 信息通知
 * @param {string} title - 标题
 * @param {string} message - 消息内容
 */
export function notifyInfo(title, message) {
  showNotification(title, message, 'info')
}

/**
 * 显示全屏加载
 * @param {string} text - 加载文字
 * @returns {object} loading实例
 */
export function showLoading(text = '加载中...') {
  return ElLoading.service({
    lock: true,
    text: text,
    background: 'rgba(255, 255, 255, 0.9)',
  })
}

/**
 * 隐藏加载
 * @param {object} loadingInstance - loading实例
 */
export function hideLoading(loadingInstance) {
  if (loadingInstance) {
    loadingInstance.close()
  }
}

/**
 * 异步操作包装器（自动显示加载状态）
 * @param {Function} asyncFn - 异步函数
 * @param {string} loadingText - 加载文字
 * @param {string} successMessage - 成功提示
 * @param {string} errorMessage - 错误提示
 * @returns {Promise}
 */
export async function withLoading(
  asyncFn,
  loadingText = '处理中...',
  successMessage = '',
  errorMessage = '操作失败'
) {
  const loading = showLoading(loadingText)
  try {
    const result = await asyncFn()
    if (successMessage) {
      showSuccess(successMessage)
    }
    return result
  } catch (error) {
    showError(errorMessage + ': ' + (error.message || '未知错误'))
    throw error
  } finally {
    hideLoading(loading)
  }
}

/**
 * 操作成功反馈（带动画效果）
 * @param {string} message - 消息内容
 * @param {HTMLElement} element - 要添加动画的元素
 */
export function operationSuccess(message = '操作成功', element = null) {
  showSuccess(message)
  
  // 添加成功动画效果
  if (element) {
    element.classList.add('success-flash')
    setTimeout(() => {
      element.classList.remove('success-flash')
    }, 600)
  }
}

/**
 * 操作失败反馈（带动画效果）
 * @param {string} message - 消息内容
 * @param {HTMLElement} element - 要添加动画的元素
 */
export function operationFailed(message = '操作失败', element = null) {
  showError(message)
  
  // 添加错误抖动动画
  if (element) {
    element.classList.add('shake')
    setTimeout(() => {
      element.classList.remove('shake')
    }, 500)
  }
}

/**
 * 复制到剪贴板并提示
 * @param {string} text - 要复制的文本
 * @param {string} successMessage - 成功提示
 */
export async function copyToClipboard(text, successMessage = '复制成功') {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess(successMessage)
  } catch (error) {
    showError('复制失败，请手动复制')
  }
}

/**
 * 表单验证失败提示
 * @param {string} message - 消息内容
 * @param {HTMLElement} formElement - 表单元素
 */
export function showValidationError(message = '请检查表单填写是否正确', formElement = null) {
  showWarning(message)
  
  // 添加表单抖动动画
  if (formElement) {
    formElement.classList.add('shake')
    setTimeout(() => {
      formElement.classList.remove('shake')
    }, 500)
  }
}

/**
 * 网络错误提示
 * @param {Error} error - 错误对象
 */
export function showNetworkError(error) {
  const message = error.message || '网络连接失败，请检查网络设置'
  showError(message)
}

/**
 * 权限不足提示
 */
export function showPermissionDenied() {
  showWarning('您没有权限执行此操作')
}

/**
 * 数据加载失败提示
 */
export function showLoadDataError() {
  showError('数据加载失败，请刷新页面重试')
}

/**
 * 保存成功提示
 */
export function showSaveSuccess() {
  showSuccess('保存成功')
}

/**
 * 删除成功提示
 */
export function showDeleteSuccess() {
  showSuccess('删除成功')
}

/**
 * 更新成功提示
 */
export function showUpdateSuccess() {
  showSuccess('更新成功')
}

/**
 * 创建成功提示
 */
export function showCreateSuccess() {
  showSuccess('创建成功')
}

/**
 * 上传成功提示
 */
export function showUploadSuccess() {
  showSuccess('上传成功')
}

/**
 * 上传失败提示
 */
export function showUploadError() {
  showError('上传失败，请重试')
}

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showDeleteConfirm,
  showAlert,
  showPrompt,
  showNotification,
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  showLoading,
  hideLoading,
  withLoading,
  operationSuccess,
  operationFailed,
  copyToClipboard,
  showValidationError,
  showNetworkError,
  showPermissionDenied,
  showLoadDataError,
  showSaveSuccess,
  showDeleteSuccess,
  showUpdateSuccess,
  showCreateSuccess,
  showUploadSuccess,
  showUploadError,
}
