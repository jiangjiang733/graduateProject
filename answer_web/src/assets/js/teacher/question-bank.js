import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestionList, createQuestion, updateQuestion, deleteQuestion } from '@/api/question.js'
import { getCourseList } from '@/api/course.js'

export function useQuestionBank() {
    const filter = ref({ type: '', difficulty: '', keyword: '', courseId: '' })
    const questions = ref([])
    const courses = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const pagination = ref({ current: 1, size: 6, total: 0 })

    const form = ref({
        courseId: '',
        type: 'SINGLE',
        difficulty: 1,
        content: '',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
        correctIndex: 0,
        answer: ''
    })

    const getTeacherId = () => localStorage.getItem('teacherId') || '1'

    const loadCourses = async () => {
        const res = await getCourseList({ pageNumber: 1, pageSize: 100, teacherId: getTeacherId() })
        if (res.success) courses.value = res.data.list
    }

    const loadQuestions = async () => {
        loading.value = true
        try {
            const res = await getQuestionList({
                pageNum: pagination.value.current,
                pageSize: pagination.value.size,
                teacherId: getTeacherId(),
                ...filter.value
            })
            if (res.success) {
                questions.value = res.data.records.map(q => {
                    if (typeof q.options === 'string') q.options = JSON.parse(q.options)
                    return q
                })
                pagination.value.total = res.data.total
            }
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        pagination.value.current = 1
        loadQuestions()
    }

    const openCreateDialog = () => {
        isEdit.value = false
        form.value = {
            courseId: courses.value[0]?.id || '',
            type: 'SINGLE',
            difficulty: 1,
            content: '',
            options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
            correctIndex: 0,
            answer: ''
        }
        dialogVisible.value = true
    }

    const editQuestion = (q) => {
        isEdit.value = true
        const qCopy = JSON.parse(JSON.stringify(q))
        if (qCopy.type === 'SINGLE') {
            qCopy.correctIndex = qCopy.options.findIndex(o => o.isCorrect)
        }
        form.value = qCopy
        dialogVisible.value = true
    }

    const saveQuestion = async () => {
        const data = JSON.parse(JSON.stringify(form.value))
        data.teacherId = getTeacherId()

        if (['SINGLE', 'MULTIPLE', 'JUDGE'].includes(data.type)) {
            if (data.type === 'SINGLE') {
                data.options.forEach((o, i) => (o.isCorrect = i === data.correctIndex))
                data.answer = String.fromCharCode(65 + data.correctIndex)
            } else if (data.type === 'MULTIPLE') {
                const correctChars = data.options
                    .map((o, i) => (o.isCorrect ? String.fromCharCode(65 + i) : null))
                    .filter(c => c !== null)
                data.answer = correctChars.join('')
            } else if (data.type === 'JUDGE') {
                data.options = [
                    { text: '正确', isCorrect: data.answer === 'A' },
                    { text: '错误', isCorrect: data.answer === 'B' }
                ]
            }
            data.options = JSON.stringify(data.options)
        } else {
            data.options = null
        }

        delete data.correctIndex

        try {
            const res = isEdit.value ? await updateQuestion(data) : await createQuestion(data)
            if (res.success) {
                ElMessage.success('操作成功')
                dialogVisible.value = false
                loadQuestions()
            } else {
                ElMessage.error(res.message || '操作失败')
            }
        } catch (error) {
            console.error('保存题目失败:', error)
            ElMessage.error('服务器错误，请稍后重试')
        }
    }

    const handleDeleteQuestion = (q) => {
        ElMessageBox.confirm('确定删除该试题？', '警告', { type: 'error' }).then(async () => {
            const res = await deleteQuestion(q.id)
            if (res.success) {
                ElMessage.success('已删除')
                loadQuestions()
            }
        })
    }

    const handleTypeChange = (v) => {
        if (v === 'JUDGE') form.value.answer = 'A'
    }

    const addOption = () => form.value.options.push({ text: '', isCorrect: false })

    const removeOption = (idx) => form.value.options.splice(idx, 1)

    const getTypeLabel = (t) => ({ SINGLE: '单选', MULTIPLE: '多选', JUDGE: '判断', ESSAY: '简答' }[t])

    const getCourseName = (id) => courses.value.find(c => c.id === id)?.courseName || '未知课程'

    const handleBatchImport = () => {
        ElMessage.info('功能开发中...')
    }

    onMounted(() => {
        loadCourses()
        loadQuestions()
    })

    return {
        filter,
        questions,
        courses,
        loading,
        dialogVisible,
        isEdit,
        pagination,
        form,
        loadQuestions,
        handleSearch,
        openCreateDialog,
        editQuestion,
        saveQuestion,
        handleDeleteQuestion,
        handleTypeChange,
        addOption,
        removeOption,
        getTypeLabel,
        getCourseName,
        handleBatchImport
    }
}
