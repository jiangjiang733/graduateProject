import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseDetail } from '@/api/course.js'
import { checkEnrollmentStatus } from '@/api/enrollment.js'
import { getCourseChapters, getChapterDetail } from '@/api/chapter.js'
import { getChapterComments, getCourseComments, addComment, deleteComment } from '@/api/comment.js'
import { getUserAvatar } from '@/utils/resource.js'

export function useCourseLearn() {
    const router = useRouter()
    const route = useRoute()

    // 用户信息
    const currentUserId = computed(() => localStorage.getItem('studentId') || localStorage.getItem('userId') || localStorage.getItem('s_id') || localStorage.getItem('teacherId') || localStorage.getItem('t_id'))
    const currentUserName = computed(() => localStorage.getItem('studentName') || localStorage.getItem('userName') || localStorage.getItem('s_name') || localStorage.getItem('teacherName') || localStorage.getItem('t_name'))
    const currentUserAvatar = computed(() => localStorage.getItem('studentAvatar') || localStorage.getItem('userAvatar') || localStorage.getItem('avatar') || localStorage.getItem('s_avatar') || localStorage.getItem('t_avatar'))
    const isTeacher = computed(() => !!(localStorage.getItem('teacherId') || localStorage.getItem('t_id')))

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
    const expandedComments = ref([]) // 存储已展开回复的评论ID

    // 切换回复展开状态
    const toggleExpand = (commentId) => {
        const index = expandedComments.value.indexOf(commentId)
        if (index > -1) {
            expandedComments.value.splice(index, 1)
        } else {
            expandedComments.value.push(commentId)
        }
    }

    const treeProps = {
        children: 'children',
        label: 'chapterTitle'
    }

    // 工具函数：将平铺回复列表转换为树形结构（带章节过滤）
    const buildCommentTree = (list, filterChapterId = null) => {
        if (!list || list.length === 0) return [];

        const map = new Map();
        const tree = [];

        // 1. 初始化项
        list.forEach(item => {
            const id = String(item.commentId || item.id);
            map.set(id, { ...item, replies: [] });
        });

        // 2. 建立全量层级
        list.forEach(item => {
            const id = String(item.commentId || item.id);
            const parentId = item.parentId ? String(item.parentId) : null;
            const currentItem = map.get(id);

            if (parentId && parentId !== '0' && map.has(parentId)) {
                map.get(parentId).replies.push(currentItem);
            }
        });

        // 3. 只将符合章节条件的根评论放入顶层
        list.forEach(item => {
            const id = String(item.commentId || item.id);
            const parentId = item.parentId ? String(item.parentId) : null;

            // 只有没有父级（根评论）且章节匹配的情况才作为树根
            if (!parentId || parentId === '0') {
                if (!filterChapterId || String(item.chapterId) === String(filterChapterId)) {
                    tree.push(map.get(id));
                }
            }
        });

        // 4. 排序
        const sortRecursive = (items, isRoot = true) => {
            items.sort((a, b) => {
                const dateA = new Date(a.createTime);
                const dateB = new Date(b.createTime);
                return isRoot ? dateB - dateA : dateA - dateB;
            });
            items.forEach(item => {
                if (item.replies && item.replies.length > 0) {
                    sortRecursive(item.replies, false);
                }
            });
        };
        sortRecursive(tree);

        return tree;
    };

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

    // 计算当前章节的相关评论总数
    const totalCommentCount = computed(() => {
        let count = 0
        const traverse = (list) => {
            list.forEach(c => {
                count++
                if (c.replies && c.replies.length > 0) {
                    traverse(c.replies)
                }
            })
        }
        traverse(comments.value);
        return count;
    });

    // 初始化
    const init = async () => {
        const courseId = route.params.id
        const chapterIdFromQuery = route.query.chapterId
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId') || localStorage.getItem('s_id')
        const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

        if (!studentId && !teacherId) {
            ElMessage.warning('请先登录')
            router.push('/login')
            return
        }

        try {
            loading.value = true

            // 如果是老师，直接跳过报名检查
            if (!teacherId) {
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
            } else {
                console.log('教师身份登录，跳过报名审核检查')
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

                // 如果 URL 中有 chapterId，保存扁平化列表以便快速查找
                allChaptersRaw = chaptersResponse.data

                if (chapterIdFromQuery) {
                    const targetChapter = allChaptersRaw.find(c => String(c.chapterId) === String(chapterIdFromQuery))
                    if (targetChapter) {
                        handleChapterClick(targetChapter)
                    }
                }
            }

            canLearn.value = true
            // 根据初始章节加载评论
            if (chapterIdFromQuery) {
                loadChapterComments(chapterIdFromQuery)
            }
        } catch (error) {
            console.error('初始化失败:', error)
            ElMessage.error('加载课程信息失败')
            canLearn.value = false
            accessMessage.value = '加载课程信息失败，请稍后重试'
        } finally {
            loading.value = false
        }
    }

    let allChaptersRaw = []

    // 监听路由参数变化，处理在同一页面切换章节的情况
    watch(() => route.query.chapterId, (newId) => {
        if (newId && allChaptersRaw.length > 0) {
            const targetChapter = allChaptersRaw.find(c => String(c.chapterId) === String(newId))
            if (targetChapter && currentChapter.value?.chapterId !== targetChapter.chapterId) {
                handleChapterClick(targetChapter)
            }
        }
    })

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

        // 如果点击的是当前已选中的章节，且正在加载，则跳过
        if (currentChapter.value?.chapterId === data.chapterId && !chapterLoading.value) {
            // 还是重新加载一下评论以防万一
            loadChapterComments(data.chapterId)
            return
        }

        try {
            chapterLoading.value = true
            currentChapter.value = data

            // 更新路由参数，不保留历史记录（以免后退时死循环）
            router.replace({
                query: { ...route.query, chapterId: data.chapterId }
            })

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
        const courseId = route.params.id
        if (!courseId || !chapterId) return

        commentsLoading.value = true
        try {
            // 我们通过获取课程全量评论，然后在前端进行章节过滤
            // 这样可以确保根评论属于该章节的同时，其下的回复（即便没有chapterId）也能完整显示
            const response = await getCourseComments(courseId)
            if (response && response.code === 200) {
                comments.value = buildCommentTree(response.data || [], chapterId)
            } else {
                comments.value = []
            }
        } catch (error) {
            console.error('加载评论发生错误:', error)
            comments.value = []
        } finally {
            commentsLoading.value = false
        }
    }

    // 检查是否可以删除
    const canDelete = (comment) => {
        // 1. 老师可以删除任何人的评论
        if (isTeacher.value) return true
        // 2. 学生只能删除自己的
        return String(comment.userId) === String(currentUserId.value)
    }

    // 处理删除评论
    const handleDeleteComment = async (commentId) => {
        try {
            await ElMessageBox.confirm('确定要删除这条讨论吗？删除后将无法恢复。', '提示', {
                type: 'warning',
                confirmButtonText: '确定',
                cancelButtonText: '取消'
            })

            const response = await deleteComment(commentId)
            if (response.code === 200) {
                ElMessage.success('删除成功')
                // 重新加载评论
                loadChapterComments(currentChapter.value.chapterId)
            } else {
                ElMessage.error(response.message || '删除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除评论失败:', error)
                ElMessage.error('删除失败')
            }
        }
    }

    // 提交评论
    const submitComment = async () => {
        if (!newComment.value.trim()) {
            ElMessage.warning('请输入评论内容')
            return
        }

        if (!currentUserId.value) {
            ElMessage.warning('请先登录')
            return
        }

        commentSubmitting.value = true
        try {
            const commentData = {
                courseId: route.params.id,
                chapterId: currentChapter.value.chapterId,
                userId: currentUserId.value,
                userName: currentUserName.value,
                userAvatar: currentUserAvatar.value,
                userType: isTeacher.value ? 'TEACHER' : 'STUDENT',
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

        if (!currentUserId.value) {
            ElMessage.warning('请先登录')
            return
        }

        replySubmitting.value = true
        try {
            const replyData = {
                courseId: route.params.id,
                chapterId: currentChapter.value.chapterId,
                userId: currentUserId.value,
                userName: currentUserName.value,
                userAvatar: currentUserAvatar.value,
                userType: isTeacher.value ? 'TEACHER' : 'STUDENT',
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

    const getChapterTypeColor = (type) => {
        const colors = {
            'VIDEO': '#6366f1',
            'PDF': '#f59e0b',
            'EXCEL': '#10b981',
            'WORD': '#3b82f6',
            'TEXT': '#8b5cf6'
        }
        return colors[type] || '#94a3b8'
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
        totalCommentCount,
        commentsLoading,
        newComment,
        commentSubmitting,
        replyingTo,
        replyContent,
        replySubmitting,
        expandedComments,
        currentUserId,
        currentUserName,
        currentUserAvatar,
        isTeacher,
        handleChapterClick,
        loadChapterComments,
        getCourseImage,
        handleImageError,
        getMediaUrl,
        downloadPdf,
        formatTextContent,
        getChapterTypeTag,
        getChapterTypeColor,
        getTypeLabel,
        formatTime,
        submitComment,
        showReplyInput,
        cancelReply,
        submitReply,
        formatCommentTime,
        getUserAvatar,
        toggleExpand,
        canDelete,
        handleDeleteComment
    }
}
