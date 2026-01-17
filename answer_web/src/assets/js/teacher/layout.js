import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '@/stores/teacher.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUnreadCount } from '@/api/message.js'

export function useTeacherLayout() {
    const route = useRoute()
    const router = useRouter()
    const teacherStore = useTeacherStore()

    const currentRouteName = computed(() => route.meta.title || '主页')
    const showQuickCreate = computed(() => route.path === '/teacher/dashboard' || route.path === '/teacher/courses')

    const menuItems = [
        { path: '/teacher/dashboard', label: '主页', icon: 'Odometer' },
        { path: '/teacher/courses', label: '课程中心', icon: 'Reading' },
        { path: '/teacher/exams', label: '考试管理', icon: 'Collection' },
        { path: '/teacher/homework', label: '作业管理', icon: 'EditPen' },
        { path: '/teacher/questions', label: '题库', icon: 'List' },
        { path: '/teacher/enrollments', label: '报名管理', icon: 'User' },
    ]

    const isActive = (path) => {
        return route.path.startsWith(path)
    }

    const navigate = (path) => {
        router.push(path)
    }

    const handleUserCommand = (command) => {
        if (command === 'logout') {
            ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                teacherStore.clearTeacherInfo()
                ElMessage.success('已退出登录')
                router.push('/')
            })
        } else if (command === 'profile') {
            router.push('/teacher/profile')
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const teacherId = teacherStore.teacherId
            if (!teacherId) return
            const res = await getUnreadCount(teacherId)
            if (res.code === 200) {
                teacherStore.setUnreadCount(res.data.unreadCount)
            }
        } catch (error) {
            console.error('Fetch unread count failed', error)
        }
    }

    onMounted(() => {
        if (teacherStore.isLoggedIn) {
            fetchUnreadCount()
        }
    })

    return {
        teacherStore,
        menuItems,
        isActive,
        navigate,
        handleUserCommand,
        fetchUnreadCount,
        currentRouteName,
        showQuickCreate
    }
}
