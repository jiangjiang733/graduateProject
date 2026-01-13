import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamDetail, saveExamQuestions, generateQuestionsWithAi } from '@/api/exam.js'
import { getQuestionList, createQuestion as createBankQuestion } from '@/api/question.js'

export function useExamQuestions(examId) {
    const exam = ref({})
    const questions = ref([])
    const saving = ref(false)

    // Bank Dialog
    const bankDialogVisible = ref(false)
    const bankQuestions = ref([])
    const bankFilter = ref({ type: '', keyword: '' })
    const bankPage = ref(1)
    const bankTotal = ref(0)
    const selectedBankQuestions = ref([])

    // Create/Edit Dialog
    const createDialogVisible = ref(false)
    const isEditIndex = ref(-1)
    const form = ref({
        questionType: 'SINGLE',
        score: 5,
        questionContent: '',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
        correctIndex: 0,
        correctAnswer: '',
        analysis: ''
    })

    // AI Dialog
    const aiDialogVisible = ref(false)
    const aiLoading = ref(false)
    const aiForm = ref({
        courseName: '',
        questionCount: 5,
        selectedTypes: ['SINGLE', 'MULTIPLE']
    })

    const totalScore = computed(() => questions.value.reduce((sum, q) => sum + (q.score || 0), 0))

    const loadExamData = async () => {
        try {
            const res = await getExamDetail(examId)
            if (res.success && res.data) {
                exam.value = res.data.exam || {}
                questions.value = (res.data.questions || []).map(q => ({ ...q }))
            }
        } catch (e) {
            ElMessage.error('加载失败')
        }
    }

    const saveAll = async () => {
        saving.value = true
        try {
            const dataToSave = questions.value.map((q, idx) => ({
                ...q,
                questionOrder: idx + 1
            }))
            const res = await saveExamQuestions(examId, dataToSave)
            if (res.success) {
                ElMessage.success('保存成功')
                loadExamData()
            } else {
                ElMessage.error(res.message)
            }
        } catch (e) {
            ElMessage.error('保存失败')
        } finally {
            saving.value = false
        }
    }

    const searchBank = async () => {
        try {
            const params = {
                pageNum: bankPage.value,
                pageSize: 10,
                courseId: exam.value.courseId,
                type: bankFilter.value.type,
                keyword: bankFilter.value.keyword
            }
            const res = await getQuestionList(params)
            if (res.success) {
                bankQuestions.value = res.data.records
                bankTotal.value = res.data.total
            }
        } catch (e) { }
    }

    const openBankDialog = () => {
        bankDialogVisible.value = true
        searchBank()
    }

    const handleBankSelection = (selection) => {
        selectedBankQuestions.value = selection
    }

    const confirmImport = () => {
        if (selectedBankQuestions.value.length === 0) return
        const newQs = selectedBankQuestions.value.map(bq => {
            let opts = bq.options
            if (typeof opts === 'object' && opts !== null) opts = JSON.stringify(opts)

            return {
                examId: examId,
                questionType: bq.type,
                questionContent: bq.content,
                questionOptions: opts,
                correctAnswer: bq.answer,
                score: 5,
                analysis: bq.analysis
            }
        })
        questions.value.push(...newQs)
        bankDialogVisible.value = false
        ElMessage.success(`已添加 ${newQs.length} 道试题`)
    }

    const openCreateDialog = () => {
        isEditIndex.value = -1
        form.value = {
            questionType: 'SINGLE',
            score: 5,
            questionContent: '',
            options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
            correctIndex: 0,
            correctAnswer: '',
            analysis: ''
        }
        createDialogVisible.value = true
    }

    const editQuestion = (index) => {
        isEditIndex.value = index
        const q = questions.value[index]

        let opts = []
        let correctIndex = 0
        try {
            if (q.questionOptions) {
                opts = JSON.parse(q.questionOptions)
                if (Array.isArray(opts)) {
                    if (q.questionType === 'SINGLE') {
                        correctIndex = opts.findIndex(o => o.isCorrect) || 0
                    }
                }
            }
        } catch (e) { opts = [] }
        if (opts.length === 0) opts = [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]

        form.value = {
            questionType: q.questionType,
            score: q.score,
            questionContent: q.questionContent,
            options: opts,
            correctIndex: correctIndex,
            correctAnswer: q.answer || q.correctAnswer,
            analysis: q.analysis
        }
        createDialogVisible.value = true
    }

    const saveLocalQuestion = async () => {
        const f = form.value
        let optsStr = null
        let ans = f.correctAnswer

        if (['SINGLE', 'MULTIPLE'].includes(f.questionType)) {
            if (f.questionType === 'SINGLE') {
                f.options.forEach((o, i) => o.isCorrect = (i === f.correctIndex))
                ans = String.fromCharCode(65 + f.correctIndex)
            } else {
                const correctChars = f.options
                    .map((o, i) => o.isCorrect ? String.fromCharCode(65 + i) : null)
                    .filter(c => c !== null)
                ans = correctChars.join('')
            }
            optsStr = JSON.stringify(f.options)
        }

        const qObj = {
            examId: examId,
            questionType: f.questionType,
            questionContent: f.questionContent,
            questionOptions: optsStr,
            answer: ans,
            score: f.score,
            analysis: f.analysis
        }

        if (isEditIndex.value > -1) {
            questions.value[isEditIndex.value] = qObj
            createDialogVisible.value = false
            ElMessage.success('试题已修改')
        } else {
            questions.value.push(qObj)
            createDialogVisible.value = false

            ElMessageBox.confirm(
                '试题已添加到试卷。是否同时也将其保存到【公共题库】中，以便在其他考试中复用？',
                '同步到题库',
                {
                    confirmButtonText: '保存到题库',
                    cancelButtonText: '仅保存到试卷',
                    type: 'info',
                    distinguishCancelAndClose: true
                }
            ).then(async () => {
                try {
                    const userId = localStorage.getItem('teacherId')
                    await createBankQuestion({
                        courseId: exam.value.courseId,
                        teacherId: userId,
                        type: f.questionType,
                        content: f.questionContent,
                        options: optsStr,
                        answer: ans,
                        difficulty: 1,
                        analysis: f.analysis
                    })
                    ElMessage.success('已成功同步到题库')
                } catch (e) {
                    ElMessage.warning('添加到题库失败，但试题已保留在试卷中')
                }
            }).catch(() => {
            })
        }
    }

    const removeQuestion = (index) => {
        questions.value.splice(index, 1)
    }

    const moveQuestion = (index, delta) => {
        const newIdx = index + delta
        if (newIdx < 0 || newIdx >= questions.value.length) return
        const temp = questions.value[index]
        questions.value[index] = questions.value[newIdx]
        questions.value[newIdx] = temp
    }

    const openAiDialog = () => {
        aiForm.value.courseName = exam.value.courseName || ''
        aiDialogVisible.value = true
    }

    const handleAiGenerate = async () => {
        if (!aiForm.value.courseName) return ElMessage.warning('请输入课程名称以供 AI 参考')
        if (aiForm.value.selectedTypes.length === 0) return ElMessage.warning('请选择至少一种题型')

        aiLoading.value = true
        try {
            const params = {
                courseName: aiForm.value.courseName,
                questionCount: aiForm.value.questionCount,
                questionTypes: aiForm.value.selectedTypes.join(','),
                courseId: exam.value.courseId,
                teacherId: localStorage.getItem('teacherId') || '1'
            }

            const res = await generateQuestionsWithAi(params)
            if (res.success && res.data) {
                const aiQs = res.data.map(q => ({
                    examId: examId,
                    questionType: q.questionType,
                    questionContent: q.questionContent,
                    questionOptions: q.questionOptions,
                    correctAnswer: q.correctAnswer,
                    score: q.score || 5,
                    analysis: q.analysis
                }))
                questions.value.push(...aiQs)
                ElMessage.success(`AI 已成功生成 ${aiQs.length} 道题目`)
                aiDialogVisible.value = false
            } else {
                ElMessage.error(res.message || 'AI 生成失败')
            }
        } catch (e) {
            console.error(e)
            ElMessage.error('AI 服务暂时不可用，请稍后再试')
        } finally {
            aiLoading.value = false
        }
    }

    const getTypeTag = (t) => ({ SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info', SINGLE_CHOICE: '', MULTIPLE_CHOICE: 'success' }[t] || '')
    const getTypeLabel = (t) => ({ SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题', SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题' }[t] || t)
    const getDiffLabel = (d) => ({ 1: '简单', 2: '中等', 3: '困难' }[d] || d)
    const parseOptions = (json) => {
        try {
            return typeof json === 'string' ? JSON.parse(json) : json
        } catch (e) { return [] }
    }
    const isCorrect = (opt, idx, q) => {
        if (q.questionType === 'SINGLE' || q.questionType === 'MULTIPLE' || q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
            if (opt && typeof opt === 'object' && opt.isCorrect !== undefined) {
                return opt.isCorrect === true || opt.isCorrect === 'true'
            }
            const ans = q.answer !== undefined ? q.answer : q.correctAnswer;
            if (ans !== undefined && ans !== null && ans !== '') {
                const ansStr = String(ans);
                const char = String.fromCharCode(65 + idx);
                const indexStr = String(idx);

                if (q.questionType === 'SINGLE' || q.questionType === 'SINGLE_CHOICE') {
                    return ansStr === char || ansStr === indexStr;
                } else {
                    return ansStr.includes(char) || ansStr.includes(indexStr);
                }
            }
        }
        return false
    }

    onMounted(() => {
        if (examId) loadExamData()
    })

    return {
        exam,
        questions,
        saving,
        bankDialogVisible,
        bankQuestions,
        bankFilter,
        bankPage,
        bankTotal,
        selectedBankQuestions,
        createDialogVisible,
        isEditIndex,
        form,
        aiDialogVisible,
        aiLoading,
        aiForm,
        totalScore,
        loadExamData,
        saveAll,
        openBankDialog,
        searchBank,
        handleBankSelection,
        confirmImport,
        openCreateDialog,
        editQuestion,
        saveLocalQuestion,
        removeQuestion,
        moveQuestion,
        openAiDialog,
        handleAiGenerate,
        getTypeTag,
        getTypeLabel,
        getDiffLabel,
        parseOptions,
        isCorrect
    }
}
