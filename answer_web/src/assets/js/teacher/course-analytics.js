import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getCourseList } from '@/api/course.js'

export function useCourseAnalytics(progressChartRef, scoreDistributionChartRef, activityChartRef) {
    // State
    const courses = ref([])
    const selectedCourseId = ref('')
    const dateRange = ref([])
    const progressViewType = ref('chapter')
    const studentSearchKeyword = ref('')
    const loadingStudentData = ref(false)

    // Chart instances
    let progressChart = null
    let scoreChart = null
    let activityChart = null

    // Data
    const analytics = ref({
        totalStudents: 0,
        newStudentsThisWeek: 0,
        completionRate: 0,
        avgEngagement: 0
    })
    const studentData = ref([])

    // Metrics Computed
    const metrics = computed(() => [
        {
            label: '总学生数',
            value: analytics.value.totalStudents,
            icon: 'User',
            colorClass: 'bg-blue',
            trend: '+12%',
            isPositive: true
        },
        {
            label: '课程完成率',
            value: analytics.value.completionRate + '%',
            icon: 'Check',
            colorClass: 'bg-emerald',
            trend: '+5%',
            isPositive: true
        },
        {
            label: '平均参与度',
            value: analytics.value.avgEngagement,
            icon: 'TrendCharts',
            colorClass: 'bg-purple',
            trend: '-2%',
            isPositive: false
        },
        {
            label: '课程评分',
            value: '4.8',
            icon: 'Star',
            colorClass: 'bg-amber',
            trend: '+0.2',
            isPositive: true
        }
    ])

    const filteredStudentData = computed(() => {
        if (!studentSearchKeyword.value) return studentData.value
        const lower = studentSearchKeyword.value.toLowerCase()
        return studentData.value.filter(s =>
            s.studentName.toLowerCase().includes(lower) ||
            (s.studentId && s.studentId.includes(lower))
        )
    })

    const initCharts = () => {
        // 1. Progress Chart (Bar)
        if (progressChartRef.value) {
            if (progressChart) progressChart.dispose()
            progressChart = echarts.init(progressChartRef.value)
            progressChart.setOption({
                color: ['#10b981'],
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: ['第一章', '第二章', '第三章', '第四章', '第五章', '第六章'] },
                yAxis: { type: 'value' },
                series: [{
                    name: '平均进度',
                    type: 'bar',
                    barWidth: '40%',
                    data: [90, 85, 70, 60, 40, 20],
                    itemStyle: { borderRadius: [4, 4, 0, 0] }
                }]
            })
        }

        // 2. Score Distribution (Pie)
        if (scoreDistributionChartRef.value) {
            if (scoreChart) scoreChart.dispose()
            scoreChart = echarts.init(scoreDistributionChartRef.value)
            scoreChart.setOption({
                tooltip: { trigger: 'item' },
                legend: { bottom: '5%', left: 'center' },
                series: [{
                    name: '成绩分布',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false, position: 'center' },
                    emphasis: {
                        label: { show: true, fontSize: 20, fontWeight: 'bold' }
                    },
                    data: [
                        { value: 40, name: '优秀 (90%以上)', itemStyle: { color: '#10b981' } },
                        { value: 30, name: '良好 (80-89%)', itemStyle: { color: '#3b82f6' } },
                        { value: 20, name: '及格 (60-79%)', itemStyle: { color: '#fbbf24' } },
                        { value: 10, name: '不及格 (<60%)', itemStyle: { color: '#ef4444' } }
                    ]
                }]
            })
        }

        // 3. Activity Trend (Line)
        if (activityChartRef.value) {
            if (activityChart) activityChart.dispose()
            activityChart = echarts.init(activityChartRef.value)
            activityChart.setOption({
                color: ['#8b5cf6'],
                tooltip: { trigger: 'axis' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                },
                yAxis: { type: 'value' },
                series: [{
                    name: '活跃人数',
                    type: 'line',
                    smooth: true,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
                            { offset: 1, color: 'rgba(139, 92, 246, 0.01)' }
                        ])
                    },
                    data: [30, 45, 42, 60, 55, 30, 40]
                }]
            })
        }
    }

    const handleCourseChange = (val) => {
        loadingStudentData.value = true
        setTimeout(() => {
            analytics.value = {
                totalStudents: 128,
                newStudentsThisWeek: 12,
                completionRate: 68,
                avgEngagement: 85
            }
            studentData.value = Array.from({ length: 15 }).map((_, i) => ({
                studentName: `学生 ${i + 1}`,
                studentId: `202300${i + 1}`,
                progress: Math.floor(Math.random() * 100),
                totalStudyTime: (Math.random() * 50).toFixed(1),
                lastActiveTime: Date.now() - Math.floor(Math.random() * 1000000000),
                status: Math.random() > 0.3 ? 'active' : 'inactive'
            }))
            loadingStudentData.value = false
            nextTick(() => {
                initCharts()
            })
        }, 800)
    }

    const loadCourses = async () => {
        courses.value = [
            { id: '1', courseName: '计算机网络基础' },
            { id: '2', courseName: '高级Web开发' },
            { id: '3', courseName: '数据结构与算法' }
        ]
        selectedCourseId.value = '1'
        handleCourseChange('1')
    }

    const handleResize = () => {
        progressChart?.resize()
        scoreChart?.resize()
        activityChart?.resize()
    }

    const refreshData = () => {
        handleCourseChange(selectedCourseId.value)
    }

    const exportReport = () => {
        window.print()
    }

    const handleDateChange = () => {
        refreshData()
    }

    const getProgressColor = (val) => {
        if (val >= 80) return '#10b981'
        if (val >= 60) return '#3b82f6'
        return '#ef4444'
    }

    const getStatusType = (status) => status === 'active' ? 'success' : 'info'
    const getStatusText = (status) => status === 'active' ? '活跃' : '离线'

    onMounted(() => {
        loadCourses()
        window.addEventListener('resize', handleResize)
    })

    return {
        courses,
        selectedCourseId,
        dateRange,
        progressViewType,
        studentSearchKeyword,
        loadingStudentData,
        metrics,
        filteredStudentData,
        handleCourseChange,
        refreshData,
        exportReport,
        handleDateChange,
        getProgressColor,
        getStatusType,
        getStatusText
    }
}
