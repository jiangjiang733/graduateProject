import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseEnrollments, cancelEnrollment, directEnroll } from '@/api/enrollment.js'

export function useCourseStudents(props) {
    const loading = ref(false)
    const students = ref([])
    const inviteDialogVisible = ref(false)
    const inviteSubmitting = ref(false)
    const inviteFormRef = ref()

    // 搜索和分页状态
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(12)

    const inviteForm = reactive({
        studentId: ''
    })

    const inviteRules = {
        studentId: [
            { required: true, message: '请输入学生ID', trigger: 'blur' }
        ]
    }

    // 过滤后的学生列表
    const filteredStudents = computed(() => {
        if (!searchQuery.value) return students.value
        const query = searchQuery.value.toLowerCase()
        return students.value.filter(s =>
            (s.studentName && s.studentName.toLowerCase().includes(query)) ||
            (s.studentId && s.studentId.toString().includes(query))
        )
    })

    // 分页后的学生列表
    const pagedStudents = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return filteredStudents.value.slice(start, end)
    })

    const handleSizeChange = (val) => {
        pageSize.value = val
        currentPage.value = 1
    }

    const handleCurrentChange = (val) => {
        currentPage.value = val
    }

    // 获取学生列表
    const fetchStudents = async () => {
        if (!props.courseId) return
        loading.value = true
        try {
            const response = await getCourseEnrollments(props.courseId)
            if (response.success) {
                students.value = (response.data || []).filter(item => item.status === 'approved')
            } else {
                students.value = []
            }
        } catch (error) {
            console.error('获取学生列表失败', error)
            ElMessage.error('无法加载学生列表')
        } finally {
            loading.value = false
        }
    }

    // 移除学生
    const handleRemove = async (student) => {
        try {
            await ElMessageBox.confirm(
                `确定要将学生 "${student.studentName}" 从本课程中移除吗？`,
                '确认移除',
                {
                    confirmButtonText: '移除',
                    cancelButtonText: '取消',
                    type: 'warning',
                    icon: 'Warning'
                }
            )

            const response = await cancelEnrollment(student.id)
            if (response.success) {
                ElMessage.success('移除成功')
                fetchStudents()
            } else {
                ElMessage.error(response.message || '移除失败')
            }
        } catch (e) {
            if (e !== 'cancel') {
                ElMessage.error('操作失败')
            }
        }
    }

    // 邀请学生
    const submitInvite = async () => {
        if (!inviteFormRef.value) return
        await inviteFormRef.value.validate(async (valid) => {
            if (valid) {
                inviteSubmitting.value = true
                try {
                    const response = await directEnroll(inviteForm.studentId, props.courseId)
                    if (response.success) {
                        ElMessage.success('邀请成功')
                        inviteDialogVisible.value = false
                        inviteForm.studentId = ''
                        fetchStudents()
                    } else {
                        ElMessage.error(response.message || '邀请失败')
                    }
                } catch (error) {
                    ElMessage.error('操作异常')
                } finally {
                    inviteSubmitting.value = false
                }
            }
        })
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString()
    }

    const getStudentAvatar = (student) => {
        if (!student.studentAvatar) return ''
        if (student.studentAvatar.startsWith('http')) return student.studentAvatar
        return `http://localhost:8088${student.studentAvatar}`
    }

    const getStudentInitial = (student) => {
        if (student.studentName && student.studentName.length > 0) {
            return student.studentName.charAt(0)
        }
        return 'S'
    }

    onMounted(() => {
        fetchStudents()
    })

    return {
        loading,
        students,
        inviteDialogVisible,
        inviteSubmitting,
        inviteFormRef,
        searchQuery,
        currentPage,
        pageSize,
        inviteForm,
        inviteRules,
        filteredStudents,
        pagedStudents,
        handleSizeChange,
        handleCurrentChange,
        fetchStudents,
        handleRemove,
        submitInvite,
        formatDate,
        getStudentAvatar,
        getStudentInitial
    }
}
