import { ref, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { getCourseList } from '@/api/course'

export function useExamManagement() {
    const router = useRouter()
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const submitting = ref(false)
    const formRef = ref(null)

    const courses = ref([])
    const exams = ref([])
    const filterForm = reactive({
        courseId: '',
        status: '',
        keyword: ''
    })

    const examForm = reactive({
        examId: null,
        examTitle: '',
        courseId: '',
        startTime: '',
        endTime: '',
        duration: 120,
        totalScore: 100,
        passScore: 60,
        status: 'DRAFT',
        timeRange: []
    })

    const rules = {
        examTitle: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
        courseId: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
        timeRange: [{ required: true, message: '请选择考试时间', type: 'array', trigger: 'change' }]
    }

    // 监听总分变化，自动计算及格分
    watch(() => examForm.totalScore, (val) => {
        examForm.passScore = Math.floor(val * 0.6)
    })

    // 监听时间范围变化
    watch(() => examForm.timeRange, (val) => {
        if (val && val.length === 2) {
            examForm.startTime = val[0]
            examForm.endTime = val[1]
        } else {
            examForm.startTime = ''
            examForm.endTime = ''
        }
    })

    const loadCourses = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) return
            const res = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })
            if (res.success && res.data) {
                courses.value = res.data.list || []
            }
        } catch (e) {
            console.error('加载课程失败', e)
        }
    }

    const loadExams = async () => {
        loading.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            if (!teacherId) {
                console.error('无法获取教师ID')
                return
            }

            let examsData = []

            // 如果有筛选条件，使用搜索接口
            if (filterForm.courseId || filterForm.status || filterForm.keyword) {
                const searchParams = {
                    teacherId,
                    courseId: filterForm.courseId || undefined,
                    status: filterForm.status || undefined,
                    keyword: filterForm.keyword || undefined
                }
                const res = await request.get('/exam/search', { params: searchParams })
                if ((res.success || res.code === 200) && res.data) {
                    examsData = res.data
                }
            } else {
                // 没有筛选条件，获取教师所有考试
                const res = await request.get(`/exam/teacher/${teacherId}`)
                if ((res.success || res.code === 200) && res.data) {
                    examsData = res.data
                }
            }

            // 数据映射处理
            exams.value = examsData.map(exam => {
                // 基础映射
                let mappedExam = {
                    ...exam,
                    examId: exam.examId || exam.exam_id || exam.id,
                    examTitle: exam.examTitle || exam.exam_title || exam.title,
                    courseId: exam.courseId || exam.course_id || (exam.course && (exam.course.id || exam.course.courseId)),
                    courseName: exam.courseName || exam.course_name || exam.courseTitle ||
                        (exam.course && (exam.course.courseName || exam.course.course_name || exam.course.title))
                }

                // 如果没有课程名称，尝试从已加载的课程列表中查找绑定
                if (!mappedExam.courseName && mappedExam.courseId && courses.value.length > 0) {
                    const course = courses.value.find(c =>
                        String(c.id) === String(mappedExam.courseId) ||
                        String(c.courseId) === String(mappedExam.courseId)
                    )
                    if (course) {
                        mappedExam.courseName = course.courseName || course.name || course.title || course.courseTitle
                        console.log('已补充列表课程名:', mappedExam.courseName)
                    }
                }

                // 如果还是没有，显示未分配
                if (!mappedExam.courseName) mappedExam.courseName = '未分配课程'

                return mappedExam
            })

        } catch (e) {
            console.error('加载考试列表失败', e)
            ElMessage.error('加载考试列表失败')
        } finally {
            loading.value = false
        }
    }

    const showCreateDialog = () => {
        isEdit.value = false
        Object.assign(examForm, {
            examId: null,
            examTitle: '',
            courseId: '',
            startTime: '',
            endTime: '',
            duration: 120,
            totalScore: 100,
            passScore: 60,
            status: 'DRAFT',
            timeRange: []
        })
        dialogVisible.value = true
    }

    const saveAsDraft = async () => {
        examForm.status = 'DRAFT'
        await handleFormSubmit()
    }

    const submitExam = async () => {
        examForm.status = 'PUBLISHED'
        await handleFormSubmit()
    }

    const handleFormSubmit = async () => {
        if (!formRef.value) return
        await formRef.value.validate(async (valid) => {
            if (valid) {
                submitting.value = true
                try {
                    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
                    const data = { ...examForm, teacherId }
                    let res
                    if (isEdit.value) {
                        res = await request.put(`/exam/${examForm.examId}`, data)
                    } else {
                        res = await request.post('/exam', data)
                    }
                    if (res.data) {
                        ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
                        dialogVisible.value = false
                        loadExams()
                    }
                } catch (e) {
                    ElMessage.error('保存失败')
                } finally {
                    submitting.value = false
                }
            }
        })
    }

    const viewExam = (exam) => {
        router.push(`/teacher/exam/${exam.examId}`)
    }

    const manageQuestions = (exam) => {
        router.push(`/teacher/exam/${exam.examId}/questions`)
    }

    const viewScores = (exam) => {
        // 成绩通常在详情页底部，或者跳转到详情页
        router.push(`/teacher/exam/${exam.examId}/scores`)
    }

    const editExam = (exam) => {
        isEdit.value = true
        Object.assign(examForm, exam)
        if (exam.startTime && exam.endTime) {
            examForm.timeRange = [exam.startTime, exam.endTime]
        }
        dialogVisible.value = true
    }

    const publishExam = async (exam) => {
        try {
            await ElMessageBox.confirm('确定要发布该考试吗？发布后部分信息将无法修改', '提示')
            const res = await request.put(`/exam/${exam.examId}/publish`)
            if (res.data) {
                ElMessage.success('发布成功')
                loadExams()
            }
        } catch (e) { }
    }

    const deleteExam = async (exam) => {
        try {
            await ElMessageBox.confirm('确定要删除该考试吗？此操作不可逆', '警告', { type: 'error' })
            const res = await request.delete(`/exam/${exam.examId}`)
            if (res.data) {
                ElMessage.success('删除成功')
                loadExams()
            }
        } catch (e) { }
    }

    const getStatusType = (status) => {
        const map = {
            'DRAFT': 'info',
            'PUBLISHED': 'primary',
            'ONGOING': 'success',
            'ENDED': 'danger'
        }
        return map[status] || 'info'
    }

    const getStatusText = (status) => {
        const map = {
            'DRAFT': '草稿',
            'PUBLISHED': '已发布',
            'ONGOING': '进行中',
            'ENDED': '已结束'
        }
        return map[status] || status
    }

    const formatDate = (date) => {
        if (!date) return '-'
        const d = new Date(date)
        return d.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    onMounted(async () => {
        await loadCourses()
        await loadExams()
    })

    return {
        loading,
        dialogVisible,
        isEdit,
        submitting,
        formRef,
        courses,
        exams,
        filterForm,
        examForm,
        rules,
        loadExams,
        showCreateDialog,
        saveAsDraft,
        submitExam,
        viewExam,
        manageQuestions,
        viewScores,
        editExam,
        publishExam,
        deleteExam,
        getStatusType,
        getStatusText,
        formatDate
    }
}
