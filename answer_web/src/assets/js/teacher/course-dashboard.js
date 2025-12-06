import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseStats, getCourseList } from '@/api/course.js'

export function useCourseDashboard() {
    const router = useRouter()

    // 状态
    const stats = ref({
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        totalChapters: 0,
        totalStudents: 0,
        activeStudents: 0,
        completedStudents: 0,
        newCoursesThisMonth: 0
    })
    const recentCourses = ref([])
    const loadingCourses = ref(false)

    // 计算属性
    const activeCoursesPercent = computed(() => {
        if (stats.value.totalCourses === 0) return 0
        return Math.round((stats.value.activeCourses / stats.value.totalCourses) * 100)
    })

    const avgChaptersPerCourse = computed(() => {
        if (stats.value.totalCourses === 0) return 0
        return Math.round(stats.value.totalChapters / stats.value.totalCourses)
    })

    const avgStudentsPerCourse = computed(() => {
        if (stats.value.totalCourses === 0) return 0
        return Math.round(stats.value.totalStudents / stats.value.totalCourses)
    })

    // 方法
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

    const loadRecentCourses = async () => {
        try {
            loadingCourses.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            if (!teacherId) {
                ElMessage.warning('请先登录')
                router.push('/login')
                return
            }

            const response = await getCourseList({
                pageNumber: 1,
                pageSize: 5,
                teacherId: teacherId
            })

            if (response.success && response.data) {
                recentCourses.value = response.data.list || []
            }
        } catch (error) {
            console.error('获取课程列表失败:', error)
            ElMessage.error('获取课程列表失败')
        } finally {
            loadingCourses.value = false
        }
    }

    // 操作方法
    const createCourse = () => {
        router.push('/teacher/course/create')
    }

    const manageCourses = () => {
        router.push('/teacher/courses')
    }

    const viewAnalytics = () => {
        router.push('/teacher/analytics')
    }

    const viewCourse = (course) => {
        router.push(`/teacher/course/${course.id}`)
    }

    const editCourse = (course) => {
        router.push(`/teacher/course/edit/${course.id}`)
    }

    onMounted(() => {
        loadStats()
        loadRecentCourses()
    })

    return {
        stats,
        recentCourses,
        loadingCourses,
        activeCoursesPercent,
        avgChaptersPerCourse,
        avgStudentsPerCourse,
        loadStats,
        loadRecentCourses,
        createCourse,
        manageCourses,
        viewAnalytics,
        viewCourse,
        editCourse
    }
}
