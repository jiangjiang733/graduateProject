import { ref, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList, searchCourses } from '@/api/course.js'
import { applyEnrollment, checkEnrollmentStatus } from '@/api/enrollment.js'

export function useCourseList() {
    const router = useRouter()
    const route = useRoute()

    // 状态
    const courses = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(12)
    const total = ref(0)

    // 筛选条件
    const filters = reactive({
        category: 'all',
        difficulty: 'all',
        sort: 'newest'
    })

    // 选项数据
    const categories = [
        { label: '全部', value: 'all' },
        { label: '计算机', value: 'cs' },
        { label: '数学', value: 'math' },
        { label: '英语', value: 'english' },
        { label: '物理', value: 'physics' }
    ]

    const difficulties = [
        { label: '全部', value: 'all' },
        { label: '初级', value: 'beginner' },
        { label: '中级', value: 'intermediate' },
        { label: '高级', value: 'advanced' }
    ]

    const sortOptions = [
        { label: '最新发布', value: 'newest' },
        { label: '最热课程', value: 'hottest' },
        { label: '评分最高', value: 'rating' }
    ]

    // 方法
    const loadCourses = async () => {
        loading.value = true
        try {
            const params = {
                pageNumber: currentPage.value,
                pageSize: pageSize.value,
                keyword: searchQuery.value
            }

            // 如果有筛选条件，添加到参数中 (假设API支持)
            if (filters.category !== 'all') params.classification = filters.category

            const response = await getCourseList(params)

            if (response.success && response.data) {
                // 只显示已发布的课程
                let allCourses = (response.data.list || [])
                    .filter(course => course.state === 1) // 只显示已发布的课程
                    .map(course => ({
                        ...course,
                        enrolling: false,
                        enrollmentStatus: null,
                        chapterCount: course.chapterCount || 0
                    }))

                // 前端筛选
                if (filters.category !== 'all') {
                    allCourses = allCourses.filter(course => 
                        course.classification === filters.category
                    )
                }

                // 排序
                if (filters.sort === 'newest') {
                    allCourses.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
                }

                total.value = allCourses.length

                // 分页
                const start = (currentPage.value - 1) * pageSize.value
                const end = start + pageSize.value
                courses.value = allCourses.slice(start, end)

                // 检查每个课程的报名状态
                checkCoursesEnrollmentStatus()
            }
        } catch (error) {
            console.error('获取课程列表失败:', error)
            ElMessage.error('加载课程失败')
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        currentPage.value = 1
        loadCourses()
    }

    const handleFilterChange = () => {
        currentPage.value = 1
        loadCourses()
    }

    const handlePageChange = (page) => {
        currentPage.value = page
        loadCourses()
    }

    const goToCourseDetail = (courseId) => {
        router.push(`/student/course/${courseId}`)
    }

    // 检查课程报名状态
    const checkCoursesEnrollmentStatus = async () => {
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId')
        if (!studentId) return

        for (const course of courses.value) {
            try {
                const response = await checkEnrollmentStatus(studentId, course.id)
                if (response.success && response.data && response.data.enrolled) {
                    course.enrollmentStatus = response.data.status
                }
            } catch (error) {
                // 忽略检查错误
            }
        }
    }

    // 获取课程图片
    const getCourseImage = (image) => {
        if (!image) return 'https://via.placeholder.com/300x200?text=Course'
        if (image.startsWith('http')) return image
        return `http://localhost:8088${image}`
    }

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '未知'
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('zh-CN')
        } catch {
            return '未知'
        }
    }

    // 处理报名
    const handleEnroll = async (course) => {
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId')
        if (!studentId) {
            ElMessage.warning('请先登录')
            router.push('/login')
            return
        }

        // 如果已经有报名状态，显示相应提示
        if (course.enrollmentStatus === 'pending') {
            ElMessage.info('您已提交报名申请，请等待教师审核')
            return
        } else if (course.enrollmentStatus === 'approved') {
            // 已通过审核，直接进入学习
            goToLearn(course.id)
            return
        } else if (course.enrollmentStatus === 'rejected') {
            ElMessage.warning('您的报名申请已被拒绝，无法重新报名')
            return
        }

        // 确认报名
        try {
            await ElMessageBox.confirm(
                `确定要报名课程"${course.courseName}"吗？提交后需要等待教师审核。`,
                '确认报名',
                {
                    confirmButtonText: '确定报名',
                    cancelButtonText: '取消',
                    type: 'info'
                }
            )

            course.enrolling = true
            
            const response = await applyEnrollment({
                studentId: studentId,
                courseId: course.id,
                courseName: course.courseName,
                teacherId: course.teacherId
            })

            if (response.success) {
                ElMessage.success({
                    message: '报名成功！您的申请已提交，请等待教师审核',
                    duration: 3000
                })
                course.enrollmentStatus = 'pending'
            } else {
                ElMessage.error(response.message || '报名失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('报名失败:', error)
                ElMessage.error('报名失败，请稍后重试')
            }
        } finally {
            course.enrolling = false
        }
    }

    // 获取报名按钮文本
    const getEnrollButtonText = (course) => {
        if (course.enrolling) return '提交中...'
        if (course.enrollmentStatus === 'pending') return '审核中'
        if (course.enrollmentStatus === 'approved') return '进入学习'
        if (course.enrollmentStatus === 'rejected') return '已拒绝'
        return '立即报名'
    }

    // 获取报名按钮是否禁用
    const isEnrollButtonDisabled = (course) => {
        return course.enrolling || 
               course.enrollmentStatus === 'pending' || 
               course.enrollmentStatus === 'rejected'
    }

    // 进入课程学习
    const goToLearn = (courseId) => {
        router.push(`/student/learn/${courseId}`)
    }

    onMounted(() => {
        if (route.query.keyword) {
            searchQuery.value = route.query.keyword
        }
        loadCourses()
    })

    return {
        courses,
        loading,
        searchQuery,
        currentPage,
        pageSize,
        total,
        filters,
        categories,
        difficulties,
        sortOptions,
        handleSearch,
        handleFilterChange,
        handlePageChange,
        goToCourseDetail,
        handleEnroll,
        getEnrollButtonText,
        isEnrollButtonDisabled,
        goToLearn,
        getCourseImage,
        formatDate
    }
}
