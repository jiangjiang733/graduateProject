import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestionList, createQuestion, updateQuestion, deleteQuestion } from '@/api/question.js'
import { getCourseList } from '@/api/course.js'

export function useQuestionBank() {
    const filter = ref({ type: '', keyword: '', courseId: '' })
    const questions = ref([])
    const courses = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    // 条数
    const pagination = ref({ current: 1, size: 6, total: 0 })
    // 当前日期时刻监听
    const currentDate = ref(new Date().toLocaleDateString())

    const form = ref({
        courseId: '',
        type: 'SINGLE',
        content: '',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
        correctIndex: 0,
        answer: '',
        analysis: ''
    })

    const cachedOptions = ref([])
    const cachedAnswer = ref('')

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
                    // 字段归一化处理 (处理后端可能返回的 snake_case)
                    const normalized = {
                        ...q,
                        id: q.id,
                        content: q.content || q.qContent || '',
                        type: q.type || q.qType || 'SINGLE',
                        options: q.options || q.qOptions || null,
                        answer: q.answer || q.qAnswer || '',
                        courseId: q.courseId || q.course_id || '',
                        analysis: q.analysis || q.qAnalysis || ''
                    }
                    if (typeof normalized.options === 'string') {
                        try {
                            normalized.options = JSON.parse(normalized.options)
                        } catch (e) {
                            normalized.options = []
                        }
                    }
                    return normalized
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
        cachedOptions.value = []
        cachedAnswer.value = ''
        form.value = {
            courseId: courses.value[0]?.id || '',
            type: 'SINGLE',
            content: '',
            options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
            correctIndex: 0,
            answer: '',
            analysis: ''
        }
        dialogVisible.value = true
    }

    const editQuestion = (q) => {
        isEdit.value = true
        loading.value = true
        cachedOptions.value = []
        cachedAnswer.value = ''
        // 深拷贝，避免引用问题
        const qCopy = JSON.parse(JSON.stringify(q))
        // 理选项格式，防止 UI 无法回显
        if (qCopy.options) {
            try {
                let opts = typeof qCopy.options === 'string' ? JSON.parse(qCopy.options) : qCopy.options
                if (Array.isArray(opts)) {
                    qCopy.options = opts.map(opt => {
                        if (typeof opt === 'string') return { text: opt, isCorrect: false }
                        return { text: opt.text || '', isCorrect: !!opt.isCorrect }
                    })
                } else {
                    qCopy.options = []
                }
            } catch (e) {
                qCopy.options = []
            }
        } else {
            qCopy.options = []
        }

        // 处理正确答案回显
        if (qCopy.type === 'SINGLE') {
            // 先从选项中找正确选项
            let correctIdx = qCopy.options.findIndex(o => o.isCorrect)

            // 如果选项中没找到，尝试从 answer 字段恢复
            if (correctIdx === -1 && qCopy.answer) {
                correctIdx = qCopy.answer.charCodeAt(0) - 65
            }

            // 确保 correctIndex 有效
            qCopy.correctIndex = correctIdx >= 0 && correctIdx < qCopy.options.length ? correctIdx : 0

            // 重新设置选项的正确标记（确保单选只有一个正确）
            qCopy.options.forEach((o, i) => {
                o.isCorrect = (i === qCopy.correctIndex)
            })

        } else if (qCopy.type === 'MULTIPLE') {
            // 多选题：从 answer 字段恢复正确选项标记
            if (qCopy.answer && qCopy.options.length > 0) {
                const answerArray = qCopy.answer.split('')
                qCopy.options.forEach((o, i) => {
                    const optionLetter = String.fromCharCode(65 + i)
                    o.isCorrect = answerArray.includes(optionLetter)
                })
            }

        } else if (qCopy.type === 'JUDGE') {
            // 判断題：确保选项和答案一致
            if (!qCopy.answer && qCopy.options.length > 0) {
                qCopy.answer = qCopy.options[0].isCorrect ? 'A' : 'B'
            }
            // 重新设置判断題的选项
            qCopy.options = [
                { text: '正确', isCorrect: qCopy.answer === 'A' },
                { text: '错误', isCorrect: qCopy.answer === 'B' }
            ]
        }
        
        form.value = qCopy
        loading.value = false
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

    const handleTabClick = (newType) => {
        if (form.value.type === newType) return;
        const oldType = form.value.type;

        // Cache current state before switching
        if (oldType === 'SINGLE' || oldType === 'MULTIPLE') {
            cachedOptions.value = JSON.parse(JSON.stringify(form.value.options));
        } else if (oldType === 'ESSAY') {
            cachedAnswer.value = form.value.answer;
        }

        form.value.type = newType;

        if (newType === 'JUDGE') {
            form.value.answer = 'A'
            form.value.options = [
                { text: '正确', isCorrect: true },
                { text: '错误', isCorrect: false }
            ]
        } else if (newType === 'SINGLE' || newType === 'MULTIPLE') {
            if (oldType === 'JUDGE' || oldType === 'ESSAY') {
                if (cachedOptions.value && cachedOptions.value.length > 0) {
                    form.value.options = JSON.parse(JSON.stringify(cachedOptions.value));
                    if (newType === 'SINGLE') {
                        let idx = form.value.options.findIndex(o => o.isCorrect);
                        if (idx === -1) {
                            form.value.options[0].isCorrect = true;
                            idx = 0;
                        }
                        form.value.correctIndex = idx;
                        form.value.options.forEach((o, i) => o.isCorrect = (i === idx));
                    }
                } else {
                    form.value.options = [
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false }
                    ]
                    form.value.correctIndex = 0
                }
            } else {
                // Switching between SINGLE and MULTIPLE
                if (newType === 'SINGLE') {
                    let idx = form.value.options.findIndex(o => o.isCorrect);
                    if (idx === -1) {
                        form.value.options[0].isCorrect = true;
                        idx = 0;
                    }
                    form.value.correctIndex = idx;
                    form.value.options.forEach((o, i) => o.isCorrect = (i === idx));
                }
            }
        } else if (newType === 'ESSAY') {
            if (cachedAnswer.value) {
                form.value.answer = cachedAnswer.value;
            } else {
                form.value.answer = '';
            }
            form.value.options = [];
        }
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

    const toggleCorrect = (idx) => {
        if (form.value.type === 'SINGLE') {
            form.value.options.forEach((o, i) => o.isCorrect = (i === idx))
            form.value.correctIndex = idx
        } else if (form.value.type === 'MULTIPLE') {
            form.value.options[idx].isCorrect = !form.value.options[idx].isCorrect
        }
    }

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
        handleTabClick,
        addOption,
        removeOption,
        getTypeLabel,
        getCourseName,
        handleBatchImport,
        currentDate,
        toggleCorrect
    }
}
