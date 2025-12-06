import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStudentEnrollments } from '@/api/enrollment.js'

export function useStudentProfile() {
    const router = useRouter()
    const studentInfo = ref({})
    const avatarUploading = ref(false)
    const enrollmentLoading = ref(false)
    const submitting = ref(false)
    const editDialogVisible = ref(false)
    const passwordDialogVisible = ref(false)
    const editFormRef = ref()
    const passwordFormRef = ref()

    const myEnrollments = ref([])
    const statistics = ref({
        enrolledCourses: 0,
        learningCourses: 0,
        completedCourses: 0
    })

    const editForm = reactive({
        studentsId: '',
        studentsUsername: '',
        studentsEmail: '',
        studentsMajor: '',
        studentsGrade: ''
    })

    const editRules = {
        studentsUsername: [
            { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        studentsEmail: [
            { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
    }

    const passwordForm = reactive({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const validatePassword = (rule, value, callback) => {
        if (value === '') {
            callback(new Error('请输入新密码'))
        } else if (value.length < 6) {
            callback(new Error('密码长度不能少于6位'))
        } else {
            callback()
        }
    }

    const validateConfirmPassword = (rule, value, callback) => {
        if (value === '') {
            callback(new Error('请再次输入密码'))
        } else if (value !== passwordForm.newPassword) {
            callback(new Error('两次输入密码不一致'))
        } else {
            callback()
        }
    }

    const passwordRules = {
        oldPassword: [
            { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
            { required: true, validator: validatePassword, trigger: 'blur' }
        ],
        confirmPassword: [
            { required: true, validator: validateConfirmPassword, trigger: 'blur' }
        ]
    }

    // 头像URL
    const avatarUrl = computed(() => {
        if (studentInfo.value.studentsHead && studentInfo.value.studentsHead.trim() !== '') {
            if (studentInfo.value.studentsHead.startsWith('http')) {
                return studentInfo.value.studentsHead
            }
            return `http://localhost:8088${studentInfo.value.studentsHead}`
        }
        return ''
    })

    // 加载学生信息
    const loadStudentInfo = () => {
        const storedInfo = localStorage.getItem('userInfo')
        if (storedInfo) {
            studentInfo.value = JSON.parse(storedInfo)
        } else {
            studentInfo.value = {
                studentsId: localStorage.getItem('studentId') || localStorage.getItem('userId'),
                studentsUsername: localStorage.getItem('studentName') || localStorage.getItem('userName'),
                studentsEmail: localStorage.getItem('studentEmail'),
                studentsHead: localStorage.getItem('studentHead')
            }
        }
    }

    // 加载报名列表
    const loadEnrollments = async () => {
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId')
        if (!studentId) return

        enrollmentLoading.value = true
        try {
            const response = await getStudentEnrollments(studentId)
            if (response.success) {
                myEnrollments.value = (response.data || []).slice(0, 5) // 只显示最近5条
                
                // 更新统计
                const allEnrollments = response.data || []
                statistics.value = {
                    enrolledCourses: allEnrollments.length,
                    learningCourses: allEnrollments.filter(e => e.status === 'approved').length,
                    completedCourses: 0 // 需要后端提供完成状态
                }
            }
        } catch (error) {
            console.error('加载报名列表失败:', error)
        } finally {
            enrollmentLoading.value = false
        }
    }

    // 上传头像前的验证
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

    // 上传头像
    const uploadAvatar = async ({ file }) => {
        avatarUploading.value = true
        try {
            // 这里应该调用上传API
            // const formData = new FormData()
            // formData.append('file', file)
            // const response = await uploadFile(formData)
            
            // 模拟上传
            await new Promise(resolve => setTimeout(resolve, 1000))
            ElMessage.success('头像上传成功')
            
            // 更新头像URL
            // studentInfo.value.studentsHead = response.data.url
        } catch (error) {
            console.error('上传头像失败:', error)
            ElMessage.error('上传失败，请重试')
        } finally {
            avatarUploading.value = false
        }
    }

    // 显示编辑对话框
    const showEditDialog = () => {
        Object.assign(editForm, {
            studentsId: studentInfo.value.studentsId,
            studentsUsername: studentInfo.value.studentsUsername,
            studentsEmail: studentInfo.value.studentsEmail,
            studentsMajor: studentInfo.value.studentsMajor,
            studentsGrade: studentInfo.value.studentsGrade
        })
        editDialogVisible.value = true
    }

    // 显示修改密码对话框
    const showPasswordDialog = () => {
        Object.assign(passwordForm, {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        })
        passwordDialogVisible.value = true
    }

    // 提交编辑
    const submitEdit = async () => {
        try {
            await editFormRef.value.validate()
            submitting.value = true

            // 这里应该调用更新API
            // const response = await updateStudentInfo(editForm)
            
            // 模拟提交
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 更新本地信息
            Object.assign(studentInfo.value, editForm)
            localStorage.setItem('userInfo', JSON.stringify(studentInfo.value))
            
            ElMessage.success('资料更新成功')
            editDialogVisible.value = false
        } catch (error) {
            if (error.errors) return
            console.error('更新资料失败:', error)
            ElMessage.error('更新失败，请重试')
        } finally {
            submitting.value = false
        }
    }

    // 提交修改密码
    const submitPassword = async () => {
        try {
            await passwordFormRef.value.validate()
            submitting.value = true

            // 这里应该调用修改密码API
            // const response = await changePassword(passwordForm)
            
            // 模拟提交
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            ElMessage.success('密码修改成功，请重新登录')
            passwordDialogVisible.value = false
            
            // 清除登录信息，跳转到登录页
            setTimeout(() => {
                localStorage.clear()
                window.location.href = '/login'
            }, 1500)
        } catch (error) {
            if (error.errors) return
            console.error('修改密码失败:', error)
            ElMessage.error('修改失败，请重试')
        } finally {
            submitting.value = false
        }
    }

    // 获取状态类型
    const getStatusType = (status) => {
        const types = {
            pending: 'warning',
            approved: 'success',
            rejected: 'danger'
        }
        return types[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
        const texts = {
            pending: '待审核',
            approved: '已通过',
            rejected: '已拒绝'
        }
        return texts[status] || '未知'
    }

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '-'
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('zh-CN')
        } catch {
            return '-'
        }
    }

    // 进入课程学习
    const goToLearn = (courseId) => {
        router.push(`/student/learn/${courseId}`)
    }

    onMounted(() => {
        loadStudentInfo()
        loadEnrollments()
    })

    return {
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
