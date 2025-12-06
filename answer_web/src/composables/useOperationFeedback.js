/**
 * 操作反馈组合式函数
 * 提供带动画效果的操作反馈
 */

import { 
  showSuccess, 
  showError, 
  showWarning,
  showConfirm,
  showDeleteConfirm 
} from '@/utils/feedback'

/**
 * 使用操作反馈
 * @returns {Object}
 */
export function useOperationFeedback() {
  /**
   * 添加元素动画
   * @param {HTMLElement} element - 元素
   * @param {string} animationClass - 动画类名
   * @param {number} duration - 持续时间
   */
  const addAnimation = (element, animationClass, duration = 600) => {
    if (!element) return

    element.classList.add(animationClass)
    setTimeout(() => {
      element.classList.remove(animationClass)
    }, duration)
  }

  /**
   * 成功反馈
   * @param {string} message - 消息
   * @param {HTMLElement} element - 元素
   */
  const success = (message, element = null) => {
    showSuccess(message)
    if (element) {
      addAnimation(element, 'success-flash', 600)
    }
  }

  /**
   * 错误反馈
   * @param {string} message - 消息
   * @param {HTMLElement} element - 元素
   */
  const error = (message, element = null) => {
    showError(message)
    if (element) {
      addAnimation(element, 'shake', 500)
    }
  }

  /**
   * 警告反馈
   * @param {string} message - 消息
   * @param {HTMLElement} element - 元素
   */
  const warning = (message, element = null) => {
    showWarning(message)
    if (element) {
      addAnimation(element, 'warning-flash', 600)
    }
  }

  /**
   * 确认操作
   * @param {string} message - 消息
   * @param {Function} onConfirm - 确认回调
   * @param {Function} onCancel - 取消回调
   * @param {Object} options - 选项
   */
  const confirm = async (message, onConfirm, onCancel = null, options = {}) => {
    try {
      await showConfirm(message, options.title, options)
      if (onConfirm) {
        await onConfirm()
      }
    } catch (error) {
      if (onCancel) {
        onCancel()
      }
    }
  }

  /**
   * 删除确认
   * @param {Function} onConfirm - 确认回调
   * @param {string} message - 消息
   */
  const confirmDelete = async (onConfirm, message = '此操作将永久删除该数据，是否继续？') => {
    try {
      await showDeleteConfirm(message)
      if (onConfirm) {
        await onConfirm()
      }
    } catch (error) {
      // 用户取消
    }
  }

  /**
   * 高亮元素
   * @param {HTMLElement} element - 元素
   */
  const highlight = (element) => {
    if (element) {
      addAnimation(element, 'highlight', 1000)
    }
  }

  /**
   * 弹出动画
   * @param {HTMLElement} element - 元素
   */
  const popIn = (element) => {
    if (element) {
      addAnimation(element, 'pop-in', 300)
    }
  }

  /**
   * 脉冲动画
   * @param {HTMLElement} element - 元素
   */
  const pulse = (element) => {
    if (element) {
      addAnimation(element, 'pulse', 2000)
    }
  }

  /**
   * 橡皮筋动画
   * @param {HTMLElement} element - 元素
   */
  const rubberBand = (element) => {
    if (element) {
      addAnimation(element, 'rubber-band', 1000)
    }
  }

  /**
   * 心跳动画
   * @param {HTMLElement} element - 元素
   */
  const heartbeat = (element) => {
    if (element) {
      addAnimation(element, 'heartbeat', 1300)
    }
  }

  return {
    success,
    error,
    warning,
    confirm,
    confirmDelete,
    highlight,
    popIn,
    pulse,
    rubberBand,
    heartbeat,
    addAnimation
  }
}

/**
 * 使用表单反馈
 * @returns {Object}
 */
export function useFormFeedback() {
  const { error, success, addAnimation } = useOperationFeedback()

  /**
   * 验证失败反馈
   * @param {string} message - 消息
   * @param {HTMLElement} formElement - 表单元素
   */
  const validationError = (message, formElement = null) => {
    error(message, formElement)
    
    // 滚动到第一个错误字段
    setTimeout(() => {
      const errorField = document.querySelector('.el-form-item.is-error')
      if (errorField) {
        errorField.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
        addAnimation(errorField, 'shake', 500)
      }
    }, 100)
  }

  /**
   * 提交成功反馈
   * @param {string} message - 消息
   * @param {HTMLElement} formElement - 表单元素
   */
  const submitSuccess = (message, formElement = null) => {
    success(message, formElement)
  }

  /**
   * 字段错误反馈
   * @param {string} fieldName - 字段名
   */
  const fieldError = (fieldName) => {
    const field = document.querySelector(`[prop="${fieldName}"]`)
    if (field) {
      addAnimation(field, 'shake', 500)
    }
  }

  return {
    validationError,
    submitSuccess,
    fieldError
  }
}

/**
 * 使用列表操作反馈
 * @returns {Object}
 */
export function useListOperationFeedback() {
  const { success, error, confirmDelete } = useOperationFeedback()

  /**
   * 添加项目成功
   * @param {string} itemName - 项目名称
   */
  const addSuccess = (itemName = '项目') => {
    success(`${itemName}添加成功`)
  }

  /**
   * 更新项目成功
   * @param {string} itemName - 项目名称
   */
  const updateSuccess = (itemName = '项目') => {
    success(`${itemName}更新成功`)
  }

  /**
   * 删除项目
   * @param {Function} onConfirm - 确认回调
   * @param {string} itemName - 项目名称
   */
  const deleteItem = async (onConfirm, itemName = '该数据') => {
    await confirmDelete(async () => {
      await onConfirm()
      success(`${itemName}删除成功`)
    }, `此操作将永久删除${itemName}，是否继续？`)
  }

  /**
   * 批量删除
   * @param {Function} onConfirm - 确认回调
   * @param {number} count - 数量
   */
  const batchDelete = async (onConfirm, count) => {
    await confirmDelete(async () => {
      await onConfirm()
      success(`成功删除 ${count} 项`)
    }, `此操作将永久删除选中的 ${count} 项数据，是否继续？`)
  }

  /**
   * 操作失败
   * @param {string} operation - 操作名称
   * @param {Error} err - 错误对象
   */
  const operationFailed = (operation, err = null) => {
    const message = err?.message || err?.msg || `${operation}失败`
    error(message)
  }

  return {
    addSuccess,
    updateSuccess,
    deleteItem,
    batchDelete,
    operationFailed
  }
}

export default {
  useOperationFeedback,
  useFormFeedback,
  useListOperationFeedback
}
