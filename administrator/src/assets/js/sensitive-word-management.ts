import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
    getSensitiveWordList,
    createSensitiveWord,
    updateSensitiveWord,
    deleteSensitiveWord,
    batchDeleteSensitiveWords,
    testSensitiveWord,
    type SensitiveWord
} from '@/api/sensitive'

export function useSensitiveWordManagement() {
    const loading = ref(false)
    const submitting = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref<FormInstance>()
    const sensitiveWords = ref<SensitiveWord[]>([])
    const selectedIds = ref<number[]>([])

    const testForm = reactive({
        text: '',
        result: ''
    })

    const searchForm = reactive({
        keyword: '',
        category: ''
    })

    const pagination = reactive({
        pageNumber: 1,
        pageSize: 10,
        total: 0
    })

    const form = reactive({
        id: undefined as number | undefined,
        word: '',
        category: 'POLITICS',
        level: 1,
        action: 'BLOCK',
        replacement: '***'
    })

    const formRules: FormRules = {
        word: [{ required: true, message: '请定义敏感词汇', trigger: 'blur' }],
        category: [{ required: true, message: '请选择业务分类', trigger: 'change' }],
        action: [{ required: true, message: '请制定执行动作', trigger: 'change' }]
    }

    const loadSensitiveWords = async () => {
        loading.value = true
        try {
            const response = await getSensitiveWordList({
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                keyword: searchForm.keyword,
                category: searchForm.category
            })

            if (response.code === 200 && response.data) {
                sensitiveWords.value = response.data.list || []
                pagination.total = response.data.total || 0
            }
        } catch (error) {
            console.error('加载库失败:', error)
            ElMessage.error('无法同步敏感词库')
        } finally {
            loading.value = false
        }
    }

    const handleTest = async () => {
        if (!testForm.text) return ElMessage.warning('请输入待检测文本')
        loading.value = true
        try {
            const res = await testSensitiveWord(testForm.text)
            testForm.result = res.data || '文本安全，未触发拦截。'
            ElMessage.success('安全检测完成')
        } catch (error) {
            console.error('检测失败:', error)
        } finally {
            loading.value = false
        }
    }

    const showAddDialog = () => {
        isEdit.value = false
        resetForm()
        dialogVisible.value = true
    }

    const handleEdit = (row: SensitiveWord) => {
        isEdit.value = true
        Object.assign(form, row)
        dialogVisible.value = true
    }

    const handleSubmit = async () => {
        if (!formRef.value) return

        await formRef.value.validate(async (valid) => {
            if (!valid) return

            submitting.value = true
            try {
                if (isEdit.value) {
                    await updateSensitiveWord(form.id!, form)
                    ElMessage.success('词库规则已更新')
                } else {
                    await createSensitiveWord(form)
                    ElMessage.success('新词条已入库')
                }

                dialogVisible.value = false
                loadSensitiveWords()
            } catch (error) {
                console.error('保存失败:', error)
            } finally {
                submitting.value = false
            }
        })
    }

    const handleDelete = async (row: SensitiveWord) => {
        try {
            await ElMessageBox.confirm(`确定移除词条 "${row.word}" 吗？`, '安全操作', {
                confirmButtonText: '确定移除',
                cancelButtonText: '取消',
                type: 'warning',
                roundButton: true
            })

            await deleteSensitiveWord(row.id!)
            ElMessage.success('词条已从引擎中移除')
            loadSensitiveWords()
        } catch (error) {
            if (error !== 'cancel') console.error('删除异常:', error)
        }
    }

    const handleBatchDelete = async () => {
        try {
            await ElMessageBox.confirm('确定执行批量清理吗？', '批量操作', {
                confirmButtonText: '确定清理',
                cancelButtonText: '取消',
                type: 'warning',
                roundButton: true
            })

            await batchDeleteSensitiveWords(selectedIds.value)
            ElMessage.success('清空成功')
            selectedIds.value = []
            loadSensitiveWords()
        } catch (error) {
            if (error !== 'cancel') console.error('批量删除异常:', error)
        }
    }

    const handleSelectionChange = (selection: SensitiveWord[]) => {
        selectedIds.value = selection.map(item => item.id!)
    }

    const resetForm = () => {
        Object.assign(form, {
            id: undefined,
            word: '',
            category: 'POLITICS',
            level: 1,
            action: 'BLOCK',
            replacement: '***'
        })
        formRef.value?.clearValidate()
    }

    return {
        loading,
        submitting,
        dialogVisible,
        isEdit,
        formRef,
        sensitiveWords,
        selectedIds,
        testForm,
        searchForm,
        pagination,
        form,
        formRules,
        loadSensitiveWords,
        handleTest,
        showAddDialog,
        handleEdit,
        handleSubmit,
        handleDelete,
        handleBatchDelete,
        handleSelectionChange
    }
}
