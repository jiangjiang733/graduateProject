import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { getCourseEnrollments, reviewEnrollment, getTeacherEnrollments, cancelEnrollment, directEnroll } from '@/api/enrollment.js'

export function useEnrollmentManagement() {
    const loading = ref(false)
    const submitting = ref(false)
    const rejectDialogVisible = ref(false)
    const rejectFormRef = ref()

    const courses = ref([])
    const enrollments = ref([])
    const selectedCourseId = ref('')
    const currentStatus = ref('all')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const currentEnrollment = ref({})

    const rejectForm = reactive({
        reason: ''
    })

    const rejectRules = {
        reason: [
            { required: true, message: '请输入拒绝原因', trigger: 'blur' },
            { min: 5, max: 200, message: '拒绝原因长度在 5 到 200 个字符', trigger: 'blur' }
        ]
    }

    // 统计数据
    const statistics = computed(() => {
        return {
            pending: enrollments.value.filter(e => e.status === 'pending').length,
            approved: enrollments.value.filter(e => e.status === 'approved').length,
            rejected: enrollments.value.filter(e => e.status === 'rejected').length
        }
    })

    const searchKeyword = ref('')

    // 筛选后的报名列表
    const filteredEnrollments = computed(() => {
        let result = enrollments.value

        // Status Filter
        if (currentStatus.value !== 'all') {
            result = result.filter(e => e.status === currentStatus.value)
        }

        // Keyword Filter
        if (searchKeyword.value) {
            const lower = searchKeyword.value.toLowerCase()
            result = result.filter(e =>
                (e.studentName && e.studentName.toLowerCase().includes(lower)) ||
                (e.studentId && e.studentId.includes(lower)) ||
                (e.courseName && e.courseName.toLowerCase().includes(lower))
            )
        }

        return result
    })

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date
        if (diff < 60000) return '刚刚'
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
        return date.toLocaleDateString()
    }

    // 分页后的报名列表
    const paginatedEnrollments = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return filteredEnrollments.value.slice(start, end)
    })

    // 加载课程列表
    const loadCourses = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })

            if (response.success && response.data) {
                courses.value = response.data.list || []
            }
        } catch (error) {
            console.error('加载课程列表失败:', error)
        }
    }

    // 加载报名列表
    const loadEnrollments = async () => {
        loading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            let response;

            if (!selectedCourseId.value) {
                // Fetch all teacher enrollments if no course selected
                response = await getTeacherEnrollments(teacherId)
            } else {
                response = await getCourseEnrollments(selectedCourseId.value)
            }

            if (response.success) {
                enrollments.value = (response.data || []).map(item => ({
                    ...item,
                    approving: false,
                    rejecting: false
                }))
            } else {
                enrollments.value = []
            }
        } catch (error) {
            console.error('加载报名列表失败:', error)
            ElMessage.error('加载报名列表失败')
            enrollments.value = []
        } finally {
            loading.value = false
        }
    }

    // 筛选报名
    const filterEnrollments = () => {
        currentPage.value = 1
    }

    // 处理分页变化
    const handlePageChange = (page) => {
        currentPage.value = page
    }

    // 处理每页显示数量变化
    const handleSizeChange = (size) => {
        pageSize.value = size
        currentPage.value = 1
    }

    // 通过报名
    const handleApprove = async (enrollment) => {
        try {
            await ElMessageBox.confirm(
                `确定要通过学生"${enrollment.studentName}"的报名申请吗？`,
                '确认通过',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'success'
                }
            )

            enrollment.approving = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            const response = await reviewEnrollment(enrollment.id, teacherId, 'approved')

            if (response.success) {
                ElMessage.success('已通过报名申请')
                enrollment.status = 'approved'
                enrollment.reviewTime = new Date().toISOString()
            } else {
                ElMessage.error(response.message || '操作失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('通过报名失败:', error)
                ElMessage.error('操作失败')
            }
        } finally {
            enrollment.approving = false
        }
    }

    // 拒绝报名
    const handleReject = (enrollment) => {
        currentEnrollment.value = enrollment
        rejectForm.reason = ''
        rejectDialogVisible.value = true
    }

    // 提交拒绝
    const submitReject = async () => {
        try {
            await rejectFormRef.value.validate()
            submitting.value = true

            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await reviewEnrollment(
                currentEnrollment.value.id,
                teacherId,
                'rejected',
                rejectForm.reason
            )

            if (response.success) {
                ElMessage.success('已拒绝报名申请')
                currentEnrollment.value.status = 'rejected'
                currentEnrollment.value.reviewTime = new Date().toISOString()
                currentEnrollment.value.rejectReason = rejectForm.reason
                rejectDialogVisible.value = false
            } else {
                ElMessage.error(response.message || '操作失败')
            }
        } catch (error) {
            if (error.errors) return
            console.error('拒绝报名失败:', error)
            ElMessage.error('操作失败')
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

    // 移除学生（退课）
    const handleRemoveStudent = async (enrollment) => {
        try {
            await ElMessageBox.confirm(
                `确定要将学生"${enrollment.studentName}"从课程中移除吗？`,
                '确认移除',
                {
                    confirmButtonText: '确定移除',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const response = await cancelEnrollment(enrollment.id)
            if (response.success) {
                ElMessage.success('移除成功')
                loadEnrollments()
            } else {
                ElMessage.error(response.message || '移除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('移除学生失败:', error)
                ElMessage.error('操作失败')
            }
        }
    }

    // 邀请学生相关
    const inviteDialogVisible = ref(false)
    const inviteSubmitting = ref(false)
    const inviteFormRef = ref()
    const inviteForm = reactive({
        courseId: '',
        studentId: ''
    })
    const inviteRules = {
        courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
        studentId: [{ required: true, message: '请输入学生ID', trigger: 'blur' }]
    }

    const submitInvite = async () => {
        try {
            await inviteFormRef.value.validate()
            inviteSubmitting.value = true

            // 使用新加的API
            const response = await directEnroll(inviteForm.studentId, inviteForm.courseId)

            if (response.success) {
                ElMessage.success('邀请成功')
                inviteDialogVisible.value = false
                inviteForm.studentId = ''
                loadEnrollments()
            } else {
                ElMessage.error(response.message || '邀请失败')
            }
        } catch (error) {
            console.error('邀请失败:', error)
            ElMessage.error('操作失败')
        } finally {
            inviteSubmitting.value = false
        }
    }

    // 获取状态文本
    const getStatusText = (status) => {
        const texts = {
            pending: '待审核',
            approved: '已入班',
            rejected: '已拒绝'
        }
        return texts[status] || '未知'
    }

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '-'
        try {
            const date = new Date(dateString)
            return date.toLocaleString('zh-CN')
        } catch {
            return '-'
        }
    }

    // 获取学生头像URL
    const getStudentAvatar = (student) => {
        if (!student.studentAvatar) return ''
        if (student.studentAvatar.startsWith('http')) return student.studentAvatar
        return `http://localhost:8088${student.studentAvatar}`
    }

    // 获取学生名字首字母
    const getStudentInitial = (student) => {
        if (student.studentName && student.studentName.length > 0) {
            return student.studentName.charAt(0)
        }
        return 'S'
    }

    onMounted(async () => {
        await loadCourses()
        loadEnrollments()
    })

    return {
        loading,
        submitting,
        rejectDialogVisible,
        courses,
        enrollments,
        filteredEnrollments,
        paginatedEnrollments,
        selectedCourseId,
        currentStatus,
        currentPage,
        pageSize,
        statistics,
        currentEnrollment,
        rejectForm,
        rejectRules,
        rejectFormRef,
        loadEnrollments,
        filterEnrollments,
        handlePageChange,
        handleSizeChange,
        handleApprove,
        handleReject,
        submitReject,
        getStatusType,
        getStatusText,
        formatDate,
        searchKeyword,
        formatTimeAgo,
        inviteDialogVisible,
        inviteForm,
        inviteRules,
        inviteFormRef,
        inviteSubmitting,
        submitInvite,
        handleRemoveStudent,
        getStudentAvatar,
        getStudentInitial
    }
}
