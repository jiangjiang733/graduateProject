import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLabReportDetail, getStudentSubmission, submitLabReport as submitLabReportAPI } from '@/api/homework'

export function useHomeworkSubmit() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const submitting = ref(false)
    const formRef = ref(null)
    const uploadRef = ref(null)

    const homework = ref({})
    const fileList = ref([])
    const currentFile = ref(null)

    const submitForm = reactive({
        content: '',
        answers: {},
        multiAnswers: {}
    })

    // 从localStorage获取学生信息
    const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId')
    const studentName = localStorage.getItem('studentName') || localStorage.getItem('username') || localStorage.getItem('s_name') || '学生'

    const getQuestionTypeText = (type) => {
        const types = { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题' }
        return types[type] || type
    }

    const getQuestionTypeTag = (type) => {
        const tags = { SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info' }
        return tags[type] || ''
    }

    const rules = {
        content: [
            { required: false, trigger: 'blur' }
        ]
    }

    const isOverdue = computed(() => {
        if (!homework.value.deadline) return false
        return new Date(homework.value.deadline) < new Date()
    })

    const loadHomework = async () => {
        loading.value = true
        try {
            const reportId = route.params.id
            const response = await getLabReportDetail(reportId)
            const data = response.data || {}

            if (data.questionList) {
                try {
                    data.questionList = typeof data.questionList === 'string' ? JSON.parse(data.questionList) : data.questionList
                    data.questionList.forEach((q, idx) => {
                        submitForm.answers[idx] = ''
                        if (q.questionType === 'MULTIPLE') {
                            submitForm.multiAnswers[idx] = []
                        }
                        if (q.questionOptions) {
                            try {
                                q.options = typeof q.questionOptions === 'string' ? JSON.parse(q.questionOptions) : q.questionOptions
                            } catch (e) { q.options = [] }
                        }
                    })
                } catch (e) {
                    console.error('解析题目失败:', e)
                    data.questionList = []
                }
            }

            homework.value = data

            const studentReportId = route.query.studentReportId
            if (studentReportId) {
                const subRes = await getStudentSubmission(studentReportId)
                if (subRes && subRes.data) {
                    const subData = subRes.data
                    submitForm.content = subData.content

                    if (subData.structuredAnswers) {
                        try {
                            const sAns = JSON.parse(subData.structuredAnswers)
                            sAns.forEach((item, idx) => {
                                if (item.type === 'MULTIPLE') {
                                    submitForm.multiAnswers[idx] = item.answer ? item.answer.split('') : []
                                } else {
                                    submitForm.answers[idx] = item.answer
                                }
                            })
                        } catch (e) {
                            console.error('解析已提交答案失败:', e)
                        }
                    }

                    if (subData.attachmentUrl) {
                        fileList.value = [{ name: '已上传的附件 (修改将覆盖)', url: subData.attachmentUrl }]
                    }
                }
            }
        } catch (error) {
            console.error('加载作业失败:', error)
            ElMessage.error('加载作业失败')
        } finally {
            loading.value = false
        }
    }

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('zh-CN')
    }

    const handleFileChange = (file, fileList) => {
        if (file.size > 10 * 1024 * 1024) {
            ElMessage.error('文件大小不能超过10MB')
            fileList.pop()
            return
        }
        currentFile.value = file.raw
    }

    const submitHomework = async () => {
        const hasQuestions = homework.value.questionList?.length > 0

        if (!hasQuestions && formRef.value) {
            const valid = await formRef.value.validate().catch(() => false)
            if (!valid) return
        }

        try {
            await ElMessageBox.confirm('确认提交作业吗?', '提示', {
                confirmButtonText: '确认提交',
                cancelButtonText: '取消',
                type: 'warning'
            })

            submitting.value = true

            const structuredAnswers = homework.value.questionList?.map((q, idx) => {
                let ans = submitForm.answers[idx]
                if (q.questionType === 'MULTIPLE') {
                    ans = (submitForm.multiAnswers[idx] || []).sort().join('')
                }
                return {
                    type: q.questionType,
                    content: q.questionContent,
                    answer: ans || ''
                }
            }) || []

            const submissionData = {
                studentId: studentId,
                studentName: studentName,
                content: submitForm.content || '',
                structuredAnswers: JSON.stringify(structuredAnswers)
            }

            const response = await submitLabReportAPI(route.params.id, submissionData, currentFile.value)
            const resId = response.data?.studentReportId || response.studentReportId || route.query.studentReportId

            ElMessage.success('作业提交成功')

            if (hasQuestions && resId) {
                router.push({ name: 'student_homework_detail', params: { id: resId } })
            } else {
                router.push({ name: 'student_homework' })
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('提交失败:', error)
                ElMessage.error(error.response?.data?.message || '提交失败')
            }
        } finally {
            submitting.value = false
        }
    }

    const goBack = () => {
        router.back()
    }

    onMounted(() => {
        loadHomework()
    })

    return {
        loading,
        submitting,
        formRef,
        uploadRef,
        homework,
        fileList,
        submitForm,
        isOverdue,
        getQuestionTypeText,
        getQuestionTypeTag,
        rules,
        formatDate,
        handleFileChange,
        submitHomework,
        goBack,
        route
    }
}
