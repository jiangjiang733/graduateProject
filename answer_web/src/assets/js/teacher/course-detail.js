import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseDetail, deleteCourse, getCourseChapters } from '@/api/course.js'
import { Folder, VideoPlay, Files, Document } from '@element-plus/icons-vue'

export function useCourseDetail() {
    const router = useRouter()
    const route = useRoute()

    // 状态
    const course = ref(null)
    const chapters = ref([])
    const loading = ref(true)
    const error = ref(null)
    const activeTab = ref('intro')
    const courseId = ref(route.params.id)

    // 权限
    const permission = ref({
        isOwner: false,
        canEdit: false,
        canDelete: false
    })

    // 章节树配置
    const chapterProps = {
        children: 'children',
        label: 'chapterTitle'
    }

    // 获取当前用户ID
    const getCurrentUserId = () => {
        return localStorage.getItem('teacherId') ||
            localStorage.getItem('t_id') ||
            localStorage.getItem('userId')
    }

    // 加载课程详情
    const loadCourseDetail = async () => {
        try {
            console.log('=== 开始加载课程详情 ===')
            console.log('课程ID:', courseId.value)

            loading.value = true
            error.value = null

            const response = await getCourseDetail(courseId.value)
            console.log('课程详情响应:', response)

            if (response.success && response.data) {
                course.value = response.data
                console.log('课程数据:', course.value)

                // 检查权限
                const currentUserId = getCurrentUserId()
                console.log('当前用户ID:', currentUserId)
                console.log('课程教师ID:', course.value.teacherId)

                const isOwner = course.value.teacherId === currentUserId

                permission.value = {
                    isOwner: isOwner,
                    canEdit: isOwner,
                    canDelete: isOwner
                }
                console.log('权限信息:', permission.value)

                // 加载章节
                await loadChapters()
            } else {
                error.value = response.message || '获取课程详情失败'
                console.error('获取课程详情失败:', error.value)
                ElMessage.error(error.value)
            }
        } catch (err) {
            console.error('加载课程详情失败:', err)
            console.error('错误详情:', err.response?.data || err.message)
            error.value = err.message || '加载课程详情失败'
            ElMessage.error(error.value)
        } finally {
            loading.value = false
            console.log('=== 课程详情加载完成 ===')
        }
    }

    // 加载章节列表
    const loadChapters = async () => {
        try {
            console.log('开始加载章节列表...')
            const response = await getCourseChapters(courseId.value)
            console.log('章节列表响应:', response)

            if (response.success && response.data) {
                console.log('原始章节数据:', response.data)
                // 将扁平数据转换为树形结构
                chapters.value = buildChapterTree(response.data)
                console.log('树形章节数据:', chapters.value)
            } else {
                console.warn('章节数据为空或获取失败')
            }
        } catch (err) {
            console.error('加载章节失败:', err)
            console.error('错误详情:', err.response?.data || err.message)
        }
    }

    // 构建章节树
    const buildChapterTree = (flatData) => {
        if (!flatData || flatData.length === 0) {
            console.log('章节数据为空')
            return []
        }

        console.log('开始构建章节树，数据量:', flatData.length)

        const map = {}
        const roots = []

        // 创建映射 - 使用 chapterId 而不是 id
        flatData.forEach(item => {
            const id = item.chapterId || item.id
            map[id] = { ...item, children: [] }
        })

        console.log('章节映射:', map)

        // 构建树
        flatData.forEach(item => {
            const id = item.chapterId || item.id
            const parentId = item.parentId

            if (parentId && map[parentId]) {
                map[parentId].children.push(map[id])
            } else {
                roots.push(map[id])
            }
        })

        console.log('根节点数量:', roots.length)

        // 按 order 排序
        const sortByOrder = (arr) => {
            arr.sort((a, b) => (a.chapterOrder || a.order || 0) - (b.chapterOrder || b.order || 0))
            arr.forEach(item => {
                if (item.children && item.children.length > 0) {
                    sortByOrder(item.children)
                }
            })
        }

        sortByOrder(roots)
        return roots
    }

    // 获取章节图标
    const getChapterIcon = (type) => {
        const iconMap = {
            'FOLDER': Folder,
            'VIDEO': VideoPlay,
            'PDF': Files,
            'TEXT': Document,
            'MIXED': Document
        }
        return iconMap[type] || Document
    }

    // 格式化日期
    const formatDate = (dateString) => {
        if (!dateString) return '未知'

        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        } catch (err) {
            return '未知'
        }
    }

    // 获取课程图片
    const getCourseImage = (imagePath) => {
        console.log('获取课程图片:', imagePath)

        if (!imagePath) {
            console.log('图片路径为空，使用占位图')
            return 'https://via.placeholder.com/280x200/409EFF/FFFFFF?text=课程封面'
        }

        // 如果是完整URL，直接返回
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.log('使用完整URL:', imagePath)
            return imagePath
        }

        // 如果是相对路径，拼接后端服务器地址（去除 /api 后缀）
        const BASE_URL = 'http://localhost:8088'
        const fullUrl = `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
        console.log('拼接后的URL:', fullUrl)
        return fullUrl
    }

    // 处理图片加载错误
    const handleImageError = (event) => {
        console.error('图片加载失败，使用占位图')
        event.target.src = 'https://via.placeholder.com/280x200/409EFF/FFFFFF?text=课程封面'
    }

    // 返回
    const goBack = () => {
        router.back()
    }

    // 编辑课程
    const editCourse = () => {
        router.push(`/teacher/course/edit/${courseId.value}`)
    }

    // 管理章节
    const manageChapters = () => {
        router.push(`/teacher/course/edit/${courseId.value}`)
    }

    // 查看内容
    const viewContent = (chapter) => {
        // 跳转到学习预览页面
        router.push(`/teacher/course/${courseId.value}/learn?chapterId=${chapter.chapterId || chapter.id}`)
    }

    // 确认删除
    const confirmDelete = async () => {
        try {
            await ElMessageBox.confirm(
                '删除课程将同时删除所有章节、作业和相关数据，此操作不可恢复。确定要删除吗？',
                '警告',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                    confirmButtonClass: 'el-button--danger'
                }
            )

            await handleDelete()
        } catch (err) {
            // 用户取消删除
            if (err !== 'cancel') {
                console.error('删除确认失败:', err)
            }
        }
    }

    // 执行删除
    const handleDelete = async () => {
        try {
            const teacherId = getCurrentUserId()

            if (!teacherId) {
                ElMessage.error('请先登录')
                return
            }

            const response = await deleteCourse(courseId.value, teacherId)

            if (response.success) {
                ElMessage.success('课程删除成功')
                router.push('/teacher/courses')
            } else {
                ElMessage.error(response.message || '删除失败')
            }
        } catch (err) {
            console.error('删除课程失败:', err)
            ElMessage.error('删除课程失败')
        }
    }

    // 挂载时加载数据
    onMounted(() => {
        if (courseId.value) {
            loadCourseDetail()
        } else {
            error.value = '无效的课程ID'
            loading.value = false
        }
    })

    return {
        course,
        chapters,
        loading,
        error,
        activeTab,
        permission,
        chapterProps,
        courseId,
        goBack,
        confirmDelete,
        editCourse,
        manageChapters,
        viewContent,
        getChapterIcon,
        formatDate,
        getCourseImage,
        handleImageError
    }
}
