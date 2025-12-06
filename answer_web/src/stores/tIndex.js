import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export function useTIndexStore() {
  const router = useRouter()

  // 教师信息状态
  const teacherInfo = ref({
    teacherId: null,
    teacherName: '',
    teacherHead: ''
  })
  
  // 加载状态
  const loading = ref(false)
  
  // 从localStorage获取教师ID
  const getTeacherIdFromStorage = () => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        return userData.teacherId || userData.id
      } catch (e) {
        console.error('解析用户信息失败:', e)
        return null
      }
    }
    return null
  }
  
  // 获取教师信息
  const fetchTeacherInfo = async () => {
    const teacherId = getTeacherIdFromStorage()
    if (!teacherId) {
      console.error('未找到教师ID')
      return
    }
    
    loading.value = true
    try {
      // 获取教师基本信息
      const profileResponse = await axios.get(`http://localhost:8088/api/teacherProfile?teacherId=${teacherId}`)
      if (profileResponse.data) {
        teacherInfo.value.teacherId = teacherId
        teacherInfo.value.teacherName = profileResponse.data.teacherUsername
        
        // 获取头像信息
        try {
          const avatarResponse = await axios.get(`http://localhost:8088/api/upload/avatar/${teacherId}`)
          if (avatarResponse.data.success && avatarResponse.data.avatarUrl) {
            teacherInfo.value.teacherHead = avatarResponse.data.avatarUrl
          } else {
            // 如果没有头像，使用默认头像
            teacherInfo.value.teacherHead = ''
          }
        } catch (avatarError) {
          console.error('获取头像失败:', avatarError)
          teacherInfo.value.teacherHead = ''
        }
      }
    } catch (error) {
      console.error('获取教师信息失败:', error)
      teacherInfo.value.teacherName = '教师'
      teacherInfo.value.teacherHead = ''
    } finally {
      loading.value = false
    }
  }
  
  // 初始化获取教师信息
  const initTeacherInfo = () => {
    fetchTeacherInfo()
  }
  
  return {
    teacherInfo,
    loading,
    initTeacherInfo,
    fetchTeacherInfo
  }
}