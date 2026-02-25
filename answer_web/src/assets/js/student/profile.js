/**
 * 学生个人信息管理逻辑
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getProfile, updateProfile, updatePassword, uploadAvatar as uploadAvatarAPI } from '@/api/student.js'
import { getStudentEnrollments } from '@/api/enrollment.js'
import { getStudentSchedule, getCourseSchedules } from '@/api/schedule.js'
import { useUserInfo } from '@/stores/user.js'

export function useStudentProfile() {
  const router = useRouter()
  const userStore = useUserInfo()

  // 响应式数据
  const studentInfo = ref({})
  const avatarUploading = ref(false)
  const enrollmentLoading = ref(false)
  const submitting = ref(false)
  const editDialogVisible = ref(false)
  const passwordDialogVisible = ref(false)
  const myEnrollments = ref([])
  const scheduleList = ref([])
  const scheduleLoading = ref(false)
  const currentWeek = ref(1)

  // 头像时间戳，用于强制刷新
  const avatarTimestamp = ref(Date.now())

  // 表单数据
  const editForm = ref({
    studentsUsername: '',
    studentsEmail: '',
    studentsMajor: '',
    studentsGrade: '',
    studentSex: '',
    studentsBirthday: ''
  })

  const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 表单引用
  const editFormRef = ref(null)
  const passwordFormRef = ref(null)

  // 表单验证规则
  const editRules = {
    studentsUsername: [
      { required: true, message: '请输入姓名', trigger: 'blur' }
    ],
    studentsEmail: [
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ]
  }

  const passwordRules = {
    oldPassword: [
      { required: true, message: '请输入原密码', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== passwordForm.value.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  // 计算属性 - 实时的头像URL
  const avatarUrl = computed(() => {
    const _ = avatarTimestamp.value
    return userStore.avatarUrl
  })

  // 方法
  const loadStudentInfo = async () => {
    try {
      const studentId = userStore.userId
      if (!studentId) {
        ElMessage.error('未找到学生信息')
        return
      }

      const response = await getProfile(studentId)
      if (response && response.data) {
        studentInfo.value = response.data
        userStore.setUserInfo({
          studentId: response.data.studentsId,
          studentName: response.data.studentsUsername,
          studentHead: response.data.studentsHead,
          studentEmail: response.data.studentsEmail
        })
      }
    } catch (error) {
      console.error('获取学生信息失败:', error)
      ElMessage.error('获取学生信息失败')
    }
  }

  const loadEnrollments = async () => {
    enrollmentLoading.value = true
    try {
      if (!userStore.userId) return
      const response = await getStudentEnrollments(userStore.userId)
      myEnrollments.value = response.data || []
    } catch (error) {
      console.error('获取报名信息失败:', error)
    } finally {
      enrollmentLoading.value = false
    }
  }

  /**
   * 加载课程表
   * 后端 getStudentSchedule 返回格式：
   *   { success: true, data: { dayOfWeek: { section: { courseId, courseName, teacherName, location, ... } } } }
   * 其中 dayOfWeek 和 section 都是数字键。
   * 
   * 如果该端点返回空数据或不可用，则回退为通过学生已选课程逐个拉取课表。
   */
  const loadSchedule = async () => {
    scheduleLoading.value = true
    try {
      if (!userStore.userId) return

      // 方式1：尝试后端学生课程表聚合接口
      let flatList = []
      try {
        const response = await getStudentSchedule(userStore.userId, currentWeek.value)
        console.log('[Schedule] API response:', response)
        const data = response?.data
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // 后端返回嵌套 Map: { dayOfWeek: { section: courseInfo } }
          flatList = flattenScheduleMap(data)
        } else if (Array.isArray(data)) {
          // 如果后端直接返回数组
          flatList = data
        }
      } catch (e) {
        console.warn('[Schedule] 学生课程表聚合接口出错，回退单课查询:', e)
      }

      // 方式2：如果聚合接口返回空，通过各已选课程分别查询 schedule
      if (flatList.length === 0 && myEnrollments.value.length > 0) {
        console.log('[Schedule] 回退：通过已选课程逐个查询课表')
        const approvedCourses = myEnrollments.value.filter(e => e.status === 'approved')
        const allSchedules = []
        let earliestWeek = Infinity

        for (const enrollment of approvedCourses) {
          try {
            const res = await getCourseSchedules(enrollment.courseId)
            const items = res?.data || []
            items.forEach(s => {
              // 记录最早开始周数
              if (s.startWeek && s.startWeek < earliestWeek) {
                earliestWeek = s.startWeek
              }
              // 展示包含当前周的排课
              if (s.startWeek <= currentWeek.value && s.endWeek >= currentWeek.value) {
                allSchedules.push({
                  ...s,
                  courseName: enrollment.courseName || s.courseName || '未知课程',
                  courseId: enrollment.courseId
                })
              }
            })
          } catch (err) {
            console.warn(`[Schedule] 课程 ${enrollment.courseId} 排课查询失败:`, err)
          }
        }

        // 如果当前周没有课，但有更晚的周有课，自动跳到最早有课的周
        if (allSchedules.length === 0 && earliestWeek !== Infinity && earliestWeek > currentWeek.value) {
          console.log(`[Schedule] 当前第${currentWeek.value}周无课，自动跳到第${earliestWeek}周`)
          currentWeek.value = earliestWeek
          // 重新用主接口尝试
          try {
            const retryRes = await getStudentSchedule(userStore.userId, currentWeek.value)
            const retryData = retryRes?.data
            if (retryData && typeof retryData === 'object' && !Array.isArray(retryData)) {
              flatList = flattenScheduleMap(retryData)
            }
          } catch (_e) { /* ignore */ }

          // 如果主接口仍然空，用回退再搜一次
          if (flatList.length === 0) {
            for (const enrollment of approvedCourses) {
              try {
                const res2 = await getCourseSchedules(enrollment.courseId)
                const items2 = res2?.data || []
                items2.forEach(s => {
                  if (s.startWeek <= currentWeek.value && s.endWeek >= currentWeek.value) {
                    allSchedules.push({
                      ...s,
                      courseName: enrollment.courseName || s.courseName || '未知课程',
                      courseId: enrollment.courseId
                    })
                  }
                })
              } catch (_err) { /* ignore */ }
            }
            flatList = allSchedules
          }
        } else {
          flatList = allSchedules
        }
      }

      console.log('[Schedule] 最终课程列表:', flatList)
      scheduleList.value = flatList
    } catch (error) {
      console.error('获取课程表失败:', error)
      scheduleList.value = []
    } finally {
      scheduleLoading.value = false
    }
  }

  /**
   * 将后端嵌套 Map 扁平化成数组
   * 输入: { "5": { "1": { courseName: "买买买", location: "12", ... }, "2": {...} } }
   * 输出: [{ dayOfWeek: 5, startSection: 1, courseName: "买买买", ... }, ...]
   */
  const flattenScheduleMap = (mapData) => {
    const result = []
    for (const [dayStr, sectionMap] of Object.entries(mapData)) {
      const dayOfWeek = parseInt(dayStr)
      if (isNaN(dayOfWeek) || typeof sectionMap !== 'object') continue

      // 收集 section 信息，将连续相同课程合并
      const sectionEntries = Object.entries(sectionMap)
        .map(([secStr, info]) => ({ section: parseInt(secStr), ...info }))
        .sort((a, b) => a.section - b.section)

      // 去重：相同 courseId 在同一天的连续节次只保留一条（使用 startSection 最小的那条）
      const seen = new Set()
      for (const entry of sectionEntries) {
        const key = `${dayOfWeek}-${entry.courseId || entry.courseName}`
        if (!seen.has(key)) {
          seen.add(key)
          result.push({
            dayOfWeek: dayOfWeek,
            startSection: entry.startSection || entry.section,
            endSection: entry.endSection || entry.section,
            courseName: entry.courseName || '未知课程',
            location: entry.location || '',
            courseId: entry.courseId || '',
            teacherName: entry.teacherName || ''
          })
        }
      }
    }
    return result
  }

  const changeWeek = (delta) => {
    currentWeek.value = Math.max(1, currentWeek.value + delta)
    loadSchedule()
  }

  const beforeAvatarUpload = (file) => {
    const isImage = file.type.startsWith('image/')
    const isLt2M = file.size / 1024 / 1024 < 2

    if (!isImage) {
      ElMessage.error('只能上传图片文件!')
      return false
    }
    if (!isLt2M) {
      ElMessage.error('图片大小不能超过 2MB!')
      return false
    }
    return true
  }

  const uploadAvatar = async (options) => {
    avatarUploading.value = true
    try {
      const response = await uploadAvatarAPI(userStore.userId, options.file)
      console.log('[Avatar] 上传响应:', response)

      // 后端返回格式: { code: 200, data: { avatarUrl: "/uploads/..." } }
      const newAvatarPath = response?.data?.avatarUrl || response?.data || ''
      if (!newAvatarPath || typeof newAvatarPath !== 'string') {
        console.error('[Avatar] 未获取到有效头像路径:', response)
        ElMessage.error('头像上传失败：未获取到路径')
        return
      }

      // 加时间戳破缓存
      const ts = Date.now()
      const cacheBustedPath = `${newAvatarPath}?t=${ts}`

      // 直接更新 Pinia store 的 avatar ref（最直接的响应式触发）
      userStore.avatar = cacheBustedPath

      // 同步 localStorage
      const role = localStorage.getItem('userRole')
      if (role === 'student') {
        localStorage.setItem('studentHead', cacheBustedPath)
      }

      // 更新本地 studentInfo
      studentInfo.value = {
        ...studentInfo.value,
        studentsHead: cacheBustedPath
      }

      // 强制触发头像 computed 重新计算 + el-avatar :key 重建
      avatarTimestamp.value = ts

      ElMessage.success('头像更新成功')
    } catch (error) {
      console.error('头像上传失败:', error)
      ElMessage.error('头像上传失败')
    } finally {
      avatarUploading.value = false
    }
  }

  const showEditDialog = () => {
    editForm.value = {
      studentsUsername: studentInfo.value.studentsUsername,
      studentsEmail: studentInfo.value.studentsEmail,
      studentsMajor: studentInfo.value.studentsMajor,
      studentsGrade: studentInfo.value.studentsGrade,
      studentSex: studentInfo.value.studentSex || '保密',
      studentsBirthday: studentInfo.value.studentsBirthday || ''
    }
    editDialogVisible.value = true
  }

  const showPasswordDialog = () => {
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    passwordDialogVisible.value = true
  }

  const submitEdit = async () => {
    if (!editFormRef.value) return

    try {
      await editFormRef.value.validate()
      submitting.value = true

      const response = await updateProfile(userStore.userId, editForm.value)
      if (response && response.code === 200) {
        studentInfo.value = { ...studentInfo.value, ...editForm.value }
        userStore.setUserInfo({
          studentName: editForm.value.studentsUsername,
          studentEmail: editForm.value.studentsEmail
        })
        editDialogVisible.value = false
        ElMessage.success('个人信息更新成功')
      }
    } catch (error) {
      console.error('更新个人信息失败:', error)
      ElMessage.error('更新个人信息失败')
    } finally {
      submitting.value = false
    }
  }

  const submitPassword = async () => {
    if (!passwordFormRef.value) return

    try {
      await passwordFormRef.value.validate()
      submitting.value = true

      const response = await updatePassword(userStore.userId, {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      })

      if (response && response.code === 200) {
        passwordDialogVisible.value = false
        ElMessage.success('密码修改成功')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      ElMessage.error('修改密码失败')
    } finally {
      submitting.value = false
    }
  }

  const getStatusType = (status) => {
    const statusMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    }
    return statusMap[status] || 'info'
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '审核中',
      'approved': '已通过',
      'rejected': '已拒绝'
    }
    return statusMap[status] || '未知'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const goToLearn = (courseId) => {
    router.push(`/student/learn/${courseId}`)
  }

  // 课程表辅助 - 星期映射
  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const getDayLabel = (day) => {
    return dayLabels[day - 1] || `第${day}天`
  }

  // 生命周期
  onMounted(async () => {
    await loadStudentInfo()
    await loadEnrollments()
    // 排课依赖已选课程数据，所以需要先加载 enrollment
    await loadSchedule()
  })

  return {
    studentInfo,
    avatarUrl,
    avatarTimestamp,
    avatarUploading,
    enrollmentLoading,
    submitting,
    editDialogVisible,
    passwordDialogVisible,
    myEnrollments,
    scheduleList,
    scheduleLoading,
    currentWeek,
    editForm,
    editRules,
    editFormRef,
    passwordForm,
    passwordRules,
    passwordFormRef,
    beforeAvatarUpload,
    uploadAvatar,
    showEditDialog,
    showPasswordDialog,
    submitEdit,
    submitPassword,
    getStatusType,
    getStatusText,
    formatDate,
    goToLearn,
    loadSchedule,
    changeWeek,
    getDayLabel
  }
}
