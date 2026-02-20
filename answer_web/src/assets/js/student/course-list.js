import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStudentJoinedCourses } from '@/api/course.js'

export function useCourseList() {
    const router = useRouter()
    const route = useRoute()

    // 状态
    const courses = ref([])
    const allJoinedCourses = ref([]) // 存储从后端获取的所有已加入课程，用于提取分类
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(12)
    const total = ref(0)

    // 筛选条件
    const filters = reactive({
        major: 'all',
        classification: 'all',
        sort: 'newest'
    })

    // 动态提取的专业列表
    const categories = ref([
        { label: '全部专业', value: 'all' }
    ])

    // 动态提取的课程类型列表
    const classifications = ref([
        { label: '全部类型', value: 'all' }
    ])

    const sortOptions = [
        { label: '最近学习', value: 'newest' },
        { label: '课程名称', value: 'name' }
    ]

    // 方法：加载已加入的课程
    const loadCourses = async () => {
        const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId') || localStorage.getItem('userId')
        if (!studentId) {
            ElMessage.warning('请先登录')
            router.push('/login')
            return
        }

        loading.value = true
        try {
            const response = await getStudentJoinedCourses(studentId)

            if (response.success && response.data) {
                const rawCourses = Array.isArray(response.data) ? response.data : []

                // 转换数据格式，确保字段一致，兼容后端 Map 可能返回的 snake_case 键
                allJoinedCourses.value = rawCourses.map(item => {
                    // 优先获取真实的课程ID（长字符串），而不是选课关联表的自增ID
                    const cId = item.courseId || item.course_id || item.id;
                    return {
                        id: cId,
                        courseName: item.courseName || item.course_name || item.name,
                        image: item.courseImage || item.course_image || item.image,
                        teacherName: item.teacherName || item.teacher_name,
                        teacherAvatar: item.teacherAvatar || item.teacher_avatar,
                        major: item.major || '通用',
                        classification: item.classification || '专业课',
                        progress: item.progress || 0,
                        lastStudyTime: item.updateTime || item.update_time || item.createTime || item.create_time,
                        enrollmentStatus: 'approved'
                    }
                })
                // 1. 动态提取专业分类
                extractMajors()

                // 2. 动态提取课程类型
                extractClassifications()

                // 执行过滤和分页
                applyFilters()
            }
        } catch (error) {
            console.error('获取已加入课程失败:', error)
            ElMessage.error('加载课程列表失败')
        } finally {
            loading.value = false
        }
    }

    // 从数据中提取唯一的专业
    const extractMajors = () => {
        const majors = new Set()
        allJoinedCourses.value.forEach(c => {
            if (c.major) majors.add(c.major)
        })

        categories.value = [
            { label: '全部专业', value: 'all' },
            ...Array.from(majors).map(m => ({ label: m, value: m }))
        ]
    }

    // 从数据中提取唯一的课程类型
    const extractClassifications = () => {
        const types = new Set()
        allJoinedCourses.value.forEach(c => {
            if (c.classification) types.add(c.classification)
        })

        classifications.value = [
            { label: '全部类型', value: 'all' },
            ...Array.from(types).map(t => ({ label: t, value: t }))
        ]
    }

    // 执行前端过滤、排序和分页
    const applyFilters = () => {
        let result = [...allJoinedCourses.value]

        // 搜索过滤
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase()
            result = result.filter(c =>
                c.courseName.toLowerCase().includes(q) ||
                (c.teacherName && c.teacherName.toLowerCase().includes(q))
            )
        }

        // 专业筛选
        if (filters.major !== 'all') {
            result = result.filter(c => c.major === filters.major)
        }

        // 类型筛选
        if (filters.classification !== 'all') {
            result = result.filter(c => c.classification === filters.classification)
        }

        // 排序
        if (filters.sort === 'newest') {
            result.sort((a, b) => new Date(b.lastStudyTime) - new Date(a.lastStudyTime))
        } else if (filters.sort === 'name') {
            result.sort((a, b) => a.courseName.localeCompare(b.courseName, 'zh-CN'))
        }

        total.value = result.length

        // 分页
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        courses.value = result.slice(start, end)
    }

    const handleSearch = () => {
        currentPage.value = 1
        applyFilters()
    }

    const handleFilterChange = () => {
        currentPage.value = 1
        applyFilters()
    }

    const handlePageChange = (page) => {
        currentPage.value = page
        applyFilters()
    }

    const goToCourseDetail = (courseId) => {
        router.push(`/student/course/${courseId}`)
    }

    const goToLearn = (courseId) => {
        router.push(`/student/learn/${courseId}`)
    }

    // 获取课程图片
    const getCourseImage = (image) => {
        if (!image) return 'https://via.placeholder.com/300x200?text=Course'
        if (image.startsWith('http')) return image
        return `http://localhost:8088${image}`
    }

    // 获取教师头像
    const getTeacherAvatar = (avatar) => {
        if (!avatar) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor'
        if (avatar.startsWith('http')) return avatar
        return `http://localhost:8088${avatar}`
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
        classifications,
        sortOptions,
        handleSearch,
        handleFilterChange,
        handlePageChange,
        goToCourseDetail,
        goToLearn,
        getCourseImage,
        getTeacherAvatar,
        formatDate
    }
}
