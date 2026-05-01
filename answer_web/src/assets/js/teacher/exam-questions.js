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
    const loadingBank = ref(false)

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
        console.log('Start loading exam data. ID:', examId)
        try {
            const res = await getExamDetail(examId)
            console.log('getExamDetail Response:', res)

            // 尝试多种可能的成功状态判断
            const isSuccess = res.success === true || res.code === 200 || res.code === '200' || res.status === 200

            if (isSuccess && res.data) {
                // 兼容不同的后端返回结构
                let rawQuestions = []
                let examData = {}

                // 情况1: data.exam + data.questions
                if (res.data.exam) {
                    examData = res.data.exam
                    rawQuestions = res.data.questions || res.data.exam.questions || []
                }
                // 情况2: data 直接就是 exam 对象
                else {
                    examData = res.data
                    // 尝试多种可能的字段名
                    rawQuestions = res.data.questions ||
                        res.data.questionList ||
                        res.data.examQuestions ||
                        res.data.question ||
                        []
                }

                exam.value = examData
                console.log('Parsed Exam Data:', exam.value)
                console.log('Raw Questions:', rawQuestions)

                // 确保 rawQuestions 是数组
                if (!Array.isArray(rawQuestions)) {
                    console.warn('rawQuestions is not an array:', rawQuestions)
                    rawQuestions = []
                }

                // 标准化题目字段
                questions.value = rawQuestions.map(q => {
                    const opts = q.questionOptions || q.options || null;
                    let ans = q.answer || q.correctAnswer || q.correct_answer;

                    // 兜底：如果答案字段为空但有选项，从选项中提取
                    if (!ans && opts) {
                        try {
                            const parsedOpts = typeof opts === 'string' ? JSON.parse(opts) : opts;
                            if (Array.isArray(parsedOpts)) {
                                const correctIndices = parsedOpts.map((o, i) => (o.isCorrect || o.correct) ? i : -1).filter(i => i !== -1);
                                if (correctIndices.length > 0) {
                                    ans = correctIndices.map(i => String.fromCharCode(65 + i)).join('');
                                }
                            }
                        } catch (e) { }
                    }

                    const standardized = {
                        ...q,
                        questionId: q.questionId || q.id,
                        questionContent: q.questionContent || q.content || q.questionText || '',
                        questionType: q.questionType || q.type || 'SINGLE',
                        questionOptions: opts,
                        score: Number(q.score) || 5,
                        answer: ans,
                        analysis: q.analysis || q.explanation || ''
                    }
                    console.log('Standardized question:', standardized)
                    return standardized
                })
                console.log('Parsed Questions Count:', questions.value.length)
                console.log('Parsed Questions:', questions.value)

                // 确保有 courseId 后再加载题库
                if (exam.value.courseId) {
                    console.log('Found courseId:', exam.value.courseId, ' - searching bank...')
                    await searchBank()
                } else {
                    console.warn('No courseId found in exam data, cannot load bank.')
                    console.warn('Exam data:', exam.value)
                    ElMessage.warning('考试未关联课程，无法加载题库')
                }
            } else {
                console.error('API returned failure or no data', res)
                console.error('Response structure:', {
                    success: res.success,
                    code: res.code,
                    status: res.status,
                    message: res.message,
                    hasData: !!res.data
                })
                ElMessage.error(res.message || '获取考试详情失败')
            }
        } catch (e) {
            console.error('Failed to load exam - Full Error:', e)
            console.error('Error message:', e.message)
            console.error('Error stack:', e.stack)
            ElMessage.error('加载失败：' + (e.message || '请检查网络或重试'))
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
        if (!exam.value.courseId) {
            console.warn('Cannot search bank: courseId is missing from exam data')
            return
        }
        loadingBank.value = true
        console.log('Searching bank with params:', {
            courseId: exam.value.courseId,
            keyword: bankFilter.value.keyword
        })
        try {
            const params = {
                pageNum: bankPage.value,
                pageSize: 50, // 增加加载数量
                courseId: exam.value.courseId,
                type: bankFilter.value.type,
                keyword: bankFilter.value.keyword
            }
            const res = await getQuestionList(params)
            console.log('Bank Search Response:', res)
            if (res.success && res.data) {
                bankQuestions.value = res.data.records || []
                bankTotal.value = res.data.total || 0
            }
        } catch (e) {
            console.error('Search Bank Error:', e)
        } finally {
            loadingBank.value = false
        }
    }

    const addFromBank = (bq) => {
        let opts = bq.options
        if (typeof opts === 'object' && opts !== null) opts = JSON.stringify(opts)

        const newQ = {
            examId: examId,
            questionId: bq.id,
            questionType: bq.type,
            questionContent: bq.content,
            questionOptions: opts,
            answer: bq.answer, // 统一使用 answer
            score: 5,
            analysis: bq.analysis
        }

        // 检查是否已存在
        if (questions.value.some(q => (q.questionId === bq.id) || (q.questionContent === bq.content))) {
            return ElMessage.warning('该试题已在卷中')
        }

        questions.value.push(newQ)
        ElMessage.success('已添加到试卷')
    }

    const formatOptionsPreview = (optsJson) => {
        try {
            const opts = typeof optsJson === 'string' ? JSON.parse(optsJson) : optsJson
            if (!Array.isArray(opts)) return ''
            return opts.map((o, i) => {
                const letter = String.fromCharCode(65 + i)
                if (typeof o === 'string') {
                    return `${letter}: ${o}`
                } else if (typeof o === 'object' && o !== null) {
                    return `${letter}: ${o.text || o.content || JSON.stringify(o)}`
                }
                return `${letter}: ${o}`
            }).join(' | ')
        } catch (e) {
            return ''
        }
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
                questionId: bq.id, // 增加 ID 关联
                questionType: bq.type,
                questionContent: bq.content,
                questionOptions: opts,
                answer: bq.answer, // 统一使用 answer
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
            ElMessage.success('试题已在卷内修改')
        } else {
            questions.value.push(qObj)
            createDialogVisible.value = false

            // 同步到题库提示词修正，并完善同步逻辑
            ElMessageBox.confirm(
                '该试题已添加到当前试卷。是否同时也将其【切实】存入题库？存入后，您可以在其他试卷中通过“引用题库”直接调用它。',
                '同步到公共题库',
                {
                    confirmButtonText: '确定存入题库',
                    cancelButtonText: '仅保留在试卷',
                    type: 'success',
                }
            ).then(async () => {
                try {
                    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id') || '1'
                    const res = await createBankQuestion({
                        courseId: exam.value.courseId,
                        teacherId: teacherId,
                        type: f.questionType,
                        content: f.questionContent,
                        options: optsStr,
                        answer: ans,
                        difficulty: 1,
                        analysis: f.analysis
                    })
                    if(res.success || res.code === 200) {
                        ElMessage.success('【操作成功】试题已切切实实存入公共题库！')
                        // 刷新左侧题库列表
                        searchBank()
                    } else {
                        ElMessage.error(res.message || '存入失败（后端返回错误）')
                    }
                } catch (e) {
                    console.error('Sync failed:', e)
                    ElMessage.warning('添加到题库失败，但试题已保留在当前试卷中')
                }
            }).catch(() => {
                ElMessage.info('已选择：仅保留在当前试卷')
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
        console.log('开始AI生成题目，参数:', {
            courseName: aiForm.value.courseName,
            questionCount: aiForm.value.questionCount,
            selectedTypes: aiForm.value.selectedTypes
        })

        try {
            const params = {
                courseName: aiForm.value.courseName,
                questionCount: aiForm.value.questionCount,
                questionTypes: aiForm.value.selectedTypes.join(','),
                courseId: exam.value.courseId,
                teacherId: localStorage.getItem('teacherId') || '1'
            }

            const res = await generateQuestionsWithAi(params)
            console.log('AI生成响应:', res)

            // 检查多种可能的成功状态
            const isSuccess = res.success === true || res.code === 200 || res.code === '200'

            if (isSuccess && res.data) {
                // 确保 res.data 是数组
                let aiQuestions = Array.isArray(res.data) ? res.data : [res.data]
                console.log('AI生成的题目数组:', aiQuestions)

                // 标准化AI生成的题目格式
                const aiQs = aiQuestions.map((q, index) => {
                    console.log(`标准化第 ${index + 1} 题:`, q)

                    // 处理选项 - 确保是字符串
                    let optionsStr = null
                    if (q.questionOptions || q.options) {
                        const opts = q.questionOptions || q.options
                        optionsStr = typeof opts === 'string' ? opts : JSON.stringify(opts)
                    }

                    const standardized = {
                        examId: examId,
                        questionType: q.questionType || q.type || 'SINGLE',
                        questionContent: q.questionContent || q.content || q.questionText || '',
                        questionOptions: optionsStr,
                        answer: q.answer || q.correctAnswer || '',
                        score: Number(q.score) || 5,
                        analysis: q.analysis || q.explanation || ''
                    }

                    console.log(`标准化后的题目 ${index + 1}:`, standardized)
                    return standardized
                })

                // 添加到现有题目列表（不是替换）
                const beforeCount = questions.value.length
                questions.value.push(...aiQs)
                const afterCount = questions.value.length

                console.log(`添加前题目数: ${beforeCount}, 添加后题目数: ${afterCount}`)
                console.log('当前所有题目:', questions.value)

                ElMessage.success(`AI 已成功生成并添加 ${aiQs.length} 道题目到试卷`)
                aiDialogVisible.value = false
            } else {
                console.error('AI生成失败，响应:', res)
                ElMessage.error(res.message || 'AI 生成失败')
            }
        } catch (e) {
            console.error('AI生成异常:', e)
            console.error('错误详情:', e.message, e.stack)

            // 特殊处理超时错误
            if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
                ElMessage.warning({
                    message: 'AI生成超时，但题目可能已在后台生成完成，请点击"刷新"按钮或稍后刷新页面查看',
                    duration: 5000,
                    showClose: true
                })
            } else if (e.message.includes('Network Error')) {
                ElMessage.error('网络连接失败，请检查网络连接或后端服务是否正常')
            } else {
                ElMessage.error('AI 服务暂时不可用：' + (e.message || '请稍后再试'))
            }
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

    onMounted(async () => {
        if (examId) {
            await loadExamData()
        }
    })

    const toggleCorrect = (idx) => {
        if (form.value.questionType === 'SINGLE') {
            form.value.options.forEach((o, i) => o.isCorrect = (i === idx))
            form.value.correctIndex = idx
        } else if (form.value.questionType === 'MULTIPLE') {
            form.value.options[idx].isCorrect = !form.value.options[idx].isCorrect
        }
    }

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
        isCorrect,
        loadingBank,
        addFromBank,
        formatOptionsPreview,
        toggleCorrect
    }
}
