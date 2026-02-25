<template>
  <div class="homework-grade">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h1 class="page-title">{{ homework.reportTitle || '作业批改' }}</h1>
      </div>
      <div class="header-right">
        <div class="progress-info">
          <span class="progress-num">{{ currentIndex + 1 }}</span>
          <span class="progress-total">/ {{ filteredSubmissions.length }}</span>
        </div>
        <el-button type="primary" class="save-next-btn" @click="saveAndNext">
          保存并批改下一份
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="grade-container">
      <!-- 左侧学生列表 -->
      <div class="student-list-section">
        <div class="list-header">
          <div class="filter-controls">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索学生..."
              clearable
              class="ketangpai-search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="status-filters">
              <span class="filter-tag" :class="{ active: filterStatus === 'ALL' }" @click="filterStatus = 'ALL'">全部</span>
              <span class="filter-tag" :class="{ active: filterStatus === 'PENDING' }" @click="filterStatus = 'PENDING'">待批改</span>
              <span class="filter-tag" :class="{ active: filterStatus === 'GRADED' }" @click="filterStatus = 'GRADED'">已批改</span>
            </div>
          </div>
        </div>
        
        <div class="list-content">
          <div v-if="filteredSubmissions.length > 0">
            <div 
              v-for="(sub, index) in filteredSubmissions" 
              :key="index" 
              class="student-item"
              :class="{ active: currentSubmission?.studentReportId === sub.studentReportId, graded: sub.status == 2 || sub.status === 'GRADED' || sub.status == 3 }"
              @click="selectSubmission(sub, index)"
            >
              <div class="student-info">
                <div class="name-row">
                  <span class="name">{{ sub.studentName }}</span>
                  <div class="status-indicator">
                    <span v-if="sub.status == 2 || sub.status === 'GRADED' || sub.status == 3" class="status-dot graded-dot" :class="{ 'returned-dot': sub.status == 3 }"></span>
                    <span v-else class="status-dot pending-dot"></span>
                  </div>
                </div>
                <div class="student-id">SNO: {{ sub.studentId }}</div>
              </div>
              <div class="score-badge" v-if="sub.status == 2 || sub.status === 'GRADED' || sub.status == 3">
                <span v-if="sub.status == 3" style="font-size: 11px;">被退回</span>
                <span v-else>{{ sub.score || 0 }}分</span>
              </div>
            </div>
          </div>
          
          <el-empty v-else-if="searchKeyword && submissions.length > 0" description="没有找到匹配的学生" :image-size="60">
            <template #image>
              <el-icon :size="40" color="#cbd5e1"><Search /></el-icon>
            </template>
          </el-empty>
          
          <el-empty v-else description="暂无提交" :image-size="60">
            <template #image>
              <el-icon :size="40" color="#cbd5e1"><User /></el-icon>
            </template>
          </el-empty>
        </div>
      </div>

      <!-- 中间内容区域 -->
      <div class="grade-detail-section">
        <div v-if="currentSubmission" class="detail-content">
          <div class="detail-header">
            <h3>{{ currentSubmission.studentName }} 的作业内容</h3>
            <div class="submission-meta">
              <span v-if="currentSubmission.attachmentUrl">
                <el-button class="download-attachment-btn" link @click="downloadFile(currentSubmission.attachmentUrl)">
                  <el-icon><Download /></el-icon>  附件
                </el-button>
              </span>
            </div>
          </div>

          <div class="content-scroll">
            <!-- 文字报告区 -->
            <div v-if="hasContent" class="content-block">
              <div class="content-section-title">
                <el-icon><Edit /></el-icon> 文字报告区
              </div>
              <div class="text-content">
                {{ currentSubmission.content }}
              </div>
            </div>

            <!-- 在线题目 -->
            <div v-if="hasQuestions" class="content-block">
              <div class="structured-ans-list">
                <div v-for="(q, index) in questionList" :key="index" class="q-ans-item">
                  <div class="q-title">
                    <span class="q-num">{{ index + 1 }}</span>
                    <span class="q-text">{{ q.questionContent || q.content }}</span>
                    <span class="q-score-tag">{{ q.score || 0 }}分</span>
                  </div>
                  
                  <!-- 选项显示区 -->
                  <div v-if="['SINGLE', 'MULTIPLE'].includes(q.questionType)" class="q-options-container">
                    <div v-for="(opt, oIdx) in parseOptions(q.questionOptions || q.options)" :key="oIdx" class="q-option-item">
                      <span class="opt-label">{{ String.fromCharCode(65 + oIdx) }}.</span>
                      <span class="opt-text">{{ opt.text || opt }}</span>
                    </div>
                  </div>
                  <div v-else-if="q.questionType === 'JUDGE'" class="q-options-container">
                    <div class="q-option-item"><span class="opt-label">A.</span><span class="opt-text">正确</span></div>
                    <div class="q-option-item"><span class="opt-label">B.</span><span class="opt-text">错误</span></div>
                  </div>
                  <div class="ans-comparison">
                    <div class="ans-unit student">
                      <span class="label">学生作答:</span>
                      <span class="val" :class="{ correct: isCorrect(index, q), wrong: !isCorrect(index, q) && getStudentAnswer(index, q) }">
                        {{ getStudentAnswer(index, q) || '未作答' }}
                      </span>
                    </div>
                    <div class="ans-unit standard">
                      <span class="label">标准答案:</span>
                      <span class="val">{{ getCorrectAnswer(q) }}</span>
                    </div>
                  </div>
                  <div v-if="q.analysis" class="q-analysis">
                    <div class="analysis-label">题目解析</div>
                    <div class="analysis-text">{{ q.analysis }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片预览区 -->
            <div v-if="!hasContent && !hasQuestions" class="image-preview-area">
              <div class="preview-icon"><el-icon><Picture /></el-icon></div>
              <div class="preview-text">图片/图表预览区域</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-detail">
          <el-empty description="请选择学生开始批改" :image-size="80" />
        </div>
      </div>

      <!-- 右侧评分面板 -->
      <div class="right-panel" v-if="currentSubmission">
        <!-- 作答情况 -->
        <div v-if="hasQuestions" class="answer-summary-section">
          <div class="panel-title">
            <el-icon><Document /></el-icon> 作答情况
          </div>
          <div class="answer-summary">
            <div class="summary-row">
              <span class="summary-label">总题数</span>
              <span class="summary-value">{{ questionList.length }} 题</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">答对</span>
              <span class="summary-value correct">{{ correctCount }} 题</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">答错</span>
              <span class="summary-value wrong">{{ questionList.length - correctCount }} 题</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">正确率</span>
              <span class="summary-value">{{ accuracyRate }}%</span>
            </div>
            <div v-if="isOnlyObjectiveQuestions" class="summary-row auto-score">
              <span class="summary-label">系统自动评分</span>
              <span class="summary-value score">{{ gradeForm.score || 0 }} 分</span>
            </div>
          </div>
        </div>

        <div class="panel-title">
          <el-icon><EditPen /></el-icon> 评分
        </div>

        <!-- 分数输入 -->
        <div class="score-input-section">
          <div class="score-label">最终得分 (0-{{ homework.totalScore || 100 }})</div>
          <div class="score-input-wrapper">
            <el-input-number 
              v-model="gradeForm.score" 
              :min="0" 
              :max="homework.totalScore || 100" 
              :controls="false"
              size="large"
              class="score-number-input"
            />
          </div>
        </div>

        <!-- 快捷评语 -->
        <div class="quick-comments-section">
          <div class="quick-comments-title">快捷评语</div>
          <div class="quick-comment-tags">
            <button class="quick-comment-tag" @click="addComment('逻辑清晰，代码规范')">逻辑清晰</button>
            <button class="quick-comment-tag" @click="addComment('代码优秀')">代码优秀</button>
            <button class="quick-comment-tag" @click="addComment('排版整齐')">排版整齐</button>
            <button class="quick-comment-tag" @click="addComment('分析深度不足')">分析深度不足</button>
            <button class="quick-comment-tag" @click="addComment('公式有误')">公式有误</button>
          </div>
        </div>

        <!-- 评语输入 -->
        <div class="comment-input-section">
          <el-input
            v-model="gradeForm.teacherComment"
            type="textarea"
            :rows="4"
            placeholder="输入评语..."
            maxlength="500"
            show-word-limit
            class="comment-input-wrapper"
          />
        </div>

        <!-- 按钮区域: 不同状态显示不同的文本和颜色 -->
        <template v-if="currentSubmission.status == 2 || currentSubmission.status === 'GRADED' || currentSubmission.status == 3">
          <button class="return-btn" @click="returnForRevision" v-if="currentSubmission.status != 3">
            <el-icon><RefreshLeft /></el-icon> 退回重写
          </button>
          <button class="save-btn over-grade-btn" @click="submitGrade" :disabled="submitting">
            <el-icon><Check /></el-icon> {{ submitting ? '覆盖批改中...' : '重新批改/覆盖' }}
          </button>
        </template>
        
        <template v-else>
          <button class="return-btn" @click="returnForRevision">
            <el-icon><RefreshLeft /></el-icon> 退回重写
          </button>
          <button class="save-btn" @click="submitGrade" :disabled="submitting">
            <el-icon><Check /></el-icon> {{ submitting ? '批改中...' : '提交批改' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  ArrowLeft, Search, Document, Download, User, Edit, EditPen, Picture, RefreshLeft, Check
} from '@element-plus/icons-vue'
import { useHomeworkGrade } from '@/assets/js/teacher/homework-grade'

const {
  homework,
  submissions,
  loading,
  searchKeyword,
  currentSubmission,
  submitting,
  gradeForm,
  questionList,
  filterStatus,
  filteredSubmissions,
  hasQuestions,
  hasContent,
  selectSubmission: originalSelect,
  downloadFile,
  submitGrade,
  returnForRevision,
  getStudentAnswer,
  getCorrectAnswer,
  isCorrect,
  parseOptions,
} = useHomeworkGrade()

const currentIndex = ref(0)

const isOnlyObjectiveQuestions = computed(() => {
  if (!questionList.value || questionList.value.length === 0) return false
  return questionList.value.every(q => {
    const type = (q.questionType || q.type || '').toString().toUpperCase()
    return ['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', '1', '2', '3', '4'].includes(type) ||
           ['单选', '多选', '判断', '填空'].includes(type) ||
           type.includes('CHOICE') || type.includes('SINGLE') || type.includes('MULTIPLE')
  })
})

const correctCount = computed(() => {
  if (!questionList.value) return 0
  let count = 0
  questionList.value.forEach((q, idx) => {
    const type = (q.questionType || q.type || '').toString().toUpperCase()
    if (['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', '1', '2', '3', '4'].includes(type) ||
        ['单选', '多选', '判断', '填空'].includes(type) ||
        type.includes('CHOICE') || type.includes('SINGLE') || type.includes('MULTIPLE')) {
      if (isCorrect(idx, q)) count++
    }
  })
  return count
})

const accuracyRate = computed(() => {
  if (!questionList.value || questionList.value.length === 0) return 0
  return Math.round((correctCount.value / questionList.value.length) * 100)
})

const selectSubmission = (sub, index) => {
  currentIndex.value = index
  originalSelect(sub)
  
  // 如果只有客观题，自动评分
  if (isOnlyObjectiveQuestions.value && sub.status != 2 && sub.status !== 'GRADED') {
    setTimeout(() => {
      let total = 0
      questionList.value.forEach((q, idx) => {
        const type = (q.questionType || q.type || '').toString().toUpperCase()
        if (['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', '1', '2', '3', '4'].includes(type) ||
            ['单选', '多选', '判断', '填空'].includes(type) ||
            type.includes('CHOICE') || type.includes('SINGLE') || type.includes('MULTIPLE')) {
          if (isCorrect(idx, q)) {
            total += (q.score || 0)
          }
        }
      })
      gradeForm.score = total
    }, 100)
  }
}

const addComment = (text) => {
  if (gradeForm.teacherComment) {
    gradeForm.teacherComment += '；' + text
  } else {
    gradeForm.teacherComment = text
  }
}

const saveAndNext = async () => {
  await submitGrade()
  if (currentIndex.value < filteredSubmissions.value.length - 1) {
    selectSubmission(filteredSubmissions.value[currentIndex.value + 1], currentIndex.value + 1)
  }
}


</script>

<style scoped>
@import '@/assets/css/teacher/homework-grade.css';
</style>
