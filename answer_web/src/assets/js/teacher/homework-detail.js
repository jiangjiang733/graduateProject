import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLabReportDetail, updateLabReport } from '@/api/homework.js'

export function useHomeworkDetail() {
    const route = useRoute()
    const router = useRouter()
    const homework = ref({})
    const loading = ref(false)

    const loadDetail = async () => {
        loading.value = true
        try {
            const id = route.params.id
            const response = await getLabReportDetail(id)
            if (response.success) {
                homework.value = response.data
            }
        } catch (error) {
            ElMessage.error('获取详情失败')
        } finally {
            loading.value = false
        }
    }

    const descriptionLines = computed(() => {
        if (!homework.value.reportDescription) return ['暂无描述内容']
        return homework.value.reportDescription.split('\n')
    })

    const submitPercentage = computed(() => {
        if (!homework.value.totalStudents) return 0
        return Math.round((homework.value.submittedCount / homework.value.totalStudents) * 100)
    })

    const getStatusType = (status) => {
        const types = { 1: 'success', 2: 'info', 0: 'warning' }
        return types[status] || 'info'
    }

    const getStatusText = (status) => {
        const texts = { 1: '正在进行', 2: '已截止', 0: '草稿' }
        return texts[status] || '未知'
    }

    const questionList = computed(() => {
        const qList = homework.value.questionList || homework.value.questions
        if (!qList) return []
        try {
            return typeof qList === 'string' ? JSON.parse(qList) : qList
        } catch (e) {
            console.error('解析题目失败', e)
            return []
        }
    })

    const getQuestionTypeText = (type) => {
        const types = {
            1: '单选题', 'SINGLE': '单选题',
            2: '多选题', 'MULTIPLE': '多选题',
            3: '判断题', 'JUDGE': '判断题',
            4: '填空题', 'COMPLETION': '填空题',
            5: '简答题', 'ESSAY': '简答题'
        }
        return types[type] || type || '未知'
    }

    const getQuestionTypeTag = (type) => {
        const maps = { SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info' }
        return maps[type] || ''
    }

    const parseOptions = (json) => {
        try {
            return typeof json === 'string' ? JSON.parse(json) : json
        } catch (e) { return [] }
    }

    const isCorrect = (opt, idx, q) => {
        const ans = q.correctAnswer || q.answer
        if (!ans) return false
        const ansStr = String(ans)
        const char = String.fromCharCode(65 + idx)
        return ansStr.includes(char) || ansStr === String(idx)
    }

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('zh-CN')
    }

    const editHomework = () => {
        router.push(`/teacher/homework`) // Back to list where edit dialog is managed
    }

    const goToGrading = () => {
        router.push(`/teacher/homework/${homework.value.reportId}/grade`)
    }

    const closeHomework = async () => {
        try {
            await ElMessageBox.confirm('确定要提前截止该作业吗？', '操作确认')
            const formData = new FormData()
            formData.append('status', 2)
            const response = await updateLabReport(homework.value.reportId, formData)
            if (response.success) {
                ElMessage.success('作业已截止')
                loadDetail()
            }
        } catch (e) { }
    }

    onMounted(loadDetail)

    return {
        homework,
        loading,
        descriptionLines,
        submitPercentage,
        getStatusType,
        getStatusText,
        questionList,
        getQuestionTypeText,
        getQuestionTypeTag,
        parseOptions,
        isCorrect,
        formatDate,
        editHomework,
        goToGrading,
        closeHomework
    }
}
