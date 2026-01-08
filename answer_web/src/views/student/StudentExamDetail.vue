<template>
  <div class="exam-take-page">
    <!-- Sticky Header with Timer -->
    <header class="exam-header glass-panel">
      <div class="header-left">
        <h1 class="exam-title text-truncate">{{ exam.examTitle }}</h1>
        <span class="exam-course">{{ exam.courseName }}</span>
      </div>

      <div class="header-center">
        <div class="timer-box" :class="{ 'urgent': timeLeft < 300 }">
          <el-icon><Timer /></el-icon>
          <span class="time-text">{{ formatDuration(timeLeft) }}</span>
        </div>
      </div>

      <div class="header-right">
        <el-button type="primary" @click="confirmSubmit" :loading="submitting" size="large">
           交卷
        </el-button>
      </div>
    </header>

    <div class="exam-container">
      <!-- Question Navigation Side -->
      <aside class="exam-nav glass-panel">
        <h3>题目导航</h3>
        <div class="nav-grid">
          <div
            v-for="(q, idx) in questions"
            :key="q.questionId"
            class="nav-item"
            :class="{ 'answered': hasAnswer(idx), 'current': currentIdx === idx }"
            @click="scrollToQuestion(idx)"
          >
            {{ idx + 1 }}
          </div>
        </div>
        <div class="nav-legend">
          <div class="legend-item"><span class="dot answering"></span>当前</div>
          <div class="legend-item"><span class="dot answered"></span>已答</div>
          <div class="legend-item"><span class="dot"></span>未答</div>
        </div>
      </aside>

      <!-- Main Question Area -->
      <main class="exam-questions glass-panel">
        <div
          v-for="(q, idx) in questions"
          :key="q.questionId"
          :ref="el => questionRefs[idx] = el"
          class="question-card"
          @mouseenter="currentIdx = idx"
        >
          <div class="q-header">
            <span class="q-no">{{ idx + 1 }}.</span>
            <el-tag :type="getTypeTag(q.questionType)" effect="dark" size="small">{{ getTypeLabel(q.questionType) }}</el-tag>
            <span class="q-score">（{{ q.score }}分）</span>
          </div>

          <div class="q-content">{{ q.questionContent }}</div>

          <!-- Single Choice -->
          <div v-if="['SINGLE', 'SINGLE_CHOICE'].includes(q.questionType)" class="q-options">
            <el-radio-group v-model="answers[idx]" class="vertical-group">
              <el-radio
                v-for="(opt, oIdx) in parseOptions(q.questionOptions)"
                :key="oIdx"
                :label="getOptionLabel(oIdx)"
                class="option-item"
              >
                <span class="opt-prefix">{{ getOptionLabel(oIdx) }}.</span>
                <span class="opt-text">{{ opt.text || opt }}</span>
              </el-radio>
            </el-radio-group>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)" class="q-options">
            <el-checkbox-group v-model="multiAnswers[idx]" class="vertical-group">
              <el-checkbox
                v-for="(opt, oIdx) in parseOptions(q.questionOptions)"
                :key="oIdx"
                :label="getOptionLabel(oIdx)"
                class="option-item"
              >
                <span class="opt-prefix">{{ getOptionLabel(oIdx) }}.</span>
                <span class="opt-text">{{ opt.text || opt }}</span>
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- Judgment -->
          <div v-else-if="['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(q.questionType)" class="q-options">
             <!-- Use explicit A/B options for consistency with Teacher side fixes -->
             <el-radio-group v-model="answers[idx]" class="vertical-group">
                <el-radio label="A" class="option-item judgment-opt">
                   <span class="opt-prefix">A.</span>
                   <span class="opt-text">正确</span>
                </el-radio>
                <el-radio label="B" class="option-item judgment-opt">
                   <span class="opt-prefix">B.</span>
                   <span class="opt-text">错误</span>
                </el-radio>
             </el-radio-group>
          </div>

          <!-- Fill Blank / Essay -->
          <div v-else class="q-input">
             <el-input
               v-model="answers[idx]"
               type="textarea"
               :rows="4"
               placeholder="请输入您的答案..."
             />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
import api from '@/api/exam'
import '@/assets/css/teacher/modern-theme.css'

const route = useRoute()
const router = useRouter()

const examId = route.params.id
const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')

const exam = ref({})
const questions = ref([])
const loading = ref(true)
const submitting = ref(false)

const answers = reactive({}) // Map: index -> value (string)
const multiAnswers = reactive({}) // Map: index -> array

const currentIdx = ref(0)
const questionRefs = ref({})
const timeLeft = ref(0)
let timerInterval = null

// Load Exam
const initExam = async () => {
  if (!studentId) {
    ElMessage.error('无法获取学生身份，请重新登录')
    return
  }

  try {
    const res = await api.getExamToTake(examId, studentId)
    if (res.success || res.code === 200) {
       const data = res.data
       exam.value = data.exam || {}
       questions.value = data.questions || []

       // Calculate remaining time
       const now = new Date().getTime()
       const end = new Date(exam.value.endTime).getTime()
       const durationMs = (exam.value.duration || 60) * 60 * 1000

       // Logic: Strict end time vs Duration
       // We usually take min(endTime - now, duration)
       const timeUntilEnd = Math.max(0, Math.floor((end - now) / 1000))
       const durationSeconds = (exam.value.duration || 60) * 60

       timeLeft.value = Math.min(timeUntilEnd, durationSeconds)

       startTimer()

       // Init answers
       questions.value.forEach((q, i) => {
          if (['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
             multiAnswers[i] = []
          } else {
             answers[i] = ''
          }
       })
    } else {
       ElMessage.error(res.message || '加载试卷失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('无法加载试卷，请联系管理员')
  } finally {
    loading.value = false
  }
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timerInterval)
      forceSubmit()
    }
  }, 1000)
}

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

const parseOptions = (optsRaw) => {
  if (!optsRaw) return []
  try {
    return JSON.parse(optsRaw)
  } catch(e) {
    return []
  }
}

const hasAnswer = (idx) => {
  const q = questions.value[idx]
  if (!q) return false
  if (['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
     return multiAnswers[idx] && multiAnswers[idx].length > 0
  }
  return !!answers[idx]
}

const getOptionLabel = (idx) => String.fromCharCode(65 + idx)

const getTypeLabel = (type) => {
  const map = { SINGLE: '单选', MULTIPLE: '多选', JUDGE: '判断', ESSAY: '简答', FILL_BLANK: '填空' }
  return map[type] || map[type?.split('_')[0]] || '未知'
}

const getTypeTag = (type) => {
  if (type.includes('SINGLE')) return ''
  if (type.includes('MULTIPLE')) return 'success'
  if (type.includes('JUDGE')) return 'warning'
  return 'info'
}

const scrollToQuestion = (idx) => {
  const el = questionRefs.value[idx]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    currentIdx.value = idx
  }
}

const confirmSubmit = () => {
  // Check completion
  const total = questions.value.length
  let answered = 0
  questions.value.forEach((q, i) => {
     if (hasAnswer(i)) answered++
  })

  const msg = answered < total
    ? `您还有 ${total - answered} 道题未作答，确定要交卷吗？`
    : '确定要提交试卷吗？提交后将无法修改。'

  ElMessageBox.confirm(msg, '交卷确认', {
    confirmButtonText: '确认交卷',
    cancelButtonText: '继续答题',
    type: 'warning'
  }).then(() => {
    doSubmit()
  })
}

const forceSubmit = () => {
  ElMessage.warning('考试时间到，正在自动交卷...')
  doSubmit()
}

const doSubmit = async () => {
  submitting.value = true
  // Prepare payload
  // Answers need to be mapped back to questionId probably?
  // Or backend expects a list of { questionId, answer }

  // Let's assume standard Answer DTO
  const answerList = questions.value.map((q, idx) => {
    let ans = answers[idx]
    if (['MULTIPLE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
       // Sort multiple choice answers (e.g. ['A','C'] -> 'AC')
       ans = (multiAnswers[idx] || []).sort().join('')
    }
    return {
       questionId: q.questionId,
       answer: ans || '' // 'A', 'AB', 'Content...', etc.
    }
  })

  const payload = {
    examId: parseInt(examId),
    studentId: parseInt(studentId),
    answers: answerList,
    submitTime: new Date() // Optional, backend should timestamp
  }

  try {
     const res = await api.submitStudentExam(examId, payload)
     if (res.success || res.code === 200) {
        ElMessage.success('交卷成功！')
        router.replace('/student/dashboard')
     } else {
        ElMessage.error(res.message || '交卷失败')
     }
  } catch (err) {
    console.error(err)
    ElMessage.error('交卷发生错误，请联系监考老师')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  initExam()
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.exam-take-page {
  min-height: 100vh;
  padding-top: 80px; /* Space for sticky header */
  background: #f1f5f9;
}

.exam-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
}
.exam-title { font-size: 18px; font-weight: 800; margin: 0; color: #1e293b; max-width: 300px; }
.exam-course { font-size: 12px; color: #64748b; }

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.timer-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
  font-family: monospace; /* For stable width */
  color: #3b82f6;
  background: #eff6ff;
  padding: 6px 20px;
  border-radius: 12px;
  transition: all 0.3s;
}

.timer-box.urgent {
  color: #ef4444;
  background: #fef2f2;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.exam-container {
  max-width: 1200px;
  margin: 20px auto;
  display: flex;
  gap: 24px;
  padding: 0 20px;
  align-items: flex-start;
}

.exam-nav {
  width: 260px;
  padding: 24px;
  position: sticky;
  top: 90px;
  border-radius: 16px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.nav-item {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.nav-item:hover { transform: scale(1.1); }
.nav-item.answered { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
.nav-item.current { ring: 2px solid #3b82f6; ring-offset: 2px; }

.nav-legend {
  margin-top: 24px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  justify-content: center;
  color: #64748b;
}

.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; }
.dot.answered { background: #3b82f6; }
.dot.answering { border: 2px solid #3b82f6; background: transparent; }

.exam-questions {
  flex: 1;
  padding: 40px;
  border-radius: 16px;
  min-height: 500px;
}

.question-card {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #f1f5f9;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.q-no { font-size: 20px; font-weight: 800; color: #3b82f6; }
.q-score { font-size: 14px; color: #94a3b8; }

.q-content {
  font-size: 16px;
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 24px;
}

.q-options {
  background: #f8fafc;
  padding: 24px;
  border-radius: 12px;
}

.vertical-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-item {
  margin: 0 !important;
  padding: 12px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.option-item.is-checked {
  border-color: #3b82f6;
  background: #eff6ff;
}

.option-item:hover { border-color: #94a3b8; }

.opt-prefix { font-weight: 700; margin-right: 8px; color: #64748b; }
.opt-text { font-size: 14px; color: #334155; white-space: normal; line-height: 1.4; }

/* Fix deep selector for element plus radio/checkbox styling overrides if needed */
:deep(.el-radio__label), :deep(.el-checkbox__label) {
  display: flex;
  align-items: flex-start;
  white-space: normal;
}
</style>
