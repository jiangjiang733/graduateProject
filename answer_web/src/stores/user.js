/**
 * 通用用户信息状态管理
 * 兼容教师和学生用户
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserInfo = defineStore('userInfo', () => {
  // 状态 - 从localStorage恢复用户信息
  const userId = ref(localStorage.getItem('teacherId') || localStorage.getItem('t_id') || localStorage.getItem('studentId') || '')
  const userName = ref(localStorage.getItem('teacherName') || localStorage.getItem('studentName') || '')
  const userType = ref(localStorage.getItem('userType') || (localStorage.getItem('teacherId') ? 'TEACHER' : 'STUDENT'))
  const avatar = ref(localStorage.getItem('teacherHead') || localStorage.getItem('studentHead') || '')
  const email = ref(localStorage.getItem('teacherEmail') || localStorage.getItem('studentEmail') || '')
  
  // 计算属性
  const isLoggedIn = computed(() => !!userId.value)
  
  const avatarUrl = computed(() => {
    if (avatar.value && avatar.value.trim() !== '') {
      if (avatar.value.startsWith('http://') || avatar.value.startsWith('https://')) {
        return avatar.value
      }
      return `http://localhost:8088${avatar.value}`
    }
    return 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9636ef921315944d5671d8.png'
  })
  
  // 方法
  /**
   * 设置用户信息
   */
  const setUserInfo = (info) => {
    if (info.userId || info.teacherId || info.studentId) {
      const id = info.userId || info.teacherId || info.studentId
      userId.value = id
      localStorage.setItem('userId', id)
    }
    
    if (info.userName || info.teacherName || info.studentName) {
      const name = info.userName || info.teacherName || info.studentName
      userName.value = name
      localStorage.setItem('userName', name)
    }
    
    if (info.userType) {
      userType.value = info.userType
      localStorage.setItem('userType', info.userType)
    }
    
    if (info.avatar || info.teacherHead || info.studentHead) {
      const avatarPath = info.avatar || info.teacherHead || info.studentHead
      avatar.value = avatarPath
      localStorage.setItem('userAvatar', avatarPath)
    }
    
    if (info.email || info.teacherEmail || info.studentEmail) {
      const userEmail = info.email || info.teacherEmail || info.studentEmail
      email.value = userEmail
      localStorage.setItem('userEmail', userEmail)
    }
  }
  
  /**
   * 清除用户信息
   */
  const clearUserInfo = () => {
    userId.value = ''
    userName.value = ''
    userType.value = ''
    avatar.value = ''
    email.value = ''
    
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userType')
    localStorage.removeItem('userAvatar')
    localStorage.removeItem('userEmail')
  }
  
  /**
   * 初始化用户信息（从localStorage恢复）
   */
  const initUserInfo = () => {
    // 优先从教师信息恢复
    if (localStorage.getItem('teacherId')) {
      setUserInfo({
        userId: localStorage.getItem('teacherId'),
        userName: localStorage.getItem('teacherName'),
        userType: 'TEACHER',
        avatar: localStorage.getItem('teacherHead'),
        email: localStorage.getItem('teacherEmail')
      })
    }
    // 其次从学生信息恢复
    else if (localStorage.getItem('studentId')) {
      setUserInfo({
        userId: localStorage.getItem('studentId'),
        userName: localStorage.getItem('studentName'),
        userType: 'STUDENT',
        avatar: localStorage.getItem('studentHead'),
        email: localStorage.getItem('studentEmail')
      })
    }
  }
  
  return {
    // 状态
    userId,
    userName,
    userType,
    avatar,
    email,
    // 计算属性
    isLoggedIn,
    avatarUrl,
    // 方法
    setUserInfo,
    clearUserInfo,
    initUserInfo
  }
})