import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamDetail, publishExam as publishExamApi, unpublishExam as unpublishExamApi, deleteExam as deleteExamApi, getStudentExams, returnStudentExam, getExamStatistics, updateExam } from '@/api/exam'
import { getCourseDetail } from '@/api/course'
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

  // 编辑考试弹窗相关
  const editDialogVisible = ref(false)
  const editForm = ref({
    examTitle: '',
    courseId: null,
    startTime: '',
    endTime: '',
    duration: 60,
    totalScore: 100
  })
  const editFormRef = ref(null)
  const submitting = ref(false)

  // 表单校验规则
  const editRules = {
    examTitle: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
    courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
    timeRange: [{ required: true, message: '请选择考试时间', trigger: 'change' }],
    duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
    totalScore: [{ required: true, message: '请输入总分', trigger: 'blur' }]
  }

  // 计算及格分数
  const calculatedPassScore = computed(() => {
    return Math.floor((editForm.value.totalScore || 100) * 0.6)
  })

  // 获取考试详情
  const fetchExamDetail = async () => {
    loading.value = true
    try {
      const examId = route.params.id
      const res = await getExamDetail(examId)

      if (res.code === 200 && res.data) {
        let examData = null
        if (res.data.exam) {
          examData = res.data.exam
          questions.value = res.data.questions || res.data.exam.questions || []
        } else {
          examData = res.data
          questions.value = res.data.questions || res.data.questionList || []
        }

        // 数据字段映射和纠偏
        exam.value = {
          ...examData,
          examId: examData.examId || examData.exam_id || examData.id,
          examTitle: examData.examTitle || examData.exam_title || examData.title,
          courseId: examData.courseId || examData.course_id || (examData.course && examData.course.id) || (examData.course && examData.course.courseId),
          courseName: examData.courseName || examData.course_name || examData.courseTitle || examData.course_title ||
            (examData.course && (examData.course.courseName || examData.course.course_name || examData.course.title || examData.course.courseTitle)),
          startTime: examData.startTime || examData.start_time,
          endTime: examData.endTime || examData.end_time,
          duration: examData.duration || 0,
          totalScore: examData.totalScore || examData.total_score || 100,
          passScore: examData.passScore || examData.pass_score || Math.floor((examData.totalScore || examData.total_score || 100) * 0.6),
          examDescription: examData.examDescription || examData.exam_description || examData.description,
          status: examData.status,
          statusText: examData.statusText || examData.status_text,
          submittedCount: examData.submittedCount || examData.submitted_count || 0,
          totalStudents: examData.totalStudents || examData.total_students || 0
        }

        console.log('考试详情数据映射后:', exam.value)
        console.log('原始 course 对象:', examData.course)
        console.log('尝试获取课程信息, ID:', exam.value.courseId, '类型:', typeof exam.value.courseId)

        // 只要有 courseId，即使有名称也尝试再次获取以确保准确（或作为兜底）
        if (exam.value.courseId) {
          fetchCourseName(exam.value.courseId)
        }

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

  // 获取课程名称
  const fetchCourseName = async (courseId) => {
    console.log('开始获取课程名称, courseId:', courseId)
    if (!courseId) return

    try {
      // 尝试 1: 获取课程详情
      const res = await getCourseDetail(courseId)
      console.log('获取课程详情响应:', res)

      // 兼容性判断：有的接口返回 code: 200，有的直接返回 success: true
      if ((res.code === 200 || res.success) && res.data) {
        const name = res.data.courseName || res.data.course_name || res.data.title || res.data.courseTitle
        if (name) {
          exam.value.courseName = name
          console.log('已补充课程名称 (from detail):', name)
          return
        }
      }

    } catch (error) {
      console.warn('获取课程名称失败:', error)
    }
  }

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const res = await getExamStatistics(route.params.id)
      if (res.code === 200) {
        statistics.value = res.data
        nextTick(() => {
          if (chartRef.value) {
            initCharts()
          }
        })
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
      { name: '不及格(<60%)', value: distribution['0-59'] || 0 },
      { name: '及格(60-69%)', value: distribution['60-69'] || 0 },
      { name: '中等(70-79%)', value: distribution['70-79'] || 0 },
      { name: '良好(80-89%)', value: distribution['80-89'] || 0 },
      { name: '优秀(90%以上)', value: distribution['90-100'] || 0 }
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

  // 打开编辑考试弹窗
  const editExam = () => {
    // 填充表单数据
    editForm.value = {
      examTitle: exam.value.examTitle || '',
      courseId: exam.value.courseId || null,
      startTime: exam.value.startTime || '',
      endTime: exam.value.endTime || '',
      duration: exam.value.duration || 60,
      totalScore: exam.value.totalScore || 100,
      timeRange: exam.value.startTime && exam.value.endTime
        ? [exam.value.startTime, exam.value.endTime]
        : []
    }
    editDialogVisible.value = true
  }

  // 保存编辑
  const saveExamEdit = async () => {
    if (!editFormRef.value) return

    try {
      await editFormRef.value.validate()

      submitting.value = true

      const examData = {
        examTitle: editForm.value.examTitle,
        courseId: editForm.value.courseId,
        startTime: editForm.value.timeRange[0],
        endTime: editForm.value.timeRange[1],
        duration: editForm.value.duration,
        totalScore: editForm.value.totalScore,
        passScore: calculatedPassScore.value
      }

      const res = await updateExam(route.params.id, examData)

      if (res.code === 200) {
        ElMessage.success('考试信息更新成功')
        editDialogVisible.value = false
        fetchExamDetail() // 刷新数据
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('更新考试失败:', error)
        ElMessage.error('更新失败')
      }
    } finally {
      submitting.value = false
    }
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
    const studentExamId = student.studentExamId || student.id
    if (studentExamId) {
      // 跳转到学生答卷详情页
      router.push(`/teacher/exam/${route.params.id}/student/${studentExamId}`)
    } else {
      ElMessage.warning('无法获取学生答卷ID')
    }
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

  // 获取题目选项（判断题自动生成选项）
  const getQuestionOptions = (question) => {
    // 判断题：如果没有选项，自动生成
    if (['JUDGE', 'JUDGEMENT', 'TRUE_FALSE'].includes(question.questionType)) {
      if (!question.questionOptions) {
        return ['正确', '错误']
      }
    }

    // 其他题型：正常解析
    return parseOptions(question.questionOptions)
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
    // 1. 尝试从各个可能的答案字段获取
    let ans = question.answer !== undefined && question.answer !== null ? question.answer :
      (question.correctAnswer !== undefined && question.correctAnswer !== null ? question.correctAnswer : question.correct_answer);

    // 2. 如果字段确实为空，尝试从选项中提取 (针对单选、多选、判断)
    if ((ans === undefined || ans === null || ans === '') && question.questionOptions) {
      try {
        const opts = typeof question.questionOptions === 'string'
          ? JSON.parse(question.questionOptions)
          : question.questionOptions;

        if (Array.isArray(opts)) {
          const correctIndices = opts.map((o, i) => (o.isCorrect || o.correct) ? i : -1).filter(i => i !== -1);
          if (correctIndices.length > 0) {
            ans = correctIndices.map(i => String.fromCharCode(65 + i)).join(', ');
          }
        }
      } catch (e) {
        console.error('从选项提取答案失败:', e);
      }
    }

    if (ans === undefined || ans === null || ans === '') return '未设置'

    const ansStr = String(ans);

    // 3. 处理单选/多选的索引转换 (如果是数字索引则转为字母)
    if (['SINGLE', 'MULTIPLE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question.questionType)) {
      if (/^\d+$/.test(ansStr)) {
        return String.fromCharCode(65 + parseInt(ansStr))
      }
      try {
        const parsed = JSON.parse(ansStr)
        if (Array.isArray(parsed)) {
          return parsed.map(idx => {
            const digit = /^\d+$/.test(String(idx));
            return digit ? String.fromCharCode(65 + parseInt(idx)) : idx;
          }).join(', ')
        }
      } catch (e) { }
    }

    // 4. 判断题处理
    if (['JUDGE', 'JUDGEMENT', 'TRUE_FALSE'].includes(question.questionType)) {
      if (ansStr === 'true' || ansStr === '1' || ansStr === '对' || ansStr === 'A' || ansStr.includes('正确')) return 'A. 正确'
      if (ansStr === 'false' || ansStr === '0' || ansStr === '错' || ansStr === 'B' || ansStr.includes('错误')) return 'B. 错误'
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
    const st = String(exam.value.statusText || status).toUpperCase()
    if (st === 'DRAFT' || st === '0') return '草稿'
    if (st === 'PUBLISHED' || st === '1') return '即将开始'
    if (st === 'ONGOING') return '进行中'
    if (st === 'ENDED' || st === '2') return '已结束'

    const texts = {
      0: '草稿',
      1: '已发布',
      2: '已结束'
    }
    return texts[status] || status || '未知'
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

  // 按题型分组显示试题
  const groupedQuestions = computed(() => {
    // 定义题型顺序：单选 -> 多选 -> 判断 -> 填空 -> 简答
    const typeOrder = {
      'SINGLE': 1,
      'SINGLE_CHOICE': 1,
      'MULTIPLE': 2,
      'MULTIPLE_CHOICE': 2,
      'JUDGE': 3,
      'TRUE_FALSE': 3,
      'FILL': 4,
      'FILL_BLANK': 4,
      'SHORT': 5,
      'SHORT_ANSWER': 5,
      'ESSAY': 5
    }

    const typeNames = {
      1: '一、单选题',
      2: '二、多选题',
      3: '三、判断题',
      4: '四、填空题',
      5: '五、简答题'
    }

    // 给每道题添加全局序号
    const questionsWithIndex = questions.value.map((q, index) => ({
      ...q,
      globalIndex: index + 1
    }))

    // 按题型分组
    const grouped = {}
    questionsWithIndex.forEach(question => {
      const order = typeOrder[question.questionType] || 99
      if (!grouped[order]) {
        grouped[order] = {
          typeName: typeNames[order] || '其他题型',
          questions: []
        }
      }
      grouped[order].questions.push(question)
    })

    // 按顺序返回
    return Object.keys(grouped)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .reduce((acc, key) => {
        acc[key] = grouped[key]
        return acc
      }, {})
  })

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
    groupedQuestions,
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
    getQuestionOptions,
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
    getExamStatusText,
    // 编辑考试弹窗相关
    editDialogVisible,
    editForm,
    editFormRef,
    editRules,
    calculatedPassScore,
    saveExamEdit,
    submitting
  }
}
