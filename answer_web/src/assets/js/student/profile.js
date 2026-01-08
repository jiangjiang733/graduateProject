/**
 * 学生个人信息管理逻辑
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getProfile, updateProfile, updatePassword, uploadAvatar as uploadAvatarAPI, getStatistics } from '@/api/student.js'
import { getStudentEnrollments } from '@/api/enrollment.js'
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
  const statistics = ref({
    enrolledCourses: 0,
    learningCourses: 0,
    completedCourses: 0
  })

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

  // 计算属性
  const avatarUrl = computed(() => userStore.avatarUrl)

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
        // 更新store中的信息
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

  const loadStatistics = async () => {
    try {
      if (!userStore.userId) return
      const response = await getStatistics(userStore.userId)
      if (response && response.data) {
        statistics.value = response.data
      }
    } catch (error) {
      console.error('获取学习统计失败:', error)
    }
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
      if (response && response.data) {
        const newAvatarUrl = response.data
        userStore.setUserInfo({
          studentHead: newAvatarUrl
        })
        studentInfo.value.studentsHead = newAvatarUrl
        ElMessage.success('头像更新成功')
      }
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

  // 生命周期
  onMounted(() => {
    loadStudentInfo()
    loadEnrollments()
    loadStatistics()
  })

  return {
    // 响应式数据
    studentInfo,
    avatarUrl,
    avatarUploading,
    enrollmentLoading,
    submitting,
    editDialogVisible,
    passwordDialogVisible,
    myEnrollments,
    statistics,
    editForm,
    editRules,
    editFormRef,
    passwordForm,
    passwordRules,
    passwordFormRef,
    // 方法
    beforeAvatarUpload,
    uploadAvatar,
    showEditDialog,
    showPasswordDialog,
    submitEdit,
    submitPassword,
    getStatusType,
    getStatusText,
    formatDate,
    goToLearn
  }
}