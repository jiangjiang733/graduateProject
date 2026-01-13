import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
    getAnnouncementList,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    withdrawAnnouncement,
    type Announcement
} from '@/api/announcement'

export function useAnnouncementManagement() {
    const loading = ref(false)
    const submitting = ref(false)
    const dialogVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref<FormInstance>()
    const announcements = ref<Announcement[]>([])

    const searchForm = reactive({
        keyword: '',
        targetType: ''
    })

    const pagination = reactive({
        pageNumber: 1,
        pageSize: 10,
        total: 0
    })

    const form = reactive({
        notificationId: 0,
        title: '',
        content: '',
        targetType: 'ALL',
        priority: 1,
        expireTime: ''
    })

    const formRules: FormRules = {
        title: [{ required: true, message: '请填写公告标题', trigger: 'blur' }],
        content: [{ required: true, message: '请填写公告具体内容', trigger: 'blur' }],
        priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
        targetType: [{ required: true, message: '请选择通告对象', trigger: 'change' }]
    }

    const loadAnnouncements = async () => {
        loading.value = true
        try {
            const response = await getAnnouncementList({
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                keyword: searchForm.keyword,
                type: searchForm.targetType
            })

            if (response.code === 200 && response.data) {
                announcements.value = response.data.list || []
                pagination.total = response.data.total || 0
            }
        } catch (error) {
            console.error('加载列表失败:', error)
            ElMessage.error('无法同步公告数据')
        } finally {
            loading.value = false
        }
    }

    const showAddDialog = () => {
        isEdit.value = false
        resetForm()
        dialogVisible.value = true
    }

    const handleEdit = (row: Announcement) => {
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
                    await updateAnnouncement(form.notificationId, form)
                    ElMessage.success('公告已更新')
                } else {
                    await createAnnouncement(form)
                    ElMessage.success('新公告已发布')
                }

                dialogVisible.value = false
                loadAnnouncements()
            } catch (error) {
                console.error('提交失败:', error)
            } finally {
                submitting.value = false
            }
        })
    }

    const handleDelete = async (row: Announcement) => {
        try {
            await ElMessageBox.confirm(`确定要彻底删除公告 "${row.title}" 吗？此操作不可逆。`, '危险操作', {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'error',
                roundButton: true
            })

            await deleteAnnouncement(row.notificationId)
            ElMessage.success('公告已彻底移除')
            loadAnnouncements()
        } catch (error) {
            if (error !== 'cancel') console.error('删除异常:', error)
        }
    }

    const handleWithdraw = async (row: Announcement) => {
        try {
            await withdrawAnnouncement(row.notificationId)
            ElMessage.success('公告已成功撤回')
            loadAnnouncements()
        } catch (error) {
            ElMessage.error('撤销失败')
        }
    }

    const handlePublish = async (row: Announcement) => {
        try {
            await publishAnnouncement(row.notificationId)
            ElMessage.success('公告已恢复发布')
            loadAnnouncements()
        } catch (error) {
            ElMessage.error('发布失败')
        }
    }

    const resetForm = () => {
        Object.assign(form, {
            notificationId: 0,
            title: '',
            content: '',
            targetType: 'ALL',
            priority: 1,
            expireTime: ''
        })
        formRef.value?.clearValidate()
    }

    return {
        loading,
        submitting,
        dialogVisible,
        isEdit,
        formRef,
        announcements,
        searchForm,
        pagination,
        form,
        formRules,
        loadAnnouncements,
        showAddDialog,
        handleEdit,
        handleSubmit,
        handleDelete,
        handleWithdraw,
        handlePublish
    }
}
