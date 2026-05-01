<template>
  <div class="exam-detail-wrapper">
    <!-- 顶部导航栏 -->
    <div class="top-header">
      <div class="header-left">
        
        <span class="header-title">阅卷系统 | 学生个人答卷详情</span>
      </div>
      <div class="header-score">
        <span class="score-label">总分</span>
        <span class="score-value">{{ studentInfo.obtainedScore || 0 }}</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- A4试卷主体 -->
      <div class="paper-container">
        <div class="a4-paper">
          <!-- 密封线 -->
          <div class="seal-line-container">
            <div class="seal-text">密封线内请勿答题</div>
          </div>

          <!-- 试卷头部 -->
          <div class="paper-header">
            <h1 class="paper-title">{{ examInfo.examTitle }}</h1>
            <div class="student-info-row">
              <div class="info-field">姓名：<span class="info-value">{{ studentInfo.studentName }}</span></div>
              <div class="info-field">学号：<span class="info-value">{{ studentInfo.studentId }}</span></div>
            </div>
          </div>

          <!-- 分数统计表 -->
          <div class="score-section">
            <table class="score-table-mini">
              <tr>
                <th>类型</th>
                <th v-for="grp in questionGroups" :key="'grp-' + grp.name">{{ grp.name }}</th>
              </tr>
              <tr>
                <td>得分</td>
                <td v-for="(grp, gi) in questionGroups" :key="'score-' + gi" class="score-red">
                  {{ grp.score }}
                </td>
              </tr>
            </table>
          </div>

          <!-- 分隔线 -->
          <div class="divider-line"></div>

          <!-- 按题型分组的题目 -->
          <div v-for="(group, gIndex) in questionGroups" :key="'group-' + gIndex" class="question-group">
            <h2 class="group-title" style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #1f2937;">{{ group.name }}（共{{ group.questions.length }}题）</h2>
            <div v-for="(answer, index) in group.questions" :key="index" :id="'question-' + answer.globalIndex" class="question-item">
              <div class="question-header">
                <span class="q-label">{{ answer.globalIndex + 1 }}. </span>
              </div>
              
              <div class="question-content">
                <div class="question-text">{{ answer.questionContent }}</div>
                
                <div class="points-badge">
                  <span class="points-num">{{ answer.score != null ? answer.score : 0 }}</span>
                  <span class="points-label">分</span>
                </div>
              </div>
              
              <!-- 选项 -->
              <div v-if="answer.questionOptions" class="options-area">
                <div v-for="(option, optIndex) in parseOptions(answer.questionOptions)" :key="optIndex" class="option-row">
                  <span class="opt-letter">{{ String.fromCharCode(65 + optIndex) }}.</span>
                  <span class="opt-text">{{ typeof option === 'object' ? option.text : option }}</span>
                </div>
              </div>
              
              <!-- 学生答案 -->
              <div class="answer-area">
                <div class="answer-label">学生答案：</div>
                <div class="answer-text" :class="getStudentAnswerClass(answer)">
                  {{ formatStudentAnswer(answer) || '未作答' }}
                </div>
              </div>
              
              <!-- 批改区域（仅主观题且试卷待批改2） -->
              <div v-if="isSubjective(answer.questionType) && studentInfo.status == 2" class="grade-panel">
                <div class="grade-input-row" style="display:flex; align-items:center; flex-wrap: wrap;">
                  <span class="grade-label">评分：</span>
                  <el-input-number v-model="answer.gradeScore" :min="0" :max="answer.questionScore || 0" controls-position="right" size="small" />
                  <span class="text-slate-500" style="margin-left: 8px; margin-right: 15px;">/ {{ answer.questionScore || 0 }} 分</span>
                  <el-button type="primary" size="small" :loading="answer.aiGrading" @click="autoGradeAnswer(answer)">
                    <el-icon><MagicStick /></el-icon>&nbsp;AI智能批改
                  </el-button>
                </div>
                <div class="grade-input-row" style="margin-top:10px;">
                  <span class="grade-label" style="margin-bottom: 5px; display: inline-block;">批语：</span>
                  <el-input v-model="answer.teacherCommentInput" type="textarea" :rows="2" placeholder="请输入批语，或点击上方[AI智能批改]自动生成" />
                </div>
              </div>
              
              <!-- 正确答案/解析 -->
              <div class="analysis-area">
                <div class="analysis-row">
                  <span class="analysis-label">主观题参考答案：</span>
                  <span class="correct-ans">{{ formatCorrectAnswer(answer) || '无' }}</span>
                </div>
              </div>
              
              <!-- 对勾叉号 -->
              <span v-if="showCorrectIcon(answer)" class="icon-check">✓</span>
              <span v-else-if="showPartialIcon(answer)" class="icon-partial"></span>
              <span v-else-if="showWrongIcon(answer)" class="icon-cross">✗</span>
            </div>
          </div>
          
        </div>
      </div>

      <!-- 答题卡侧边栏 -->
      <div class="answer-sidebar">
        <div class="sidebar-header">答题卡总览</div>
        
        <div class="answer-grid">
          <div 
             v-for="(answer, index) in answers" 
             :key="index"
             @click="scrollToQuestion(index)"
             class="answer-number"
             :class="getAnswerStatus(answer)"
          >
            {{ index + 1 }}
          </div>
        </div>
        
        <div class="sidebar-actions">
          <el-button v-if="hasPendingSubjective" type="primary" @click="submitGrades" :loading="submitLoading">提交批改</el-button>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick } from '@element-plus/icons-vue'
import { getStudentExamDetail, gradeExam, aiGradeAnswer } from '@/api/exam'
import * as echarts from 'echarts'
import '@/assets/css/teacher/student-answer-detail.css'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const studentInfo = ref({})
const examInfo = ref({})
const answers = ref([])
const questionChartRef = ref(null)
let questionChart = null

const questionGroups = computed(() => {
  const cnNums = ['一', '二', '三', '四', '五', '六', '七'];
  const typeWeights = {
    'SINGLE': 1, 'SINGLE_CHOICE': 1,
    'MULTIPLE': 2, 'MULTIPLE_CHOICE': 2,
    'JUDGE': 3, 'TRUE_FALSE': 3,
    'FILL': 4, 'FILL_BLANK': 4,
    'SHORT': 5, 'SHORT_ANSWER': 5, 'ESSAY': 5
  };
  
  // 按照题型顺序先整体排序
  const sortedAnswers = [...answers.value].sort((a, b) => {
    return (typeWeights[a.questionType] || 99) - (typeWeights[b.questionType] || 99)
  });

  const groupsObj = {};
  sortedAnswers.forEach((ans, globalIdx) => {
    const type = ans.questionType;
    const weight = typeWeights[type] || 99;
    if (!groupsObj[weight]) {
      groupsObj[weight] = {
        name: getQuestionTypeName(type),
        questions: [],
        score: 0
      };
    }
    ans.globalIndex = globalIdx; // 录入全局有序编号
    groupsObj[weight].questions.push(ans);
    groupsObj[weight].score += Number(ans.score) || 0;
  });

  // 整理为数组并附加上“一、二”序号
  const groupArr = Object.values(groupsObj);
  groupArr.forEach((grp, i) => {
    grp.name = cnNums[i % cnNums.length] + '、' + grp.name;
  });
  return groupArr;
})

const objectiveScore = computed(() => {
  return answers.value
    .filter(a => !isSubjective(a.questionType))
    .reduce((sum, a) => sum + (Number(a.score) || 0), 0)
})

const subjectiveScore = computed(() => {
  return answers.value
    .filter(a => isSubjective(a.questionType))
    .reduce((sum, a) => sum + (Number(a.score) || 0), 0)
})

const hasPendingSubjective = computed(() => {
  return answers.value.some(a => isSubjective(a.questionType) && studentInfo.value.status == 2)
})

const submitLoading = ref(false)

// 计算属性
const scoreRate = computed(() => {
  if (!examInfo.value.totalScore) return 0
  const obtained = studentInfo.value.obtainedScore || 0
  return Math.round(Number(obtained) / Number(examInfo.value.totalScore) * 100)
})

const isSubjective = (type) => ['SHORT', 'SHORT_ANSWER', 'ESSAY', 'FILL', 'FILL_BLANK'].includes(type)

const getAnswerStatus = (answer) => {
  if (isSubjective(answer.questionType)) {
    const score = Number(answer.score) || 0
    const maxScore = Number(answer.questionScore) || 1
    if (score >= maxScore) return 'correct'
    if (score > 0) return 'partial'
    return 'wrong'
  }
  if (answer.isCorrect == 1) return 'correct'
  if (answer.isCorrect == 0) return 'wrong'
  return 'pending'
}

const showCorrectIcon = (answer) => {
  if (isSubjective(answer.questionType)) {
    const score = Number(answer.score) || 0
    const maxScore = Number(answer.questionScore) || 1
    return score >= maxScore && score > 0
  }
  return answer.isCorrect == 1
}

const showPartialIcon = (answer) => {
  if (isSubjective(answer.questionType)) {
    const score = Number(answer.score) || 0
    const maxScore = Number(answer.questionScore) || 1
    return score > 0 && score < maxScore
  }
  return false
}

const showWrongIcon = (answer) => {
  if (isSubjective(answer.questionType)) {
    const score = Number(answer.score) || 0
    return score == 0;
  }
  return answer.isCorrect == 0
}

const getStudentAnswerClass = (answer) => {
  if (isSubjective(answer.questionType)) {
    const score = Number(answer.score) || 0
    const maxScore = Number(answer.questionScore) || 1
    if (score >= maxScore) return 'correct'
    if (score == 0) return 'wrong'
    return 'partial'
  }
  if (answer.isCorrect == 1) return 'correct'
  if (answer.isCorrect == 0) return 'wrong'
  return ''
}

const correctRate = computed(() => {
  const objective = answers.value.filter(a => !isSubjective(a.questionType))
  if (objective.length === 0) return 0
  const correctCount = objective.filter(a => a.isCorrect == 1).length
  return Math.round(correctCount / objective.length * 100)
})

const objectiveAnswers = computed(() => answers.value.filter(a => !isSubjective(a.questionType)))
const subjectiveAnswers = computed(() => answers.value.filter(a => isSubjective(a.questionType)))

const scrollToQuestion = (index) => {
  const el = document.getElementById('question-' + index)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const autoGradeAnswer = async (answer) => {
  if (!answer.studentAnswer || answer.studentAnswer.trim() === '') {
    ElMessage.warning('该题无学生作答记录，无法AI批改')
    return
  }
  answer.aiGrading = true
  try {
    const res = await aiGradeAnswer({
      questionContent: answer.questionContent || '',
      referenceAnswer: formatCorrectAnswer(answer) || '',
      studentAnswer: answer.studentAnswer || '',
      maxScore: answer.questionScore || 0
    })
    if (res.code === 200 || res.success) {
      if (res.data) {
        answer.gradeScore = res.data.score != null ? res.data.score : 0;
        answer.teacherCommentInput = res.data.comment || '';
        ElMessage.success('智能批改成功');
      } else {
        ElMessage.warning('未能获取有效的批改数据')
      }
    } else {
      ElMessage.error(res.message || 'AI批改失败');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('请求网络错误或格式解析失败');
  } finally {
    answer.aiGrading = false
  }
}

const submitGrades = async () => {
  // 收集包含简答题的主观题评分
  const grades = answers.value.filter(a => isSubjective(a.questionType)).map(a => ({
    answerId: a.answerId || a.id,
    score: a.gradeScore || 0,
    teacherComment: a.teacherCommentInput || ''
  }))
  
  const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id') || localStorage.getItem('userId')

  submitLoading.value = true
  try {
    const res = await gradeExam(route.params.studentExamId, {
      teacherId,
      answers: grades
    })
    if (res.code === 200 || res.success) {
      ElMessage.success('批改成功')
      fetchAnswerDetail() // 刷新页面
    } else {
      ElMessage.error(res.message || '批改失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('批改失败')
  } finally {
    submitLoading.value = false
  }
}

// 获取答卷详情
const fetchAnswerDetail = async () => {
  loading.value = true
  try {
    const studentExamId = route.params.studentExamId
    const res = await getStudentExamDetail(studentExamId)
    
    if (res.code === 200 && res.data) {
      const data = res.data
      studentInfo.value = {
        studentId: data.studentId,
        studentName: data.studentName,
        studentAvatar: data.studentAvatar || null,
        obtainedScore: data.obtainedScore || data.totalScore,
        submitTime: data.submitTime,
        duration: data.duration,
        status: data.status
      }
      examInfo.value = {
        examId: data.examId,
        examTitle: data.examTitle,
        totalScore: data.examTotalScore || data.totalScore || 100
      }
      // 处理答案列表 —— score 是学生得分，questionScore 是题目满分
      answers.value = (data.answers || data.studentAnswers || []).map(ans => ({
        ...ans,
        // 主观题批改输入框的初始值：若已批改过则显示已有分数，否则为0
        gradeScore: ans.score != null ? Number(ans.score) : 0,
        teacherCommentInput: ans.teacherComment || '',
        // isCorrect 来自后端的 Integer 字段（1=正确，0=错误），此处不覆盖
      }))
      
      nextTick(() => {
        initChart()
      })
    } else {
      ElMessage.error(res.message || '获取答卷详情失败')
    }
  } catch (error) {
    console.error('获取答卷详情失败:', error)
    ElMessage.error('获取答卷详情失败')
  } finally {
    loading.value = false
  }
}

// 头像URL生成
const getAvatarUrl = (path) => {
  if (!path || path.trim() === '') {
    return 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9636ef921315944d5671d8.png'
  }
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `http://localhost:8088${path}`
}

// 初始化图表
const initChart = () => {
  if (!questionChartRef.value || answers.value.length === 0) return
  
  if (questionChart) {
    questionChart.dispose()
  }
  
  questionChart = echarts.init(questionChartRef.value)
  
  const categories = answers.value.map((_, i) => `第${i + 1}题`)
  const scores = answers.value.map(a => a.obtainedScore || 0)
  const maxScores = answers.value.map(a => a.score || 0)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const idx = params[0].dataIndex
        return `${categories[idx]}<br/>得分: ${scores[idx]} / ${maxScores[idx]} 分`
      }
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: answers.value.length > 10 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '得分'
    },
    series: [
      {
        name: '满分',
        type: 'bar',
        data: maxScores,
        itemStyle: {
          color: '#e0e0e0'
        },
        barGap: '-100%',
        z: 1
      },
      {
        name: '得分',
        type: 'bar',
        data: scores,
        itemStyle: {
          color: (params) => {
            const ratio = scores[params.dataIndex] / maxScores[params.dataIndex]
            if (ratio >= 1) return '#67C23A'
            if (ratio >= 0.6) return '#E6A23C'
            return '#F56C6C'
          }
        },
        z: 2
      }
    ]
  }
  
  questionChart.setOption(option)
}

// 工具函数
const goBack = () => router.back()

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

const getScoreType = (score) => {
  if (!score || !examInfo.value.totalScore) return 'info'
  const ratio = score / examInfo.value.totalScore
  if (ratio >= 0.9) return 'success'
  if (ratio >= 0.6) return 'warning'
  return 'danger'
}

const getScoreClass = (score) => {
  if (!score || !examInfo.value.totalScore) return ''
  const ratio = score / examInfo.value.totalScore
  if (ratio >= 0.9) return 'success'
  if (ratio >= 0.6) return 'warning'
  return 'danger'
}

const getQuestionTypeName = (type) => {
  const names = {
    'SINGLE': '单选题', 'SINGLE_CHOICE': '单选题',
    'MULTIPLE': '多选题', 'MULTIPLE_CHOICE': '多选题',
    'JUDGE': '判断题', 'TRUE_FALSE': '判断题',
    'FILL': '填空题', 'FILL_BLANK': '填空题',
    'SHORT': '简答题', 'SHORT_ANSWER': '简答题', 'ESSAY': '简答题'
  }
  return names[type] || type
}

const getQuestionTypeColor = (type) => {
  const colors = {
    'SINGLE': 'primary', 'SINGLE_CHOICE': 'primary',
    'MULTIPLE': 'success', 'MULTIPLE_CHOICE': 'success',
    'JUDGE': 'warning', 'TRUE_FALSE': 'warning',
    'FILL': 'info', 'FILL_BLANK': 'info',
    'SHORT': 'danger', 'SHORT_ANSWER': 'danger', 'ESSAY': 'danger'
  }
  return colors[type] || ''
}

const parseOptions = (options) => {
  if (!options) return []
  try {
    if (typeof options === 'string') {
      const parsed = JSON.parse(options)
      return Array.isArray(parsed) ? parsed : []
    }
    return Array.isArray(options) ? options : []
  } catch (e) {
    return []
  }
}

const isOptionSelected = (answer, index) => {
  if (!answer) return false
  const ansStr = String(answer)
  if (ansStr === String(index)) return true
  try {
    const parsed = JSON.parse(ansStr)
    if (Array.isArray(parsed)) {
      return parsed.includes(index) || parsed.includes(String(index))
    }
  } catch (e) {}
  return ansStr === String.fromCharCode(65 + index)
}

const isCorrectOption = (answer, index) => {
  if (!answer) return false
  const ansStr = String(answer)
  if (ansStr === String(index)) return true
  try {
    const parsed = JSON.parse(ansStr)
    if (Array.isArray(parsed)) {
      return parsed.includes(index) || parsed.includes(String(index))
    }
  } catch (e) {}
  return ansStr === String.fromCharCode(65 + index)
}

const formatStudentAnswer = (answer) => {
  const ans = answer.studentAnswer
  if (!ans) return null
  
  if (['SINGLE', 'SINGLE_CHOICE', 'MULTIPLE', 'MULTIPLE_CHOICE'].includes(answer.questionType)) {
    if (/^\d+$/.test(String(ans))) {
      return String.fromCharCode(65 + parseInt(ans))
    }
    try {
      const parsed = JSON.parse(String(ans))
      if (Array.isArray(parsed)) {
        return parsed.map(idx => /^\d+$/.test(String(idx)) ? String.fromCharCode(65 + parseInt(idx)) : idx).join(', ')
      }
    } catch (e) {}
  }
  
  if (['JUDGE', 'TRUE_FALSE'].includes(answer.questionType)) {
    if (ans === 'true' || ans === '1' || ans === 'A') return '正确'
    if (ans === 'false' || ans === '0' || ans === 'B') return '错误'
  }
  
  return String(ans)
}

const formatCorrectAnswer = (answer) => {
  const ans = answer.correctAnswer || answer.answer
  if (!ans) return '未设置'
  
  if (['SINGLE', 'SINGLE_CHOICE', 'MULTIPLE', 'MULTIPLE_CHOICE'].includes(answer.questionType)) {
    if (/^\d+$/.test(String(ans))) {
      return String.fromCharCode(65 + parseInt(ans))
    }
    try {
      const parsed = JSON.parse(String(ans))
      if (Array.isArray(parsed)) {
        return parsed.map(idx => /^\d+$/.test(String(idx)) ? String.fromCharCode(65 + parseInt(idx)) : idx).join(', ')
      }
    } catch (e) {}
  }
  
  if (['JUDGE', 'TRUE_FALSE'].includes(answer.questionType)) {
    if (ans === 'true' || ans === '1' || ans === 'A') return '正确'
    if (ans === 'false' || ans === '0' || ans === 'B') return '错误'
  }
  
  return String(ans)
}

onMounted(() => {
  fetchAnswerDetail()
})
</script>

<style scoped>
/* 针对答题卡侧边栏的细小滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>
