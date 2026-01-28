<template>
  <div class="student-answer-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h2>{{ studentInfo.studentName }} 的答卷详情</h2>
      <div class="header-info">
        <el-tag :type="getScoreType(studentInfo.obtainedScore)">
          得分: {{ studentInfo.obtainedScore || 0 }} / {{ examInfo.totalScore || 100 }}
        </el-tag>
      </div>
    </div>

    <!-- 学生信息卡片 -->
    <el-card class="info-card" v-loading="loading">
      <template #header>
        <span>考试信息</span>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="学生姓名">{{ studentInfo.studentName }}</el-descriptions-item>
        <el-descriptions-item label="学生ID">{{ studentInfo.studentId }}</el-descriptions-item>
        <el-descriptions-item label="考试名称">{{ examInfo.examTitle }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatDate(studentInfo.submitTime) }}</el-descriptions-item>
        <el-descriptions-item label="答题用时">{{ formatDuration(studentInfo.duration) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="studentInfo.status >= 3 ? 'success' : 'warning'">
            {{ studentInfo.status >= 3 ? '已批改' : '待批改' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 成绩分析 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>题目得分分析</span>
          </template>
          <div ref="questionChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="summary-card">
          <template #header>
            <span>成绩概览</span>
          </template>
          <div class="summary-items">
            <div class="summary-item">
              <div class="label">总得分</div>
              <div class="value" :class="getScoreClass(studentInfo.obtainedScore)">
                {{ studentInfo.obtainedScore || 0 }}
              </div>
            </div>
            <div class="summary-item">
              <div class="label">满分</div>
              <div class="value">{{ examInfo.totalScore || 100 }}</div>
            </div>
            <div class="summary-item">
              <div class="label">得分率</div>
              <div class="value primary">{{ scoreRate }}%</div>
            </div>
            <div class="summary-item">
              <div class="label">正确率</div>
              <div class="value success">{{ correctRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 答题详情 -->
    <el-card class="answers-card" style="margin-top: 20px">
      <template #header>
        <span>答题详情（共 {{ answers.length }} 题）</span>
      </template>
      
      <div v-if="answers.length === 0" class="empty-state">
        <el-empty description="暂无答题记录" />
      </div>
      
      <div v-else class="answers-list">
        <div 
          v-for="(answer, index) in answers" 
          :key="answer.questionId || index"
          class="answer-item"
          :class="{ 'is-correct': answer.isCorrect, 'is-wrong': !answer.isCorrect && answer.studentAnswer }"
        >
          <div class="answer-header">
            <span class="question-number">第 {{ index + 1 }} 题</span>
            <el-tag :type="getQuestionTypeColor(answer.questionType)" size="small">
              {{ getQuestionTypeName(answer.questionType) }}
            </el-tag>
            <span class="question-score">
              <span :class="{ 'score-correct': answer.isCorrect, 'score-wrong': !answer.isCorrect }">
                {{ answer.obtainedScore || 0 }}
              </span> / {{ answer.score }} 分
            </span>
            <el-tag v-if="answer.isCorrect" type="success" size="small">正确</el-tag>
            <el-tag v-else-if="answer.studentAnswer" type="danger" size="small">错误</el-tag>
            <el-tag v-else type="info" size="small">未作答</el-tag>
          </div>
          
          <div class="answer-content">
            <p class="question-text">{{ answer.questionContent }}</p>
            
            <!-- 选择题选项 -->
            <div v-if="answer.questionOptions" class="question-options">
              <div 
                v-for="(option, optIndex) in parseOptions(answer.questionOptions)" 
                :key="optIndex"
                class="option-item"
                :class="{ 
                  'selected': isOptionSelected(answer.studentAnswer, optIndex),
                  'correct': isCorrectOption(answer.correctAnswer, optIndex),
                  'wrong': isOptionSelected(answer.studentAnswer, optIndex) && !isCorrectOption(answer.correctAnswer, optIndex)
                }"
              >
                <span class="opt-prefix">{{ String.fromCharCode(65 + optIndex) }}.</span>
                {{ typeof option === 'object' ? option.text : option }}
              </div>
            </div>
            
            <div class="answer-comparison">
              <div class="student-answer">
                <strong>学生答案：</strong>
                <span :class="{ 'wrong-text': !answer.isCorrect }">
                  {{ formatStudentAnswer(answer) || '未作答' }}
                </span>
              </div>
              <div class="correct-answer">
                <strong>正确答案：</strong>
                <span class="correct-text">{{ formatCorrectAnswer(answer) }}</span>
              </div>
            </div>
            
            <div v-if="answer.analysis" class="answer-analysis">
              <strong>解析：</strong>{{ answer.analysis }}
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getStudentExamDetail } from '@/api/exam'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const studentInfo = ref({})
const examInfo = ref({})
const answers = ref([])
const questionChartRef = ref(null)
let questionChart = null

// 计算属性
const scoreRate = computed(() => {
  if (!examInfo.value.totalScore) return 0
  return Math.round((studentInfo.value.obtainedScore || 0) / examInfo.value.totalScore * 100)
})

const correctRate = computed(() => {
  if (answers.value.length === 0) return 0
  const correctCount = answers.value.filter(a => a.isCorrect).length
  return Math.round(correctCount / answers.value.length * 100)
})

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
      // 处理答案列表
      answers.value = (data.answers || data.studentAnswers || []).map(ans => ({
        ...ans,
        isCorrect: ans.isCorrect || ans.obtainedScore === ans.score
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
.student-answer-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.page-header h2 {
  margin: 0;
  flex: 1;
}

.info-card, .chart-card, .summary-card, .answers-card {
  border-radius: 12px;
}

.summary-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.summary-item .label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.summary-item .value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.summary-item .value.success { color: #67C23A; }
.summary-item .value.warning { color: #E6A23C; }
.summary-item .value.danger { color: #F56C6C; }
.summary-item .value.primary { color: #409EFF; }

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.answer-item {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.answer-item.is-correct {
  border-left: 4px solid #67C23A;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.answer-item.is-wrong {
  border-left: 4px solid #F56C6C;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.question-number {
  font-weight: 700;
  color: #1f2937;
}

.question-score {
  margin-left: auto;
  color: #64748b;
}

.score-correct { color: #67C23A; font-weight: 700; }
.score-wrong { color: #F56C6C; font-weight: 700; }

.question-text {
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
  margin-bottom: 16px;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.option-item {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: #f8fafc;
  transition: all 0.3s;
}

.option-item.selected {
  border-color: #409EFF;
  background: #ecf5ff;
}

.option-item.correct {
  border-color: #67C23A;
  background: #f0f9eb;
}

.option-item.wrong {
  border-color: #F56C6C;
  background: #fef0f0;
}

.opt-prefix {
  font-weight: 700;
  margin-right: 8px;
}

.answer-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 12px;
}

.wrong-text { color: #F56C6C; }
.correct-text { color: #67C23A; }

.answer-analysis {
  padding: 12px;
  background: #fffbeb;
  border-radius: 8px;
  color: #92400e;
  font-size: 14px;
}
</style>
