import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getProfile, updateProfile, updatePassword, uploadAvatar as uploadAvatarAPI } from '@/api/teacher'
import { getCourseList } from '@/api/course.js'
import { getCourseSchedules } from '@/api/schedule.js'
import { useTeacherStore } from '@/stores/teacher.js'

export function useProfile() {
    const teacherStore = useTeacherStore()
    // 用户个人信息状态
    const profileData = ref({})
    // 表单状态
    const dialogFormVisible = ref(false)
    const form = reactive({
        name: '',
        region: '',
        level: '',
        department: '',
        email: '',
        verificationCode: ''
    })

    // 验证码倒计时相关
    const countdown = ref(0)
    const isCounting = ref(false)

    // 表单引用
    const formRef = ref()

    // 响应式数据
    const loading = ref(false)
    const submitLoading = ref(false)

    // 课程表数据
    const courseData = ref([])

    // 将当前用户信息填充到表单中
    const fillFormWithCurrentData = () => {
        if (profileData.value) {
            form.name = profileData.value.teacherUsername || ''
            form.email = profileData.value.teacherEmail || ''
            form.level = profileData.value.teacherLevel || ''
            form.department = profileData.value.teacherDepartment || ''
        }
    }

    // 获取教师个人信息
    const getTeacherProfile = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                ElMessage.warning('请先登录')
                // 使用localStorage中的数据作为默认值
                profileData.value = {
                    teacherUsername: localStorage.getItem('teacherName') || '未登录',
                    teacherEmail: localStorage.getItem('teacherEmail') || '',
                    teacherDepartment: localStorage.getItem('teacherDepartment') || '',
                    teacherLevel: localStorage.getItem('teacherLevel') || '',
                    teacherHead: localStorage.getItem('teacherHead') || ''
                }
                fillFormWithCurrentData()
                return
            }

            const response = await getProfile(teacherId)
            console.log('获取个人信息响应:', response)

            if (response && response.data) {
                profileData.value = response.data
                teacherStore.setTeacherInfo(response.data)

                localStorage.setItem('teacherName', profileData.value.teacherUsername || '')
                localStorage.setItem('teacherEmail', profileData.value.teacherEmail || '')
                localStorage.setItem('teacherHead', profileData.value.teacherHead || '')
                localStorage.setItem('teacherDepartment', profileData.value.teacherDepartment || '')
                localStorage.setItem('teacherLevel', profileData.value.teacherLevel || '')
            } else {
                // 使用localStorage中的数据
                profileData.value = {
                    teacherUsername: localStorage.getItem('teacherName') || '未登录',
                    teacherEmail: localStorage.getItem('teacherEmail') || '',
                    teacherDepartment: localStorage.getItem('teacherDepartment') || '',
                    teacherLevel: localStorage.getItem('teacherLevel') || '',
                    teacherHead: localStorage.getItem('teacherHead') || ''
                }
            }

            // 将当前用户信息填充到表单中
            fillFormWithCurrentData()
        } catch (e) {
            console.error('获取个人信息失败:', e)
            // 使用localStorage中的数据作为默认值
            profileData.value = {
                teacherUsername: localStorage.getItem('teacherName') || '未登录',
                teacherEmail: localStorage.getItem('teacherEmail') || '',
                teacherDepartment: localStorage.getItem('teacherDepartment') || '',
                teacherLevel: localStorage.getItem('teacherLevel') || '',
                teacherHead: localStorage.getItem('teacherHead') || ''
            }
            fillFormWithCurrentData()
        }
    }

    // 获取验证码函数
    const getVerificationCode = async () => {
        if (!form.email) {
            ElMessage.warning('请先输入邮箱')
            return
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
            ElMessage.warning('请输入正确的邮箱格式')
            return
        }

        try {
            // 开始倒计时
            isCounting.value = true
            countdown.value = 60
            // 调用后端发送验证码接口
            await axios.post('http://localhost:8088/api/sendVerificationCode', { email: form.email })

            const timer = setInterval(() => {
                countdown.value--
                if (countdown.value <= 0) {
                    clearInterval(timer)
                    isCounting.value = false
                }
            }, 1000)

            ElMessage.success('验证码已发送到您的邮箱')
        } catch (error) {
            ElMessage.error('验证码发送失败: ' + (error.response?.data?.message || error.message))
            isCounting.value = false
            countdown.value = 0
        }
    }

    // 提交表单函数
    const submitForm = async () => {
        try {
            // 表单验证
            await formRef.value.validate()

            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                ElMessage.warning('未获取到用户ID，请重新登录')
                return
            }

            submitLoading.value = true

            // 准备提交数据
            const updateData = {
                email: form.email,
                level: form.level,
                department: form.department,
                phone: form.phone || ''
            }

            // 调用后端更新接口
            const response = await updateProfile(teacherId, updateData)
            console.log('更新个人信息响应:', response)

            if (response && response.success) {
                ElMessage.success('个人信息更新成功')
                dialogFormVisible.value = false

                // 重新获取个人信息以更新显示
                await getTeacherProfile()

                // 重置验证码
                form.verificationCode = ''
            } else {
                ElMessage.error(response.message || '更新失败')
            }
        } catch (error) {
            if (error.response && error.response.data) {
                ElMessage.error('更新失败：' + error.response.data.message)
            } else if (error.errors) {
                ElMessage.warning('请检查表单填写是否正确')
            } else {
                ElMessage.error('网络错误，请稍后重试')
            }
        } finally {
            submitLoading.value = false
        }
    }

    // 表单验证规则
    const rules = {
        department: [
            { required: true, message: '请选择院系', trigger: 'change' }
        ],
        email: [
            { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        ],
        level: [
            { required: true, message: '请选择级别', trigger: 'change' }
        ],
        verificationCode: [
            { required: true, message: '请输入验证码', trigger: 'blur' },
        ]
    }

    // 头像上传相关状态
    const avatarUploading = ref(false)

    // 计算属性获取头像URL
    const avatarUrl = computed(() => {
        if (profileData.value.teacherHead) {
            return `http://localhost:8088${profileData.value.teacherHead}`
        }
        return null
    })

    // 头像上传前的验证
    const beforeAvatarUpload = (file) => {
        const isImage = file.type.startsWith('image/')
        const isLt5M = file.size / 1024 / 1024 < 5

        if (!isImage) {
            ElMessage.error('只能上传图片文件!')
            return false
        }
        if (!isLt5M) {
            ElMessage.error('头像大小不能超过 5MB!')
            return false
        }
        return true
    }

    // 上传头像
    const uploadAvatar = async (options) => {
        const { file } = options

        // 从本地存储获取教师ID
        const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
        if (!teacherId) {
            ElMessage.error('请先登录')
            return
        }

        avatarUploading.value = true

        try {
            const response = await uploadAvatarAPI(teacherId, file)
            console.log('上传头像响应:', response)

            if (response && (response.success || response.data?.success)) {
                ElMessage.success('头像上传成功')
                // 刷新教师信息
                await getTeacherProfile()
            } else {
                ElMessage.error(response?.message || response?.data?.message || '头像上传失败')
            }
        } catch (error) {
            ElMessage.error('头像上传失败，请重试')
            console.error('Avatar upload error:', error)
        } finally {
            avatarUploading.value = false
        }
    }

    // 密码修改相关状态
    const passwordDialogVisible = ref(false)
    const passwordLoading = ref(false)
    const passwordFormRef = ref()

    // 密码表单
    const passwordForm = reactive({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // 密码表单验证规则
    const passwordRules = {
        oldPassword: [
            { required: true, message: '请输入原密码', trigger: 'blur' },
        ],
        newPassword: [
            { required: true, message: '请输入新密码', trigger: 'blur' },
            {
                validator: (rule, value, callback) => {
                    if (value === passwordForm.oldPassword) {
                        callback(new Error('新密码不能与原密码相同'))
                    } else {
                        callback()
                    }
                },
                trigger: 'blur'
            }
        ],
        confirmPassword: [
            { required: true, message: '请确认新密码', trigger: 'blur' },
            {
                validator: (rule, value, callback) => {
                    if (value !== passwordForm.newPassword) {
                        callback(new Error('两次输入的密码不一致'))
                    } else {
                        callback()
                    }
                },
                trigger: 'blur'
            }
        ]
    }

    // 提交密码修改
    const submitPasswordChange = async () => {
        try {
            // 表单验证
            await passwordFormRef.value.validate()
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                ElMessage.warning('未获取到用户ID，请重新登录')
                return
            }

            passwordLoading.value = true

            // 准备提交数据
            const passwordData = {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            }

            // 调用后端修改密码接口
            const response = await updatePassword(teacherId, passwordData)
            console.log('修改密码响应:', response)

            if (response && response.success) {
                ElMessage.success('密码修改成功')
                passwordDialogVisible.value = false

                // 重置表单
                passwordForm.oldPassword = ''
                passwordForm.newPassword = ''
                passwordForm.confirmPassword = ''
            } else {
                ElMessage.error(response.message || '密码修改失败')
            }
        } catch (error) {
            if (error.response && error.response.data) {
                ElMessage.error('密码修改失败：' + error.response.data.message)
            } else if (error.errors) {
                ElMessage.warning('请检查表单填写是否正确')
            } else {
                ElMessage.error('网络错误，请稍后重试')
            }
        } finally {
            passwordLoading.value = false
        }
    }

    // 编辑按钮点击事件
    const handleEdit = () => {
        dialogFormVisible.value = true
    }

    // 修改密码按钮点击事件
    const handleChangePassword = () => {
        passwordDialogVisible.value = true
    }

    // 加载教师课程表
    const loadTeacherSchedule = async () => {
        try {
            console.log('=== 开始加载教师课程表 ===')
            loading.value = true

            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                console.log('教师ID为空，跳过加载')
                return
            }

            console.log('教师ID:', teacherId)

            // 1. 获取教师的所有课程
            const coursesResponse = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })

            console.log('课程列表响应:', coursesResponse)

            if (!coursesResponse.success || !coursesResponse.data || !coursesResponse.data.list) {
                console.log('没有课程数据')
                courseData.value = []
                return
            }

            const courses = coursesResponse.data.list
            console.log('课程数量:', courses.length)

            // 2. 为每个课程获取时间表
            const schedulePromises = courses.map(async (course) => {
                try {
                    const scheduleResponse = await getCourseSchedules(course.id)
                    console.log(`课程 ${course.courseName} 的时间表:`, scheduleResponse)

                    if (scheduleResponse.success && scheduleResponse.data && scheduleResponse.data.length > 0) {
                        // 将课程时间表转换为显示格式
                        return scheduleResponse.data.map(schedule => ({
                            courseName: course.courseName || course.name,
                            courseTime: formatScheduleTime(schedule),
                            courseLocation: schedule.location || '未设置',
                            courseStudent: course.num || 0,
                            courseId: course.id,
                            scheduleId: schedule.scheduleId
                        }))
                    }
                    return []
                } catch (error) {
                    console.error(`获取课程 ${course.courseName} 的时间表失败:`, error)
                    return []
                }
            })

            // 3. 等待所有时间表加载完成
            const scheduleResults = await Promise.all(schedulePromises)

            // 4. 扁平化数组并设置数据
            courseData.value = scheduleResults.flat()

            console.log('最终课程表数据:', courseData.value)
            console.log('=== 教师课程表加载完成 ===')

        } catch (error) {
            console.error('加载教师课程表失败:', error)
            ElMessage.error('加载课程表失败')
        } finally {
            loading.value = false
        }
    }

    // 格式化课程时间显示
    const formatScheduleTime = (schedule) => {
        const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
        const dayName = dayNames[schedule.dayOfWeek] || '未知'

        // 节次时间映射
        const sectionTimes = {
            1: '08:00', 2: '08:55', 3: '10:00', 4: '10:55',
            5: '14:00', 6: '14:55', 7: '16:00', 8: '16:55',
            9: '19:00', 10: '19:55', 11: '20:50', 12: '21:45'
        }

        const startTime = sectionTimes[schedule.startSection] || '00:00'
        const endTime = sectionTimes[schedule.endSection + 1] || '23:59'

        return `${dayName} ${startTime}-${endTime} (第${schedule.startWeek}-${schedule.endWeek}周)`
    }

    onMounted(() => {
        getTeacherProfile()
        loadTeacherSchedule()
    })

    return {
        profileData,
        dialogFormVisible,
        form,
        formRef,
        countdown,
        isCounting,
        loading,
        submitLoading,
        courseData,
        getTeacherProfile,
        getVerificationCode,
        submitForm,
        rules,
        avatarUploading,
        avatarUrl,
        beforeAvatarUpload,
        uploadAvatar,
        passwordDialogVisible,
        passwordLoading,
        passwordForm,
        passwordFormRef,
        passwordRules,
        submitPasswordChange,
        handleEdit,
        handleChangePassword
    }
}
