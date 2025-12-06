import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { getStudentLabReports } from '@/api/homework.js'

export function useStudentDashboard() {
    const router = useRouter()
    const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
    const searchQuery = ref('')
    const currentDate = ref(new Date())

    // 状态
    const courses = ref([])
    const todoList = ref([])
    const activities = ref([])
    const loading = ref(false)

    // 模拟数据 - 真实环境中应从API获取
    const mockActivities = [
        {
            id: 1,
            content: '完成了 "Vue.js 基础" 的第一章测验',
            timestamp: '2023-11-20 14:30',
            type: 'exam',
            color: '#67c23a'
        },
        {
            id: 2,
            content: '提交了 "Web 前端开发" 的实验报告',
            timestamp: '2023-11-19 16:20',
            type: 'homework',
            color: '#409EFF'
        },
        {
            id: 3,
            content: '加入了课程 "计算机网络"',
            timestamp: '2023-11-18 09:15',
            type: 'course',
            color: '#e6a23c'
        }
    ]

    const mockTodos = [
        {
            id: 1,
            title: '完成 Vue.js 组件通信作业',
            deadline: '2023-11-25',
            urgent: true,
            type: 'homework'
        },
        {
            id: 2,
            title: '计算机网络期中考试',
            deadline: '2023-11-28',
            urgent: false,
            type: 'exam'
        },
        {
            id: 3,
            title: '阅读 React Hooks 文档',
            deadline: '2023-11-30',
            urgent: false,
            type: 'study'
        }
    ]

    // 方法
    const loadDashboardData = async () => {
        loading.value = true
        try {
            // 获取最近3条已发布的课程
            const courseRes = await getCourseList({ 
                pageNumber: 1, 
                pageSize: 100 // 先获取所有课程
            })
            
            if (courseRes.success && courseRes.data) {
                // 筛选已发布的课程 (state === 1)，按创建时间倒序排序，取前3条
                const publishedCourses = courseRes.data.list
                    .filter(course => course.state === 1) // 只显示已发布的课程
                    .sort((a, b) => {
                        // 按创建时间倒序排序（最新的在前）
                        const dateA = new Date(a.createTime || 0)
                        const dateB = new Date(b.createTime || 0)
                        return dateB - dateA
                    })
                    .slice(0, 3) // 只取前3条
                    .map(course => ({
                        ...course,
                        // 处理图片URL
                        image: course.image ? 
                            (course.image.startsWith('http') ? course.image : `http://localhost:8088${course.image}`) 
                            : 'https://via.placeholder.com/300x200?text=Course',
                        progress: Math.floor(Math.random() * 100), // 模拟进度
                        lastStudy: '2小时前'
                    }))
                
                courses.value = publishedCourses
            }

            // 获取待办事项 (模拟)
            todoList.value = mockTodos

            // 获取最近活动 (模拟)
            activities.value = mockActivities

        } catch (error) {
            console.error('获取仪表盘数据失败:', error)
            ElMessage.error('加载数据失败')
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        if (searchQuery.value) {
            router.push({
                path: '/student/courses',
                query: { keyword: searchQuery.value }
            })
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
        courses,
        todoList,
        activities,
        loading,
        handleSearch,
        continueLearning,
        viewAllCourses
    }
}
