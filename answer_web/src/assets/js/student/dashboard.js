import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStudentJoinedCourses } from '@/api/course.js'

export function useStudentDashboard() {
    const router = useRouter()

    // 安全获取用户信息
    const getUserInfo = () => {
        try {
            const student = localStorage.getItem('student')
            if (student) return JSON.parse(student)
            const userInfo = localStorage.getItem('userInfo')
            if (userInfo) return JSON.parse(userInfo)
            const user = localStorage.getItem('user')
            if (user) {
                const parsed = JSON.parse(user)
                return typeof parsed === 'object' ? parsed : { username: parsed }
            }
        } catch (e) {
            console.warn('解析用户信息失败:', e)
        }
        return {}
    }

    const userInfo = ref(getUserInfo())
    const searchQuery = ref('')
    const currentDate = ref(new Date())

    // 状态
    const allJoinedCourses = ref([])
    const todoList = ref([])
    const activities = ref([])
    const loading = ref(false)

    // 计算属性：只显示前2个课程用于展示卡片
    const displayCourses = computed(() => {
        if (!Array.isArray(allJoinedCourses.value)) return []
        return allJoinedCourses.value.slice(0, 2)
    })

    // 模拟数据
    const mockActivities = [
        { id: 1, content: '开始了新的学习计划', timestamp: '刚刚', type: 'system', color: '#6366f1' },
        { id: 2, content: '完成了第一阶段课程', timestamp: '1天前', type: 'course', color: '#10b981' }
    ]

    const mockTodos = [
        { id: 1, title: '完善个人资料', deadline: '2026-12-31', type: 'system' }
    ]

    // 方法
    const loadDashboardData = async () => {
        // 尝试从多个字段获取学生ID
        const studentId = userInfo.value.studentsId ||
            userInfo.value.studentId ||
            localStorage.getItem('s_id') ||
            localStorage.getItem('studentId')

        if (!studentId) {
            console.warn('未找到学生ID，无法加载课程数据')
            return
        }

        loading.value = true
        try {
            const courseRes = await getStudentJoinedCourses(studentId)
            if (courseRes && courseRes.success && Array.isArray(courseRes.data)) {
                allJoinedCourses.value = courseRes.data.map(course => ({
                    id: course.courseId || course.id,
                    courseName: course.courseName || '未命名课程',
                    teacherName: course.teacherName || '教师',
                    classification: course.classification || '综合',
                    image: course.courseImage ?
                        (course.courseImage.startsWith('http') ? course.courseImage : `http://localhost:8088${course.courseImage}`)
                        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
                    progress: course.progress || 0
                }))
            }
            todoList.value = mockTodos
            activities.value = mockActivities
        } catch (error) {
            console.error('获取仪表盘数据失败:', error)
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        if (searchQuery.value) {
            router.push({ path: '/student/courses', query: { keyword: searchQuery.value } })
        }
    }

    const continueLearning = (courseId) => {
        router.push(`/student/learn/${courseId}`)
    }

    const viewAllCourses = () => {
        router.push('/student/courses')
    }

    onMounted(() => {
        loadDashboardData()
    })

    return {
        userInfo,
        searchQuery,
        currentDate,
        courses: displayCourses,
        allCourses: allJoinedCourses,
        todoList,
        activities,
        loading,
        handleSearch,
        continueLearning,
        viewAllCourses
    }
}
