import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course.js'
import { getTeacherComments, addComment, deleteComment as deleteCommentAPI } from '@/api/comment.js'
import { useUserInfo } from '@/stores/user.js'

export function useCommentManagement() {
    // 用户信息
    const userInfoStore = useUserInfo()
    userInfoStore.initUserInfo()

    // 状态
    const loading = ref(false)
    const courses = ref([])
    const comments = ref([])
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)

    // 筛选条件
    const filterCourse = ref('')
    const filterStatus = ref('')
    const dateRange = ref([])
    const searchKeyword = ref('')

    // 回复对话框
    const replyDialogVisible = ref(false)
    const currentComment = ref(null)
    const replyContent = ref('')
    const replying = ref(false)

    // 统计数据
    const totalComments = computed(() => total.value)
    const todayComments = computed(() => {
        const today = new Date().toDateString()
        return comments.value.filter(comment =>
            new Date(comment.createTime).toDateString() === today
        ).length
    })
    const pendingReplies = computed(() => {
        return comments.value.filter(comment => !comment.hasReply).length
    })

    // 方法
    const loadCourses = async () => {
        try {
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const response = await getCourseList({
                pageNumber: 1,
                pageSize: 100,
                teacherId: teacherId
            })

            if (response.success && response.data) {
                courses.value = response.data.list || []
            }
        } catch (error) {
            console.error('获取课程列表失败:', error)
        }
    }

    const loadComments = async () => {
        try {
            loading.value = true
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            if (!teacherId) {
                ElMessage.warning('请先登录')
                return
            }

            const params = {
                pageNumber: currentPage.value,
                pageSize: pageSize.value
            }

            if (filterCourse.value) {
                params.courseId = filterCourse.value
            }

            if (searchKeyword.value) {
                params.keyword = searchKeyword.value
            }

            const response = await getTeacherComments(teacherId, params)

            if (response.code === 200 && response.data) {
                comments.value = response.data
                // 这里需要后端返回总数，暂时使用数据长度
                total.value = response.data.length
            } else {
                comments.value = []
                total.value = 0
            }

        } catch (error) {
            console.error('获取评论失败:', error)
            ElMessage.error('获取评论失败')
            comments.value = []
            total.value = 0
        } finally {
            loading.value = false
        }
    }

    const getCourseNameById = (courseId) => {
        const course = courses.value.find(c => c.id === courseId)
        return course ? course.courseName : '未知课程'
    }

    const handleSearch = () => {
        currentPage.value = 1
        loadComments()
    }

    const handleSizeChange = (size) => {
        pageSize.value = size
        loadComments()
    }

    const handleCurrentChange = (page) => {
        currentPage.value = page
        loadComments()
    }

    const openReplyDialog = (comment) => {
        currentComment.value = comment
        replyContent.value = ''
        replyDialogVisible.value = true
    }

    const submitReply = async () => {
        if (!replyContent.value.trim()) {
            ElMessage.warning('请输入回复内容')
            return
        }

        try {
            replying.value = true

            const replyData = {
                courseId: currentComment.value.courseId,
                chapterId: currentComment.value.chapterId,
                userId: userInfoStore.userId || localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
                userName: userInfoStore.userName || localStorage.getItem('teacherName') || '教师',
                userType: userInfoStore.userType || 'TEACHER',
                userAvatar: userInfoStore.userAvatar,
                content: replyContent.value,
                parentId: currentComment.value.commentId,
                targetUserId: currentComment.value.userId,
                targetUserName: currentComment.value.userName
            }

            const response = await addComment(replyData)

            if (response.code === 200) {
                ElMessage.success('回复成功')
                replyDialogVisible.value = false
                loadComments()
            } else {
                ElMessage.error(response.message || '回复失败')
            }
        } catch (error) {
            console.error('回复失败:', error)
            ElMessage.error('回复失败')
        } finally {
            replying.value = false
        }
    }

    const deleteComment = async (comment) => {
        try {
            await ElMessageBox.confirm(
                '确定要删除这条评论吗？删除后将无法恢复！',
                '删除确认',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const response = await deleteCommentAPI(comment.commentId)

            if (response.code === 200) {
                ElMessage.success('删除成功')
                loadComments()
            } else {
                ElMessage.error(response.message || '删除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除失败:', error)
                ElMessage.error('删除失败')
            }
        }
    }

    onMounted(() => {
        loadCourses()
        loadComments()
    })

    return {
        loading,
        courses,
        comments,
        currentPage,
        pageSize,
        total,
        filterCourse,
        filterStatus,
        dateRange,
        searchKeyword,
        replyDialogVisible,
        currentComment,
        replyContent,
        replying,
        totalComments,
        todayComments,
        pendingReplies,
        loadCourses,
        loadComments,
        getCourseNameById,
        handleSearch,
        handleSizeChange,
        handleCurrentChange,
        openReplyDialog,
        submitReply,
        deleteComment
    }
}
