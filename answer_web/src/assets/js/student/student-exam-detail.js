import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api/exam'

export function useStudentExamDetail() {
    const route = useRoute()
    const router = useRouter()

    const examId = route.params.id
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')

    const exam = ref({})
    const questions = ref([])
    const loading = ref(true)
    const submitting = ref(false)

    const answers = reactive({}) // Map: index -> value (string)
    const multiAnswers = reactive({}) // Map: index -> array

    const currentIdx = ref(0)
    const questionRefs = ref({})
    const timeLeft = ref(0)
    let timerInterval = null

    // Load Exam
    const initExam = async () => {
        if (!studentId) {
            ElMessage.error('无法获取学生身份，请重新登录')
            return
        }

        try {
            const res = await api.getExamToTake(examId, studentId)
            if (res.success || res.code === 200) {
                const data = res.data
                exam.value = data.exam || {}
                questions.value = data.questions || []

                // Calculate remaining time
                const now = new Date().getTime()
                const end = new Date(exam.value.endTime).getTime()

                const timeUntilEnd = Math.max(0, Math.floor((end - now) / 1000))
                const durationSeconds = (exam.value.duration || 60) * 60

                timeLeft.value = Math.min(timeUntilEnd, durationSeconds)

                startTimer()

                // Init answers
                questions.value.forEach((q, i) => {
                    if (['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
                        multiAnswers[i] = []
                    } else {
                        answers[i] = ''
                    }
                })
            } else {
                ElMessage.error(res.message || '加载试卷失败')
            }
        } catch (err) {
            console.error(err)
            ElMessage.error('无法加载试卷，请联系管理员')
        } finally {
            loading.value = false
        }
    }

    const startTimer = () => {
        if (timerInterval) clearInterval(timerInterval)
        timerInterval = setInterval(() => {
            if (timeLeft.value > 0) {
                timeLeft.value--
            } else {
                clearInterval(timerInterval)
                forceSubmit()
            }
        }, 1000)
    }

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const parseOptions = (optsRaw) => {
        if (!optsRaw) return []
        try {
            return JSON.parse(optsRaw)
        } catch (e) {
            return []
        }
    }

    const hasAnswer = (idx) => {
        const q = questions.value[idx]
        if (!q) return false
        if (['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
            return multiAnswers[idx] && multiAnswers[idx].length > 0
        }
        return !!answers[idx]
    }

    const getOptionLabel = (idx) => String.fromCharCode(65 + idx)

    const getTypeLabel = (type) => {
        const map = { SINGLE: '单选', MULTIPLE: '多选', JUDGE: '判断', ESSAY: '简答', FILL_BLANK: '填空' }
        return map[type] || map[type?.split('_')[0]] || '未知'
    }

    const getTypeTag = (type) => {
        if (!type) return ''
        if (type.includes('SINGLE')) return ''
        if (type.includes('MULTIPLE')) return 'success'
        if (type.includes('JUDGE')) return 'warning'
        return 'info'
    }

    const scrollToQuestion = (idx) => {
        const el = questionRefs.value[idx]
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            currentIdx.value = idx
        }
    }

    const doSubmit = async () => {
        submitting.value = true
        const answerList = questions.value.map((q, idx) => {
            let ans = answers[idx]
            if (['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
                ans = (multiAnswers[idx] || []).sort().join('')
            }
            return {
                questionId: q.questionId,
                answer: ans || ''
            }
        })

        const payload = {
            examId: parseInt(examId),
            studentId: parseInt(studentId),
            answers: answerList,
            submitTime: new Date()
        }

        try {
            const res = await api.submitStudentExam(examId, payload)
            if (res.success || res.code === 200) {
                ElMessage.success('交卷成功！')
                router.replace('/student/dashboard')
            } else {
                ElMessage.error(res.message || '交卷失败')
            }
        } catch (err) {
            console.error(err)
            ElMessage.error('交卷发生错误，请联系监考老师')
        } finally {
            submitting.value = false
        }
    }

    const confirmSubmit = () => {
        const total = questions.value.length
        let answered = 0
        questions.value.forEach((q, i) => {
            if (hasAnswer(i)) answered++
        })

        const msg = answered < total
            ? `您还有 ${total - answered} 道题未作答，确定要交卷吗？`
            : '确定要提交试卷吗？提交后将无法修改。'

        ElMessageBox.confirm(msg, '交卷确认', {
            confirmButtonText: '确认交卷',
            cancelButtonText: '继续答题',
            type: 'warning'
        }).then(() => {
            doSubmit()
        })
    }

    const forceSubmit = () => {
        ElMessage.warning('考试时间到，正在自动交卷...')
        doSubmit()
    }

    onMounted(() => {
        initExam()
    })

    onBeforeUnmount(() => {
        if (timerInterval) clearInterval(timerInterval)
    })

    return {
        exam,
        questions,
        loading,
        submitting,
        answers,
        multiAnswers,
        currentIdx,
        questionRefs,
        timeLeft,
        formatDuration,
        parseOptions,
        hasAnswer,
        getOptionLabel,
        getTypeLabel,
        getTypeTag,
        scrollToQuestion,
        confirmSubmit,
        forceSubmit
    }
}
