import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseList, getCourseAnalytics, getTeacherStudents } from '@/api/course.js'

export function useCourseAnalytics() {
    const router = useRouter()

    // 状态
    const courses = ref([])
    const selectedCourseId = ref('')
    const dateRange = ref([])
    const progressViewType = ref('chapter')
    const activityViewType = ref('daily')
    const studentSearchKeyword = ref('')
    const loadingStudentData = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 分析数据
    const analytics = ref({
        totalStudents: 0,
        newStudentsThisWeek: 0,
        completionRate: 0,
        completedStudents: 0,
        avgEngagement: 0,
        avgStudyTime: 0,
        satisfaction: 0,
        reviewCount: 0
    })

    // 学生数据
    const studentData = ref([])
    const totalStudents = ref(0)

    // 计算属性
    const filteredStudentData = computed(() => {
        if (!studentSearchKeyword.value) return studentData.value

        return studentData.value.filter(student =>
            student.studentName.toLowerCase().includes(studentSearchKeyword.value.toLowerCase()) ||
            student.studentId.toLowerCase().includes(studentSearchKeyword.value.toLowerCase())
        )
    })

    // 方法
    const loadCourses = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })

            if (response.success && response.data) {
                courses.value = response.data.list || []
            }
        } catch (error) {
            console.error('获取课程列表失败:', error)
        }
    }

    const handleCourseChange = (courseId) => {
        if (courseId) {
            loadAnalyticsData(courseId)
            loadStudentData(courseId)
        }
    }

    const handleDateChange = () => {
        if (selectedCourseId.value) {
            loadAnalyticsData(selectedCourseId.value)
            loadStudentData(selectedCourseId.value)
        }
    }

    const loadAnalyticsData = async (courseId) => {
        try {
            const response = await getCourseAnalytics(courseId)
            if (response.success && response.data) {
                const { studentStats } = response.data

                const totalStudents = studentStats.totalStudents || 0
                const completedStudents = studentStats.completedStudents || 0
                const avgProgress = studentStats.avgProgress || 0
                const avgStudyTime = (studentStats.avgStudyTime || 0) / 60 // 转换为小时

                analytics.value = {
                    totalStudents: totalStudents,
                    newStudentsThisWeek: studentStats.newStudentsThisWeek || 0,
                    completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
                    completedStudents: completedStudents,
                    avgEngagement: Math.round(avgProgress),
                    avgStudyTime: Math.round(avgStudyTime * 10) / 10,
                    satisfaction: 4.6, // 暂时使用固定值，后续可以从评论系统获取
                    reviewCount: 89 // 暂时使用固定值
                }
            }
        } catch (error) {
            console.error('获取分析数据失败:', error)
            ElMessage.error('获取分析数据失败')
        }
    }

    const loadStudentData = async (courseId) => {
        try {
            loadingStudentData.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            const response = await getTeacherStudents(teacherId, {
                courseId: courseId,
                pageNumber: currentPage.value,
                pageSize: pageSize.value
            })

            if (response.success && response.data) {
                // 转换数据格式以匹配前端显示
                const students = response.data.map(student => ({
                    id: student.id,
                    studentName: student.studentName || `学生${student.studentId}`,
                    studentId: student.studentId,
                    progress: student.progress || 0,
                    completedChapters: Math.floor((student.progress || 0) / 10), // 假设每10%进度对应1个章节
                    totalStudyTime: Math.round((student.totalStudyTime || 0) / 60), // 转换为小时
                    lastActiveTime: student.lastActiveTime,
                    status: getStudentStatus(student.status)
                }))

                studentData.value = students
                totalStudents.value = students.length
            }

        } catch (error) {
            console.error('获取学生数据失败:', error)
            ElMessage.error('获取学生数据失败')
        } finally {
            loadingStudentData.value = false
        }
    }

    // 转换学生状态
    const getStudentStatus = (status) => {
        const statusMap = {
            0: 'inactive',
            1: 'active',
            2: 'completed',
            3: 'inactive'
        }
        return statusMap[status] || 'inactive'
    }

    const refreshData = () => {
        if (selectedCourseId.value) {
            loadAnalyticsData(selectedCourseId.value)
            loadStudentData(selectedCourseId.value)
            ElMessage.success('数据已刷新')
        }
    }

    const exportReport = () => {
        ElMessage.info('导出功能开发中...')
    }

    const exportStudentData = () => {
        ElMessage.info('导出学生数据功能开发中...')
    }

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#67c23a'
        if (progress >= 60) return '#e6a23c'
        if (progress >= 40) return '#f56c6c'
        return '#909399'
    }

    const getStatusType = (status) => {
        const types = {
            active: 'success',
            inactive: 'warning',
            completed: 'primary'
        }
        return types[status] || 'info'
    }

    const getStatusText = (status) => {
        const texts = {
            active: '活跃',
            inactive: '不活跃',
            completed: '已完成'
        }
        return texts[status] || '未知'
    }

    const viewStudentDetail = (student) => {
        ElMessage.info(`查看学生 ${student.studentName} 的详细信息`)
    }

    onMounted(() => {
        loadCourses()
    })

    return {
        courses,
        selectedCourseId,
        dateRange,
        progressViewType,
        activityViewType,
        studentSearchKeyword,
        loadingStudentData,
        currentPage,
        pageSize,
        analytics,
        studentData,
        totalStudents,
        filteredStudentData,
        handleCourseChange,
        handleDateChange,
        refreshData,
        exportReport,
        exportStudentData,
        getProgressColor,
        getStatusType,
        getStatusText,
        viewStudentDetail
    }
}
