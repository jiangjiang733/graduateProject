import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList, searchCourses, deleteCourse, toggleCourseState, getCourseStats } from '@/api/course.js'

// 格式化日期函数
const formatDate = (dateString) => {
    if (!dateString) return '未知'
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    } catch (err) {
        return '未知'
    }
}

export function useCourseManagement() {
    const router = useRouter()
    const courses = ref([])
    const allCourses = ref([]) // 存储所有课程数据用于分页
    const loading = ref(false)
    const searchKeyword = ref('')
    const currentFilter = ref('all') // 默认显示草稿状态
    const stats = ref({
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        totalChapters: 0,
        totalStudents: 0
    })

    // 分页配置
    const pagination = ref({
        currentPage: 1,
        pageSize: 3, // 默认每页显示3条
        total: 0
    })

    // 计算属性 - 课程统计
    const activeCourses = computed(() => stats.value.activeCourses)
    const totalChapters = computed(() => stats.value.totalChapters)

    // 获取课程统计
    const loadStats = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) return

            const response = await getCourseStats(teacherId)
            if (response.success && response.data) {
                stats.value = response.data
            }
        } catch (error) {
            console.error('获取统计失败:', error)
        }
    }

    // 获取课程列表
    const loadCourses = async () => {
        try {
            loading.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            if (!teacherId) {
                ElMessage.warning('请先登录')
                router.push('/login')
                return
            }

            const response = await getCourseList({
                pageNumber: 1,
                pageSize: 1000, // 获取所有数据用于前端分页和筛选
                teacherId: teacherId
            })

            if (response.success && response.data) {
                allCourses.value = response.data.list || []
                applyFilterAndPagination()
            } else {
                allCourses.value = []
                courses.value = []
                pagination.value.total = 0
            }

            // 加载统计数据
            await loadStats()
        } catch (error) {
            console.error('获取课程列表失败:', error)
            ElMessage.error('获取课程列表失败')
            allCourses.value = []
            courses.value = []
        } finally {
            loading.value = false
        }
    }

    // 应用筛选和分页
    const applyFilterAndPagination = () => {
        let filteredCourses = allCourses.value

        // 根据状态筛选
        if (currentFilter.value === 'draft') {
            filteredCourses = allCourses.value.filter(course => course.state === 0)
        } else if (currentFilter.value === 'publish') {
            filteredCourses = allCourses.value.filter(course => course.state === 1)
        }
        // 更新总数
        pagination.value.total = filteredCourses.length

        // 前端分页
        const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
        const end = start + pagination.value.pageSize
        courses.value = filteredCourses.slice(start, end)
    }

    // 切换筛选状态
    const handleFilterChange = (filter) => {
        currentFilter.value = filter
        pagination.value.currentPage = 1 // 重置到第一页
        applyFilterAndPagination()
    }

    // 处理分页变化
    const handlePageChange = (page) => {
        pagination.value.currentPage = page
        applyFilterAndPagination()
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 处理每页显示数量变化
    const handleSizeChange = (size) => {
        pagination.value.pageSize = size
        pagination.value.currentPage = 1
        applyFilterAndPagination()
    }

    // 搜索课程
    const handleSearch = async () => {
        if (!searchKeyword.value.trim()) {
            // 清空搜索，重新加载并应用筛选
            pagination.value.currentPage = 1
            applyFilterAndPagination()
            return
        }

        try {
            loading.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            const response = await searchCourses({
                keyword: searchKeyword.value,
                filterType: 'MY',
                teacherId: teacherId
            })

            if (response.success && response.data) {
                allCourses.value = response.data
                pagination.value.currentPage = 1
                applyFilterAndPagination()
            } else {
                allCourses.value = []
                courses.value = []
                pagination.value.total = 0
            }
        } catch (error) {
            console.error('搜索课程失败:', error)
            ElMessage.error('搜索课程失败')
        } finally {
            loading.value = false
        }
    }

    // 查看课程详情
    const getCourseImage = (image) => {
        if (!image) return 'https://via.placeholder.com/400x180?text=Course'
        if (image.startsWith('http')) return image
        return `http://localhost:8088${image}`
    }

    const viewCourseDetail = (course) => {
        router.push(`/teacher/course/${course.id}`)
    }

    // 进入课程编辑
    const editCourse = (course) => {
        router.push(`/teacher/course/edit/${course.id}`)
    }

    // 创建新课程
    const createCourse = () => {
        router.push('/teacher/course/create')
    }

    // 处理下拉菜单命令
    const handleDropdownCommand = async (command, course) => {
        switch (command) {
            case 'toggle-state':
                await handleToggleState(course)
                break
            case 'copy-code':
                await handleCopyCode(course)
                break
            case 'export':
                ElMessage.info('导出功能开发中...')
                break
            case 'delete':
                await handleDeleteCourse(course)
                break
        }
    }

    // 切换课程状态
    const handleToggleState = async (course) => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            // 验证teacherId是否存在
            if (!teacherId) {
                ElMessage.error('未找到教师ID，请重新登录')
                return
            }

            const newState = course.state === 1 ? 0 : 1
            const response = await toggleCourseState(course.id, teacherId, newState)

            if (response.success) {
                // 1. 更新课程对象的状态
                course.state = newState

                // 2. 同时更新allCourses中对应的课程对象
                const courseInAll = allCourses.value.find(c => c.id === course.id)
                if (courseInAll) {
                    courseInAll.state = newState
                }

                // 3. 重新加载统计数据
                await loadStats()

                // 4. 重新应用筛选和分页
                applyFilterAndPagination()

                // 5. 如果当前页没有课程了（比如最后一条被移到其他标签），跳转到第一页
                if (courses.value.length === 0 && pagination.value.currentPage > 1) {
                    pagination.value.currentPage = 1
                    applyFilterAndPagination()
                }

                ElMessage.success(newState === 1 ? '课程已发布' : '课程已设为草稿')
            } else {
                ElMessage.error(response.message || '状态更新失败')
            }
        } catch (error) {
            console.error('状态更新失败:', error)
            ElMessage.error('状态更新失败')
        }
    }

    // 复制课程码
    const handleCopyCode = async (course) => {
        if (!course.courseCode) {
            ElMessage.warning('该课程暂未设置课程码')
            return
        }

        try {
            await navigator.clipboard.writeText(course.courseCode)
            ElMessage.success('课程码已复制到剪贴板')
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea')
            textArea.value = course.courseCode
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            ElMessage.success('课程码已复制到剪贴板')
        }
    }

    // 删除课程
    const handleDeleteCourse = async (course) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除课程"${course.courseName || course.name}"吗？此操作不可恢复。`,
                '删除确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await deleteCourse(course.id, teacherId)

            if (response.success) {
                ElMessage.success('课程删除成功')
                loadCourses()
            } else {
                ElMessage.error(response.message || '删除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除课程失败:', error)
                ElMessage.error('删除课程失败')
            }
        }
    }

    onMounted(() => {
        loadCourses()
    })

    return {
        courses,
        loading,
        searchKeyword,
        currentFilter,
        stats,
        pagination,
        activeCourses,
        totalChapters,
        handleSearch,
        handleFilterChange,
        handlePageChange,
        handleSizeChange,
        getCourseImage,
        viewCourseDetail,
        editCourse,
        createCourse,
        handleDropdownCommand,
        formatDate
    }
}
