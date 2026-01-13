import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLabReportDetail, getSubmissions, gradeLabReport } from '@/api/homework.js'

export function useHomeworkGrade() {
    const route = useRoute()
    const router = useRouter()

    const homework = ref({})
    const submissions = ref([])
    const loading = ref(false)
    const searchKeyword = ref('')
    const currentSubmission = ref(null)
    const activeTab = ref('content')
    const submitting = ref(false)

    const gradeForm = reactive({
        score: 0,
        teacherComment: ''
    })

    // 题目相关逻辑
    const questionList = computed(() => {
        const qList = homework.value.questionList || homework.value.questions
        if (!qList) return []
        try {
            return typeof qList === 'string' ? JSON.parse(qList) : qList
        } catch (e) { return [] }
    })

    const getStudentAnswer = (idx, q) => {
        if (!currentSubmission.value?.structuredAnswers) return ''
        try {
            const ansList = JSON.parse(currentSubmission.value.structuredAnswers)
            return ansList[idx]?.answer || ''
        } catch (e) { return '' }
    }

    const getCorrectAnswer = (q) => {
        return q.correctAnswer || q.answer || ''
    }

    const isCorrect = (idx, q) => {
        const sAns = getStudentAnswer(idx, q)
        const cAns = getCorrectAnswer(q)
        if (!sAns || !cAns) return false
        return String(sAns).trim() === String(cAns).trim()
    }

    const applyAutoScore = (showMessage = true) => {
        let total = 0
        questionList.value.forEach((q, idx) => {
            if (['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.questionType)) {
                if (isCorrect(idx, q)) {
                    total += (q.score || 0)
                }
            }
        })
        gradeForm.score = total
        if (showMessage) {
            ElMessage.success(`客观题自动评分为: ${total} 分`)
        }
    }

    const selectSubmission = (sub) => {
        currentSubmission.value = sub
        gradeForm.score = sub.score || 0
        gradeForm.teacherComment = sub.teacherComment || ''

        if (questionList.value.length > 0) {
            activeTab.value = 'questions'
            if (sub.status !== 2 && (!sub.score || sub.score === 0)) {
                applyAutoScore(false)
            }
        } else if (sub.attachmentUrl) {
            activeTab.value = 'attachment'
        } else {
            activeTab.value = 'content'
        }
    }

    const loadData = async () => {
        loading.value = true
        try {
            const id = route.params.id
            const hwRes = await getLabReportDetail(id)
            if (hwRes.success) homework.value = hwRes.data

            const subRes = await getSubmissions(id)
            if (subRes.success) {
                submissions.value = subRes.data || []
                if (!currentSubmission.value && submissions.value.length > 0) {
                    selectSubmission(submissions.value[0])
                }
            }
        } catch (error) {
            ElMessage.error('加载数据失败')
        } finally {
            loading.value = false
        }
    }

    const filteredSubmissions = computed(() => {
        if (!searchKeyword.value) return submissions.value
        const kw = searchKeyword.value.toLowerCase()
        return submissions.value.filter(s =>
            s.studentName.toLowerCase().includes(kw) ||
            (s.studentId && s.studentId.toLowerCase().includes(kw))
        )
    })

    const gradedCount = computed(() => {
        return submissions.value.filter(s => s.status === 2).length
    })

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('zh-CN')
    }

    const downloadFile = (url) => {
        const link = document.createElement('a')
        link.href = `/api/${url}`
        link.download = ''
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const submitGrade = async () => {
        if (!currentSubmission.value) return

        submitting.value = true
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await gradeLabReport(currentSubmission.value.studentReportId, {
                score: gradeForm.score,
                teacherComment: gradeForm.teacherComment,
                teacherId: teacherId
            })

            if (response.success) {
                ElMessage.success('批改成功')
                currentSubmission.value.status = 2
                currentSubmission.value.score = gradeForm.score
                currentSubmission.value.teacherComment = gradeForm.teacherComment

                const pendingIndex = submissions.value.findIndex(s => s.status !== 2)
                if (pendingIndex !== -1) {
                    selectSubmission(submissions.value[pendingIndex])
                }
            }
        } catch (e) {
            ElMessage.error('批改保存失败')
        } finally {
            submitting.value = false
        }
    }

    const getQuestionTypeText = (type) => {
        const types = { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题' }
        return types[type] || type
    }

    onMounted(loadData)

    return {
        homework,
        submissions,
        loading,
        searchKeyword,
        currentSubmission,
        activeTab,
        submitting,
        gradeForm,
        questionList,
        filteredSubmissions,
        gradedCount,
        selectSubmission,
        formatDate,
        downloadFile,
        submitGrade,
        getStudentAnswer,
        getCorrectAnswer,
        isCorrect,
        applyAutoScore,
        getQuestionTypeText
    }
}
