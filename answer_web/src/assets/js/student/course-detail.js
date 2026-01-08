import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseDetail, getCourseChapters, getCourseStudents } from '@/api/course.js'
import { applyEnrollment, checkEnrollmentStatus } from '@/api/enrollment.js'

export function useCourseDetail() {
    const route = useRoute()
    const router = useRouter()
    const courseId = route.params.id

    // 状态
    const course = ref({})
    const chapters = ref([])
    const courseStudents = ref([])
    const activeTab = ref('intro')
    const loading = ref(false)
    const enrollmentStatus = ref('none') // none, pending, approved, rejected
    const isEnrolled = ref(false)

    // 方法
    const loadData = async () => {
        const studentId = localStorage.getItem('s_id')
        loading.value = true
        try {
            // 1. 获取课程详情
            const courseRes = await getCourseDetail(courseId)
            if (courseRes.success && courseRes.data) {
                const data = courseRes.data
                if (data.image && !data.image.startsWith('http')) {
                    data.image = `http://localhost:8088${data.image}`
                }
                course.value = data
            }

            // 2. 获取章节列表
            const chapterRes = await getCourseChapters(courseId)
            if (chapterRes.success && chapterRes.data) {
                chapters.value = buildChapterTree(chapterRes.data)
            }

            // 3. 检查报名状态
            if (studentId) {
                const statusRes = await checkEnrollmentStatus(studentId, courseId)
                if (statusRes.success && statusRes.data) {
                    enrollmentStatus.value = statusRes.data.status || 'none'
                    isEnrolled.value = enrollmentStatus.value === 'approved'

                    // 如果已加入，获取班级成员
                    if (isEnrolled.value) {
                        const studentsRes = await getCourseStudents(courseId)
                        if (studentsRes.code === 200 || studentsRes.success) {
                            courseStudents.value = studentsRes.data || []
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取课程详情失败:', error)
            ElMessage.error('加载课程详情失败')
        } finally {
            loading.value = false
        }
    }

    const buildChapterTree = (flatChapters) => {
        const roots = flatChapters.filter(c => c.parentId === 0 || !c.parentId)
        const map = {}
        flatChapters.forEach(c => map[c.chapterId] = { ...c, children: [] })

        roots.forEach(root => {
            if (map[root.chapterId]) {
                flatChapters.forEach(c => {
                    if (c.parentId === root.chapterId) {
                        map[root.chapterId].children.push(map[c.chapterId])
                    }
                })
            }
        })

        return roots.map(r => map[r.chapterId])
    }

    const handleEnroll = async () => {
        try {
            const studentId = localStorage.getItem('s_id')
            if (!studentId) {
                ElMessage.warning('请先登录')
                router.push('/login')
                return
            }

            // 构造报名数据
            const applyData = {
                studentId: studentId,
                courseId: courseId,
                courseName: course.value.courseName,
                teacherId: course.value.teacherId
            }

            // 调用申请报名API (带审核机制)
            const res = await applyEnrollment(applyData)
            if (res.success || res.code === 200) {
                ElMessage.success('申请提交成功，请等待教师审核')
                enrollmentStatus.value = 'pending'
            } else {
                ElMessage.error(res.message || '申请失败')
            }
        } catch (error) {
            console.error('报名申请失败:', error)
            ElMessage.error(error.response?.data?.message || '报名申请失败')
        }
    }

    const startLearning = () => {
        if (enrollmentStatus.value === 'approved') {
            router.push(`/student/learn/${courseId}`)
        } else if (enrollmentStatus.value === 'pending') {
            ElMessage.info('您的报名申请正在审核中，请稍后再试')
        } else {
            handleEnroll()
        }
    }

    onMounted(() => {
        loadData()
    })

    return {
        course,
        chapters,
        courseStudents,
        activeTab,
        loading,
        isEnrolled,
        enrollmentStatus,
        handleEnroll,
        startLearning
    }
}
