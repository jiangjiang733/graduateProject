import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseDetail, getCourseChapters, joinCourse } from '@/api/course.js'

export function useCourseDetail() {
    const route = useRoute()
    const router = useRouter()
    const courseId = route.params.id

    // 状态
    const course = ref({})
    const chapters = ref([])
    const activeTab = ref('intro')
    const loading = ref(false)
    const isEnrolled = ref(false) // 模拟已报名状态

    // 方法
    const loadData = async () => {
        loading.value = true
        try {
            // 获取课程详情
            const courseRes = await getCourseDetail(courseId)
            if (courseRes.success && courseRes.data) {
                course.value = courseRes.data
            }

            // 获取章节列表
            const chapterRes = await getCourseChapters(courseId)
            if (chapterRes.success && chapterRes.data) {
                chapters.value = buildChapterTree(chapterRes.data)
            }
        } catch (error) {
            console.error('获取课程详情失败:', error)
            ElMessage.error('加载课程详情失败')
        } finally {
            loading.value = false
        }
    }

    const buildChapterTree = (flatChapters) => {
        // 简单的树构建逻辑，假设 parentId 为 0 是根节点
        const roots = flatChapters.filter(c => c.parentId === 0 || !c.parentId)
        const map = {}
        flatChapters.forEach(c => map[c.id] = { ...c, children: [] })

        roots.forEach(root => {
            if (map[root.id]) {
                // 查找子节点
                flatChapters.forEach(c => {
                    if (c.parentId === root.id) {
                        map[root.id].children.push(map[c.id])
                    }
                })
            }
        })

        return roots.map(r => map[r.id])
    }

    const handleEnroll = async () => {
        try {
            const studentId = localStorage.getItem('s_id')
            if (!studentId) {
                ElMessage.warning('请先登录')
                router.push('/login')
                return
            }

            // 调用加入课程API
            await joinCourse(studentId, courseId)
            ElMessage.success('报名成功，开始学习吧！')
            isEnrolled.value = true
            // 跳转到学习页
            router.push(`/student/learn/${courseId}`)
        } catch (error) {
            console.error('报名失败:', error)
            ElMessage.error('报名失败')
        }
    }

    const startLearning = () => {
        router.push(`/student/learn/${courseId}`)
    }

    onMounted(() => {
        loadData()
    })

    return {
        course,
        chapters,
        activeTab,
        loading,
        isEnrolled,
        handleEnroll,
        startLearning
    }
}
