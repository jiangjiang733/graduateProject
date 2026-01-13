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
    const timeRange = ref([])

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
        status: 'DRAFT'
    })

    const rules = {
        examTitle: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
        courseId: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
        timeRange: [{ required: true, message: '请选择考试时间', trigger: 'change' }]
    }

    // 监听总分变化，自动计算及格分
    watch(() => examForm.totalScore, (val) => {
        examForm.passScore = Math.floor(val * 0.6)
    })

    // 监听时间范围变化
    watch(timeRange, (val) => {
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

            // 如果有筛选条件，使用搜索接口
            if (filterForm.courseId || filterForm.status || filterForm.keyword) {
                const searchParams = {
                    teacherId,
                    courseId: filterForm.courseId || undefined,
                    status: filterForm.status || undefined,
                    keyword: filterForm.keyword || undefined
                }
                const res = await request.get('/exam/search', { params: searchParams })
                if (res.success && res.data) {
                    exams.value = res.data
                } else if (res.data) {
                    exams.value = res.data
                }
            } else {
                // 没有筛选条件，获取教师所有考试
                const res = await request.get(`/exam/teacher/${teacherId}`)
                if (res.success && res.data) {
                    exams.value = res.data
                } else if (res.data) {
                    exams.value = res.data
                }
            }
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
            status: 'DRAFT'
        })
        timeRange.value = []
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
                        res = await request.post('/exam/create', data)
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
        router.push(`/teacher/exam-detail/${exam.examId}`)
    }

    const manageQuestions = (exam) => {
        router.push(`/teacher/exam-questions/${exam.examId}`)
    }

    const viewScores = (exam) => {
        router.push(`/teacher/exam-scores/${exam.examId}`)
    }

    const editExam = (exam) => {
        isEdit.value = true
        Object.assign(examForm, exam)
        if (exam.startTime && exam.endTime) {
            timeRange.value = [exam.startTime, exam.endTime]
        }
        dialogVisible.value = true
    }

    const publishExam = async (exam) => {
        try {
            await ElMessageBox.confirm('确定要发布该考试吗？发布后部分信息将无法修改', '提示')
            const res = await request.post(`/exam/${exam.examId}/publish`)
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

    onMounted(() => {
        loadCourses()
        loadExams()
    })

    return {
        loading,
        dialogVisible,
        isEdit,
        submitting,
        formRef,
        courses,
        exams,
        timeRange,
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
