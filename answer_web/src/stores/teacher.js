/**
 * 教师端状态管理
 * 管理教师登录状态、个人信息和头像
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTeacherStore = defineStore('teacher', () => {
  // 状态 - 从localStorage恢复登录状态
  const teacherId = ref(localStorage.getItem('teacherId') || localStorage.getItem('t_id') || '')
  const teacherName = ref(localStorage.getItem('teacherName') || '')
  const teacherHead = ref(localStorage.getItem('teacherHead') || '')
  const teacherEmail = ref(localStorage.getItem('teacherEmail') || '')
  const teacherDepartment = ref(localStorage.getItem('teacherDepartment') || '')
  const teacherLevel = ref(localStorage.getItem('teacherLevel') || '')
  const teacherPhone = ref(localStorage.getItem('teacherPhone') || '')

  // Notification State
  const unreadCount = ref(0)
  const setUnreadCount = (count) => {
    unreadCount.value = count
  }

  // 计算属性
  const isLoggedIn = computed(() => !!teacherId.value)

  const avatarUrl = computed(() => {
    if (teacherHead.value && teacherHead.value.trim() !== '') {
      if (teacherHead.value.startsWith('http://') || teacherHead.value.startsWith('https://')) {
        return teacherHead.value
      }
      return `http://localhost:8088${teacherHead.value}`
    }
    return '/src/assets/image/avatar.jpeg'
  })

  // 方法
  /**
   * 设置教师信息并持久化到localStorage
   */
  const setTeacherInfo = (info) => {
    if (info.teacherId) {
      teacherId.value = info.teacherId
      localStorage.setItem('teacherId', info.teacherId)
      localStorage.setItem('t_id', info.teacherId)
    }
    if (info.teacherName) {
      teacherName.value = info.teacherName
      localStorage.setItem('teacherName', info.teacherName)
    }
    if (info.teacherHead !== undefined) {
      teacherHead.value = info.teacherHead
      localStorage.setItem('teacherHead', info.teacherHead)
    }
    if (info.teacherEmail) {
      teacherEmail.value = info.teacherEmail
      localStorage.setItem('teacherEmail', info.teacherEmail)
    }
    if (info.teacherDepartment) {
      teacherDepartment.value = info.teacherDepartment
      localStorage.setItem('teacherDepartment', info.teacherDepartment)
    }
    if (info.teacherLevel) {
      teacherLevel.value = info.teacherLevel
      localStorage.setItem('teacherLevel', info.teacherLevel)
    }
    if (info.teacherPhone) {
      teacherPhone.value = info.teacherPhone
      localStorage.setItem('teacherPhone', info.teacherPhone)
    }
  }

  /**
   * 清除教师信息并退出登录
   */
  const clearTeacherInfo = () => {
    teacherId.value = ''
    teacherName.value = ''
    teacherHead.value = ''
    teacherEmail.value = ''
    teacherDepartment.value = ''
    teacherLevel.value = ''
    teacherPhone.value = ''

    localStorage.removeItem('teacherId')
    localStorage.removeItem('t_id')
    localStorage.removeItem('teacherName')
    localStorage.removeItem('teacherHead')
    localStorage.removeItem('teacherEmail')
    localStorage.removeItem('teacherDepartment')
    localStorage.removeItem('teacherLevel')
    localStorage.removeItem('teacherPhone')
    localStorage.removeItem('user')
    localStorage.setItem('status', 'false')
  }

  /**
   * 更新教师头像
   */
  const updateAvatar = (avatarUrl) => {
    teacherHead.value = avatarUrl
    localStorage.setItem('teacherHead', avatarUrl)
  }

  /**
   * 更新教师个人信息
   */
  const updateProfile = (profileData) => {
    if (profileData.teacherEmail !== undefined) {
      teacherEmail.value = profileData.teacherEmail
      localStorage.setItem('teacherEmail', profileData.teacherEmail)
    }
    if (profileData.teacherDepartment !== undefined) {
      teacherDepartment.value = profileData.teacherDepartment
      localStorage.setItem('teacherDepartment', profileData.teacherDepartment)
    }
    if (profileData.teacherLevel !== undefined) {
      teacherLevel.value = profileData.teacherLevel
      localStorage.setItem('teacherLevel', profileData.teacherLevel)
    }
    if (profileData.teacherPhone !== undefined) {
      teacherPhone.value = profileData.teacherPhone
      localStorage.setItem('teacherPhone', profileData.teacherPhone)
    }
  }

  return {
    // 状态
    teacherId,
    teacherName,
    teacherHead,
    teacherEmail,
    teacherDepartment,
    teacherLevel,
    teacherPhone,
    // 计算属性
    isLoggedIn,
    avatarUrl,
    // 方法
    setTeacherInfo,
    clearTeacherInfo,
    updateAvatar,
    updateProfile,
    // Notification
    unreadCount,
    setUnreadCount
  }
})
