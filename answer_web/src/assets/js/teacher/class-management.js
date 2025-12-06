import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { 
  createClass, 
  getClassesByCourseId, 
  getClassStudents, 
  removeStudent,
  updateClass,
  deleteClass,
  getStudentProgress
} from '@/api/class.js'

export function useClassManagement() {
    const loading = ref(false)
    const dialogVisible = ref(false)
    const studentsDialogVisible = ref(false)
    const progressDialogVisible = ref(false)
    const submitting = ref(false)
    const studentsLoading = ref(false)
    const progressLoading = ref(false)
    const formRef = ref()
    const isEditMode = ref(false)
    const editingClassId = ref(null)

    const courses = ref([])
    const classes = ref([])
    const students = ref([])
    const studentProgress = ref(null)
    const selectedCourseId = ref('')
    const currentClass = ref(null)

    // 分页相关状态
    const pagination = reactive({
        currentPage: 1,
        pageSize: 12,
        total: 0
    })

    // 学生列表分页
    const studentPagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    const classForm = reactive({
        className: '',
        courseId: '',
        description: '',
        maxStudents: 50
    })

    const rules = {
        className: [
            { required: true, message: '请输入班级名称', trigger: 'blur' },
            { min: 2, max: 50, message: '班级名称长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        courseId: [
            { required: true, message: '请选择课程', trigger: 'change' }
        ],
        maxStudents: [
            { type: 'number', min: 1, max: 500, message: '学生人数限制在 1 到 500 之间', trigger: 'blur' }
        ]
    }

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

    // 加载班级列表
    const loadClasses = async () => {
        if (!selectedCourseId.value) {
            classes.value = []
            pagination.total = 0
            return
        }

        loading.value = true
        try {
            const response = await getClassesByCourseId(selectedCourseId.value)
            if (response.success) {
                const allClasses = response.data || []
                pagination.total = allClasses.length
                
                // 前端分页处理
                const start = (pagination.currentPage - 1) * pagination.pageSize
                const end = start + pagination.pageSize
                classes.value = allClasses.slice(start, end)
            }
        } catch (error) {
            console.error('加载班级列表失败:', error)
            ElMessage.error('加载班级列表失败')
        } finally {
            loading.value = false
        }
    }

    // 处理班级列表分页变化
    const handlePageChange = (page) => {
        pagination.currentPage = page
        loadClasses()
    }

    // 处理每页显示数量变化
    const handleSizeChange = (size) => {
        pagination.pageSize = size
        pagination.currentPage = 1
        loadClasses()
    }

    // 显示创建对话框
    const showCreateDialog = () => {
        isEditMode.value = false
        editingClassId.value = null
        Object.assign(classForm, {
            className: '',
            courseId: selectedCourseId.value || '',
            description: '',
            maxStudents: 50
        })
        dialogVisible.value = true
    }

    // 显示编辑对话框
    const showEditDialog = (classItem) => {
        isEditMode.value = true
        editingClassId.value = classItem.classId
        Object.assign(classForm, {
            className: classItem.className,
            courseId: classItem.courseId,
            description: classItem.description || '',
            maxStudents: classItem.maxStudents || 50
        })
        dialogVisible.value = true
    }

    // 提交创建/编辑班级
    const submitClass = async () => {
        try {
            await formRef.value.validate()
            submitting.value = true

            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const data = {
                ...classForm,
                teacherId: teacherId
            }

            let response
            if (isEditMode.value) {
                response = await updateClass(editingClassId.value, data)
                if (response.success) {
                    ElMessage.success('班级更新成功')
                }
            } else {
                response = await createClass(data)
                if (response.success) {
                    ElMessage.success({
                        message: `班级创建成功！班级码：${response.data.classCode}`,
                        duration: 5000
                    })
                }
            }

            if (response.success) {
                dialogVisible.value = false
                if (selectedCourseId.value === classForm.courseId) {
                    loadClasses()
                }
            }
        } catch (error) {
            if (error.errors) return
            console.error('操作失败:', error)
            ElMessage.error(isEditMode.value ? '更新班级失败' : '创建班级失败')
        } finally {
            submitting.value = false
        }
    }

    // 删除班级
    const handleDeleteClass = async (classItem) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除班级"${classItem.className}"吗？删除后将无法恢复，班级内的所有学生关系也将被清除。`,
                '删除确认',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                    confirmButtonClass: 'el-button--danger'
                }
            )

            const response = await deleteClass(classItem.classId)
            if (response.success) {
                ElMessage.success('班级删除成功')
                loadClasses()
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除班级失败:', error)
                ElMessage.error('删除班级失败')
            }
        }
    }

    // 复制班级码
    const copyClassCode = async (classCode) => {
        try {
            await navigator.clipboard.writeText(classCode)
            ElMessage.success('班级码已复制到剪贴板')
        } catch (error) {
            console.error('复制失败:', error)
            ElMessage.error('复制失败，请手动复制')
        }
    }

    // 查看学生
    const viewStudents = async (classItem) => {
        currentClass.value = classItem
        studentsDialogVisible.value = true
        studentsLoading.value = true
        studentPagination.currentPage = 1

        try {
            const response = await getClassStudents(classItem.classId)
            if (response.success) {
                const allStudents = response.data || []
                studentPagination.total = allStudents.length
                
                // 前端分页处理
                const start = (studentPagination.currentPage - 1) * studentPagination.pageSize
                const end = start + studentPagination.pageSize
                students.value = allStudents.slice(start, end)
                
                // 保存完整学生列表用于分页
                currentClass.value.allStudents = allStudents
            }
        } catch (error) {
            console.error('加载学生列表失败:', error)
            ElMessage.error('加载学生列表失败')
        } finally {
            studentsLoading.value = false
        }
    }

    // 处理学生列表分页变化
    const handleStudentPageChange = (page) => {
        studentPagination.currentPage = page
        
        if (currentClass.value && currentClass.value.allStudents) {
            const start = (page - 1) * studentPagination.pageSize
            const end = start + studentPagination.pageSize
            students.value = currentClass.value.allStudents.slice(start, end)
        }
    }

    // 处理学生列表每页显示数量变化
    const handleStudentSizeChange = (size) => {
        studentPagination.pageSize = size
        studentPagination.currentPage = 1
        
        if (currentClass.value && currentClass.value.allStudents) {
            const start = 0
            const end = size
            students.value = currentClass.value.allStudents.slice(start, end)
        }
    }

    // 管理学生
    const manageStudents = (classItem) => {
        viewStudents(classItem)
    }

    // 移除学生
    const removeStudentFromClass = async (student) => {
        try {
            await ElMessageBox.confirm(
                `确定要将学生"${student.studentsUsername}"从班级中移除吗？`,
                '移除确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const response = await removeStudent(currentClass.value.classId, student.studentId)
            if (response.success) {
                ElMessage.success('学生移除成功')
                viewStudents(currentClass.value)
                loadClasses()
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('移除学生失败:', error)
                ElMessage.error('移除学生失败')
            }
        }
    }

    // 查看学生进度
    const viewStudentProgress = async (student) => {
        if (!currentClass.value) return
        
        progressDialogVisible.value = true
        progressLoading.value = true
        studentProgress.value = null

        try {
            const response = await getStudentProgress(student.studentId, currentClass.value.courseId)
            if (response.success) {
                studentProgress.value = response.data
            }
        } catch (error) {
            console.error('加载学生进度失败:', error)
            ElMessage.error('加载学生进度失败')
        } finally {
            progressLoading.value = false
        }
    }

    onMounted(() => {
        loadCourses()
    })

    return {
        loading,
        dialogVisible,
        studentsDialogVisible,
        progressDialogVisible,
        submitting,
        studentsLoading,
        progressLoading,
        formRef,
        isEditMode,
        courses,
        classes,
        students,
        studentProgress,
        selectedCourseId,
        currentClass,
        classForm,
        rules,
        pagination,
        studentPagination,
        loadCourses,
        loadClasses,
        showCreateDialog,
        showEditDialog,
        submitClass,
        handleDeleteClass,
        copyClassCode,
        viewStudents,
        manageStudents,
        removeStudentFromClass,
        viewStudentProgress,
        handlePageChange,
        handleSizeChange,
        handleStudentPageChange,
        handleStudentSizeChange
    }
}
