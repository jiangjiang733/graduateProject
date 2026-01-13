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
            <span class="q-no">{{ idx + 1. }}</span>
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
import { Timer } from '@element-plus/icons-vue'
import { useStudentExamDetail } from '@/assets/js/student/student-exam-detail'

const {
  exam,
  questions,
  submitting,
  answers,
  multiAnswers,
  currentIdx,
  questionRefs,
  timeLeft,
  formatDuration,
  parseOptions,
  hasAnswer,
  getOptionLabel,
  getTypeLabel,
  getTypeTag,
  scrollToQuestion,
  confirmSubmit
} = useStudentExamDetail()
</script>

<style scoped>
@import '@/assets/css/student/student-exam-detail.css';
</style>
