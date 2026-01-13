import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

export function useStudentExamResult() {
    const route = useRoute()
    const loading = ref(true)
    const examInfo = ref({})
    const studentExam = ref({})
    const questions = ref([])
    const answers = ref([])

    // 分页逻辑
    const currentPage = ref(1)
    const pageSize = ref(5)

    const examId = route.params.id
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
    const studentName = ref(localStorage.getItem('studentName') || localStorage.getItem('username') || '未知考生')

    // 计算当前页展示的题目
    const paginatedQuestions = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        return questions.value.slice(start, start + pageSize.value)
    })

    // 翻译题型
    const translateType = (type) => {
        const map = {
            'SINGLE': '单选题', 'SINGLE_CHOICE': '单选题',
            'MULTIPLE': '多选题', 'MULTIPLE_CHOICE': '多选题',
            'JUDGE': '判断题', 'TRUE_FALSE': '判断题', 'JUDGEMENT': '判断题',
            'SHORT_ANSWER': '简答题'
        };
        return map[type] || '题目'
    }

    // 是否为选择题类型
    const isChoiceType = (type) => ['SINGLE', 'SINGLE_CHOICE', 'MULTIPLE', 'MULTIPLE_CHOICE', 'JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(type)

    // 获取某题的得分 (helper for getPartScore and template)
    const getQuestionScore = (q) => {
        const ans = answers.value.find(a => Number(a.questionId) === Number(q.questionId))
        return ans?.score || 0
    }

    // 获取题型分值统计
    const getPartScore = (types) => {
        return questions.value
            .filter(q => types.includes(q.questionType))
            .reduce((sum, q) => sum + getQuestionScore(q), 0)
    }

    // 解析选项
    const getOptions = (q) => {
        if (['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(q.questionType)) {
            return [{ key: 'A', value: '正确' }, { key: 'B', value: '错误' }]
        }
        if (!q.questionOptions) return []
        try {
            const parsed = typeof q.questionOptions === 'string' ? JSON.parse(q.questionOptions) : q.questionOptions
            return Array.isArray(parsed) ? parsed.map((opt, index) => ({
                key: String.fromCharCode(65 + index),
                value: typeof opt === 'object' ? opt.text : opt
            })) : []
        } catch (e) { return [] }
    }

    // 获取考生针对某题的回答
    const getStudentAnswer = (q) => {
        const ans = answers.value.find(a => Number(a.questionId) === Number(q.questionId))
        return ans?.studentAnswer || ''
    }

    // 题目对错状态标识
    const getAnswerStatus = (q) => {
        const score = getQuestionScore(q)
        return Number(score) === Number(q.score) ? { type: 'success' } : { type: 'danger' }
    }

    // 判断某选项是否被选中
    const isSelectedOption = (q, key) => {
        const ans = getStudentAnswer(q)
        if (!ans) return false
        return ans.split(',').includes(key) || ans.includes(key)
    }

    // 判断某选项是否为正确答案
    const isCorrectOption = (q, key) => q.answer?.includes(key)

    // 判断某选项是否选错
    const isWrongOption = (q, key) => isSelectedOption(q, key) && !isCorrectOption(q, key)

    // 动态绑定选项类名
    const getOptClass = (q, key) => ({
        'is-correct': isCorrectOption(q, key),
        'is-wrong': isWrongOption(q, key),
        'is-selected': isSelectedOption(q, key)
    })

    const jumpToQuestion = (index, questionId) => {
        const targetPage = Math.floor(index / pageSize.value) + 1
        if (currentPage.value !== targetPage) {
            currentPage.value = targetPage
        }
        nextTick(() => {
            const element = document.getElementById(`question-${questionId}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } else {
                window.scrollTo({ top: 180, behavior: 'smooth' })
            }
        })
    }

    const handlePrint = () => {
        window.print()
    }

    const loadExamResult = async () => {
        try {
            const [eRes, rRes] = await Promise.all([
                request.get(`/exam/${examId}`),
                request.get(`/student/exam/${examId}/result`, { params: { studentId } })
            ])

            if (eRes.data) {
                examInfo.value = eRes.data.exam || eRes.data
                questions.value = eRes.data.questions || []
            }

            if (rRes.data) {
                studentExam.value = rRes.data.studentExam || rRes.data
                answers.value = rRes.data.answers || []
                if (studentExam.value.studentName) {
                    studentName.value = studentExam.value.studentName
                }
            }
        } catch (e) {
            ElMessage.error('同步后端数据失败，请检查网络')
            console.error(e)
        } finally {
            loading.value = false
        }
    }

    onMounted(loadExamResult)

    return {
        loading,
        examInfo,
        studentExam,
        questions,
        answers,
        currentPage,
        pageSize,
        studentName,
        studentId,
        paginatedQuestions,
        translateType,
        isChoiceType,
        getPartScore,
        getOptions,
        getStudentAnswer,
        getQuestionScore,
        isCorrectOption,
        isWrongOption,
        getOptClass,
        getAnswerStatus,
        jumpToQuestion,
        handlePrint
    }
}
