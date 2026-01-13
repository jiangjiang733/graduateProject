/**
 * 学生端作业详情页逻辑
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStudentSubmission, getLabReportDetail } from '@/api/homework'

export function useHomeworkDetail() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)

    const homework = ref({})
    const submission = ref({})

    // 加载详情
    const loadDetail = async () => {
        loading.value = true
        try {
            const studentReportId = route.params.id

            // 获取学生提交详情
            const submissionResponse = await getStudentSubmission(studentReportId)
            submission.value = submissionResponse.data || {}

            // 获取作业详情
            const homeworkResponse = await getLabReportDetail(submission.value.reportId)
            homework.value = homeworkResponse.data || {}
        } catch (error) {
            console.error('加载详情失败:', error)
            ElMessage.error('加载详情失败')
        } finally {
            loading.value = false
        }
    }

    // 格式化日期
    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('zh-CN')
    }

    // 获取状态类型
    const getStatusType = (status) => {
        const typeMap = {
            0: 'info',
            1: 'warning',
            2: 'success'
        }
        return typeMap[status] || 'info'
    }

    // 获取状态文本
    const getStatusText = (status) => {
        const textMap = {
            0: '未提交',
            1: '已提交',
            2: '已批改'
        }
        return textMap[status] || '未提交'
    }

    // 修改提交
    const editSubmission = () => {
        router.push({
            name: 'student_homework_submit',
            params: { id: homework.value.reportId },
            query: { studentReportId: submission.value.studentReportId }
        })
    }

    // 返回
    const goBack = () => {
        router.push({ name: 'student_homework' })
    }

    // 题目列表
    const questionList = computed(() => {
        const qList = homework.value.questionList || homework.value.questions
        if (!qList) return []
        try {
            const parsed = typeof qList === 'string' ? JSON.parse(qList) : qList
            return parsed.map(q => {
                if (q.questionOptions && typeof q.questionOptions === 'string') {
                    try { q.options = JSON.parse(q.questionOptions) } catch (e) { q.options = [] }
                }
                return q
            })
        } catch (e) { return [] }
    })

    // 结构化答案
    const structuredAnswers = computed(() => {
        if (!submission.value.structuredAnswers) return []
        try {
            return JSON.parse(submission.value.structuredAnswers)
        } catch (e) { return [] }
    })

    // 实时出分逻辑
    const liveScore = computed(() => {
        // 如果老师已经批改了，显示最终得分
        if (submission.value.status === 2 && (submission.value.score !== null && submission.value.score !== undefined)) {
            return submission.value.score
        }

        // 否则，根据客观题对错立即计算预得分
        let total = 0
        questionList.value.forEach((q, index) => {
            // 仅针对客观题进行自动计分
            if (['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.questionType)) {
                if (isStudentCorrect(index, q)) {
                    total += (q.score || 0)
                }
            }
        })
        return total
    })

    // 获取题目类型文本
    const getQuestionTypeText = (type) => {
        const types = { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题' }
        return types[type] || type
    }

    // 格式化学生答案
    const formatStudentAnswer = (idx, q) => {
        const ansObj = structuredAnswers.value[idx]
        if (!ansObj) return ''
        const ans = ansObj.answer
        if (q.questionType === 'JUDGE') {
            if (ans === 'A' || ans === '正确') return 'A. 正确'
            if (ans === 'B' || ans === '错误') return 'B. 错误'
        }
        return ans
    }

    // 格式化正确答案
    const formatCorrectAnswer = (q) => {
        const ans = q.correctAnswer || q.answer
        if (q.questionType === 'JUDGE') {
            if (ans === 'A' || ans === '正确') return 'A. 正确'
            if (ans === 'B' || ans === '错误') return 'B. 错误'
        }
        return ans
    }

    // 判断学生是否答对
    const isStudentCorrect = (idx, q) => {
        const sAns = (getRawStudentAnswer(idx) || '').trim().toUpperCase()
        const cAns = (q.correctAnswer || q.answer || '').trim().toUpperCase()
        return sAns === cAns
    }

    // 获取原始学生答案
    const getRawStudentAnswer = (idx) => {
        const ansObj = structuredAnswers.value[idx]
        return ansObj ? ansObj.answer : ''
    }

    // 判断选项是否被学生选中
    const isOptionSelectedByStudent = (qIdx, q, optIndex) => {
        const sAns = getRawStudentAnswer(qIdx)
        const char = String.fromCharCode(65 + optIndex)
        if (q.questionType === 'MULTIPLE') {
            return sAns.includes(char)
        }
        return sAns === char
    }

    // 判断选项是否正确
    const isOptionCorrect = (q, optIndex) => {
        const cAns = (q.correctAnswer || q.answer || '')
        const char = String.fromCharCode(65 + optIndex)
        if (q.questionType === 'MULTIPLE') {
            return cAns.includes(char)
        }
        return cAns === char
    }

    onMounted(() => {
        loadDetail()
    })

    return {
        loading,
        homework,
        submission,
        questionList,
        structuredAnswers,
        liveScore,
        formatDate,
        getStatusType,
        getStatusText,
        editSubmission,
        goBack,
        getQuestionTypeText,
        formatStudentAnswer,
        formatCorrectAnswer,
        isStudentCorrect,
        getRawStudentAnswer,
        isOptionSelectedByStudent,
        isOptionCorrect
    }
}
