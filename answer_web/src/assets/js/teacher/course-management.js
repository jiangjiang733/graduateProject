import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList, searchCourses, deleteCourse, toggleCourseState, getCourseStats } from '@/api/course.js'
import { getCourseSchedules } from '@/api/schedule.js'

export function useCourseManagement() {
    const router = useRouter()
    const courses = ref([])
    const allCourses = ref([])
    const loading = ref(false)
    const searchKeyword = ref('')
    const currentFilter = ref('all')
    const stats = ref({
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        totalChapters: 0,
        totalStudents: 0
    })

    const PAGE_SIZE_STORAGE_KEY = 'teacher_course_page_size'
    const PAGE_CURRENT_STORAGE_KEY = 'teacher_course_current_page'

    const getSavedPageSize = () => {
        const saved = localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
        if (saved && [4, 8, 12, 16, 20].includes(parseInt(saved))) return parseInt(saved)
        return 8
    }

    const getSavedCurrentPage = () => {
        const saved = sessionStorage.getItem(PAGE_CURRENT_STORAGE_KEY)
        if (saved) return parseInt(saved) || 1
        return 1
    }

    const pagination = ref({
        currentPage: getSavedCurrentPage(),
        pageSize: getSavedPageSize(),
        total: 0
    })

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

    // 获取课程列表（含 studentCount 来自后端 num 字段）
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
                pageSize: 1000,
                teacherId
            })

            if (response.success && response.data) {
                allCourses.value = (response.data.list || []).map(c => ({
                    ...c,
                    studentCount: c.num ?? c.studentCount ?? null,
                    schedules: []
                }))
                applyFilterAndPagination()
                loadAllCourseSchedules()
            } else {
                allCourses.value = []
                courses.value = []
                pagination.value.total = 0
            }

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

    // 应用过滤 + 分页
    const applyFilterAndPagination = () => {
        let filtered = allCourses.value

        if (currentFilter.value === 'draft') {
            filtered = allCourses.value.filter(c => c.state === 0)
        } else if (currentFilter.value === 'publish') {
            filtered = allCourses.value.filter(c => c.state === 1)
        }

        // 同步统计数据（从本地 allCourses 计算）
        if (!stats.value.totalCourses) {
            stats.value.totalCourses = allCourses.value.length
            stats.value.activeCourses = allCourses.value.filter(c => c.state === 1).length
            stats.value.draftCourses = allCourses.value.filter(c => c.state === 0).length
        }

        pagination.value.total = filtered.length
        const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
        courses.value = filtered.slice(start, start + pagination.value.pageSize)
    }

    const handleFilterChange = (filter) => {
        currentFilter.value = filter
        pagination.value.currentPage = 1
        sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, '1')
        applyFilterAndPagination()
    }

    const handlePageChange = (page) => {
        pagination.value.currentPage = page
        sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, page.toString())
        applyFilterAndPagination()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSizeChange = (size) => {
        pagination.value.pageSize = size
        pagination.value.currentPage = 1
        localStorage.setItem(PAGE_SIZE_STORAGE_KEY, size.toString())
        sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, '1')
        applyFilterAndPagination()
    }

    // 搜索（关键词为空时自动显示全部）
    const handleSearch = async () => {
        if (!searchKeyword.value.trim()) {
            pagination.value.currentPage = 1
            sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, '1')
            applyFilterAndPagination()
            return
        }

        try {
            loading.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await searchCourses({
                keyword: searchKeyword.value,
                filterType: 'MY',
                teacherId
            })

            if (response.success && response.data) {
                allCourses.value = (response.data || []).map(c => ({
                    ...c,
                    studentCount: c.num ?? c.studentCount ?? null,
                    schedules: []
                }))
                pagination.value.currentPage = 1
                sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, '1')
                applyFilterAndPagination()
                loadAllCourseSchedules()
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

    // 清空搜索 → 自动显示全部
    const handleClearSearch = () => {
        searchKeyword.value = ''
        pagination.value.currentPage = 1
        sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, '1')
        loadCourses()
    }

    const getCourseImage = (image) => {
        if (!image) return ''
        if (image.startsWith('http')) return image
        return `http://localhost:8088${image}`
    }

    const getCourseStatus = (course) => {
        if (course.state === 0) return { text: '草稿', class: 'draft' }
        const now = new Date()
        const start = course.startTime ? new Date(course.startTime) : null
        const end = course.endTime ? new Date(course.endTime) : null
        if (end && now > end) return { text: '已结束', class: 'ended' }
        if (start && now < start) return { text: '未开始', class: 'pending' }
        return { text: '进行中', class: 'active' }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const loadAllCourseSchedules = async () => {
        const courseIds = allCourses.value.map(c => c.id).filter(Boolean)
        if (courseIds.length === 0) return
        try {
            const promises = courseIds.map(id => getCourseSchedules(id).catch(() => ({ success: false, data: [] })))
            const results = await Promise.all(promises)
            results.forEach((response, index) => {
                if (response.success && response.data) {
                    const course = allCourses.value.find(c => c.id === courseIds[index])
                    if (course) {
                        course.schedules = response.data || []
                    }
                }
            })
            applyFilterAndPagination()
        } catch (error) {
            console.error('加载排课信息失败:', error)
        }
    }

    // 进入课堂（课程详情页）
    const viewCourseDetail = (course) => {
        router.push(`/teacher/course/${course.id}`)
    }

    // 进入课堂（学习页面）
    const goClassroom = (course) => {
        router.push(`/teacher/course/${course.id}/learn`)
    }

    // 编辑课程
    const editCourse = (course) => {
        router.push(`/teacher/course/edit/${course.id}`)
    }

    // 创建课程
    const createCourse = () => {
        router.push('/teacher/course/create')
    }

    // 处理下拉菜单命令
    const handleDropdownCommand = async (command, course) => {
        switch (command) {
            case 'edit':
                editCourse(course)
                break
            case 'view':
                goClassroom(course)
                break
            case 'toggle-state':
                await handleToggleState(course)
                break
            case 'copy-code':
                await handleCopyCode(course)
                break
            case 'delete':
                await handleDeleteCourse(course)
                break
        }
    }

    const handleToggleState = async (course) => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) { ElMessage.error('未找到教师ID，请重新登录'); return }

            const newState = course.state === 1 ? 0 : 1
            const response = await toggleCourseState(course.id, teacherId, newState)

            if (response.success) {
                course.state = newState
                const courseInAll = allCourses.value.find(c => c.id === course.id)
                if (courseInAll) courseInAll.state = newState

                // 重置本地统计
                stats.value.activeCourses = allCourses.value.filter(c => c.state === 1).length
                stats.value.draftCourses = allCourses.value.filter(c => c.state === 0).length

                applyFilterAndPagination()
                if (courses.value.length === 0 && pagination.value.currentPage > 1) {
                    pagination.value.currentPage -= 1
                    sessionStorage.setItem(PAGE_CURRENT_STORAGE_KEY, pagination.value.currentPage.toString())
                    applyFilterAndPagination()
                }
                ElMessage.success(newState === 1 ? '课程已发布' : '课程已设为草稿')
            } else {
                ElMessage.error(response.message || '状态更新失败')
            }
        } catch (error) {
            ElMessage.error('状态更新失败')
        }
    }

    const handleCopyCode = async (course) => {
        if (!course.courseCode) { ElMessage.warning('该课程暂未设置课程码'); return }
        try {
            await navigator.clipboard.writeText(course.courseCode)
            ElMessage.success('课程码已复制到剪贴板')
        } catch {
            const ta = document.createElement('textarea')
            ta.value = course.courseCode
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
            ElMessage.success('课程码已复制到剪贴板')
        }
    }

    const handleDeleteCourse = async (course) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除课程"${course.courseName || course.name}"吗？此操作不可恢复。`,
                '删除确认',
                { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
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

    onMounted(() => { loadCourses() })

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
        handleClearSearch,
        handleFilterChange,
        handlePageChange,
        handleSizeChange,
        getCourseImage,
        getCourseStatus,
        formatDate,
        viewCourseDetail,
        goClassroom,
        editCourse,
        createCourse,
        handleDropdownCommand,
    }
}
