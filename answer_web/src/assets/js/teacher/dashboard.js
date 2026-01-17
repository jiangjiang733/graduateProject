import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getDashboardData } from '@/api/dashboard.js'

export function useTeacherDashboard() {
    const router = useRouter()
    const loading = ref(true)
    const activityChartRef = ref(null)
    let activityChart = null

    const currentTime = computed(() => {
        const d = new Date()
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
    })

    const statistics = ref({
        studentCount: 0,
        courseCount: 0,
        pendingHomeworkCount: 0,
        ongoingExamCount: 0
    })
    const recentCourses = ref([])
    const recentMessages = ref([])

    const statCards = computed(() => [
        {
            label: '活跃学生',
            value: statistics.value.studentCount,
            icon: 'User',
            glowColor: 'rgba(0, 122, 255, 0.12)',
            iconColor: '#007AFF',
            trend: '12%',
            trendUp: true,
        },
        {
            label: '进行中课程',
            value: statistics.value.courseCount,
            icon: 'Reading',
            glowColor: 'rgba(52, 199, 89, 0.12)',
            iconColor: '#34C759',
            trend: '2.4%',
            trendUp: true,
        },
        {
            label: '待批改作业',
            value: statistics.value.pendingHomeworkCount,
            icon: 'EditPen',
            glowColor: 'rgba(255, 149, 0, 0.12)',
            iconColor: '#FF9500',
            trendUp: false,
        },
        {
            label: '进行中考试',
            value: statistics.value.ongoingExamCount,
            icon: 'TrendCharts',
            glowColor: 'rgba(175, 82, 222, 0.12)',
            iconColor: '#AF52DE',
            trend: '实时',
            trendUp: true,
        }
    ])

    const totalActivities = computed(() => {
        return recentMessages.value.length
    })

    const getAvatarColor = (name) => {
        if (!name) return '#007AFF'
        const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FF2D55']
        const charCode = name.charCodeAt(0)
        return colors[charCode % colors.length]
    }

    const refreshActivity = () => {
        fetchDashboardData()
        if (activityChartRef.value) {
            activityChartRef.value.style.animation = 'refresh-pulse 0.6s ease'
            setTimeout(() => {
                activityChartRef.value.style.animation = ''
            }, 600)
        }
    }

    const fetchDashboardData = async () => {
        loading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) return

            const response = await getDashboardData(teacherId)
            if (response.code === 200 && response.data) {
                const { statistics: stats, recentCourses: courses, recentMessages: msgs } = response.data
                statistics.value = {
                    studentCount: stats?.studentCount || 0,
                    pendingHomeworkCount: stats?.pendingHomeworkCount || 0,
                    courseCount: stats?.courseCount || 0,
                    ongoingExamCount: stats?.ongoingExamCount || 0
                }
                recentCourses.value = courses || []
                recentMessages.value = msgs || []
                initActivityChart()
            }
        } catch (error) {
            console.error('Dashboard data error:', error)
        } finally {
            loading.value = false
        }
    }

    const initActivityChart = () => {
        nextTick(() => {
            if (!activityChartRef.value) return
            if (activityChart) activityChart.dispose()

            activityChart = echarts.init(activityChartRef.value)
            const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (6 - i))
                return `${d.getMonth() + 1}/${d.getDate()}`
            })

            const chartData = days.map(day => {
                return recentMessages.value.filter(msg => {
                    const msgDate = new Date(msg.time)
                    return `${msgDate.getMonth() + 1}/${msgDate.getDate()}` === day
                }).length
            })

            activityChart.setOption({
                grid: { top: 10, right: 10, bottom: 20, left: 30 },
                xAxis: {
                    type: 'category',
                    data: days,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#8E8E93', fontSize: 11, fontWeight: 500 }
                },
                yAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.08)' } },
                    axisLabel: { color: '#8E8E93', fontSize: 11, fontWeight: 500 },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    min: 0
                },
                series: [{
                    data: chartData,
                    type: 'line',
                    smooth: 0.6,
                    symbol: 'circle',
                    symbolSize: 6,
                    symbolHoverSize: 8,
                    lineStyle: { width: 3, color: '#007AFF' },
                    itemStyle: { color: '#FFFFFF', borderColor: '#007AFF', borderWidth: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(0, 122, 255, 0.2)' },
                            { offset: 1, color: 'rgba(0, 122, 255, 0.02)' }
                        ])
                    },
                    emphasis: {
                        lineStyle: { width: 4 },
                        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 122, 255, 0.3)' }
                    }
                }]
            })
        })
    }

    const getCourseImage = (image) => {
        if (!image) return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400'
        return image.startsWith('http') ? image : `http://localhost:8088${image}`
    }

    const getStudentAvatar = (avatar) => {
        if (!avatar) return ''
        return avatar.startsWith('http') ? avatar : `http://localhost:8088${avatar}`
    }

    const getActionText = (type, content) => {
        if (type === 'homework') {
            return content ? `提交了《${content}》` : '提交了作业'
        } else if (type === 'comment') {
            return '发表了评论：' + (content || '')
        } else {
            return content || '系统通知'
        }
    }

    const viewCourse = (course) => {
        try {
            console.log('点击查看课程:', course)
            const courseId = course.courseId || course.id
            if (!courseId) {
                console.error('课程ID不存在')
                return
            }
            console.log('跳转到课程详情页，ID:', courseId)
            router.push({
                path: `/teacher/course/${courseId}`,
                replace: false
            })
        } catch (error) {
            console.error('跳转失败:', error)
        }
    }

    const isSameDay = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
    }

    const formatSmartTime = (timeStr) => {
        if (!timeStr) return ''

        const date = new Date(timeStr)
        const now = new Date()
        const diff = now - date

        if (diff < 1800000) {
            if (diff < 60000) return '刚刚'
            return Math.floor(diff / 60000) + '分钟前'
        }

        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const timePart = `${hours}:${minutes}`

        if (isSameDay(date, now)) {
            return timePart
        }

        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        if (isSameDay(date, yesterday)) {
            return `昨天 ${timePart}`
        }

        const dayBeforeYesterday = new Date(now)
        dayBeforeYesterday.setDate(now.getDate() - 2)
        if (isSameDay(date, dayBeforeYesterday)) {
            return `前天 ${timePart}`
        }

        if (date.getFullYear() === now.getFullYear()) {
            return `${date.getMonth() + 1}月${date.getDate()}日`
        }

        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }

    onMounted(() => {
        fetchDashboardData()
        window.addEventListener('resize', () => activityChart?.resize())
    })

    onBeforeUnmount(() => {
        activityChart?.dispose()
        window.removeEventListener('resize', () => activityChart?.resize())
    })

    return {
        loading,
        activityChartRef,
        currentTime,
        statistics,
        recentCourses,
        recentMessages,
        statCards,
        totalActivities,
        getAvatarColor,
        refreshActivity,
        getCourseImage,
        getStudentAvatar,
        getActionText,
        viewCourse,
        formatSmartTime
    }
}
