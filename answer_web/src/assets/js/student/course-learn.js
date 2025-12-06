import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseDetail } from '@/api/course.js'
import { checkEnrollmentStatus } from '@/api/enrollment.js'
import { getCourseChapters, getChapterDetail } from '@/api/chapter.js'
import { getChapterComments, addComment } from '@/api/comment.js'

export function useCourseLearn() {
    const router = useRouter()
    const route = useRoute()

    // 状态
    const loading = ref(true)
    const canLearn = ref(false)
    const accessMessage = ref('')
    const courseInfo = ref({})
    const chapters = ref([])
    const currentChapter = ref(null)
    const chapterLoading = ref(false)
    const searchText = ref('')

    // 评论相关状态
    const comments = ref([])
    const commentsLoading = ref(false)
    const newComment = ref('')
    const commentSubmitting = ref(false)
    const replyingTo = ref(null)
    const replyContent = ref('')
    const replySubmitting = ref(false)

    // 树形结构配置
    const treeProps = {
        children: 'children',
        label: 'chapterTitle'
    }

    // 计算总章节数
    const totalChapters = computed(() => {
        const countChapters = (list) => {
            let count = 0
            list.forEach(item => {
                count++
                if (item.children && item.children.length > 0) {
                    count += countChapters(item.children)
                }
            })
            return count
        }
        return countChapters(chapters.value)
    })

    // 初始化
    const init = async () => {
        const courseId = route.params.id
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId')

        if (!studentId) {
            ElMessage.warning('请先登录')
            router.push('/login')
            return
        }

        try {
            loading.value = true

            // 1. 检查报名状态
            const enrollmentResponse = await checkEnrollmentStatus(studentId, courseId)
            
            if (!enrollmentResponse.success || !enrollmentResponse.data || !enrollmentResponse.data.enrolled) {
                canLearn.value = false
                accessMessage.value = '您还未报名该课程，请先报名'
                loading.value = false
                return
            }

            if (enrollmentResponse.data.status !== 'approved') {
                canLearn.value = false
                if (enrollmentResponse.data.status === 'pending') {
                    accessMessage.value = '您的报名申请正在审核中，请等待教师审核通过'
                } else if (enrollmentResponse.data.status === 'rejected') {
                    accessMessage.value = '您的报名申请已被拒绝，无法学习该课程'
                } else {
                    accessMessage.value = '您暂时无法学习该课程'
                }
                loading.value = false
                return
            }

            // 2. 获取课程信息
            const courseResponse = await getCourseDetail(courseId)
            if (courseResponse.success && courseResponse.data) {
                courseInfo.value = courseResponse.data
            }

            // 3. 获取章节列表
            const chaptersResponse = await getCourseChapters(courseId)
            if (chaptersResponse.success && chaptersResponse.data) {
                chapters.value = buildChapterTree(chaptersResponse.data)
            }

            canLearn.value = true
        } catch (error) {
            console.error('初始化失败:', error)
            ElMessage.error('加载课程信息失败')
            canLearn.value = false
            accessMessage.value = '加载课程信息失败，请稍后重试'
        } finally {
            loading.value = false
        }
    }

    // 构建章节树
    const buildChapterTree = (flatList) => {
        const map = {}
        const tree = []

        // 创建映射
        flatList.forEach(item => {
            map[item.chapterId] = { ...item, children: [] }
        })

        // 构建树形结构
        flatList.forEach(item => {
            if (item.parentId === null || item.parentId === 0) {
                tree.push(map[item.chapterId])
            } else if (map[item.parentId]) {
                map[item.parentId].children.push(map[item.chapterId])
            }
        })

        // 排序
        const sortChapters = (list) => {
            list.sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0))
            list.forEach(item => {
                if (item.children && item.children.length > 0) {
                    sortChapters(item.children)
                }
            })
        }
        sortChapters(tree)

        return tree
    }

    // 处理章节点击
    const handleChapterClick = async (data) => {
        // 如果是文件夹类型，不加载内容
        if (data.chapterType === 'FOLDER') {
            ElMessage.info('请选择具体的章节内容')
            return
        }

        try {
            chapterLoading.value = true
            currentChapter.value = data

            // 获取章节详细信息（包含完整的视频、PDF URL等）
            const response = await getChapterDetail(data.chapterId)
            if (response.success && response.data) {
                currentChapter.value = response.data
            }

            // 加载章节评论
            loadChapterComments(data.chapterId)
        } catch (error) {
            console.error('加载章节详情失败:', error)
            ElMessage.error('加载章节内容失败')
        } finally {
            chapterLoading.value = false
        }
    }

    // 加载章节评论
    const loadChapterComments = async (chapterId) => {
        if (!chapterId) return

        commentsLoading.value = true
        try {
            const response = await getChapterComments(chapterId)
            if (response.code === 200 && response.data) {
                comments.value = response.data
            }
        } catch (error) {
            console.error('加载评论失败:', error)
        } finally {
            commentsLoading.value = false
        }
    }

    // 提交评论
    const submitComment = async () => {
        if (!newComment.value.trim()) {
            ElMessage.warning('请输入评论内容')
            return
        }

        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId')
        const studentName = localStorage.getItem('studentName') || localStorage.getItem('userName')

        if (!studentId) {
            ElMessage.warning('请先登录')
            return
        }

        commentSubmitting.value = true
        try {
            const commentData = {
                courseId: route.params.id,
                chapterId: currentChapter.value.chapterId,
                userId: studentId,
                userName: studentName,
                userType: 'STUDENT',
                content: newComment.value.trim()
            }

            const response = await addComment(commentData)
            if (response.code === 200) {
                ElMessage.success('评论发表成功')
                newComment.value = ''
                // 重新加载评论
                loadChapterComments(currentChapter.value.chapterId)
            } else {
                ElMessage.error(response.message || '评论发表失败')
            }
        } catch (error) {
            console.error('发表评论失败:', error)
            ElMessage.error('评论发表失败')
        } finally {
            commentSubmitting.value = false
        }
    }

    // 显示回复输入框
    const showReplyInput = (comment) => {
        replyingTo.value = comment.commentId
        replyContent.value = ''
    }

    // 取消回复
    const cancelReply = () => {
        replyingTo.value = null
        replyContent.value = ''
    }

    // 提交回复
    const submitReply = async (parentId) => {
        if (!replyContent.value.trim()) {
            ElMessage.warning('请输入回复内容')
            return
        }

        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId')
        const studentName = localStorage.getItem('studentName') || localStorage.getItem('userName')

        if (!studentId) {
            ElMessage.warning('请先登录')
            return
        }

        replySubmitting.value = true
        try {
            const replyData = {
                courseId: route.params.id,
                chapterId: currentChapter.value.chapterId,
                userId: studentId,
                userName: studentName,
                userType: 'STUDENT',
                content: replyContent.value.trim(),
                parentId: parentId
            }

            const response = await addComment(replyData)
            if (response.code === 200) {
                ElMessage.success('回复成功')
                cancelReply()
                // 重新加载评论
                loadChapterComments(currentChapter.value.chapterId)
            } else {
                ElMessage.error(response.message || '回复失败')
            }
        } catch (error) {
            console.error('回复失败:', error)
            ElMessage.error('回复失败')
        } finally {
            replySubmitting.value = false
        }
    }

    // 格式化评论时间
    const formatCommentTime = (timeString) => {
        if (!timeString) return ''
        try {
            const date = new Date(timeString)
            const now = new Date()
            const diff = now - date
            const minutes = Math.floor(diff / 60000)
            const hours = Math.floor(diff / 3600000)
            const days = Math.floor(diff / 86400000)

            if (minutes < 1) return '刚刚'
            if (minutes < 60) return `${minutes}分钟前`
            if (hours < 24) return `${hours}小时前`
            if (days < 7) return `${days}天前`
            return date.toLocaleDateString('zh-CN')
        } catch {
            return ''
        }
    }

    // 获取课程图片
    const getCourseImage = (image) => {
        if (!image) return 'https://via.placeholder.com/800x450?text=Course'
        if (image.startsWith('http')) return image
        return `http://localhost:8088${image}`
    }

    // 处理图片加载错误
    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/800x450?text=Course'
    }

    // 获取媒体文件URL
    const getMediaUrl = (url) => {
        if (!url) return ''
        if (url.startsWith('http')) return url
        return `http://localhost:8088${url}`
    }

    // 下载PDF
    const downloadPdf = (pdfUrl) => {
        const url = getMediaUrl(pdfUrl)
        window.open(url, '_blank')
    }

    // 格式化文本内容
    const formatTextContent = (content) => {
        if (!content) return ''
        // 将换行符转换为<br>标签
        return content.replace(/\n/g, '<br>')
    }

    // 获取章节类型标签颜色
    const getChapterTypeTag = (type) => {
        const typeMap = {
            'FOLDER': '',
            'VIDEO': 'success',
            'PDF': 'warning',
            'TEXT': 'info',
            'MIXED': 'primary'
        }
        return typeMap[type] || ''
    }

    // 获取章节类型标签文本
    const getTypeLabel = (type) => {
        const labelMap = {
            'FOLDER': '文件夹',
            'VIDEO': '视频',
            'PDF': 'PDF文档',
            'TEXT': '文本',
            'MIXED': '混合内容'
        }
        return labelMap[type] || type
    }

    // 格式化时间
    const formatTime = (timeString) => {
        if (!timeString) return '未知'
        try {
            const date = new Date(timeString)
            return date.toLocaleString('zh-CN')
        } catch {
            return '未知'
        }
    }

    onMounted(() => {
        init()
    })

    return {
        loading,
        canLearn,
        accessMessage,
        courseInfo,
        chapters,
        totalChapters,
        searchText,
        currentChapter,
        chapterLoading,
        treeProps,
        comments,
        commentsLoading,
        newComment,
        commentSubmitting,
        replyingTo,
        replyContent,
        replySubmitting,
        handleChapterClick,
        getCourseImage,
        handleImageError,
        getMediaUrl,
        downloadPdf,
        formatTextContent,
        getChapterTypeTag,
        getTypeLabel,
        formatTime,
        submitComment,
        showReplyInput,
        cancelReply,
        submitReply,
        formatCommentTime
    }
}
