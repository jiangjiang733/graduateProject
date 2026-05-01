import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '@/stores/teacher.js'
import { useSettingsStore } from '@/stores/settings.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUnreadCount } from '@/api/message.js'
import { getChatUnreadCount } from '@/api/chat.js'
import { getProfile } from '@/api/teacher.js'
import { getTeacherEnrollments } from '@/api/enrollment.js'

export function useTeacherLayout() {
    const route = useRoute()
    const router = useRouter()
    const teacherStore = useTeacherStore()
    const settingsStore = useSettingsStore()

    const currentRouteName = computed(() => route.meta.title || '主页')
    const showQuickCreate = computed(() => route.path === '/teacher/dashboard' || route.path === '/teacher/courses')

    const menuItems = [
        { path: '/teacher/dashboard', label: '主页', icon: 'HomeFilled' },
        { path: '/teacher/courses', label: '课程中心', icon: 'Reading' },
        { path: '/teacher/exams', label: '考试管理', icon: 'Collection' },
        { path: '/teacher/homework', label: '作业管理', icon: 'EditPen' },
        { path: '/teacher/questions', label: '题库', icon: 'List' },
        { path: '/teacher/messages', label: '消息中心', icon: 'Bell' },
        { path: '/teacher/profile', label: '个人中心', icon: 'UserFilled' },
        // { path: '', label: '智能助手', icon: 'UserFilled' },
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
                // 重置主题为默认亮色
                settingsStore.resetToDefault()
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
            
            const teacherType = 'TEACHER'
            let totalUnread = 0

            const [chatRes, sysRes, enrollRes] = await Promise.all([
                getChatUnreadCount(teacherType.toLowerCase(), teacherId),
                getUnreadCount(teacherId, teacherType),
                getTeacherEnrollments(teacherId)
            ])

            if (chatRes && chatRes.code === 200) {
                totalUnread += chatRes.data
            }

            if (sysRes && sysRes.code === 200) {
                totalUnread += sysRes.data.unreadCount || 0
            }

            if (enrollRes && enrollRes.success && enrollRes.data) {
                const pendingCount = enrollRes.data.filter(e => e.status === 'pending' && e.enrollmentType !== 'INVITE').length
                totalUnread += pendingCount
            }

            teacherStore.setUnreadCount(totalUnread)
        } catch (error) {
            console.error('Fetch unread count failed', error)
        }
    }

    const fetchProfile = async () => {
        try {
            const teacherId = teacherStore.teacherId
            if (!teacherId) return
            const res = await getProfile(teacherId)
            // 增加更严谨的校验，确保 res 存在且包含 data
            if (res && res.data && (res.code === 200 || res.success)) {
                // 更新 store 中的教师信息
                teacherStore.setTeacherInfo(res.data)
                console.log('Teacher profile synced:', res.data)
            }
        } catch (error) {
            console.error('Fetch profile failed:', error)
        }
    }

    let unreadTimer = null

    onMounted(async () => {
        // 注意: initSettings() 已由 App.vue 在 onMounted 中调用
        // 这里只刷新当前用户的设置，避免重复初始化
        settingsStore.refreshForCurrentUser()

        // 初始化时加载必要数据，避免需要多次刷新
        if (teacherStore.teacherId) {
            console.log('[TeacherLayout] 加载教师数据，ID:', teacherStore.teacherId)
            // 并行加载教师信息和未读消息，提高加载效率
            await Promise.all([
                fetchProfile(),
                fetchUnreadCount()
            ])

            // 每 5 秒刷新一次侧边栏未读数量
            unreadTimer = setInterval(() => {
                fetchUnreadCount()
            }, 5000)
        } else {
            console.warn('[TeacherLayout] teacherId 不存在，跳过数据加载')
        }
    })

    onUnmounted(() => {
        if (unreadTimer) {
            clearInterval(unreadTimer)
        }
    })

    return {
        teacherStore,
        settingsStore,
        menuItems,
        isActive,
        navigate,
        handleUserCommand,
        fetchUnreadCount,
        currentRouteName,
        showQuickCreate
    }
}
