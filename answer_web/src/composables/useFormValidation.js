/**
 * 表单验证组合式函数
 * 提供增强的表单验证体验，包括实时反馈和友好的错误提示
 */

import { ref, nextTick } from 'vue'
import { showValidationError } from '@/utils/feedback'

/**
 * 使用表单验证
 * @param {Object} formRef - 表单引用
 * @returns {Object} 验证相关方法和状态
 */
export function useFormValidation(formRef) {
  const validating = ref(false)
  const errors = ref({})

  /**
   * 验证整个表单
   * @param {Function} callback - 验证成功后的回调
   * @returns {Promise<boolean>}
   */
  const validateForm = async (callback) => {
    if (!formRef.value) {
      console.error('表单引用不存在')
      return false
    }

    validating.value = true
    errors.value = {}

    try {
      await formRef.value.validate()
      validating.value = false
      if (callback) {
        callback()
      }
      return true
    } catch (error) {
      validating.value = false
      
      // 收集所有错误信息
      if (error && typeof error === 'object') {
        Object.keys(error).forEach(key => {
          if (error[key] && error[key].length > 0) {
            errors.value[key] = error[key][0].message
          }
        })
      }

      // 显示第一个错误信息
      const firstError = Object.values(errors.value)[0]
      if (firstError) {
        showValidationError(firstError)
      }

      // 滚动到第一个错误字段
      await nextTick()
      scrollToFirstError()

      return false
    }
  }

  /**
   * 验证单个字段
   * @param {string} prop - 字段名
   * @returns {Promise<boolean>}
   */
  const validateField = async (prop) => {
    if (!formRef.value) {
      return false
    }

    try {
      await formRef.value.validateField(prop)
      delete errors.value[prop]
      return true
    } catch (error) {
      if (error && error.message) {
        errors.value[prop] = error.message
      }
      return false
    }
  }

  /**
   * 清除验证结果
   */
  const clearValidate = () => {
    if (formRef.value) {
      formRef.value.clearValidate()
      errors.value = {}
    }
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    if (formRef.value) {
      formRef.value.resetFields()
      errors.value = {}
    }
  }

  /**
   * 滚动到第一个错误字段
   */
  const scrollToFirstError = () => {
    const errorField = document.querySelector('.el-form-item.is-error')
    if (errorField) {
      errorField.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      
      // 添加抖动动画
      errorField.classList.add('shake')
      setTimeout(() => {
        errorField.classList.remove('shake')
      }, 500)
    }
  }

  /**
   * 获取字段错误信息
   * @param {string} prop - 字段名
   * @returns {string}
   */
  const getFieldError = (prop) => {
    return errors.value[prop] || ''
  }

  /**
   * 检查字段是否有错误
   * @param {string} prop - 字段名
   * @returns {boolean}
   */
  const hasFieldError = (prop) => {
    return !!errors.value[prop]
  }

  /**
   * 设置字段错误
   * @param {string} prop - 字段名
   * @param {string} message - 错误信息
   */
  const setFieldError = (prop, message) => {
    errors.value[prop] = message
  }

  return {
    validating,
    errors,
    validateForm,
    validateField,
    clearValidate,
    resetForm,
    scrollToFirstError,
    getFieldError,
    hasFieldError,
    setFieldError
  }
}

/**
 * 实时验证组合式函数
 * @param {Object} formRef - 表单引用
 * @param {Object} rules - 验证规则
 * @returns {Object}
 */
export function useRealtimeValidation(formRef, rules) {
  const { validateField } = useFormValidation(formRef)

  /**
   * 创建字段变化处理器
   * @param {string} prop - 字段名
   * @returns {Function}
   */
  const createFieldHandler = (prop) => {
    let timer = null
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        validateField(prop)
      }, 300)
    }
  }

  /**
   * 为所有字段创建处理器
   * @returns {Object}
   */
  const createHandlers = () => {
    const handlers = {}
    if (rules) {
      Object.keys(rules).forEach(prop => {
        handlers[prop] = createFieldHandler(prop)
      })
    }
    return handlers
  }

  return {
    handlers: createHandlers()
  }
}

export default {
  useFormValidation,
  useRealtimeValidation
}
