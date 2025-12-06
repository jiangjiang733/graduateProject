import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamDetail, publishExam as publishExamApi, deleteExam as deleteExamApi } from '@/api/exam'

export function useExamDetail() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const exam = ref({})
  const questions = ref([])
  const studentExams = ref([])

  // 获取考试详情
  const fetchExamDetail = async () => {
    loading.value = true
    try {
      const examId = route.params.id
      const res = await getExamDetail(examId)
      
      if (res.code === 200) {
        exam.value = res.data.exam || {}
        questions.value = res.data.questions || []
        // TODO: 获取学生答题情况
        studentExams.value = []
      } else {
        ElMessage.error(res.message || '获取考试详情失败')
      }
    } catch (error) {
      console.error('获取考试详情失败:', error)
      ElMessage.error('获取考试详情失败')
    } finally {
      loading.value = false
    }
  }

  // 返回
  const goBack = () => {
    router.back()
  }

  // 编辑考试
  const editExam = () => {
    router.push(`/teacher/exam/edit/${route.params.id}`)
  }

  // 发布考试
  const publishExam = async () => {
    try {
      await ElMessageBox.confirm('确定要发布这场考试吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      const res = await publishExamApi(route.params.id)
      if (res.code === 200) {
        ElMessage.success('考试发布成功')
        fetchExamDetail()
      } else {
        ElMessage.error(res.message || '发布失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('发布考试失败:', error)
        ElMessage.error('发布考试失败')
      }
    }
  }

  // 删除考试
  const deleteExam = async () => {
    try {
      await ElMessageBox.confirm('确定要删除这场考试吗？此操作不可恢复！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      })
      
      const res = await deleteExamApi(route.params.id)
      if (res.code === 200) {
        ElMessage.success('考试删除成功')
        router.push('/teacher/exams')
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除考试失败:', error)
        ElMessage.error('删除考试失败')
      }
    }
  }

  // 刷新学生列表
  const refreshStudents = () => {
    // TODO: 实现刷新学生答题情况
    ElMessage.info('刷新功能开发中')
  }

  // 查看学生答卷
  const viewStudentAnswer = (student) => {
    // TODO: 跳转到答卷详情页
    ElMessage.info('查看答卷功能开发中')
  }

  // 解析选项（支持 JSON 数组和字符串）
  const parseOptions = (options) => {
    if (!options) return []
    
    try {
      // 如果是 JSON 字符串，解析它
      if (typeof options === 'string') {
        const parsed = JSON.parse(options)
        return Array.isArray(parsed) ? parsed : []
      }
      // 如果已经是数组，直接返回
      if (Array.isArray(options)) {
        return options
      }
    } catch (e) {
      console.error('解析选项失败:', e)
    }
    
    return []
  }

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取状态类型
  const getStatusType = (status) => {
    const types = {
      0: 'info',    // 草稿
      1: 'success', // 已发布
      2: 'warning'  // 已结束
    }
    return types[status] || 'info'
  }

  // 获取状态文本
  const getStatusText = (status) => {
    const texts = {
      0: '草稿',
      1: '已发布',
      2: '已结束'
    }
    return texts[status] || '未知'
  }

  // 获取题型名称
  const getQuestionTypeName = (type) => {
    const names = {
      'SINGLE': '单选题',
      'MULTIPLE': '多选题',
      'JUDGE': '判断题',
      'FILL': '填空题',
      'FILL_BLANK': '填空题',
      'SHORT': '简答题',
      'SHORT_ANSWER': '简答题'
    }
    return names[type] || type
  }

  // 获取题型颜色
  const getQuestionTypeColor = (type) => {
    const colors = {
      'SINGLE': 'primary',
      'MULTIPLE': 'success',
      'JUDGE': 'warning',
      'FILL': 'info',
      'FILL_BLANK': 'info',
      'SHORT': 'danger',
      'SHORT_ANSWER': 'danger'
    }
    return colors[type] || ''
  }

  // 获取考试状态类型
  const getExamStatusType = (status) => {
    const types = {
      0: 'info',    // 未开始
      1: 'warning', // 进行中
      2: 'success', // 已提交
      3: 'success'  // 已批改
    }
    return types[status] || 'info'
  }

  // 获取考试状态文本
  const getExamStatusText = (status) => {
    const texts = {
      0: '未开始',
      1: '进行中',
      2: '已提交',
      3: '已批改'
    }
    return texts[status] || '未知'
  }

  onMounted(() => {
    fetchExamDetail()
  })

  return {
    loading,
    exam,
    questions,
    studentExams,
    fetchExamDetail,
    goBack,
    editExam,
    publishExam,
    deleteExam,
    refreshStudents,
    viewStudentAnswer,
    parseOptions,
    formatDate,
    getStatusType,
    getStatusText,
    getQuestionTypeName,
    getQuestionTypeColor,
    getExamStatusType,
    getExamStatusText
  }
}
