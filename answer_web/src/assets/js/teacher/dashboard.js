import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardData } from '@/api/dashboard.js'
import { getExamsByTeacher, getExamStatistics, getStudentExams } from '@/api/exam.js'
import { showError, showLoadDataError, showInfo } from '@/utils/feedback.js'

export function useTeacherDashboard() {
    const router = useRouter()
    const loading = ref(false)

    let refreshTimer = null


    const selectedCourseId = ref('')
    const courseOptions = computed(() => recentCourses.value.map(c => ({ label: c.courseName || c.name, value: c.id || c.courseId })))

    const statistics = ref({
        studentCount: 0,
        courseCount: 0,
        pendingHomeworkCount: 0,
        ongoingExamCount: 0,
        studentTrend: '',
        courseTrend: '',
        homeworkTrend: '',
        examTrend: ''
    })
    const recentCourses = ref([])
    const recentMessages = ref([])
    const todoItems = ref([])
    const allExams = ref([])

    const analysisData = ref({
        examName: '暂无考试',
        participantCount: 0,
        averageScore: 0,
        passRate: 0,
        scoreDistribution: [0, 0, 0, 0]
    })

    const statCards = computed(() => {
        const s = statistics.value
        const cleanTrend = (t) => {
            if (!t) return ''
            return String(t).replace(/[+\-%]/g, '') + '%'
        }

        return [
            {
                label: '活跃学生',
                value: s.studentCount || 0,
                trend: cleanTrend(s.studentTrend),
                trendUp: !String(s.studentTrend || '').includes('-'),
                icon: 'UserFilled'
            },
            {
                label: '进行中课程',
                value: s.courseCount || 0,
                trend: cleanTrend(s.courseTrend),
                trendUp: !String(s.courseTrend || '').includes('-'),
                icon: 'Reading'
            },
            {
                label: '待批改作业',
                value: s.pendingHomeworkCount || 0,
                trend: cleanTrend(s.homeworkTrend),
                trendUp: String(s.homeworkTrend || '').includes('+'),
                icon: 'EditPen'
            },
            {
                label: '进行中考试',
                value: s.ongoingExamCount || 0,
                trend: s.examTrend || '',
                trendUp: true,
                icon: 'TrendCharts'
            }
        ]
    })

    const fetchDashboardData = async () => {
        if (loading.value) return
        loading.value = true

        try {
            let teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            // Fix: Check for literal "undefined" string
            if (teacherId === 'undefined' || teacherId === 'null') {
                teacherId = null
            }

            if (!teacherId) {
                const teacherStore = (await import('@/stores/teacher.js')).useTeacherStore()
                teacherId = teacherStore.teacherId
            }

            if (!teacherId || teacherId === 'undefined') {
                loading.value = false
                return
            }

            const [dashRes, statsRes, coursesRes, todoRes, messagesRes, examsRes] = await Promise.allSettled([
                getDashboardData(teacherId),
                import('@/api/dashboard.js').then(m => m.getStatistics(teacherId)),
                import('@/api/dashboard.js').then(m => m.getRecentCourses(teacherId, 50)),
                import('@/api/dashboard.js').then(m => m.getTodoList(teacherId)),
                import('@/api/dashboard.js').then(m => m.getRecentMessages(teacherId, 10)),
                getExamsByTeacher(teacherId)
            ])

            let rawDash = dashRes.status === 'fulfilled' ? dashRes.value.data : {}
            let rawStats = statsRes.status === 'fulfilled' ? statsRes.value.data : {}

            // 处理考试列表
            if (examsRes.status === 'fulfilled' && examsRes.value.data) {
                allExams.value = examsRes.value.data
            }

            // 计算进行中的考试数量：状态为进行中，且未过期
            const now = new Date()
            const realOngoingExams = allExams.value.filter(e => {
                const isStatusActive = e.status === 'published' || e.status === 'ongoing' || e.status === 'running'
                const isNotExpired = e.endTime ? new Date(e.endTime) > now : true
                return isStatusActive && isNotExpired
            })

            let cList = []
            if (rawDash?.recentCourses) {
                cList = rawDash.recentCourses
            } else if (coursesRes.status === 'fulfilled') {
                cList = coursesRes.value.data || []
            }
            // 比较后更新课程数据
            if (JSON.stringify(recentCourses.value) !== JSON.stringify(cList)) {
                recentCourses.value = [...cList]
            }

            // Default selection for analysis
            if (!selectedCourseId.value && recentCourses.value.length > 0) {
                selectedCourseId.value = recentCourses.value[0].id || recentCourses.value[0].courseId
            }

            const statsObj = rawDash?.statistics || rawDash?.data?.statistics || rawStats || rawStats?.data || {}

            const newStats = {
                studentCount: statsObj.studentCount || statsObj.studentNum || statsObj.student_count || 0,
                courseCount: statsObj.courseCount || statsObj.courseNum || statsObj.course_count || cList.length || 0,
                pendingHomeworkCount: statsObj.pendingHomeworkCount || statsObj.homeworkNum || statsObj.homework_count || 0,
                ongoingExamCount: realOngoingExams.length, // 使用前端计算的准确值
                studentTrend: statsObj.studentTrend || statsObj.student_trend || '',
                courseTrend: statsObj.courseTrend || statsObj.course_trend || '',
                homeworkTrend: statsObj.homeworkTrend || statsObj.homework_trend || '',
                examTrend: statsObj.examTrend || statsObj.exam_trend || ''
            }

            // 比较后更新统计数据
            if (JSON.stringify(statistics.value) !== JSON.stringify(newStats)) {
                statistics.value = newStats
            }

            // 比较后更新待办事项
            let newTodos = []
            if (rawDash?.todoList) {
                newTodos = rawDash.todoList
            } else if (todoRes.status === 'fulfilled') {
                newTodos = todoRes.value.data || []
            }

            // 如果后端没有提供待办事项，自动生成
            if (!newTodos || newTodos.length === 0) {
                // console.log('后端无待办事项，自动生成')
                newTodos = []

                // 1. 检查是否有待批改作业
                if (statistics.value.pendingHomeworkCount > 0) {
                    newTodos.push({
                        type: 'homework',
                        title: `您有 ${statistics.value.pendingHomeworkCount} 份作业待批改`,
                        description: '及时批改作业可以提高学生学习积极性',
                        buttonText: '去批改',
                        link: '/teacher/homework'
                    })
                }

                // 2. 检查个人信息是否完善
                try {
                    const teacherStore = (await import('@/stores/teacher.js')).useTeacherStore()

                    // 检查 store 中的字段
                    const email = teacherStore.teacherEmail
                    const dept = teacherStore.teacherDepartment

                    // 如果 store 中没有，再尝试从 localStorage 获取
                    const localEmail = localStorage.getItem('teacherEmail')
                    const localDept = localStorage.getItem('teacherDepartment')

                    const isProfileIncomplete = !(email || localEmail) || !(dept || localDept)

                    if (isProfileIncomplete) {
                        newTodos.push({
                            type: 'profile',
                            title: '完善个人信息',
                            description: '请补充邮箱和部门信息，方便学生联系您',
                            buttonText: '去完善',
                            link: '/teacher/profile'
                        })
                    }
                } catch (e) {
                    // console.log('无法检查个人信息:', e)
                }
            }

            if (JSON.stringify(todoItems.value) !== JSON.stringify(newTodos)) {
                todoItems.value = [...newTodos]
            }

            // 比较后更新消息数据
            let newMessages = []
            if (rawDash?.recentMessages) {
                newMessages = rawDash.recentMessages
            } else if (messagesRes.status === 'fulfilled') {
                newMessages = messagesRes.value.data || []
            }

            if (JSON.stringify(recentMessages.value) !== JSON.stringify(newMessages)) {
                recentMessages.value = [...newMessages]
            }

            // 更新当前Subject的分析数据
            await updateAnalysis()

        } catch (error) {
            console.error('Dashboard Error:', error)
            showLoadDataError()
        } finally {
            loading.value = false
        }
    }

    // 根据选中的科目更新分析数据
    async function updateAnalysis() {
        if (!selectedCourseId.value) {
            analysisData.value = {
                examName: '暂无考试',
                participantCount: 0,
                averageScore: 0,
                passRate: 0
            }
            return
        }

        const cid = selectedCourseId.value
        // Find latest exam for this course
        const courseExams = allExams.value.filter(e => (e.courseId || e.course_id) === cid)

        // Reset defaults
        let newData = {
            examName: '暂无考试数据',
            participantCount: 0,
            averageScore: 0,
            passRate: 0
        }

        if (courseExams.length > 0) {
            courseExams.sort((a, b) => b.id - a.id) // Assuming higher ID means newer exam
            const latestExam = courseExams[0]
            console.log('=== DEBUG: latestExam object ===', latestExam)

            newData.examName = latestExam.title || latestExam.examName || '最新考试'

            try {
                // Fetch stats, ensure exam ID exists
                // Support multiple ID field names
                const examId = latestExam.id || latestExam.examId || latestExam.exam_id
                console.log('=== DEBUG: Extracted examId ===', examId)

                if (examId) {
                    console.log('=== DEBUG: Fetching stats for exam ID ===', examId)
                    const statRes = await getExamStatistics(examId)
                    console.log('=== DEBUG: statRes ===', statRes)

                    if (statRes && (statRes.success || statRes.code === 200)) {
                        console.log('=== IN STATS SUCCESS BRANCH ===')
                        const stats = statRes.data

                        newData.participantCount = stats.attendCount || stats.participantCount || 0
                        newData.averageScore = parseFloat(stats.averageScore || 0).toFixed(1)

                        // Pass Rate
                        const passCount = stats.passCount || 0
                        const total = newData.participantCount || 1
                        newData.passRate = total > 0 ? Math.round((passCount / total) * 1000) / 10 : 0
                        // Score Distribution
                        // If backend provides valid distribution, use it. 
                        // OTHERWISE, if it's missing OR it's all zeros, try to calculate manually to be safe.
                        console.log('=== DEBUG: Stats object ===', stats)
                        console.log('=== DEBUG: Backend scoreDistribution ===', stats.scoreDistribution)

                        // Ensure backendDist is always an array
                        let backendDist = Array.isArray(stats.scoreDistribution) ? stats.scoreDistribution : []
                        const backendHasData = backendDist.length > 0 && backendDist.reduce((a, b) => a + b, 0) > 0

                        console.log('=== DEBUG: backendDist ===', backendDist)
                        console.log('=== DEBUG: backendHasData ===', backendHasData)

                        if (backendHasData) {
                            console.log('=== Using backend distribution ===')
                            newData.scoreDistribution = backendDist
                        } else {
                            console.log('=== Calculating distribution manually ===')
                            // Backend provided nothing or zeros. Try manual calculation.
                            try {
                                const studentsRes = await getStudentExams(examId)
                                console.log('=== DEBUG: Student Exam Response ===', studentsRes)

                                if (studentsRes && (studentsRes.success || studentsRes.code === 200) && studentsRes.data) {
                                    const students = studentsRes.data
                                    console.log('=== DEBUG: Total students fetched ===', students.length)
                                    console.log('=== DEBUG: First student sample ===', students[0])

                                    // Get total score - try multiple field names
                                    const examTotal = parseFloat(
                                        latestExam.totalScore ||
                                        latestExam.total_score ||
                                        latestExam.score ||
                                        latestExam.fullScore ||
                                        latestExam.full_score ||
                                        100
                                    )
                                    console.log('=== DEBUG: Exam Total Score ===', examTotal)

                                    // Categories: 不及格, 及格, 良好, 优秀
                                    const dist = [0, 0, 0, 0]

                                    students.forEach(s => {
                                        // Check text score or numeric score fields
                                        // Support both camelCase and snake_case commonly found in DB results
                                        let scoreVal = s.obtainedScore !== undefined ? s.obtainedScore :
                                            s.obtained_score !== undefined ? s.obtained_score :
                                                s.totalScore !== undefined ? s.totalScore :
                                                    s.total_score !== undefined ? s.total_score :
                                                        s.score !== undefined ? s.score : 0

                                        let score = parseFloat(scoreVal)

                                        console.log(`Student: ${s.studentName || s.student_name || s.id}, Status: ${s.status}, ScoreVal: ${scoreVal}, Score: ${score}`)

                                        // Check status: 3 usually means graded.
                                        // Also accept if they have a non-zero score just in case status is missing
                                        if (s.status === 3 || s.status === '3' || s.status === 'graded' || score > 0) {
                                            const percentage = (score / examTotal) * 100

                                            // Buckets based on Percentage:
                                            // 0: < 60% (不及格 Fail)
                                            // 1: 60% - 70% (及格 Pass)
                                            // 2: 70% - 90% (良好 Good)
                                            // 3: >= 90% (优秀 Excellent)

                                            console.log(`  → Percentage: ${percentage.toFixed(2)}%`)

                                            if (percentage < 60) dist[0]++
                                            else if (percentage < 70) dist[1]++
                                            else if (percentage < 90) dist[2]++
                                            else dist[3]++
                                        }
                                    })
                                    console.log('=== DEBUG: Final Distribution ===', dist)
                                    newData.scoreDistribution = dist

                                    // Recalculate average if needed (for better accuracy)
                                    // const validScores = students.filter(s => s.status === 3 || s.status === 'graded').map(s => parseFloat(s.obtainedScore || 0))
                                    // if (validScores.length > 0) {
                                    //    newData.averageScore = (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
                                    // }

                                } else {
                                    newData.scoreDistribution = [0, 0, 0, 0, 0]
                                }
                            } catch (err) {
                                console.error('Failed to calculate distribution manually:', err)
                                newData.scoreDistribution = [0, 0, 0, 0, 0]
                            }
                        }
                    } else {
                        console.log('=== IN ELSE BRANCH (statRes failed) ===', statRes)
                        newData.averageScore = parseFloat(latestExam.averageScore || 0).toFixed(1)
                        newData.scoreDistribution = [0, 0, 0, 0, 0]
                    }
                } else {
                    console.log('=== NO EXAM ID ===')
                    newData.averageScore = parseFloat(latestExam.averageScore || 0).toFixed(1)
                    newData.scoreDistribution = [0, 0, 0, 0, 0]
                }
            } catch (e) {
                console.error("=== EXCEPTION in updateAnalysis ===", e)
                newData.averageScore = parseFloat(latestExam.averageScore || 0).toFixed(1)
                newData.scoreDistribution = [0, 0, 0, 0, 0]
            }
        }

        console.log('=== DEBUG: Final newData ===', newData)
        analysisData.value = newData
        console.log('=== DEBUG: analysisData after update ===', analysisData.value)
    }

    const getCourseImage = (image) => {
        if (!image) return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400'
        return image.startsWith('http') ? image : `http://localhost:8088${image}`
    }

    const viewCourse = (course) => {
        const courseId = course.courseId || course.id
        if (courseId) router.push(`/teacher/course/${courseId}`)
    }



    onMounted(() => {
        fetchDashboardData()

        // 添加定时刷新机制，每30秒获取一次最新数据
        refreshTimer = setInterval(() => {
            fetchDashboardData()
        }, 30000)
    })

    onBeforeUnmount(() => {
        // 清除定时器
        if (refreshTimer) {
            clearInterval(refreshTimer)
            refreshTimer = null
        }
    })

    // Watch for changes in selectedCourseId to update analysis data
    watch(selectedCourseId, (newVal, oldVal) => {
        if (newVal !== oldVal) {
            updateAnalysis()
        }
    })

    return {
        loading,
        statistics,
        recentCourses,
        recentMessages,
        statCards,
        refreshActivity: fetchDashboardData,
        getCourseImage,
        viewCourse,
        todoItems,
        analysisData,
        selectedCourseId,
        courseOptions,
        updateAnalysis
    }
}
