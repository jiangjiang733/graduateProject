/**
 * 表单管理 Composable
 * 提供统一的表单验证和提交管理
 */

import { ref, reactive } from 'vue'
import { showValidationError, showSuccess, showError } from '@/utils/feedback'

/**
 * 使用表单
 * @param {object} initialData - 初始表单数据
 * @returns {object} 表单状态和方法
 */
export function useForm(initialData = {}) {
  const formRef = ref(null)
  const formData = reactive({ ...initialData })
  const formLoading = ref(false)

  /**
   * 重置表单
   */
  const resetForm = () => {
    if (formRef.value) {
      formRef.value.resetFields()
    }
  }

  /**
   * 清空表单验证
   */
  const clearValidate = () => {
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }

  /**
   * 验证表单
   * @returns {Promise<boolean>}
   */
  const validateForm = async () => {
    if (!formRef.value) {
      return false
    }

    try {
      await formRef.value.validate()
      return true
    } catch (error) {
      showValidationError('请检查表单填写是否正确')
      return false
    }
  }

  /**
   * 验证指定字段
   * @param {string|Array} props - 字段名或字段名数组
   * @returns {Promise<boolean>}
   */
  const validateField = async (props) => {
    if (!formRef.value) {
      return false
    }

    try {
      await formRef.value.validateField(props)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 提交表单
   * @param {Function} submitFn - 提交函数
   * @param {string} successMessage - 成功提示
   * @param {string} errorMessage - 错误提示
   * @returns {Promise}
   */
  const submitForm = async (submitFn, successMessage = '提交成功', errorMessage = '提交失败') => {
    const isValid = await validateForm()
    if (!isValid) {
      return false
    }

    formLoading.value = true
    try {
      const result = await submitFn(formData)
      if (successMessage) {
        showSuccess(successMessage)
      }
      return result
    } catch (error) {
      showError(errorMessage + ': ' + (error.message || '未知错误'))
      throw error
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 设置表单数据
   * @param {object} data - 表单数据
   */
  const setFormData = (data) => {
    Object.assign(formData, data)
  }

  /**
   * 获取表单数据
   * @returns {object}
   */
  const getFormData = () => {
    return { ...formData }
  }

  return {
    formRef,
    formData,
    formLoading,
    resetForm,
    clearValidate,
    validateForm,
    validateField,
    submitForm,
    setFormData,
    getFormData,
  }
}

/**
 * 使用对话框表单
 * @param {object} initialData - 初始表单数据
 * @returns {object} 对话框表单状态和方法
 */
export function useDialogForm(initialData = {}) {
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const dialogMode = ref('create') // create | edit
  
  const {
    formRef,
    formData,
    formLoading,
    resetForm,
    clearValidate,
    validateForm,
    submitForm,
    setFormData,
    getFormData,
  } = useForm(initialData)

  /**
   * 打开对话框（创建模式）
   * @param {string} title - 对话框标题
   */
  const openCreateDialog = (title = '新增') => {
    dialogMode.value = 'create'
    dialogTitle.value = title
    dialogVisible.value = true
    resetForm()
  }

  /**
   * 打开对话框（编辑模式）
   * @param {object} data - 编辑数据
   * @param {string} title - 对话框标题
   */
  const openEditDialog = (data, title = '编辑') => {
    dialogMode.value = 'edit'
    dialogTitle.value = title
    setFormData(data)
    dialogVisible.value = true
    clearValidate()
  }

  /**
   * 关闭对话框
   */
  const closeDialog = () => {
    dialogVisible.value = false
    resetForm()
  }

  /**
   * 提交对话框表单
   * @param {Function} submitFn - 提交函数
   * @param {string} successMessage - 成功提示
   * @returns {Promise}
   */
  const submitDialogForm = async (submitFn, successMessage = null) => {
    const message = successMessage || (dialogMode.value === 'create' ? '创建成功' : '更新成功')
    try {
      const result = await submitForm(submitFn, message)
      closeDialog()
      return result
    } catch (error) {
      throw error
    }
  }

  return {
    dialogVisible,
    dialogTitle,
    dialogMode,
    formRef,
    formData,
    formLoading,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    resetForm,
    clearValidate,
    validateForm,
    submitDialogForm,
    setFormData,
    getFormData,
  }
}

/**
 * 使用搜索表单
 * @param {object} initialData - 初始搜索数据
 * @returns {object} 搜索表单状态和方法
 */
export function useSearchForm(initialData = {}) {
  const searchData = reactive({ ...initialData })
  const searchLoading = ref(false)

  /**
   * 重置搜索
   * @param {Function} searchFn - 搜索函数
   */
  const resetSearch = async (searchFn) => {
    Object.assign(searchData, initialData)
    if (searchFn) {
      await handleSearch(searchFn)
    }
  }

  /**
   * 执行搜索
   * @param {Function} searchFn - 搜索函数
   * @returns {Promise}
   */
  const handleSearch = async (searchFn) => {
    searchLoading.value = true
    try {
      const result = await searchFn(searchData)
      return result
    } finally {
      searchLoading.value = false
    }
  }

  return {
    searchData,
    searchLoading,
    resetSearch,
    handleSearch,
  }
}

export default {
  useForm,
  useDialogForm,
  useSearchForm,
}
