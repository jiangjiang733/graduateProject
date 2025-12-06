/**
 * 加载状态组合式函数
 * 提供统一的加载状态管理和操作包装
 */

import { ref } from 'vue'
import { showLoading, hideLoading, showError, showSuccess } from '@/utils/feedback'

/**
 * 使用加载状态
 * @param {boolean} initialState - 初始加载状态
 * @returns {Object}
 */
export function useLoading(initialState = false) {
  const loading = ref(initialState)
  const loadingInstance = ref(null)

  /**
   * 开始加载
   * @param {string} text - 加载文本
   */
  const startLoading = (text = '加载中...') => {
    loading.value = true
    loadingInstance.value = showLoading(text)
  }

  /**
   * 停止加载
   */
  const stopLoading = () => {
    loading.value = false
    if (loadingInstance.value) {
      hideLoading(loadingInstance.value)
      loadingInstance.value = null
    }
  }

  /**
   * 包装异步操作
   * @param {Function} asyncFn - 异步函数
   * @param {Object} options - 选项
   * @returns {Promise}
   */
  const withLoading = async (asyncFn, options = {}) => {
    const {
      loadingText = '处理中...',
      successMessage = '',
      errorMessage = '操作失败',
      showFullscreen = true
    } = options

    if (showFullscreen) {
      startLoading(loadingText)
    } else {
      loading.value = true
    }

    try {
      const result = await asyncFn()
      
      if (successMessage) {
        showSuccess(successMessage)
      }
      
      return result
    } catch (error) {
      const message = error.message || error.msg || errorMessage
      showError(message)
      throw error
    } finally {
      if (showFullscreen) {
        stopLoading()
      } else {
        loading.value = false
      }
    }
  }

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading
  }
}

/**
 * 使用多个加载状态
 * @param {Array<string>} keys - 加载状态键名数组
 * @returns {Object}
 */
export function useMultipleLoading(keys = []) {
  const loadingStates = ref({})
  
  // 初始化所有加载状态
  keys.forEach(key => {
    loadingStates.value[key] = false
  })

  /**
   * 设置加载状态
   * @param {string} key - 键名
   * @param {boolean} value - 状态值
   */
  const setLoading = (key, value) => {
    loadingStates.value[key] = value
  }

  /**
   * 获取加载状态
   * @param {string} key - 键名
   * @returns {boolean}
   */
  const getLoading = (key) => {
    return loadingStates.value[key] || false
  }

  /**
   * 包装异步操作
   * @param {string} key - 键名
   * @param {Function} asyncFn - 异步函数
   * @param {Object} options - 选项
   * @returns {Promise}
   */
  const withLoading = async (key, asyncFn, options = {}) => {
    const {
      successMessage = '',
      errorMessage = '操作失败'
    } = options

    setLoading(key, true)

    try {
      const result = await asyncFn()
      
      if (successMessage) {
        showSuccess(successMessage)
      }
      
      return result
    } catch (error) {
      const message = error.message || error.msg || errorMessage
      showError(message)
      throw error
    } finally {
      setLoading(key, false)
    }
  }

  /**
   * 检查是否有任何加载状态
   * @returns {boolean}
   */
  const isAnyLoading = () => {
    return Object.values(loadingStates.value).some(state => state)
  }

  return {
    loadingStates,
    setLoading,
    getLoading,
    withLoading,
    isAnyLoading
  }
}

/**
 * 使用按钮加载状态
 * @returns {Object}
 */
export function useButtonLoading() {
  const buttonLoading = ref({})

  /**
   * 设置按钮加载状态
   * @param {string} buttonId - 按钮ID
   * @param {boolean} loading - 加载状态
   */
  const setButtonLoading = (buttonId, loading) => {
    buttonLoading.value[buttonId] = loading
  }

  /**
   * 获取按钮加载状态
   * @param {string} buttonId - 按钮ID
   * @returns {boolean}
   */
  const isButtonLoading = (buttonId) => {
    return buttonLoading.value[buttonId] || false
  }

  /**
   * 包装按钮点击操作
   * @param {string} buttonId - 按钮ID
   * @param {Function} asyncFn - 异步函数
   * @param {Object} options - 选项
   * @returns {Promise}
   */
  const handleButtonClick = async (buttonId, asyncFn, options = {}) => {
    const {
      successMessage = '',
      errorMessage = '操作失败'
    } = options

    setButtonLoading(buttonId, true)

    try {
      const result = await asyncFn()
      
      if (successMessage) {
        showSuccess(successMessage)
      }
      
      return result
    } catch (error) {
      const message = error.message || error.msg || errorMessage
      showError(message)
      throw error
    } finally {
      setButtonLoading(buttonId, false)
    }
  }

  return {
    buttonLoading,
    setButtonLoading,
    isButtonLoading,
    handleButtonClick
  }
}

export default {
  useLoading,
  useMultipleLoading,
  useButtonLoading
}
