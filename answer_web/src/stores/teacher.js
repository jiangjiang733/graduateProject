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
    try {
      const head = teacherHead.value
      if (head && typeof head === 'string' && head.trim() !== '') {
        if (head.startsWith('http://') || head.startsWith('https://')) {
          return head
        }
        return `http://localhost:8088${head}`
      }
    } catch (e) {
      console.error('Error computing avatarUrl', e)
    }
    return ''
  })

  // 方法
  /**
   * 设置教师信息并持久化到localStorage
   */
  const setTeacherInfo = (info) => {
    try {
      if (!info) return

      if (info.teacherId || info.t_id) {
        const id = String(info.teacherId || info.t_id)
        teacherId.value = id
        localStorage.setItem('teacherId', id)
        localStorage.setItem('t_id', id)
      }

      const name = info.teacherName || info.teacherUsername || info.name
      if (name) {
        teacherName.value = name
        localStorage.setItem('teacherName', name)
      }

      if (info.teacherHead !== undefined && info.teacherHead !== null) {
        const head = String(info.teacherHead)
        teacherHead.value = head
        localStorage.setItem('teacherHead', head)
      } else if (info.avatar !== undefined && info.avatar !== null) {
        const head = String(info.avatar)
        teacherHead.value = head
        localStorage.setItem('teacherHead', head)
      }

      if (info.teacherEmail || info.email) {
        const mail = info.teacherEmail || info.email
        teacherEmail.value = mail
        localStorage.setItem('teacherEmail', mail)
      }

      if (info.teacherDepartment || info.department) {
        const dept = info.teacherDepartment || info.department
        teacherDepartment.value = dept
        localStorage.setItem('teacherDepartment', dept)
      }

      if (info.teacherLevel || info.level) {
        const lvl = info.teacherLevel || info.level
        teacherLevel.value = lvl
        localStorage.setItem('teacherLevel', lvl)
      }

      if (info.teacherPhone || info.phone) {
        const ph = info.teacherPhone || info.phone
        teacherPhone.value = ph
        localStorage.setItem('teacherPhone', ph)
      }
    } catch (e) {
      console.error('Error in setTeacherInfo', e)
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
