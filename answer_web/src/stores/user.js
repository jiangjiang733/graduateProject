/**
 * 通用用户信息状态管理
 * 兼容教师和学生用户
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserInfo = defineStore('userInfo', () => {
  // 状态
  const userType = ref(localStorage.getItem('userRole')?.toUpperCase() || '')
  const userId = ref('')
  const userName = ref('')
  const avatar = ref('')
  const email = ref('')

  // 同步存储数据
  const syncWithStorage = () => {
    const role = localStorage.getItem('userRole')
    if (role === 'teacher') {
      userId.value = localStorage.getItem('teacherId') || ''
      userName.value = localStorage.getItem('teacherName') || ''
      avatar.value = localStorage.getItem('teacherHead') || ''
      email.value = localStorage.getItem('teacherEmail') || ''
      userType.value = 'TEACHER'
    } else if (role === 'student') {
      userId.value = localStorage.getItem('studentId') || ''
      userName.value = localStorage.getItem('studentName') || ''
      avatar.value = localStorage.getItem('studentHead') || ''
      email.value = localStorage.getItem('studentEmail') || ''
      userType.value = 'STUDENT'
    }
  }

  // 立即初始化
  syncWithStorage()

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
  const setUserInfo = (info) => {
    if (info.userType) {
      userType.value = info.userType
      localStorage.setItem('userRole', info.userType.toLowerCase())
    }

    // 根据角色保存具体 ID
    const id = info.userId || info.teacherId || info.studentId
    if (id) {
      userId.value = id
      if (userType.value === 'TEACHER') localStorage.setItem('teacherId', id)
      else localStorage.setItem('studentId', id)
    }

    const name = info.userName || info.teacherName || info.studentName
    if (name) {
      userName.value = name
      if (userType.value === 'TEACHER') localStorage.setItem('teacherName', name)
      else localStorage.setItem('studentName', name)
    }

    const avatarPath = info.avatar || info.teacherHead || info.studentHead
    if (avatarPath) {
      avatar.value = avatarPath
      if (userType.value === 'TEACHER') localStorage.setItem('teacherHead', avatarPath)
      else localStorage.setItem('studentHead', avatarPath)
    }

    const userEmail = info.email || info.teacherEmail || info.studentEmail
    if (userEmail) {
      email.value = userEmail
      if (userType.value === 'TEACHER') localStorage.setItem('teacherEmail', userEmail)
      else localStorage.setItem('studentEmail', userEmail)
    }
  }

  const clearUserInfo = () => {
    userId.value = ''
    userName.value = ''
    userType.value = ''
    avatar.value = ''
    email.value = ''

    const keys = [
      'teacherId', 'teacherName', 'teacherHead', 'teacherEmail', 'teacherDepartment', 'teacherLevel', 'teacherPhone',
      'studentId', 'studentName', 'studentHead', 'studentEmail', 'studentMajor', 'studentClass',
      'userRole', 'token', 'status', 'userId', 'userName', 'userType', 'userAvatar', 'userEmail'
    ]
    keys.forEach(k => localStorage.removeItem(k))
  }

  const initUserInfo = () => {
    syncWithStorage()
  }

  return {
    userId,
    userName,
    userType,
    avatar,
    email,
    isLoggedIn,
    avatarUrl,
    setUserInfo,
    clearUserInfo,
    initUserInfo
  }
})