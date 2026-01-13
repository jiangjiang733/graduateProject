import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
    getTeacherList,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    batchDeleteTeachers,
    resetTeacherPassword,
    type Teacher
} from '@/api/user'

export function useTeacherManagement() {
    const loading = ref(false)
    const submitting = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref<FormInstance>()
    const teachers = ref<Teacher[]>([])
    const selectedIds = ref<number[]>([])
    const visiblePasswords = reactive<Record<string, boolean>>({})

    const searchForm = reactive({
        keyword: ''
    })

    const pagination = reactive({
        pageNumber: 1,
        pageSize: 10,
        total: 0
    })

    const form = reactive({
        teacherId: '',
        teacherUsername: '',
        teacherEmail: '',
        teacherPhone: '',
        teacherDepartment: '',
        teacherLevel: '',
        teacherPassword: ''
    })

    const formRules: FormRules = {
        teacherId: [{ required: true, message: '请输入工号', trigger: 'blur' }],
        teacherUsername: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        teacherEmail: [
            { required: true, message: '请输入邮箱', trigger: 'blur' },
            { type: 'email', message: '格式不正确', trigger: 'blur' }
        ],
        teacherPassword: [{ required: true, message: '请设置密码', trigger: 'blur' }]
    }

    const togglePasswordVisibility = (id: string | number) => {
        visiblePasswords[id] = !visiblePasswords[id]
    }

    const loadTeachers = async () => {
        loading.value = true
        try {
            const response = await getTeacherList({
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                keyword: searchForm.keyword
            })

            if (response.code === 200 && response.data) {
                teachers.value = response.data.list || []
                pagination.total = response.data.total || 0
            }
        } catch (error) {
            console.error('加载教师列表失败:', error)
            ElMessage.error('获取教师列表失败')
        } finally {
            loading.value = false
        }
    }

    const showAddDialog = () => {
        isEdit.value = false
        resetForm()
        dialogVisible.value = true
    }

    const handleEdit = (row: Teacher) => {
        isEdit.value = true
        Object.assign(form, {
            ...row,
            teacherId: String(row.teacherId)
        })
        dialogVisible.value = true
    }

    const handleSubmit = async () => {
        if (!formRef.value) return

        await formRef.value.validate(async (valid) => {
            if (!valid) return

            submitting.value = true
            try {
                const payload = { ...form, teacherId: Number(form.teacherId) }
                if (isEdit.value) {
                    await updateTeacher(payload.teacherId, payload)
                    ElMessage.success('更新成功')
                } else {
                    await createTeacher(payload)
                    ElMessage.success('添加成功')
                }

                dialogVisible.value = false
                loadTeachers()
            } catch (error) {
                console.error('提交失败:', error)
                ElMessage.error('操作失败')
            } finally {
                submitting.value = false
            }
        })
    }

    const handleDelete = async (row: Teacher) => {
        try {
            await ElMessageBox.confirm(`确认移除教师 "${row.teacherUsername}" 吗？`, '警告', {
                confirmButtonText: '确定移除',
                cancelButtonText: '取消',
                type: 'error',
                roundButton: true
            })

            await deleteTeacher(row.teacherId!)
            ElMessage.success('删除成功')
            loadTeachers()
        } catch (error) {
            if (error !== 'cancel') console.error('删除异常:', error)
        }
    }

    const handleBatchDelete = async () => {
        try {
            await ElMessageBox.confirm('确认批量注销选中的教师账号吗？', '批量操作', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                roundButton: true
            })

            await batchDeleteTeachers(selectedIds.value)
            ElMessage.success('批量删除成功')
            selectedIds.value = []
            loadTeachers()
        } catch (error) {
            if (error !== 'cancel') console.error('批量异常:', error)
        }
    }

    const handleResetPassword = async (row: Teacher) => {
        try {
            await ElMessageBox.confirm('将密码重置为 123456？', '提示', {
                confirmButtonText: '确定',
                type: 'warning',
                roundButton: true
            })

            await resetTeacherPassword(row.teacherId!)
            ElMessage.success('密码重置成功')
        } catch (error) {
            if (error !== 'cancel') console.error('重置异常:', error)
        }
    }

    const handleSelectionChange = (selection: Teacher[]) => {
        selectedIds.value = selection.map(item => item.teacherId!)
    }

    const resetForm = () => {
        Object.assign(form, {
            teacherId: '',
            teacherUsername: '',
            teacherEmail: '',
            teacherPhone: '',
            teacherDepartment: '',
            teacherLevel: '',
            teacherPassword: ''
        })
        formRef.value?.clearValidate()
    }

    return {
        loading,
        submitting,
        dialogVisible,
        isEdit,
        formRef,
        teachers,
        selectedIds,
        visiblePasswords,
        searchForm,
        pagination,
        form,
        formRules,
        loadTeachers,
        showAddDialog,
        handleEdit,
        handleSubmit,
        handleDelete,
        handleBatchDelete,
        handleResetPassword,
        handleSelectionChange,
        togglePasswordVisibility
    }
}
