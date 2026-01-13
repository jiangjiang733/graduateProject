import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
    getStudentList,
    createStudent,
    updateStudent,
    deleteStudent,
    batchDeleteStudents,
    resetStudentPassword,
    type Student
} from '@/api/user'

export function useStudentManagement() {
    const loading = ref(false)
    const submitting = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref<FormInstance>()
    const students = ref<Student[]>([])
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
        studentsId: 0,
        studentsUsername: '',
        studentsEmail: '',
        studentsMajor: '',
        studentsGrade: '',
        studentsPassword: ''
    })

    const formRules: FormRules = {
        studentsUsername: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
        studentsEmail: [
            { required: true, message: '请输入邮箱地址', trigger: 'blur' },
            { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        studentsPassword: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
    }

    const togglePasswordVisibility = (id: string | number) => {
        visiblePasswords[id] = !visiblePasswords[id]
    }

    const loadStudents = async () => {
        loading.value = true
        try {
            const response = await getStudentList({
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                keyword: searchForm.keyword
            })

            if (response.code === 200 && response.data) {
                students.value = response.data.list || []
                pagination.total = response.data.total || 0
            }
        } catch (error) {
            console.error('加载学生列表失败:', error)
            ElMessage.error('无法同步后端数据，请检查网络')
        } finally {
            loading.value = false
        }
    }

    const showAddDialog = () => {
        isEdit.value = false
        resetForm()
        dialogVisible.value = true
    }

    const handleEdit = (row: Student) => {
        isEdit.value = true
        Object.assign(form, row)
        dialogVisible.value = true
    }

    const handleSubmit = async () => {
        if (!formRef.value) return

        await formRef.value.validate(async (valid) => {
            if (!valid) return

            submitting.value = true
            try {
                if (isEdit.value) {
                    await updateStudent(form.studentsId, form)
                    ElMessage.success('学生信息已更新')
                } else {
                    await createStudent(form)
                    ElMessage.success('成功添加新学生账号')
                }

                dialogVisible.value = false
                loadStudents()
            } catch (error) {
                console.error('保存失败:', error)
                ElMessage.error('保存失败，请检查数据完整性')
            } finally {
                submitting.value = false
            }
        })
    }

    const handleDelete = async (row: Student) => {
        try {
            await ElMessageBox.confirm(`确定要注销学生 "${row.studentsUsername}" 吗？此操作不可撤销。`, '安全警告', {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'error',
                roundButton: true
            })

            await deleteStudent(row.studentsId!)
            ElMessage.success('信息已移除')
            loadStudents()
        } catch (error) {
            if (error !== 'cancel') console.error('删除操作异常:', error)
        }
    }

    const handleBatchDelete = async () => {
        try {
            await ElMessageBox.confirm(`确定要批量清除选中的 ${selectedIds.value.length} 条记录吗？`, '批量操作确认', {
                confirmButtonText: '执行删除',
                cancelButtonText: '暂不操作',
                type: 'warning',
                roundButton: true
            })

            await batchDeleteStudents(selectedIds.value)
            ElMessage.success('批量清理完成')
            selectedIds.value = []
            loadStudents()
        } catch (error) {
            if (error !== 'cancel') console.error('批量删除异常:', error)
        }
    }

    const handleResetPassword = async (row: Student) => {
        try {
            await ElMessageBox.confirm('重置后密码将恢复为系统初始密码 "123456"，是否继续？', '密码重置提示', {
                confirmButtonText: '确认重置',
                cancelButtonText: '取消',
                type: 'warning',
                roundButton: true
            })

            await resetStudentPassword(row.studentsId!)

            ElMessageBox.alert(
                `<div style="text-align: center; padding: 20px;">
          <p style="font-size: 16px; margin-bottom: 20px; font-weight: bold;">该学生密码已重置！</p>
          <div style="background: #f0fdf4; color: #15803d; font-size: 28px; font-weight: 800; padding: 20px; border-radius: 12px; font-family: monospace; letter-spacing: 4px;">123456</div>
          <p style="margin-top: 20px; color: #64748b;">请告知学生及时修改新密码</p>
        </div>`,
                '重置成功',
                { dangerouslyUseHTMLString: true, confirmButtonText: '关闭', center: true }
            )
        } catch (error) {
            if (error !== 'cancel') ElMessage.error('重置密码操作失败')
        }
    }

    const handleSelectionChange = (selection: Student[]) => {
        selectedIds.value = selection.map(item => item.studentsId!)
    }

    const resetForm = () => {
        Object.assign(form, {
            studentsId: 0,
            studentsUsername: '',
            studentsEmail: '',
            studentsMajor: '',
            studentsGrade: '',
            studentsPassword: ''
        })
        formRef.value?.clearValidate()
    }

    return {
        loading,
        submitting,
        dialogVisible,
        isEdit,
        formRef,
        students,
        selectedIds,
        visiblePasswords,
        searchForm,
        pagination,
        form,
        formRules,
        loadStudents,
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
