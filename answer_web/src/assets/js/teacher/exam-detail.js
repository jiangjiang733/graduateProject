import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamDetail, publishExam as publishExamApi, unpublishExam as unpublishExamApi, deleteExam as deleteExamApi, getStudentExams, returnStudentExam as returnStudentExamApi, getExamStatistics } from '@/api/exam'
import * as echarts from 'echarts'

export function useExamDetail() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const exam = ref({})
  const questions = ref([])
  const studentExams = ref([])
  const statistics = ref(null)
  const chartRef = ref(null)
  const scoreChart = ref(null)

  // 获取考试详情
  const fetchExamDetail = async () => {
    loading.value = true
    try {
      const examId = route.params.id
      const res = await getExamDetail(examId)

      if (res.code === 200) {
        exam.value = res.data.exam || {}
        questions.value = res.data.questions || []
        // 获取学生答题情况
        fetchStudentExams()
        // 获取统计信息
        fetchStatistics()
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

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const res = await getExamStatistics(route.params.id)
      if (res.code === 200) {
        statistics.value = res.data
        if (chartRef.value) {
          initCharts()
        }
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 初始化图表
  const initCharts = () => {
    if (!statistics.value || !chartRef.value) return

    if (scoreChart.value) {
      scoreChart.value.dispose()
    }

    scoreChart.value = echarts.init(chartRef.value)

    const distribution = statistics.value.scoreDistribution || {}
    const data = [
      { name: '不及格(0-59)', value: distribution['0-59'] || 0 },
      { name: '及格(60-69)', value: distribution['60-69'] || 0 },
      { name: '中等(70-79)', value: distribution['70-79'] || 0 },
      { name: '良好(80-89)', value: distribution['80-89'] || 0 },
      { name: '优秀(90-100)', value: distribution['90-100'] || 0 }
    ]

    const option = {
      title: {
        text: '分数等级分布',
        left: 'center',
        top: '10'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center'
      },
      series: [
        {
          name: '分数分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data,
          color: ['#F56C6C', '#E6A23C', '#409EFF', '#36cbcb', '#67C23A']
        }
      ]
    }

    scoreChart.value.setOption(option)
  }

  // 取消发布考试
  const unpublishExam = async () => {
    try {
      await ElMessageBox.confirm('确定要取消发布该考试吗？取消后学生将无法看到该考试。', '提示', {
        type: 'warning'
      })
      const res = await unpublishExamApi(route.params.id)
      if (res.code === 200) {
        ElMessage.success('已取消发布')
        fetchExamDetail()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('取消发布失败:', error)
        ElMessage.error('操作失败')
      }
    }
  }

  // 退回学生考试
  const returnStudentExam = async (studentExamId) => {
    try {
      await ElMessageBox.confirm('确定要退回该学生的考试吗？退回后该学生的作答记录将被清空，可以重新参加考试。', '提示', {
        type: 'warning'
      })
      const res = await returnStudentExamApi(studentExamId)
      if (res.code === 200) {
        ElMessage.success('已退回')
        fetchStudentExams()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('退回考试失败:', error)
        ElMessage.error('操作失败')
      }
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

  // 获取学生列表
  const fetchStudentExams = async () => {
    try {
      const examId = route.params.id
      const res = await getStudentExams(examId)
      if (res.code === 200) {
        studentExams.value = res.data || []
      }
    } catch (error) {
      console.error('获取学生列表失败:', error)
    }
  }

  // 刷新学生列表
  const refreshStudents = () => {
    fetchStudentExams()
    ElMessage.success('刷新成功')
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

  // 格式化题目内容（处理填空题括号）
  const formatQuestionContent = (question) => {
    let content = question.questionContent || ''
    if (['FILL', 'FILL_BLANK'].includes(question.questionType)) {
      // 替换常见的占位符为标准的 ( )
      if (content.includes('___')) {
        content = content.replace(/___+/g, '（ ）')
      } else if (!content.includes('（ ）') && !content.includes('()') && !content.includes('（）')) {
        content += ' （ ）'
      }
    }
    return content
  }

  // 格式化答案显示
  const formatAnswer = (question) => {
    // 兼容多种可能的字段名 (correctAnswer, answer, correct_answer)
    const ans = question.answer !== undefined && question.answer !== null ? question.answer :
      (question.correctAnswer !== undefined && question.correctAnswer !== null ? question.correctAnswer : question.correct_answer);

    if (ans === undefined || ans === null || ans === '') return '未设置'

    const ansStr = String(ans);

    // 如果是单选或多选，且答案是索引，转换为字母
    if (['SINGLE', 'MULTIPLE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question.questionType)) {
      if (/^\d+$/.test(ansStr)) {
        return String.fromCharCode(65 + parseInt(ansStr))
      }
      // 如果是 JSON 数组索引 (如多选 ["0", "1"])
      try {
        const parsed = JSON.parse(ansStr)
        if (Array.isArray(parsed)) {
          return parsed.map(idx => {
            const digit = /^\d+$/.test(String(idx));
            return digit ? String.fromCharCode(65 + parseInt(idx)) : idx;
          }).join(', ')
        }
      } catch (e) {
        // 解析失败则按原样显示
      }
    }

    // 判断题处理
    if (['JUDGE', 'JUDGEMENT', 'TRUE_FALSE'].includes(question.questionType)) {
      if (ansStr === 'true' || ansStr === '1' || ansStr === '对') return '正确'
      if (ansStr === 'false' || ansStr === '0' || ansStr === '错') return '错误'
    }

    return ansStr
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
    // 优先使用后端计算的状态文本进行颜色匹配
    const st = exam.value.statusText
    if (st === 'DRAFT') return 'info'
    if (st === 'PUBLISHED') return 'primary'
    if (st === 'ONGOING') return 'success'
    if (st === 'ENDED') return 'warning'

    const types = {
      0: 'info',    // 草稿
      1: 'success', // 已发布
      2: 'warning'  // 已结束
    }
    return types[status] || 'info'
  }

  // 获取状态文本
  const getStatusText = (status) => {
    // 优先使用后端计算的状态文本
    const st = exam.value.statusText
    if (st === 'DRAFT') return '草稿'
    if (st === 'PUBLISHED') return '即将开始'
    if (st === 'ONGOING') return '进行中'
    if (st === 'ENDED') return '已结束'

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
      'SINGLE_CHOICE': '单选题',
      'MULTIPLE': '多选题',
      'MULTIPLE_CHOICE': '多选题',
      'JUDGE': '判断题',
      'TRUE_FALSE': '判断题',
      'FILL': '填空题',
      'FILL_BLANK': '填空题',
      'SHORT': '简答题',
      'SHORT_ANSWER': '简答题',
      'ESSAY': '简答题'
    }
    return names[type] || type
  }

  // 获取题型颜色
  const getQuestionTypeColor = (type) => {
    const colors = {
      'SINGLE': 'primary',
      'SINGLE_CHOICE': 'primary',
      'MULTIPLE': 'success',
      'MULTIPLE_CHOICE': 'success',
      'JUDGE': 'warning',
      'TRUE_FALSE': 'warning',
      'FILL': 'info',
      'FILL_BLANK': 'info',
      'SHORT': 'danger',
      'SHORT_ANSWER': 'danger',
      'ESSAY': 'danger'
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
    unpublishExam,
    returnStudentExam,
    goBack,
    editExam,
    publishExam,
    deleteExam,
    refreshStudents,
    viewStudentAnswer,
    parseOptions,
    formatQuestionContent,
    formatAnswer,
    formatDate,
    fetchStudentExams,
    statistics,
    chartRef,
    initCharts,
    getStatusType,
    getStatusText,
    getQuestionTypeName,
    getQuestionTypeColor,
    getExamStatusType,
    getExamStatusText
  }
}
