import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStudentSchedule } from '@/api/schedule.js'

export function useSchedule() {
    const router = useRouter()
    const loading = ref(false)
    const currentWeek = ref(1)
    const scheduleData = ref({})
    const detailDialogVisible = ref(false)
    const selectedCourse = ref(null)

    const weekDays = [
        { label: '周一', value: 1 },
        { label: '周二', value: 2 },
        { label: '周三', value: 3 },
        { label: '周四', value: 4 },
        { label: '周五', value: 5 },
        { label: '周六', value: 6 },
        { label: '周日', value: 7 }
    ]

    const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    const sectionTimes = {
        1: '08:00-08:45',
        2: '08:55-09:40',
        3: '10:00-10:45',
        4: '10:55-11:40',
        5: '14:00-14:45',
        6: '14:55-15:40',
        7: '16:00-16:45',
        8: '16:55-17:40',
        9: '19:00-19:45',
        10: '19:55-20:40',
        11: '20:50-21:35',
        12: '21:45-22:30'
    }

    const hasSchedule = computed(() => {
        return Object.keys(scheduleData.value).length > 0
    })

    // 加载课程表
    const loadSchedule = async () => {
        loading.value = true
        try {
            const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
            if (!studentId) {
                ElMessage.warning('请先登录')
                loading.value = false
                return
            }

            const response = await getStudentSchedule(studentId, currentWeek.value)
            if (response.success) {
                scheduleData.value = response.data || {}
            } else {
                ElMessage.error(response.message || '获取课程表失败')
            }
        } catch (error) {
            console.error('加载课程表失败:', error)
            ElMessage.error('加载课程表失败')
        } finally {
            loading.value = false
        }
    }

    // 切换周数
    const changeWeek = (offset) => {
        const newWeek = currentWeek.value + offset
        if (newWeek < 1 || newWeek > 20) {
            ElMessage.warning('周数范围为1-20周')
            return
        }
        currentWeek.value = newWeek
        loadSchedule()
    }

    // 获取课程
    const getCourse = (day, section) => {
        if (!scheduleData.value[day]) return null
        if (!scheduleData.value[day][section]) return null
        return scheduleData.value[day][section]
    }

    // 获取课程样式类
    const getCourseClass = (day, section) => {
        const course = getCourse(day, section)
        if (!course) return ''

        // 如果是跨节次的课程，只在第一节显示
        if (course.startSection !== section) {
            return 'course-hidden'
        }

        const span = course.endSection - course.startSection + 1
        return `course-span-${span}`
    }

    // 获取节次时间
    const getSectionTime = (section) => {
        return sectionTimes[section] || ''
    }

    // 获取星期名称
    const getDayName = (day) => {
        const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
        return days[day] || ''
    }

    // 查看课程详情
    const viewCourseDetail = (course) => {
        if (!course) return
        selectedCourse.value = course
        detailDialogVisible.value = true
    }

    // 进入课程
    const goToCourse = () => {
        if (selectedCourse.value && selectedCourse.value.courseId) {
            router.push(`/student/course/${selectedCourse.value.courseId}`)
        }
    }

    onMounted(() => {
        loadSchedule()
    })

    return {
        loading,
        currentWeek,
        scheduleData,
        detailDialogVisible,
        selectedCourse,
        weekDays,
        sections,
        hasSchedule,
        loadSchedule,
        changeWeek,
        getCourse,
        getCourseClass,
        getSectionTime,
        getDayName,
        viewCourseDetail,
        goToCourse
    }
}
