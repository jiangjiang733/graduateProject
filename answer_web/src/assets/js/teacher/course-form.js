import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    createCourse,
    getCourseDetail,
    updateCourse,
    getCourseChapters,
    createFolderChapter,
    createVideoChapter,
    createPdfChapter,
    createTextChapter,
    createMixedChapter,
    createMixedChapterMulti,
    getChapterDetail,
    updateChapter,
    updateChapterWithFiles,
    deleteChapter as deleteChapterApi,
    deleteChapterVideo,
    deleteChapterPdf
} from '@/api/course.js'
import {
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getCourseSchedules
} from '@/api/schedule.js'
import { API_BASE_URL } from '@/api/request.js'

export function useCourseForm() {
    const videoUploadRef = ref()
    // 获取基础URL (去除/api后缀)
    const BASE_URL = API_BASE_URL.replace('/api', '')
    const route = useRoute()
    const router = useRouter()
    const formRef = ref()

    // 判断是编辑还是创建
    const isEdit = computed(() => {
        const id = route.params.id
        const result = id && id !== 'create'
        console.log('isEdit computed:', { id, result })
        return result
    })
    const courseId = computed(() => {
        const id = route.params.id
        console.log('courseId computed:', id)
        return id
    })

    // 标签页
    const activeTab = ref('basic')

    // 表单数据
    const formData = reactive({
        courseName: '',
        courseDescription: '',
        major: '',
        classification: '公开课程',
        state: 1, // 0=草稿, 1=已发布
        num: 0, // 招生人数限制，0表示不限制
        remark: '', // 备注说明
        image: null
    })

    // 日期范围
    const dateRange = ref([])

    // 封面预览
    const coverPreview = ref('')
    const coverFile = ref(null)

    // 步骤定义和导航
    const steps = ref([
        { label: '基本信息', value: 'basic' },
        { label: '课程详情', value: 'details' },
        { label: '课程时间', value: 'schedule' },
        { label: '课程大纲', value: 'chapters' }
    ])
    const currentStep = ref(0)

    const nextStep = () => {
        if (currentStep.value < steps.value.length - 1) {
            currentStep.value++
        }
    }

    const prevStep = () => {
        if (currentStep.value > 0) {
            currentStep.value--
        }
    }

    const goToStep = (index) => {
        currentStep.value = index
    }

    // 提交状态
    const submitting = ref(false)

    const treeData = ref([])
    const chaptersLoading = ref(false)
    const addDialogVisible = ref(false)
    const isEditChapter = ref(false)
    const detailDialogVisible = ref(false)
    const currentParent = ref(null)
    const currentChapter = ref(null)
    const chapterSearchText = ref('')

    const treeProps = {
        children: 'children',
        label: 'chapterTitle'
    }

    const chapterForm = ref({
        type: 'MIXED',
        title: '',
        order: 1,
        // New file(s) selected by user this session
        videos: [],   // Array<File> for multi-video
        pdfs: [],     // Array<File> for multi-pdf
        video: null,  // legacy single-file (kept for compat)
        pdf: null,    // legacy single-file (kept for compat)
        content: '',
        // Existing file metadata from server (shown in edit mode)
        videoUrl: '',
        pdfUrl: '',
        existingVideos: [], // [{name, size, url, uploadTime}]
        existingPdfs: []    // [{name, size, url, uploadTime}]
    })

    watch(() => chapterForm.value.type, (newType, oldType) => {
        if (!oldType || newType === oldType) return
        if (newType === 'FOLDER') {
            chapterForm.value.existingVideos = []
            chapterForm.value.existingPdfs = []
            chapterForm.value.videos = []
            chapterForm.value.pdfs = []
            chapterForm.value.video = null
            chapterForm.value.pdf = null
            chapterForm.value.videoUrl = ''
            chapterForm.value.pdfUrl = ''
            chapterForm.value.content = ''
        } else if (newType === 'VIDEO') {
            chapterForm.value.existingPdfs = []
            chapterForm.value.pdfs = []
            chapterForm.value.pdf = null
            chapterForm.value.pdfUrl = ''
            chapterForm.value.content = ''
        } else if (newType === 'PDF') {
            chapterForm.value.existingVideos = []
            chapterForm.value.videos = []
            chapterForm.value.video = null
            chapterForm.value.videoUrl = ''
            chapterForm.value.content = ''
        } else if (newType === 'TEXT') {
            chapterForm.value.existingVideos = []
            chapterForm.value.existingPdfs = []
            chapterForm.value.videos = []
            chapterForm.value.pdfs = []
            chapterForm.value.video = null
            chapterForm.value.pdf = null
            chapterForm.value.videoUrl = ''
            chapterForm.value.pdfUrl = ''
        }
    })

    // ==================== 课程时间表相关 ====================
    const schedules = ref([])
    const schedulesToDelete = ref([])
    const scheduleLoading = ref(false)
    const scheduleDialogVisible = ref(false)
    const isEditSchedule = ref(false)
    const scheduleForm = reactive({
        scheduleId: null,
        courseId: '',
        dayOfWeek: 1,
        startSection: 1,
        endSection: 2,
        startWeek: 1,
        endWeek: 16,
        location: '',
        status: 1
    })

    // 加载课程时间表
    const loadSchedules = async () => {
        if (!courseId.value) {
            console.log('课程ID为空，跳过加载时间表')
            return
        }

        console.log('开始加载课程时间表，课程ID:', courseId.value)
        scheduleLoading.value = true

        try {
            const response = await getCourseSchedules(courseId.value)
            console.log('课程时间表响应:', response)

            if (response.success) {
                schedules.value = response.data || []
                schedulesToDelete.value = []
                console.log('课程时间表数据:', schedules.value)
            } else {
                console.error('获取课程时间表失败:', response.message)
                ElMessage.error(response.message || '获取课程时间表失败')
            }
        } catch (error) {
            console.error('加载课程时间表失败:', error)
            console.error('错误详情:', error.response?.data || error.message)

            // 显示更详细的错误信息
            const errorMsg = error.response?.data?.message || error.message || '加载课程时间表失败'
            ElMessage.error(errorMsg)
        } finally {
            scheduleLoading.value = false
        }
    }

    // 打开添加时间对话框
    const openScheduleDialog = () => {
        isEditSchedule.value = false
        Object.assign(scheduleForm, {
            scheduleId: null,
            courseId: courseId.value,
            dayOfWeek: 1,
            startSection: 1,
            endSection: 2,
            startWeek: 1,
            endWeek: 16,
            location: '',
            status: 1
        })
        scheduleDialogVisible.value = true
    }

    // 编辑时间
    const editSchedule = (schedule) => {
        isEditSchedule.value = true
        Object.assign(scheduleForm, schedule)
        scheduleDialogVisible.value = true
    }

    // 提交时间表（仅本地操作，实际提交在更新课程时执行）
    const submitSchedule = async () => {
        // 验证
        if (!scheduleForm.dayOfWeek || !scheduleForm.startSection || !scheduleForm.endSection) {
            ElMessage.warning('请填写完整信息')
            return
        }
        if (scheduleForm.startSection > scheduleForm.endSection) {
            ElMessage.warning('开始节次不能大于结束节次')
            return
        }
        if (scheduleForm.startWeek > scheduleForm.endWeek) {
            ElMessage.warning('开始周数不能大于结束周数')
            return
        }
        if (!scheduleForm.location) {
            ElMessage.warning('请输入上课地点')
            return
        }

        const tempSchedule = {
            scheduleId: scheduleForm.scheduleId,
            courseId: scheduleForm.courseId || courseId.value,
            dayOfWeek: scheduleForm.dayOfWeek,
            startSection: scheduleForm.startSection,
            endSection: scheduleForm.endSection,
            startWeek: scheduleForm.startWeek,
            endWeek: scheduleForm.endWeek,
            location: scheduleForm.location,
            status: scheduleForm.status || 1
        }

        if (isEditSchedule.value) {
            // 编辑模式
            const index = schedules.value.findIndex(item => item.scheduleId === tempSchedule.scheduleId)
            if (index !== -1) {
                // 如果不是新添加的，标记为待修改
                if (!schedules.value[index].isNew) {
                    tempSchedule.isModified = true
                }
                schedules.value[index] = tempSchedule
            }
            ElMessage.success('已标记修改，点击"更新课程"后生效')
        } else {
            // 新增模式
            tempSchedule.scheduleId = 'temp_' + Date.now()
            tempSchedule.isNew = true
            schedules.value.push(tempSchedule)
            ElMessage.success('已添加到列表，点击"更新课程"后生效')
        }

        scheduleDialogVisible.value = false
    }

    // 删除时间（仅标记待删除，实际删除在更新课程时执行）
    const deleteScheduleItem = async (schedule) => {
        try {
            await ElMessageBox.confirm(
                '确定要删除这个上课时间吗？（需点击"更新课程"才会真正删除）',
                '删除确认',
                { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
            )

            // 如果是创建课程模式，仅在本地操作
            if (!isEdit.value) {
                const index = schedules.value.findIndex(item => item.scheduleId === schedule.scheduleId)
                if (index !== -1) {
                    schedules.value.splice(index, 1)
                    ElMessage.success('已标记删除')
                }
                return
            }

            // 编辑模式：标记待删除，加入待删除列表
            if (schedule.scheduleId && !schedulesToDelete.value.includes(schedule.scheduleId)) {
                schedulesToDelete.value.push(schedule.scheduleId)
            }

            // 从当前显示列表移除
            const index = schedules.value.findIndex(item => item.scheduleId === schedule.scheduleId)
            if (index !== -1) {
                schedules.value.splice(index, 1)
            }

            ElMessage.success('已标记待删除，点击"更新课程"后生效')
        } catch (error) {
            if (error === 'cancel' || error?.toString() === 'cancel') return
            console.error('删除课程时间失败:', error)
            const msg = error?.response?.data?.message || error?.message || '删除失败'
            ElMessage.error(msg)
        }
    }

    // 获取星期名称
    const getDayName = (day) => {
        const days = ['', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
        return days[day] || ''
    }

    // 表单验证规则
    const rules = {
        courseName: [
            { required: true, message: '请输入课程名称', trigger: 'blur' },
            { min: 2, max: 100, message: '课程名称长度在2-100个字符', trigger: 'blur' }
        ],
        courseDescription: [
            { max: 500, message: '课程描述不能超过500个字符', trigger: 'blur' }
        ]
    }

    // 加载课程详情（编辑模式）
    const loadCourseDetail = async () => {
        try {
            console.log('开始加载课程详情，课程ID:', route.params.id)
            const response = await getCourseDetail(route.params.id)
            console.log('课程详情响应:', response)

            if (response.success && response.data) {
                const course = response.data
                console.log('课程数据:', course)

                formData.courseName = course.courseName || ''
                formData.courseDescription = course.courseDescription || ''
                formData.major = course.major || ''
                formData.classification = course.classification || '公开课程'
                formData.state = course.state !== undefined ? course.state : 1
                formData.num = course.num || 0
                formData.remark = course.remark || ''

                console.log('表单数据已设置:', formData)

                // 设置日期范围
                if (course.startTime && course.endTime) {
                    dateRange.value = [course.startTime, course.endTime]
                    console.log('日期范围已设置:', dateRange.value)
                }

                // 设置封面预览
                if (course.image) {
                    coverPreview.value = getCourseImage(course.image)
                    console.log('封面预览已设置:', coverPreview.value)
                }

                // 加载章节数据
                await loadChapters()
            } else {
                console.error('响应数据无效:', response)
                ElMessage.error('加载课程详情失败：数据无效')
            }
        } catch (error) {
            console.error('加载课程详情失败:', error)
            ElMessage.error('加载课程详情失败: ' + (error.message || '未知错误'))
        }
    }

    // 加载章节数据
    const loadChapters = async () => {
        try {
            const response = await getCourseChapters(courseId.value)
            if (response.success && response.data) {
                treeData.value = response.data
                console.log('章节数据已加载:', treeData.value)
            }
        } catch (error) {
            console.error('加载章节失败:', error)
        }
    }

    // 获取课程图片URL
    const getCourseImage = (image) => {
        if (!image) return ''
        if (image.startsWith('http://') || image.startsWith('https://')) {
            return image
        }
        return `${BASE_URL}${image} `
    }

    // 封面上传前验证
    const beforeCoverUpload = (file) => {
        const isImage = file.type.startsWith('image/')
        const isLt2M = file.size / 1024 / 1024 < 2

        if (!isImage) {
            ElMessage.error('只能上传图片文件!')
            return false
        }
        if (!isLt2M) {
            ElMessage.error('图片大小不能超过 2MB!')
            return false
        }
        return true
    }

    // 封面选择
    const handleCoverChange = (file) => {
        coverFile.value = file.raw

        // 预览
        const reader = new FileReader()
        reader.onload = (e) => {
            coverPreview.value = e.target.result
        }
        reader.readAsDataURL(file.raw)
    }

    // 提交表单
    const submitForm = async () => {
        try {
            // 表单验证
            await formRef.value.validate()

            submitting.value = true

            // 获取教师信息
            const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
            const teacherName = localStorage.getItem('teacherName') || '教师'

            if (!teacherId) {
                ElMessage.warning('请先登录')
                router.push('/login')
                return
            }

            // 准备提交数据
            const submitData = {
                courseName: formData.courseName,
                teacherId: teacherId,
                teacherName: teacherName,
                courseDescription: formData.courseDescription,
                major: formData.major,
                classification: formData.classification,
                state: formData.state,
                remark: formData.remark || '',
                num: formData.num || 0,
                creatorUsername: teacherName
            }

            // 添加日期范围
            if (dateRange.value && dateRange.value.length === 2) {
                submitData.startTime = dateRange.value[0]
                submitData.endTime = dateRange.value[1]
            }

            // 添加封面
            if (coverFile.value) {
                submitData.image = coverFile.value
            }

            let response
            try {
                if (isEdit.value) {
                    response = await updateCourse(route.params.id, submitData)
                } else {
                    response = await createCourse(submitData)
                }
            } catch (apiError) {
                console.error('API调用失败:', apiError.response?.data || apiError)
                if (apiError.response?.data?.message) {
                    ElMessage.error(apiError.response.data.message)
                } else {
                    ElMessage.error('服务器错误，请稍后重试')
                }
                return
            }

            console.log('API响应:', response)

            if (response.success || response.code === 200 || (response.data && response.data.success)) {
                const success = response.success || (response.data && response.data.success)
                const newCourseId = response.data?.id || response.data?.data?.id || response.id || (isEdit.value ? route.params.id : null)

                // 编辑模式下，先处理待删除的时间表
                if (isEdit.value && schedulesToDelete.value.length > 0) {
                    try {
                        console.log('开始删除时间表，待删除列表:', schedulesToDelete.value)
                        for (const scheduleId of schedulesToDelete.value) {
                            const id = Number(scheduleId)
                            if (!isNaN(id) && id > 0) {
                                console.log('正在删除 scheduleId:', id)
                                const result = await deleteSchedule(id)
                                console.log('删除结果:', result)
                            } else {
                                console.warn('无效的 scheduleId:', scheduleId)
                            }
                        }
                        schedulesToDelete.value = []
                    } catch (deleteError) {
                        console.error('删除时间表失败:', deleteError)
                        ElMessage.warning('课程更新成功，但部分时间表删除失败')
                    }
                }

                // 编辑模式下，处理新增和修改的时间表
                if (isEdit.value && schedules.value.length > 0) {
                    try {
                        for (const schedule of schedules.value) {
                            if (schedule.isNew) {
                                const newSchedule = { ...schedule }
                                delete newSchedule.isNew
                                delete newSchedule.isModified
                                if (newSchedule.scheduleId && String(newSchedule.scheduleId).startsWith('temp_')) {
                                    delete newSchedule.scheduleId
                                }
                                newSchedule.courseId = courseId.value
                                console.log('添加时间表:', newSchedule)
                                const addResult = await addSchedule(newSchedule)
                                console.log('添加结果:', addResult)
                            } else if (schedule.isModified) {
                                const modifiedSchedule = { ...schedule }
                                delete modifiedSchedule.isNew
                                delete modifiedSchedule.isModified
                                const id = Number(modifiedSchedule.scheduleId)
                                console.log('修改时间表 ID:', id, modifiedSchedule)
                                const updateResult = await updateSchedule(id, modifiedSchedule)
                                console.log('修改结果:', updateResult)
                            }
                        }
                    } catch (schedError) {
                        console.error('保存时间表失败:', schedError)
                        ElMessage.warning('课程更新成功，但部分时间表保存失败')
                    }
                }

                if (!isEdit.value && schedules.value.length > 0 && newCourseId) {
                    try {
                        for (const schedule of schedules.value) {
                            schedule.courseId = newCourseId
                            if (schedule.scheduleId && String(schedule.scheduleId).startsWith('temp_')) {
                                delete schedule.scheduleId
                            }
                            await addSchedule(schedule)
                        }
                    } catch (schedError) {
                        console.error('保存时间表失败:', schedError)
                        ElMessage.warning('课程创建成功，但部分时间表保存失败')
                    }
                }

                if (!isEdit.value && treeData.value.length > 0 && newCourseId) {
                    try {
                        ElMessage.info('正在保存课程章节及文件，请稍候...')
                        await submitLocalChapters(newCourseId, treeData.value)
                    } catch (chapError) {
                        console.error('保存章节失败:', chapError)
                        ElMessage.warning('课程创建成功，但部分章节保存失败')
                    }
                }

                ElMessage.success(isEdit.value ? '课程更新成功' : '课程创建成功')
                if (!isEdit.value) {
                    router.push('/teacher/courses')
                } else {
                    loadSchedules()
                }
            } else {
                ElMessage.error(response.message || response.data?.message || '操作失败')
            }
        } catch (error) {
            if (error.errors) {
                return
            }
            console.error('提交失败:', error)
            ElMessage.error('操作失败，请重试')
        } finally {
            submitting.value = false
        }
    }

    // 返回
    const goBack = () => {
        router.push('/teacher/courses')
    }
    // 获取章节列表并构建树形结构
    const fetchChapters = async () => {
        if (!courseId.value || courseId.value === 'create') return

        chaptersLoading.value = true
        try {
            const response = await getCourseChapters(courseId.value)
            if (response.success) {
                treeData.value = buildTree(response.data)
            }
        } catch (error) {
            console.error('获取章节失败:', error)
            ElMessage.error('获取章节失败')
        } finally {
            chaptersLoading.value = false
        }
    }

    // 构建树形结构
    const buildTree = (chapters) => {
        const map = {}
        const roots = []

        chapters.forEach(chapter => {
            map[chapter.chapterId] = { ...chapter, children: [] }
        })

        chapters.forEach(chapter => {
            if (chapter.parentId) {
                if (map[chapter.parentId]) {
                    map[chapter.parentId].children.push(map[chapter.chapterId])
                }
            } else {
                roots.push(map[chapter.chapterId])
            }
        })

        return roots
    }

    // 打开添加对话框
    const openAddDialog = (parent) => {
        isEditChapter.value = false
        currentParent.value = parent
        chapterForm.value = {
            type: 'MIXED',
            title: '',
            order: parent ? (parent.children?.length || 0) + 1 : treeData.value.length + 1,
            videos: [],
            pdfs: [],
            video: null,
            pdf: null,
            content: '',
            videoUrl: '',
            pdfUrl: '',
            existingVideos: [],
            existingPdfs: []
        }
        if (videoUploadRef.value) {
            videoUploadRef.value.clearFiles()
        }
        addDialogVisible.value = true
    }
    // 编辑章节
    const editChapter = (chapter) => {
        isEditChapter.value = true
        currentParent.value = null

        const form = {
            chapterId: chapter.chapterId,
            type: chapter.chapterType,
            title: chapter.chapterTitle,
            order: chapter.chapterOrder || chapter.order || 1,
            videos: [],
            pdfs: [],
            video: null,
            pdf: null,
            videoUrl: '',
            pdfUrl: '',
            content: chapter.textContent || '',
            existingVideos: [],
            existingPdfs: []
        }

        if (chapter.chapterId && String(chapter.chapterId).startsWith('temp_')) {
            form.video = chapter.video
            form.pdf = chapter.pdf
            form.videos = chapter.videos || (chapter.video ? [chapter.video] : [])
            form.pdfs = chapter.pdfs || (chapter.pdf ? [chapter.pdf] : [])

            if (chapter.video instanceof File) {
                form.existingVideos = [{ name: chapter.video.name, size: chapter.video.size, url: URL.createObjectURL(chapter.video), isLocal: true }]
            }
            if (chapter.pdf instanceof File) {
                form.existingPdfs = [{ name: chapter.pdf.name, size: chapter.pdf.size, url: URL.createObjectURL(chapter.pdf), isLocal: true }]
            }
        } else {
            const serverVideoUrl = chapter.videoUrl || ''
            const serverPdfUrl = chapter.pdfUrl || ''

            form.videoUrl = serverVideoUrl
            form.pdfUrl = serverPdfUrl

            // 支持 & 分隔的多文件 URL
            if (serverVideoUrl && serverVideoUrl.trim() !== '') {
                form.existingVideos = serverVideoUrl.split('&')
                    .filter(u => u.trim())
                    .map(u => ({ name: extractFileName(u.trim()), url: u.trim(), isLocal: false }))
            }
            if (serverPdfUrl && serverPdfUrl.trim() !== '') {
                form.existingPdfs = serverPdfUrl.split('&')
                    .filter(u => u.trim())
                    .map(u => ({ name: extractFileName(u.trim()), url: u.trim(), isLocal: false }))
            }
        }

        chapterForm.value = form

        if (videoUploadRef.value) {
            videoUploadRef.value.clearFiles()
        }
        addDialogVisible.value = true
    }

    const extractFileName = (url) => {
        if (!url) return ''
        const parts = url.split('/')
        const last = parts[parts.length - 1]
        return decodeURIComponent(last.split('?')[0])
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    }

    // 文件选择 - 支持多文件
    const handleVideoChange = (file, fileList) => {
        // fileList contains all selected files
        chapterForm.value.videos = fileList.map(f => f.raw).filter(Boolean)
        // Also keep single-file compat
        chapterForm.value.video = chapterForm.value.videos[0] || null
    }

    const handleVideoRemove = (file, fileList) => {
        chapterForm.value.videos = fileList.map(f => f.raw).filter(Boolean)
        chapterForm.value.video = chapterForm.value.videos[0] || null
    }

    const removeNewVideo = (index) => {
        chapterForm.value.videos.splice(index, 1)
        chapterForm.value.video = chapterForm.value.videos[0] || null
        if (videoUploadRef.value) {
            const currentFiles = videoUploadRef.value.uploadFiles || []
            currentFiles.splice(index, 1)
        }
    }

    const handlePdfChange = (file, fileList) => {
        chapterForm.value.pdfs = fileList.map(f => f.raw).filter(Boolean)
        chapterForm.value.pdf = chapterForm.value.pdfs[0] || null
    }

    const handlePdfRemove = (file, fileList) => {
        chapterForm.value.pdfs = fileList.map(f => f.raw).filter(Boolean)
        chapterForm.value.pdf = chapterForm.value.pdfs[0] || null
    }

    const removeNewPdf = (index) => {
        chapterForm.value.pdfs.splice(index, 1)
        chapterForm.value.pdf = chapterForm.value.pdfs[0] || null
    }

    // 移除已有文件——仅标记待删除，实际操作在点击「保存修改」时执行
    const removeExistingVideo = (index) => {
        const file = chapterForm.value.existingVideos[index]
        if (!file) return
        // 本地未保存的临时文件直接删除
        if (file.isLocal) {
            chapterForm.value.existingVideos.splice(index, 1)
            if (chapterForm.value.existingVideos.length === 0) chapterForm.value.videoUrl = ''
            return
        }
        // 服务器文件：标记待删除（保留 url 以便保存时传给后端）
        chapterForm.value.existingVideos[index] = { ...file, pendingDelete: true }
        ElMessage.info('已标记待删除，请点击「保存修改」生效')
    }

    const removeExistingPdf = (index) => {
        const file = chapterForm.value.existingPdfs[index]
        if (!file) return
        if (file.isLocal) {
            chapterForm.value.existingPdfs.splice(index, 1)
            if (chapterForm.value.existingPdfs.length === 0) chapterForm.value.pdfUrl = ''
            return
        }
        chapterForm.value.existingPdfs[index] = { ...file, pendingDelete: true }
        ElMessage.info('已标记待删除，请点击「保存修改」生效')
    }

    // 辅助：更新本地 treeData 中指定章节的某个字段
    const updateTreeNodeField = (chapterId, field, value) => {
        const walk = (nodes) => {
            for (const node of nodes) {
                if (String(node.chapterId) === String(chapterId)) {
                    node[field] = value
                    return true
                }
                if (node.children && walk(node.children)) return true
            }
            return false
        }
        walk(treeData.value)
    }

    // 提交章节
    const submitChapter = async () => {
        if (!chapterForm.value.title) {
            ElMessage.warning('请输入章节名称')
            return
        }

        const hasNewVideos = chapterForm.value.videos && chapterForm.value.videos.length > 0
        const hasNewPdfs = chapterForm.value.pdfs && chapterForm.value.pdfs.length > 0
        // 没有标记待删除的已保存视频才算“有”
        const hasExistingVideo = chapterForm.value.existingVideos &&
            chapterForm.value.existingVideos.some(f => !f.pendingDelete)
        const hasExistingPdf = chapterForm.value.existingPdfs &&
            chapterForm.value.existingPdfs.some(f => !f.pendingDelete)

        // ========== 文件验证 ==========
        if (chapterForm.value.type === 'VIDEO') {
            if (!hasNewVideos && !hasExistingVideo && !chapterForm.value.videoUrl) {
                ElMessage.warning('视频章节必须包含视频文件')
                return
            }
        }

        if (chapterForm.value.type === 'MIXED') {
            const hasVideo = hasNewVideos || hasExistingVideo || !!chapterForm.value.videoUrl
            const hasPdf = hasNewPdfs || hasExistingPdf || !!chapterForm.value.pdfUrl
            const hasContent = !!chapterForm.value.content

            if (!hasVideo && !hasPdf && !hasContent) {
                ElMessage.warning('混合内容至少需要包含一种内容(视频/PDF/文本)')
                return
            }
        }

        if (!isEdit.value) {
            // ========== 创建课程模式：本地暂存（支持多文件） ==========
            const tempId = chapterForm.value.chapterId || `temp_chap_${Date.now()}`
            const newChapter = {
                chapterId: tempId,
                parentId: currentParent.value ? currentParent.value.chapterId : null,
                chapterTitle: chapterForm.value.title,
                chapterType: chapterForm.value.type,
                chapterOrder: chapterForm.value.order,
                video: chapterForm.value.videos.length > 0 ? chapterForm.value.videos[0] : chapterForm.value.video,
                pdf: chapterForm.value.pdfs.length > 0 ? chapterForm.value.pdfs[0] : chapterForm.value.pdf,
                videos: [...(chapterForm.value.videos || [])],
                pdfs: [...(chapterForm.value.pdfs || [])],
                textContent: chapterForm.value.content,
                children: []
            }

            if (isEditChapter.value) {
                const updateNode = (nodes) => {
                    for (let node of nodes) {
                        if (node.chapterId === tempId) {
                            const mergedChapter = { ...newChapter }

                            // 保留原视频（若用户未选择新文件）
                            if (mergedChapter.videos.length === 0 && node.videos && node.videos.length > 0) {
                                mergedChapter.videos = node.videos
                                mergedChapter.video = node.video
                            } else if (!mergedChapter.video && node.video) {
                                mergedChapter.video = node.video
                            }

                            // 保留原PDF（若用户未选择新文件）
                            if (mergedChapter.pdfs.length === 0 && node.pdfs && node.pdfs.length > 0) {
                                mergedChapter.pdfs = node.pdfs
                                mergedChapter.pdf = node.pdf
                            } else if (!mergedChapter.pdf && node.pdf) {
                                mergedChapter.pdf = node.pdf
                            }

                            Object.assign(node, mergedChapter)
                            return true
                        }
                        if (node.children && updateNode(node.children)) return true
                    }
                    return false
                }
                updateNode(treeData.value)
                ElMessage.success('已更新本地章节')
            } else {
                if (currentParent.value) {
                    if (!currentParent.value.children) currentParent.value.children = []
                    currentParent.value.children.push(newChapter)
                } else {
                    treeData.value.push(newChapter)
                }
                ElMessage.success('已添加到大纲')
            }
            addDialogVisible.value = false
            return
        }

        // ========== 编辑课程模式：直接提交到后端 ==========
        chaptersLoading.value = true
        try {
            const userId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')

            // ① 先处理标记为 pendingDelete 的文件（在保存时才真正删除）
            if (isEditChapter.value && chapterForm.value.chapterId && isEdit.value) {
                const videoPending = chapterForm.value.existingVideos.filter(f => f.pendingDelete && !f.isLocal)
                const pdfPending = chapterForm.value.existingPdfs.filter(f => f.pendingDelete && !f.isLocal)

                for (const f of videoPending) {
                    try {
                        // 传递具体的 url，后端只删这一个
                        await deleteChapterVideo(chapterForm.value.chapterId, userId, f.url)
                        updateTreeNodeField(chapterForm.value.chapterId, 'videoUrl', null)
                    } catch (e) { console.error('删除视频失败:', e) }
                }
                for (const f of pdfPending) {
                    try {
                        await deleteChapterPdf(chapterForm.value.chapterId, userId, f.url)
                        updateTreeNodeField(chapterForm.value.chapterId, 'pdfUrl', null)
                    } catch (e) { console.error('删除PDF失败:', e) }
                }

                // 删除完成后从列表移除待删元素
                chapterForm.value.existingVideos = chapterForm.value.existingVideos.filter(f => !f.pendingDelete)
                chapterForm.value.existingPdfs = chapterForm.value.existingPdfs.filter(f => !f.pendingDelete)
            }

            let response
            if (isEditChapter.value) {
                // ② 更新章节内容
                const hasNewVids = chapterForm.value.videos && chapterForm.value.videos.length > 0
                const hasNewPdfsNow = chapterForm.value.pdfs && chapterForm.value.pdfs.length > 0

                const updateData = {
                    chapterTitle: chapterForm.value.title,
                    chapterOrder: chapterForm.value.order,
                    chapterType: chapterForm.value.type,
                    textContent: chapterForm.value.content || '',
                    videos: chapterForm.value.videos || [],
                    pdfs: chapterForm.value.pdfs || []
                }

                if (hasNewVids || hasNewPdfsNow) {
                    response = await updateChapterWithFiles(chapterForm.value.chapterId, userId, updateData)
                    const result = response.data || response
                    if (result.success || result.code === 200) {
                        ElMessage.success('章节及文件更新成功')
                        addDialogVisible.value = false
                        fetchChapters()
                    } else {
                        ElMessage.error(result.message || '更新失败')
                    }
                } else {
                    const plainData = {
                        chapterTitle: chapterForm.value.title,
                        chapterOrder: chapterForm.value.order,
                        chapterType: chapterForm.value.type,
                        textContent: chapterForm.value.content || ''
                    }
                    response = await updateChapter(chapterForm.value.chapterId, userId, plainData)
                    const result = response
                    if (result.success || result.code === 200) {
                        ElMessage.success('章节更新成功')
                        addDialogVisible.value = false
                        fetchChapters()
                    } else {
                        ElMessage.error(result.message || '更新失败')
                    }
                }
            } else {
                // ③ 新建章节
                const data = {
                    courseId: courseId.value,
                    parentId: currentParent.value?.chapterId,
                    title: chapterForm.value.title,
                    order: chapterForm.value.order
                }
                switch (chapterForm.value.type) {
                    case 'FOLDER': response = await createFolderChapter(data); break
                    case 'VIDEO':
                        data.video = chapterForm.value.videos.length > 0 ? chapterForm.value.videos[0] : chapterForm.value.video
                        response = await createVideoChapter(data); break
                    case 'PDF':
                        data.pdf = chapterForm.value.pdfs.length > 0 ? chapterForm.value.pdfs[0] : chapterForm.value.pdf
                        response = await createPdfChapter(data); break
                    case 'TEXT':
                        data.content = chapterForm.value.content
                        response = await createTextChapter(data); break
                    case 'MIXED':
                        data.videos = chapterForm.value.videos || []
                        data.pdfs = chapterForm.value.pdfs || []
                        data.video = data.videos[0] || chapterForm.value.video
                        data.pdf = data.pdfs[0] || chapterForm.value.pdf
                        data.content = chapterForm.value.content
                        response = await createMixedChapterMulti(data); break
                }
                const result = response.data || response
                if (result.success || result.code === 200) {
                    ElMessage.success('章节创建成功')
                    addDialogVisible.value = false
                    fetchChapters()
                } else {
                    ElMessage.error(result.message || '创建失败')
                }
            }
        } catch (error) {
            console.error('操作失败:', error)
            ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message))
        } finally {
            chaptersLoading.value = false
        }
    }

    // 递归提交本地章节
    const submitLocalChapters = async (courseId, chapters, parentId = null) => {
        for (const chapter of chapters) {
            try {
                const data = {
                    courseId: courseId,
                    parentId: parentId,
                    title: chapter.chapterTitle,
                    order: chapter.chapterOrder
                }

                let response
                switch (chapter.chapterType) {
                    case 'FOLDER': response = await createFolderChapter(data); break;
                    case 'VIDEO':
                        data.video = chapter.video;
                        response = await createVideoChapter(data); break;
                    case 'PDF':
                        data.pdf = chapter.pdf;
                        response = await createPdfChapter(data); break;
                    case 'TEXT':
                        data.content = chapter.textContent;
                        response = await createTextChapter(data); break;
                    case 'MIXED':
                        data.video = chapter.video;
                        data.pdf = chapter.pdf;
                        data.content = chapter.textContent;
                        response = await createMixedChapter(data); break;
                }

                const result = response.data || response // createFolderChapter returns axios response, handle generically if needed
                if (result.success || result.code === 200) {
                    const newChapterId = (result.data && result.data.chapterId) ? result.data.chapterId : result.data

                    // 如果有子章节，递归提交
                    if (chapter.children && chapter.children.length > 0 && newChapterId) {
                        await submitLocalChapters(courseId, chapter.children, newChapterId)
                    }
                }
            } catch (error) {
                console.error(`提交章节 ${chapter.chapterTitle} 失败: `, error)
                // Continue with siblings
            }
        }
    }

    // 查看章节
    const viewChapter = async (chapter) => {
        if (chapter.chapterId && String(chapter.chapterId).startsWith('temp_')) {
            // 本地章节预览
            const temp = { ...chapter }
            // 为本地文件生成预览URL
            if (temp.video instanceof File) {
                temp.videoUrl = URL.createObjectURL(temp.video)
            }
            if (temp.pdf instanceof File) {
                temp.pdfUrl = URL.createObjectURL(temp.pdf)
            }
            currentChapter.value = temp
            detailDialogVisible.value = true
            return
        }

        try {
            const response = await getChapterDetail(chapter.chapterId)
            if (response.success) {
                currentChapter.value = response.data
                detailDialogVisible.value = true
            }
        } catch (error) {
            console.error('获取详情失败:', error)
            ElMessage.error('获取详情失败')
        }
    }

    // 删除章节
    const deleteChapter = async (chapter) => {
        try {
            await ElMessageBox.confirm('确定要删除这个章节吗？', '确认删除', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            })

            if (!isEdit.value) {
                // 本地删除
                const removeNode = (nodes, id) => {
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].chapterId === id) {
                            nodes.splice(i, 1)
                            return true
                        }
                        if (nodes[i].children && removeNode(nodes[i].children, id)) return true
                    }
                    return false
                }
                removeNode(treeData.value, chapter.chapterId)
                ElMessage.success('删除成功')
                return
            }

            const response = await deleteChapterApi(chapter.chapterId)
            if (response.success) {
                ElMessage.success('删除成功')
                fetchChapters()
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

    // 处理章节点击
    const handleChapterClick = async (chapter) => {
        if (chapter.chapterType === 'FOLDER') {
            return // 文件夹不加载详情
        }
        await viewChapter(chapter)
    }

    // 获取媒体URL
    const getMediaUrl = (url) => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${BASE_URL}${url} `
    }

    // 下载PDF
    const downloadPdf = (url) => {
        const fullUrl = getMediaUrl(url)
        window.open(fullUrl, '_blank')
    }

    // 格式化文本内容（支持换行）
    const formatTextContent = (text) => {
        if (!text) return ''
        return text.replace(/\n/g, '<br>')
    }

    // 获取章节类型标签颜色
    const getChapterTypeTag = (type) => {
        const tags = {
            FOLDER: 'info',
            VIDEO: 'success',
            PDF: 'warning',
            TEXT: '',
            MIXED: 'primary'
        }
        return tags[type] || ''
    }

    // 工具函数
    const getTypeLabel = (type) => {
        const types = {
            FOLDER: '文件夹',
            VIDEO: '视频',
            PDF: 'PDF',
            TEXT: '文本',
            MIXED: '混合内容'
        }
        return types[type] || type
    }

    const formatTime = (time) => {
        if (!time) return ''
        return new Date(time).toLocaleString('zh-CN')
    }

    // 监听标签页切换，加载章节数据和时间表
    watch(activeTab, (newTab) => {
        if (newTab === 'chapters' && isEdit.value) {
            fetchChapters()
        } else if (newTab === 'schedule' && isEdit.value) {
            loadSchedules()
        }
    })

    onMounted(async () => {
        console.log('=== useCourseForm onMounted ===')
        console.log('isEdit:', isEdit.value)
        console.log('courseId:', courseId.value)

        if (isEdit.value && courseId.value && courseId.value !== 'create') {
            try {
                await loadCourseDetail()
            } catch (error) {
                console.error('加载课程详情时出错:', error)
            }
            // 同时加载排课和章节
            try {
                await loadSchedules()
            } catch (e) {
                console.error('加载时间表失败:', e)
            }
            try {
                await fetchChapters()
            } catch (e) {
                console.error('加载章节失败:', e)
            }
        } else {
            console.log('创建模式，跳过加载课程详情')
        }
    })

    return {
        videoUploadRef,
        formRef,
        isEdit,
        courseId,
        activeTab,
        formData,
        dateRange,
        coverPreview,
        coverFile,
        submitting,
        treeData,
        chaptersLoading,
        addDialogVisible,
        isEditChapter,
        detailDialogVisible,
        currentParent,
        currentChapter,
        chapterSearchText,
        treeProps,
        chapterForm,
        // 课程时间表
        schedules,
        scheduleLoading,
        scheduleDialogVisible,
        isEditSchedule,
        scheduleForm,
        loadSchedules,
        openScheduleDialog,
        editSchedule,
        submitSchedule,
        deleteScheduleItem,
        getDayName,
        rules,
        handleCoverChange,
        beforeCoverUpload,
        submitForm,
        goBack,
        openAddDialog,
        editChapter,
        handleVideoChange,
        handleVideoRemove,
        removeNewVideo,
        handlePdfChange,
        handlePdfRemove,
        removeNewPdf,
        removeExistingVideo,
        removeExistingPdf,
        formatFileSize,
        submitChapter,
        viewChapter,
        deleteChapter,
        handleChapterClick,
        getMediaUrl,
        downloadPdf,
        formatTextContent,
        getChapterTypeTag,
        getTypeLabel,
        formatTime,
        // 步骤相关
        steps,
        currentStep,
        nextStep,
        prevStep,
        goToStep
    }
}
