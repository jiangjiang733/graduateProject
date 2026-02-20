import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLabReportDetail, updateLabReport } from '@/api/homework.js'
import { useHomeworkManagement } from './homework-management.js'

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
            if (response.success && response.data) {
                const data = response.data
                // 数据字段纠偏：兼容后端多种返回格式 (snake_case, camelCase)
                homework.value = {
                    ...data,
                    // 基本信息
                    reportId: data.reportId || data.id,
                    reportTitle: data.reportTitle || data.title || data.report_title,
                    reportDescription: data.reportDescription || data.description || data.report_description,
                    courseId: data.courseId || data.course_id,
                    courseName: data.courseName || data.course_name,
                    deadline: data.deadline || data.deadline_time,
                    totalScore: data.totalScore || data.total_score || 0,
                    status: data.status !== undefined ? Number(data.status) : 1,

                    // 核心逻辑：响应后端的统计数据字段
                    submittedCount: data.submittedCount !== undefined ? data.submittedCount : (data.submitted_count || data.report_submitted_count || 0),
                    totalStudents: data.totalStudents !== undefined ? data.totalStudents : (data.total_students || data.student_count || 0),
                    gradedCount: data.gradedCount !== undefined ? data.gradedCount : (data.graded_count || 0)
                }

                // 如果发现课程名称缺失，尝试从课程列表补全 (这一步可以根据需要开启)
                if (!homework.value.courseName && homework.value.courseId) {
                    console.log('检测到课程名称缺失，建议补充课程查询逻辑')
                }
                await loadSubmissionStats(id)
            }
        } catch (error) {
            console.error('获取详情失败:', error)
            ElMessage.error('获取详情失败')
        } finally {
            loading.value = false
        }
    }

    // 新增：通过提交列表获取统计数据
    const loadSubmissionStats = async (reportId) => {
        try {
            const { getSubmissions } = await import('@/api/homework.js')
            const res = await getSubmissions(reportId)
            if (res.success && res.data) {
                const submissions = Array.isArray(res.data) ? res.data : (res.data.list || res.data.records || [])
                const submittedCount = submissions.filter(s => s.submitTime || s.submit_time).length
                const totalStudents = submissions.length
                const gradedCount = submissions.filter(s => s.score !== null && s.score !== undefined).length

                // 只有在有数据时才更新
                if (totalStudents > 0) {
                    homework.value.submittedCount = submittedCount
                    homework.value.totalStudents = totalStudents
                    homework.value.gradedCount = gradedCount
                    console.log('通过提交列表计算统计：', {
                        提交人数: submittedCount,
                        总人数: totalStudents,
                        已批改: gradedCount
                    })
                }
            }
        } catch (err) {
            console.warn('获取提交统计失败，使用默认值', err)
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

    // 实时计算作业状态
    const currentStatus = computed(() => {
        const status = Number(homework.value.status)

        // 如果是草稿，直接返回草稿状态
        if (status === 0) {
            return 0
        }

        // 检查截止时间
        if (homework.value.deadline) {
            const now = new Date()
            const deadline = new Date(homework.value.deadline)

            // 如果当前时间已经超过截止时间，状态应该是"已截止"
            if (now > deadline) {
                return 2
            }
        }

        // 否则返回原始状态
        return status
    })

    const getStatusType = (status) => {
        const actualStatus = typeof status === 'number' ? status : currentStatus.value
        const types = { 1: 'success', 2: 'info', 0: 'warning' }
        return types[actualStatus] || 'info'
    }

    const getStatusText = (status) => {
        const actualStatus = typeof status === 'number' ? status : currentStatus.value
        const texts = { 1: '正在进行', 2: '已截止', 0: '草稿' }
        return texts[actualStatus] || '未知'
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

    // 按题型排序分组逻辑 (极致稳健版)
    const groupedQuestions = computed(() => {
        const rawList = questionList.value || []
        if (!Array.isArray(rawList) || rawList.length === 0) return []

        // 先给所有题打上全局序号
        const indexedList = rawList.map((q, i) => ({ ...q, globalIndex: i + 1 }))

        // 定义有序分类
        const categories = [
            { id: 1, name: '一、单选题', keys: ['SINGLE', '1', 'SINGLE_CHOICE'] },
            { id: 2, name: '二、多选题', keys: ['MULTIPLE', '2', 'MULTIPLE_CHOICE'] },
            { id: 3, name: '三、判断题', keys: ['JUDGE', '3', 'JUDGEMENT', 'TRUE_FALSE'] },
            { id: 4, name: '四、填空题', keys: ['COMPLETION', '4', 'FILL', 'FILL_BLANK'] },
            { id: 5, name: '五、简答题', keys: ['ESSAY', '5', 'SHORT', 'SHORT_ANSWER', 'ESSAY_QUESTION'] }
        ]

        const result = []

        // 1. 按照分类顺序提取
        categories.forEach(cat => {
            const matches = indexedList.filter(q => {
                const type = String(q.questionType || '').toUpperCase()
                return cat.keys.includes(type)
            })
            if (matches.length > 0) {
                result.push({
                    typeName: cat.name,
                    questions: matches
                })
            }
        })

        // 2. 兜底处理：如果有题目没匹配到上述类型，归入“其他”
        const otherMatches = indexedList.filter(q => {
            const type = String(q.questionType || '').toUpperCase()
            return !categories.some(cat => cat.keys.includes(type))
        })
        if (otherMatches.length > 0) {
            result.push({
                typeName: '其他题型',
                questions: otherMatches
            })
        }

        return result
    })

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

    // 引入作业管理逻辑（用于编辑弹窗）
    // autoLoad=false: 不自动加载列表
    // onSuccess=loadDetail: 编辑成功后刷新详情页
    const management = useHomeworkManagement(false, loadDetail)

    const editHomework = () => {
        // 构造符合管理组件要求的数据格式
        const homeworkData = {
            id: homework.value.reportId || homework.value.id,
            title: homework.value.reportTitle,
            courseId: homework.value.courseId,
            description: homework.value.reportDescription,
            deadline: homework.value.deadline,
            totalScore: homework.value.totalScore,
            // 处理题目列表
            questions: questionList.value
        }
        // 调用 management 的编辑方法，会打开弹窗
        management.editHomework(homeworkData)
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
        currentStatus,
        getStatusType,
        getStatusText,
        questionList,
        groupedQuestions,
        getQuestionTypeText,
        getQuestionTypeTag,
        parseOptions,
        isCorrect,
        formatDate,
        editHomework,
        goToGrading,
        closeHomework,

        // 从 management 导出编辑弹窗相关的状态和方法
        dialogVisible: management.dialogVisible,
        homeworkForm: management.homeworkForm,
        isEdit: management.isEdit,
        submitting: management.submitting,
        formRef: management.formRef,
        courses: management.courses,
        fileList: management.fileList,
        rules: management.rules,

        // 题库相关
        bankDialogVisible: management.bankDialogVisible,
        bankLoading: management.bankLoading,
        bankQuestions: management.bankQuestions,
        bankFilter: management.bankFilter,
        bankPagination: management.bankPagination,
        selectedQuestions: management.selectedQuestions,
        openQuestionBank: management.openQuestionBank,
        searchBank: management.searchBank,
        handleBankSelection: management.handleBankSelection,
        confirmImportQuestions: management.confirmImportQuestions,

        // AI 生成相关
        aiDialogVisible: management.aiDialogVisible,
        aiLoading: management.aiLoading,
        aiForm: management.aiForm,
        openAiDialog: management.openAiDialog,
        handleAiGenerate: management.handleAiGenerate,

        // 题目编辑相关
        editQuestionDialogVisible: management.editQuestionDialogVisible,
        editingQuestion: management.editingQuestion,
        openEditQuestion: management.openEditQuestion,
        saveEditQuestion: management.saveEditQuestion,
        addOption: management.addOption,
        removeOption: management.removeOption,

        // 其他方法
        handleFileChange: management.handleFileChange,
        saveAsDraft: management.saveAsDraft,
        submitHomework: management.submitHomework,
        removeHomeworkQuestion: management.removeHomeworkQuestion,
        moveHomeworkQuestion: management.moveHomeworkQuestion,
        calculateHomeworkTotalScore: management.calculateHomeworkTotalScore,
        saveToBank: management.saveToBank
    }
}
