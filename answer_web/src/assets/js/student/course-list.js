import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { searchCourses } from '@/api/course.js'
import { applyEnrollment, getStudentEnrollments, cancelEnrollment } from '@/api/enrollment.js'

export function useCourseList() {
    const router = useRouter()
    const route = useRoute()

    // 状态
    const courses = ref([])
    const allJoinedCourses = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(6)
    const total = ref(0)

    // 筛选条件
    const filters = reactive({
        major: 'all',
        classification: 'all',
        sort: 'newest',
        joinStatus: 'all'
    })

    // 参与状态筛选项
    const joinStatusOptions = [
        { label: '全部课程', value: 'all' },
        { label: '已参与', value: 'joined' },
        { label: '未参与', value: 'unjoined' }
    ]

    // 动态提取的专业列表
    const categories = ref([
        { label: '全部专业', value: 'all' }
    ])

    // 动态提取的课程类型列表
    const classifications = ref([
        { label: '全部类型', value: 'all' }
    ])

    const sortOptions = [
        { label: '最新发布', value: 'newest' },
        { label: '课程名称', value: 'name' }
    ]

    // 方法：加载所有发布的课程
    const loadCourses = async () => {
        const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId') || localStorage.getItem('userId')
        if (!studentId) {
            ElMessage.warning('请先登录')
            router.push('/login')
            return
        }

        loading.value = true
        try {
            // 并行获取：全部课程 + 已加入课程对应的报名记录 (需 enrollmentId 以便后期退课)
            const [allRes, enrolledRes] = await Promise.all([
                searchCourses({ filterType: 'ALL' }),
                getStudentEnrollments(studentId).catch(() => ({ data: [] }))
            ])

            // 构建已加入课程ID -> enrollmentId 的映射
            const enrollmentMap = new Map()
            const rawEnrolled = enrolledRes.success && enrolledRes.data ? enrolledRes.data : []
            
            rawEnrolled.forEach(e => {
                // 仅记录状态为 approved 的，以便后期退课
                if (e.status === 'approved') {
                    enrollmentMap.set(String(e.courseId), String(e.id || e.enrollmentId))
                }
            })

            if (allRes.success && allRes.data) {
                const rawCourses = Array.isArray(allRes.data) ? allRes.data : []

                allJoinedCourses.value = rawCourses.map(item => {
                    const cId = item.courseId || item.course_id || item.id
                    const enrollmentId = enrollmentMap.get(String(cId))
                    const isJoined = enrollmentId !== undefined
                    return {
                        id: cId,
                        courseName: item.courseName || item.course_name || item.name,
                        courseCode: item.courseCode || item.course_code || '',
                        image: item.courseImage || item.course_image || item.image,
                        teacherName: item.teacherName || item.teacher_name,
                        teacherAvatar: item.teacherAvatar || item.teacher_avatar,
                        teacherId: item.teacherId || item.teacher_id,
                        major: item.major || '通用',
                        classification: item.classification || '专业课',
                        progress: item.progress || 0,
                        lastStudyTime: item.updateTime || item.update_time || item.createTime || item.create_time,
                        isJoined,
                        enrollmentId,
                        enrollmentStatus: isJoined ? 'approved' : null
                    }
                })
                extractMajors()
                extractClassifications()
                applyFilters()
            }
        } catch (error) {
            console.error('获取课程失败:', error)
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
            const q = searchQuery.value.trim().toLowerCase()
            result = result.filter(c =>
                (c.courseName && c.courseName.toLowerCase().includes(q)) ||
                (c.teacherName && c.teacherName.toLowerCase().includes(q)) ||
                (c.courseCode && c.courseCode.toLowerCase().includes(q))
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

        // 参与状态筛选
        if (filters.joinStatus === 'joined') {
            result = result.filter(c => c.isJoined)
        } else if (filters.joinStatus === 'unjoined') {
            result = result.filter(c => !c.isJoined)
        }

        // 排序
        if (filters.sort === 'newest') {
            result.sort((a, b) => new Date(b.lastStudyTime) - new Date(a.lastStudyTime))
        } else if (filters.sort === 'name') {
            result.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || '', 'zh-CN'))
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

    // 申请加入课程
    const applyToCourse = async (course) => {
        const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId')
        const studentName = localStorage.getItem('studentName') || ''
        const studentEmail = localStorage.getItem('studentEmail') || ''
        try {
            const res = await applyEnrollment({
                studentId,
                studentName,
                studentEmail,
                courseId: course.id,
                courseName: course.courseName,
                teacherId: course.teacherId || ''
            })
            if (res.success || res.code === 200) {
                ElMessage.success('申请已提交，请等待教师审核')
                // 更新本地状态
                course.enrollmentStatus = 'pending'
            } else {
                ElMessage.error(res.message || '申请失败')
            }
        } catch (e) {
            console.error(e)
            ElMessage.error('申请失败，请重试')
        }
    }

    // 退课操作
    const dropCourse = async (course) => {
        if (!course.enrollmentId) {
            // 兜底：如果加载时没拿到ID，尝试重新加载一次或提示
            ElMessage.error('无法确定报名记录，请刷新列表后再试')
            return
        }

        try {
            await ElMessageBox.confirm(
                `确定要退出课程"${course.courseName}"吗？退课后将无法继续学习该课程。`,
                '确认退课',
                {
                    confirmButtonText: '确定退课',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const res = await cancelEnrollment(course.enrollmentId)
            if (res.success || res.code === 200) {
                ElMessage.success('已成功退课')
                // 刷新列表
                loadCourses()
            } else {
                ElMessage.error(res.message || '退课失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('退课异常:', error)
                ElMessage.error('操作失败')
            }
        }
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
    // 监听搜索词：清空时自动显示全部
    watch(searchQuery, (val) => {
        if (val === '' || val.trim() === '') {
            currentPage.value = 1
            applyFilters()
        }
    })

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
        joinStatusOptions,
        handleSearch,
        handleFilterChange,
        handlePageChange,
        goToCourseDetail,
        goToLearn,
        applyToCourse,
        dropCourse,
        getCourseImage,
        getTeacherAvatar,
        formatDate
    }
}
