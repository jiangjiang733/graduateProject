<template>
  <div class="exam-form-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2 class="page-title">{{ isEdit ? '编辑考试' : '创建考试' }}</h2>
    </div>

    <el-card class="form-card" shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="手动出卷 / 题库拣题" name="manual">
          <div class="step-container">
            <div class="form-header section-title-wrap">
              <span class="step-num">Step 1</span>
              <h3 class="section-title">考试基础设置</h3>
            </div>
            
            <el-form :model="examForm" label-position="top" class="premium-form">
              <div class="form-grid">
                <el-form-item label="所属课程" required>
                  <el-select v-model="examForm.courseId" placeholder="请选择课程" class="glass-select" @change="handleCourseChange">
                    <template #prefix><el-icon><Notebook /></el-icon></template>
                    <el-option v-for="course in courses" :key="course.id" :label="course.courseName" :value="course.id" />
                  </el-select>
                </el-form-item>

                <el-form-item label="考试标题" required>
                  <el-input v-model="examForm.examTitle" placeholder="请输入考试标题" class="glass-input" />
                </el-form-item>

                <el-form-item label="考试时间" required class="full-width">
                  <el-date-picker
                    v-model="timeRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    class="glass-date-picker"
                  />
                </el-form-item>

                <el-form-item label="考试时长 (分钟)">
                  <el-input-number v-model="examForm.duration" :min="10" :max="300" class="glass-number" controls-position="right" />
                </el-form-item>

                <el-form-item :label="'及格分 (总分的60%)'">
                  <el-input-number v-model="examForm.passScore" disabled class="glass-number" />
                </el-form-item>
              </div>

              <el-form-item label="考试说明" class="full-width">
                <el-input v-model="examForm.examDescription" type="textarea" :rows="3" placeholder="请输入考试说明..." class="glass-input" />
              </el-form-item>
            </el-form>

            <el-divider />

            <div class="form-header questions-section">
              <div class="section-title-wrap">
                <span class="step-num">Step 2</span>
                <h3 class="section-title">题目列表</h3>
                <el-tag effect="dark" round class="score-badge">已添加 {{ manualQuestions.length }} 题 / 共 {{ totalManualScore }} 分</el-tag>
              </div>
              <div class="actions">
                <el-button class="premium-btn ghost" :icon="Collection" @click="openBankSelection">从题库添加</el-button>
                <el-button class="premium-btn primary" :icon="Plus" @click="addManualQuestion">手动添加题目</el-button>
              </div>
            </div>

            <div v-if="manualQuestions.length === 0" class="empty-questions glass-panel">
              <el-empty description="暂无题目，建议从题库拣题或手动添加" :image-size="120" />
            </div>

            <div v-else class="structured-questions-list">
              <div v-for="(q, index) in manualQuestions" :key="index" class="q-item-card glass-panel animate-slide-up" :style="{ '--delay': index * 0.05 + 's' }">
                <div class="q-card-header">
                  <div class="q-card-meta">
                    <span class="q-index">#{{ index + 1 }}</span>
                    <el-tag :type="getQuestionTypeTag(q.questionType)" size="small">{{ getQuestionTypeText(q.questionType) }}</el-tag>
                    <div class="q-score-edit">
                      <el-input-number v-model="q.score" :min="1" :max="100" size="small" controls-position="right" @change="calculateTotal" />
                      <span class="unit">分</span>
                    </div>
                  </div>
                  <div class="q-card-ops">
                    <el-button link type="primary" @click="editManualQuestion(index)">编辑</el-button>
                    <el-button link type="danger" @click="deleteManualQuestion(index)">移除</el-button>
                  </div>
                </div>
                <div class="q-card-body">
                  <div class="q-content">{{ q.questionContent }}</div>
                  <div v-if="['SINGLE', 'MULTIPLE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.questionType) && q.questionOptions" class="q-options-preview">
                     <div v-for="(opt, oIdx) in parseOptions(q.questionOptions)" :key="oIdx" class="opt-preview-item" :class="{ 'is-answer': isCorrectOption(q, oIdx) }">
                       <span class="opt-prefix">{{ String.fromCharCode(65 + oIdx) }}</span>
                       <span class="opt-text">{{ (typeof opt === 'object' && opt !== null) ? (opt.text || JSON.stringify(opt)) : opt }}</span>
                     </div>
                  </div>
                  <div v-else-if="['JUDGE', 'TRUE_FALSE'].includes(q.questionType)" class="q-options-preview">
                     <div class="opt-preview-item" :class="{ 'is-answer': q.correctAnswer === 'A' || q.correctAnswer === '对' || q.correctAnswer === '正确' }">
                       <span class="opt-prefix">A</span>
                       <span class="opt-text">正确</span>
                     </div>
                     <div class="opt-preview-item" :class="{ 'is-answer': q.correctAnswer === 'B' || q.correctAnswer === '错' || q.correctAnswer === '错误' }">
                       <span class="opt-prefix">B</span>
                       <span class="opt-text">错误</span>
                     </div>
                  </div>
                  <div v-if="['JUDGE', 'FILL_BLANK', 'SHORT_ANSWER', 'TRUE_FALSE'].includes(q.questionType)" class="q-answer-preview">
                    <span class="label">正确答案:</span>
                    <template v-if="q.questionType === 'JUDGE' || q.questionType === 'TRUE_FALSE'">
                       <span class="value" :class="{correct: q.correctAnswer === 'A' || q.correctAnswer === '对', error: q.correctAnswer === 'B' || q.correctAnswer === '错'}">
                         {{ (q.correctAnswer === 'A' || q.correctAnswer === '对') ? 'A. 正确' : (q.correctAnswer === 'B' || q.correctAnswer === '错' ? 'B. 错误' : q.correctAnswer) }}
                       </span>
                    </template>
                    <span class="value" v-else>{{ q.correctAnswer }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-footer">
              <el-button size="large" @click="goBack" class="premium-btn ghost">取消</el-button>
              <el-button 
                v-if="!isEdit"
                type="primary" 
                size="large"
                @click="confirmCreateManual" 
                :loading="submitting"
                :disabled="!canCreateManual"
                class="premium-btn primary submit-btn"
              >
                <el-icon><Check /></el-icon> 确认创建考试
              </el-button>
              <el-button 
                v-else给我修正
                type="primary" 
                size="large"
                @click="confirmUpdate" 
                :loading="submitting"
                class="premium-btn primary submit-btn"
              >
                <el-icon><Check /></el-icon> 保存修改
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI 智能出题 -->
        <el-tab-pane label="AI 智能出题" name="ai">
          <div class="step-container">
            <div class="ai-hero">
              <div class="ai-icon-wrap">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="ai-text">
                <h3>AI 智能出题助手</h3>
                <p>根据您的教学大纲和课程名，由 AI 一键生成高质量试卷</p>
              </div>
            </div>

            <el-form :model="aiForm" label-position="top" class="premium-form ai-config">
              <div class="ai-config-grid">
                <el-form-item label="参考课程" required>
                  <el-select v-model="examForm.courseId" placeholder="请选择课程" class="glass-select" @change="handleCourseChange">
                    <el-option v-for="course in courses" :key="course.id" :label="course.courseName" :value="course.id" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="生成课程名 (AI识别项)" required>
                  <el-input v-model="aiForm.courseName" placeholder="例如: 数据结构、线性代数" class="glass-input" />
                </el-form-item>

                <el-form-item label="期望题数">
                  <el-input-number v-model="aiForm.questionCount" :min="1" :max="20" class="glass-number" />
                </el-form-item>

                <el-form-item label="题型组合">
                  <el-checkbox-group v-model="aiForm.questionTypes" class="glass-checkbox-group">
                    <el-checkbox label="SINGLE">单选</el-checkbox>
                    <el-checkbox label="MULTIPLE">多选</el-checkbox>
                    <el-checkbox label="JUDGE">判断</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </div>

              <div class="ai-actions">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="generateWithAi" 
                  :loading="aiLoading"
                  :disabled="!canGenerateAi"
                  class="premium-btn ai-start-btn"
                >
                  <el-icon><MagicStick /></el-icon> 开始 AI 智能出卷
                </el-button>
              </div>
            </el-form>

            <div v-if="aiQuestions.length > 0" class="ai-result-section">
              <div class="result-header">
                <h3><el-icon><DocumentChecked /></el-icon> AI 生成结果</h3>
                <div class="result-ops">
                  <el-button link @click="aiQuestions = []">重新配置</el-button>
                  <el-button type="success" @click="confirmCreateWithAi" :loading="submitting" class="premium-btn success">
                    采用这套试题
                  </el-button>
                </div>
              </div>

              <div class="ai-questions-grid">
                <div v-for="(q, index) in aiQuestions" :key="index" class="q-item-card ai-style glass-panel">
                  <div class="q-card-header">
                    <span class="q-index">#{{ index + 1 }}</span>
                    <el-tag :type="getQuestionTypeTag(q.questionType)" size="small">{{ getQuestionTypeText(q.questionType) }}</el-tag>
                    <div class="q-card-ops">
                      <el-button link type="primary" @click="editAiQuestion(index)">调整</el-button>
                    </div>
                  </div>
                  <div class="q-card-body">
                    <div class="q-content">{{ q.questionContent }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 编辑题目对话框 -->
    <el-dialog
      v-model="questionDialogVisible"
      :title="isEditQuestion ? '编辑题目' : '添加题目'"
      width="700px"
    >
      <el-form :model="questionForm" label-width="100px">
        <el-form-item label="题目类型" required>
          <el-select v-model="questionForm.questionType" placeholder="选择题目类型" style="width: 100%">
            <el-option label="单选题" value="SINGLE_CHOICE" />
            <el-option label="多选题" value="MULTIPLE_CHOICE" />
            <el-option label="判断题" value="TRUE_FALSE" />
            <el-option label="填空题" value="FILL_BLANK" />
            <el-option label="简答题" value="SHORT_ANSWER" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目内容" required>
          <div v-if="questionForm.questionType === 'FILL_BLANK'" style="margin-bottom: 5px;">
             <el-button size="small" type="primary" link @click="questionForm.questionContent += '（ ）'">
               <el-icon><Plus /></el-icon> 插入填空符（ ）
             </el-button>
             <span class="tip-text" style="font-size: 12px; color: #999;">点击插入或手动输入中文括号</span>
          </div>
          <el-input
            v-model="questionForm.questionContent"
            type="textarea"
            :rows="4"
            placeholder="请输入题目内容"
          />
        </el-form-item>

        <el-form-item
          v-if="['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.questionType)"
          label="选项"
          required
        >
          <div v-for="(option, index) in questionForm.options" :key="index" class="option-input">
            <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
            <el-input v-model="questionForm.options[index]" placeholder="请输入选项内容" />
            <el-button
              v-if="questionForm.options.length > 2"
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeOption(index)"
            />
          </div>
          <el-button v-if="questionForm.options.length < 6" @click="addOption" size="small">
            添加选项
          </el-button>
        </el-form-item>

        <el-form-item label="正确答案" required>
          <el-select
            v-if="questionForm.questionType === 'SINGLE_CHOICE'"
            v-model="questionForm.correctAnswer"
            placeholder="选择正确答案"
            style="width: 100%"
          >
            <el-option
              v-for="(option, index) in questionForm.options"
              :key="index"
              :label="String.fromCharCode(65 + index)"
              :value="String.fromCharCode(65 + index)"
            />
          </el-select>
          <el-select
            v-else-if="questionForm.questionType === 'MULTIPLE_CHOICE'"
            v-model="questionForm.correctAnswerArray"
            placeholder="选择正确答案（可多选）"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="(option, index) in questionForm.options"
              :key="index"
              :label="String.fromCharCode(65 + index)"
              :value="String.fromCharCode(65 + index)"
            />
          </el-select>
          <el-select
            v-else-if="questionForm.questionType === 'TRUE_FALSE'"
            v-model="questionForm.correctAnswer"
            placeholder="选择正确答案"
            style="width: 100%"
          >
            <el-option label="A. 正确" value="A" />
            <el-option label="B. 错误" value="B" />
          </el-select>
          <el-input
            v-else-if="questionForm.questionType === 'FILL_BLANK'"
            v-model="questionForm.correctAnswer"
            placeholder="请输入正确答案（多个答案用 | 分隔）"
            style="width: 100%"
          >
            <template #append>
              <el-tooltip content="多个空格答案用 | 分隔，如：答案1|答案2|答案3" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
          <el-input
            v-else-if="questionForm.questionType === 'SHORT_ANSWER'"
            v-model="questionForm.correctAnswer"
            type="textarea"
            :rows="4"
            placeholder="请输入参考答案"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="分值" required>
          <el-input-number v-model="questionForm.score" :min="1" :max="100" />
        </el-form-item>

        <el-form-item label="答案解析">
          <el-input
            v-model="questionForm.analysis"
            type="textarea"
            :rows="3"
            placeholder="请输入答案解析（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestion" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 题库选题对话框 -->
    <el-dialog v-model="bankDialogVisible" title="从我的题库选题" width="900px" class="glass-dialog bank-picker">
      <div class="bank-picker-container">
        <div class="picker-filter">
          <el-select v-model="bankFilter.courseId" placeholder="所属课程" clearable @change="searchBank">
            <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
          <el-select v-model="bankFilter.type" placeholder="题型" clearable @change="searchBank">
            <el-option label="单选" value="SINGLE" />
            <el-option label="多选" value="MULTIPLE" />
            <el-option label="判断" value="JUDGE" />
            <el-option label="简答" value="ESSAY" />
          </el-select>
          <el-input v-model="bankFilter.keyword" placeholder="搜索题目内容..." prefix-icon="Search" @keyup.enter="searchBank" />
          <el-button type="primary" @click="searchBank" icon="Search">搜索</el-button>
        </div>

        <el-table :data="bankQuestions" height="450px" v-loading="bankLoading" @selection-change="handleBankSelection">
          <el-table-column type="selection" width="50" />
          <el-table-column label="题型" width="100">
            <template #default="{row}">
              <el-tag size="small" :type="getQuestionTypeTag(row.type)">{{ getQuestionTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="题目内容" show-overflow-tooltip>
            <template #default="{row}">{{ row.content }}</template>
          </el-table-column>
          <el-table-column label="难度" width="100" align="center">
            <template #default="{row}">{{ '★'.repeat(row.difficulty) }}</template>
          </el-table-column>
        </el-table>

        <div class="picker-footer">
          <span class="selected-badge">已选择 {{ selectedBankQuestions.length }} 题</span>
          <el-pagination 
            v-model:current-page="bankPagination.current" 
            v-model:page-size="bankPagination.size"
            :total="bankPagination.total"
            layout="prev, pager, next"
            @current-change="searchBank"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="bankDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImportFromBank" :disabled="selectedBankQuestions.length === 0">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Plus, Delete, MagicStick, DocumentChecked, Check, QuestionFilled, Notebook, Collection 
} from '@element-plus/icons-vue'
import { getCourseList } from '@/api/course.js'
import { createExam, generateQuestionsWithAi, getExamDetail, updateExam, saveExamQuestions } from '@/api/exam.js'
import { getQuestionList } from '@/api/question.js'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id && route.params.id !== 'create')
const activeTab = ref('manual')
const submitting = ref(false)
const courses = ref([])
const timeRange = ref([])

const examForm = reactive({
  examTitle: '',
  courseId: '',
  examDescription: '',
  duration: 60,
  totalScore: 0,
  passScore: 0
})

// 手动创建相关
const manualQuestions = ref([])

// AI 相关
const aiForm = reactive({
  courseName: '',
  questionCount: 5,
  questionTypes: ['SINGLE', 'MULTIPLE']
})

const aiQuestions = ref([])
const aiLoading = ref(false)

// 题库选择相关
const bankDialogVisible = ref(false)
const bankLoading = ref(false)
const bankQuestions = ref([])
const bankFilter = reactive({ courseId: '', type: '', keyword: '' })
const bankPagination = reactive({ current: 1, size: 10, total: 0 })
const selectedBankQuestions = ref([])

// 题目编辑
const questionDialogVisible = ref(false)
const isEditQuestion = ref(false)
const questionForm = reactive({
  questionId: null,
  questionType: 'SINGLE_CHOICE',
  questionContent: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  correctAnswerArray: [],
  score: 10,
  analysis: ''
})

const canGenerateAi = computed(() => {
  return examForm.courseId && 
         examForm.examTitle && 
         aiForm.courseName.trim() && 
         aiForm.questionTypes.length > 0 &&
         timeRange.value && 
         timeRange.value.length === 2
})

const totalAiScore = computed(() => {
  return aiQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
})

const totalManualScore = computed(() => {
  return manualQuestions.value.reduce((sum, q) => sum + (Number(q.score) || 0), 0)
})

watch(totalManualScore, (newTotal) => {
  examForm.totalScore = newTotal
  examForm.passScore = Math.floor(newTotal * 0.6)
})

// === 考试时间与时长双向绑定逻辑 ===
let isInternalChange = false // 防止循环触发

// 1. 监听时间范围变化 -> 更新时长
watch(timeRange, (newRange) => {
  if (isInternalChange) return
  if (newRange && newRange.length === 2) {
    const start = new Date(newRange[0]).getTime()
    const end = new Date(newRange[1]).getTime()
    if (end > start) {
      const diffMinutes = Math.floor((end - start) / (1000 * 60))
      isInternalChange = true
      examForm.duration = diffMinutes
      setTimeout(() => { isInternalChange = false }, 50)
    }
  }
})

// 2. 监听时长变化 -> 更新结束时间
watch(() => examForm.duration, (newDuration) => {
  if (isInternalChange) return
  if (newDuration && timeRange.value && timeRange.value[0]) {
    const start = new Date(timeRange.value[0]).getTime()
    const newEnd = new Date(start + newDuration * 60 * 1000)
    
    const formatStr = (date) => {
      const d = new Date(date)
      return d.getFullYear() + '-' + 
             String(d.getMonth() + 1).padStart(2, '0') + '-' + 
             String(d.getDate()).padStart(2, '0') + ' ' + 
             String(d.getHours()).padStart(2, '0') + ':' + 
             String(d.getMinutes()).padStart(2, '0') + ':' + 
             String(d.getSeconds()).padStart(2, '0')
    }
    
    isInternalChange = true
    timeRange.value = [timeRange.value[0], formatStr(newEnd)]
    setTimeout(() => { isInternalChange = false }, 50)
  }
})

const canCreateManual = computed(() => {
  return examForm.courseId && 
         examForm.examTitle && 
         manualQuestions.value.length > 0 &&
         timeRange.value && 
         timeRange.value.length === 2
})

const loadCourses = async () => {
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    const response = await getCourseList({
      pageNumber: 1,
      pageSize: 100,
      teacherId: teacherId
    })
    if (response.success && response.data) {
      courses.value = response.data.list || []
    }
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

const handleCourseChange = (courseId) => {
  const selectedCourse = courses.value.find(c => c.id === courseId)
  if (selectedCourse) {
    aiForm.courseName = selectedCourse.courseName
    if (!examForm.examTitle) {
      examForm.examTitle = `${selectedCourse.courseName} - 考试`
    }
  }
}

const addManualQuestion = () => {
  isEditQuestion.value = false
  Object.assign(questionForm, {
    questionId: null,
    questionType: 'SINGLE_CHOICE',
    questionContent: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    correctAnswerArray: [],
    score: 10,
    analysis: ''
  })
  questionDialogVisible.value = true
}

const editManualQuestion = (index) => {
  const question = manualQuestions.value[index]
  
  const typeMapping = {
    'SINGLE': 'SINGLE_CHOICE',
    'MULTIPLE': 'MULTIPLE_CHOICE',
    'JUDGE': 'TRUE_FALSE',
    'FILL_BLANK': 'FILL_BLANK',
    'SHORT_ANSWER': 'SHORT_ANSWER'
  }
  
  isEditQuestion.value = true
  const mappedType = typeMapping[question.questionType] || 'SINGLE_CHOICE'

  Object.assign(questionForm, {
    questionId: index,
    questionType: mappedType,
    questionContent: question.questionContent,
    options: getOptionsForEdit(question.questionOptions),
    correctAnswer: mappedType === 'TRUE_FALSE'
      ? normalizeJudgeAnswer(question.answer || question.correctAnswer)
      : (question.answer || question.correctAnswer),
    correctAnswerArray: (question.questionType === 'MULTIPLE' || question.questionType === 'MULTIPLE_CHOICE') 
      ? (question.answer || question.correctAnswer || '').split('') : [],
    score: question.score,
    analysis: question.analysis || ''
  })
  
  questionDialogVisible.value = true
}

const deleteManualQuestion = (index) => {
  ElMessageBox.confirm('确定要删除这道题目吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    manualQuestions.value.splice(index, 1)
    calculateTotal()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 题库选题方法
const openBankSelection = () => {
  bankFilter.courseId = examForm.courseId
  bankDialogVisible.value = true
  searchBank()
}

const searchBank = async () => {
  bankLoading.value = true
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id') || '1'
    const res = await getQuestionList({
      pageNum: bankPagination.current,
      pageSize: bankPagination.size,
      teacherId: teacherId,
      ...bankFilter
    })
    if(res.success) {
      bankQuestions.value = res.data.records
      bankPagination.total = res.data.total
    }
  } finally {
    bankLoading.value = false
  }
}

const handleBankSelection = (val) => {
  selectedBankQuestions.value = val
}

const confirmImportFromBank = () => {
  const newQs = selectedBankQuestions.value.map(q => {
    const qClone = JSON.parse(JSON.stringify(q))
    
    let opts = qClone.options
    // Ensure options are handled correctly (might be string or array)
    if (typeof opts === 'string') {
      try {
        const parsed = JSON.parse(opts)
        opts = JSON.stringify(parsed)
      } catch(e) {}
    } else if (Array.isArray(opts)) {
      opts = JSON.stringify(opts)
    } else if (['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(qClone.type) && (!opts || opts === 'null')) {
        // Fix for missing options in Judgment questions from bank
        opts = JSON.stringify([
          { text: 'A. 正确', isCorrect: false }, 
          { text: 'B. 错误', isCorrect: false }
        ])
    }

    return {
      questionType: qClone.type,
      questionContent: qClone.content,
      questionOptions: opts,
      correctAnswer: qClone.answer, // Unified field name
      score: 5, 
      analysis: qClone.analysis
    }
  })
  
  manualQuestions.value.push(...newQs)
  calculateTotal()
  bankDialogVisible.value = false
  selectedBankQuestions.value = []
  ElMessage.success(`成功导入 ${newQs.length} 道题目`)
}

const isCorrectOption = (question, optIdx) => {
  if (question.questionType === 'SINGLE') {
    return question.correctAnswer === String.fromCharCode(65 + optIdx)
  }
  if (question.questionType === 'MULTIPLE') {
    return question.correctAnswer && question.correctAnswer.includes(String.fromCharCode(65 + optIdx))
  }
  // Simplified Judgment display handled in template logic
  return false
}

const calculateTotal = () => {
  const total = manualQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
  examForm.totalScore = total
}

const getQuestionTypeTag = (type) => {
  const typeMap = {
    'SINGLE': 'primary',
    'MULTIPLE': 'success',
    'JUDGE': 'warning',
    'FILL_BLANK': 'info',
    'SHORT_ANSWER': 'danger'
  }
  return typeMap[type] || 'info'
}

const getQuestionTypeText = (type) => {
  const textMap = {
    'SINGLE': '单选题',
    'MULTIPLE': '多选题',
    'JUDGE': '判断题',
    'FILL_BLANK': '填空题',
    'SHORT_ANSWER': '简答题'
  }
  return textMap[type] || type
}

const parseOptions = (optionsStr) => {
  try {
    return JSON.parse(optionsStr)
  } catch {
    return []
  }
}

const generateWithAi = async () => {
  if (!examForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }
  
  if (!examForm.examTitle) {
    ElMessage.warning('请先填写考试标题')
    return
  }
  
  if (!aiForm.courseName.trim()) {
    ElMessage.warning('请输入课程名称')
    return
  }
  
  if (aiForm.questionTypes.length === 0) {
    ElMessage.warning('请至少选择一种题型')
    return
  }
  
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择考试时间')
    return
  }

  aiLoading.value = true
  ElMessage.info('AI正在生成题目，请稍候...')
  
  try {
    const data = {
      courseName: aiForm.courseName,
      questionCount: aiForm.questionCount,
      questionTypes: aiForm.questionTypes.join(',')
    }
    
    const response = await generateQuestionsWithAi(data)
    
    if (response.code === 200 || response.success) {
      aiQuestions.value = response.data || []
      
      if (aiQuestions.value.length > 0) {
        ElMessage.success(`AI成功生成 ${aiQuestions.value.length} 道题目！请预览并确认`)
        
        setTimeout(() => {
          const previewEl = document.querySelector('.ai-preview')
          if (previewEl) {
            previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        ElMessage.warning('AI未生成题目，请重试')
      }
    } else {
      ElMessage.error(response.message || 'AI生成失败，请重试')
    }
  } catch (error) {
    console.error('AI 生成失败:', error)
    ElMessage.error('AI生成失败，请检查网络或稍后重试')
  } finally {
    aiLoading.value = false
  }
}

const getOptionsForEdit = (optionsRaw) => {
  const opts = parseOptions(optionsRaw)
  if (Array.isArray(opts)) {
    return opts.map(o => (typeof o === 'object' && o !== null) ? (o.text || '') : String(o))
  }
  return ['', '', '', '']
}

const normalizeJudgeAnswer = (ans) => {
   if (ans === '正确' || ans === '对' || ans === 'true' || ans === 'True') return 'A'
   if (ans === '错误' || ans === '错' || ans === 'false' || ans === 'False') return 'B'
   return ans
}

const editAiQuestion = (index) => {
  const question = aiQuestions.value[index]
  
  const typeMapping = {
    'SINGLE': 'SINGLE_CHOICE',
    'MULTIPLE': 'MULTIPLE_CHOICE',
    'JUDGE': 'TRUE_FALSE',
    'FILL_BLANK': 'FILL_BLANK',
    'SHORT_ANSWER': 'SHORT_ANSWER'
  }
  
  isEditQuestion.value = true
  const mappedType = typeMapping[question.questionType] || 'SINGLE_CHOICE'
  
  Object.assign(questionForm, {
    questionId: index,
    questionType: mappedType,
    questionContent: question.questionContent,
    options: getOptionsForEdit(question.questionOptions),
    correctAnswer: mappedType === 'TRUE_FALSE' 
      ? normalizeJudgeAnswer(question.answer || question.correctAnswer)
      : (question.answer || question.correctAnswer),
    correctAnswerArray: (question.questionType === 'MULTIPLE' || question.questionType === 'MULTIPLE_CHOICE') 
      ? (question.answer || question.correctAnswer || '').split('') : [],
    score: question.score,
    analysis: question.analysis || ''
  })
  
  questionDialogVisible.value = true
}

const deleteAiQuestion = (index) => {
  ElMessageBox.confirm('确定要删除这道题目吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    aiQuestions.value.splice(index, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const addOption = () => {
  if (questionForm.options.length < 6) {
    questionForm.options.push('')
  }
}

const removeOption = (index) => {
  if (questionForm.options.length > 2) {
    questionForm.options.splice(index, 1)
  }
}

const saveQuestion = async () => {
  if (!questionForm.questionContent) {
    ElMessage.warning('请输入题目内容')
    return
  }
  
  if (questionForm.questionType === 'MULTIPLE_CHOICE') {
    questionForm.correctAnswer = questionForm.correctAnswerArray.join('')
  }
  
  if (!questionForm.correctAnswer) {
    ElMessage.warning('请输入正确答案')
    return
  }

  const typeMap = {
    'SINGLE_CHOICE': 'SINGLE',
    'MULTIPLE_CHOICE': 'MULTIPLE',
    'TRUE_FALSE': 'JUDGE',
    'FILL_BLANK': 'FILL_BLANK',
    'SHORT_ANSWER': 'SHORT_ANSWER'
  }

  let optionsData = null
  if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.questionType)) {
    optionsData = questionForm.options
      .filter(o => o)
      .map((opt, idx) => {
        const char = String.fromCharCode(65 + idx)
        let isCorrect = false
        if (questionForm.questionType === 'SINGLE_CHOICE') {
          isCorrect = questionForm.correctAnswer === char
        } else {
          isCorrect = questionForm.correctAnswerArray.includes(char)
        }
        return { text: opt, isCorrect }
      })
  } else if (questionForm.questionType === 'TRUE_FALSE') {
    optionsData = [
      { text: 'A. 正确', isCorrect: questionForm.correctAnswer === 'A' || questionForm.correctAnswer === '正确' || questionForm.correctAnswer === '对' },
      { text: 'B. 错误', isCorrect: questionForm.correctAnswer === 'B' || questionForm.correctAnswer === '错误' || questionForm.correctAnswer === '错' }
    ]
  }

  const questionData = {
    questionType: typeMap[questionForm.questionType] || questionForm.questionType,
    questionContent: questionForm.questionContent,
    questionOptions: optionsData ? JSON.stringify(optionsData) : null,
    answer: questionForm.questionType === 'MULTIPLE_CHOICE' 
      ? questionForm.correctAnswerArray.join('') 
      : questionForm.correctAnswer,
    score: questionForm.score,
    analysis: questionForm.analysis
  }

  if (isEditQuestion.value && typeof questionForm.questionId === 'number') {
    const index = questionForm.questionId
    
    // 根据当前 tab 判断是编辑 AI 题目还是手动题目
    if (activeTab.value === 'ai' && index >= 0 && index < aiQuestions.value.length) {
      aiQuestions.value[index] = { ...questionData }
      ElMessage.success('题目更新成功')
      questionDialogVisible.value = false
      return
    } else if (activeTab.value === 'manual' && index >= 0 && index < manualQuestions.value.length) {
      manualQuestions.value[index] = { ...questionData }
      ElMessage.success('题目更新成功')
      questionDialogVisible.value = false
      return
    }
  }

  // 新增题目
  if (activeTab.value === 'manual') {
    manualQuestions.value.push({ ...questionData })
  }

  ElMessage.success('题目保存成功')
  questionDialogVisible.value = false
}

const processQuestionsForSubmit = (list) => {
  return list.map((q, idx) => {
    let opts = q.questionOptions
    let ans = q.answer || q.correctAnswer
    
    if (typeof opts === 'object' && opts !== null) {
      opts = JSON.stringify(opts)
    }

    if (['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(q.questionType) && (!opts || opts === 'null')) {
       const isACorrect = ans === 'A' || ans === '对' || ans === '正确' || ans === 'true' || ans === 'True' || ans === '1'
       const isBCorrect = ans === 'B' || ans === '错' || ans === '错误' || ans === 'false' || ans === 'False' || ans === '0'
       
       opts = JSON.stringify([
          { text: 'A. 正确', isCorrect: isACorrect },
          { text: 'B. 错误', isCorrect: isBCorrect }
       ])
       
       if (isACorrect) ans = 'A'
       else if (isBCorrect) ans = 'B'
    }

    return {
      ...q,
      questionOptions: opts,
      answer: ans,
      questionOrder: idx + 1
    }
  })
}

const confirmCreateManual = async () => {
  if (!examForm.courseId) {
    ElMessage.warning('请选择课程')
    return
  }
  
  if (!examForm.examTitle) {
    ElMessage.warning('请输入考试标题')
    return
  }
  
  if (manualQuestions.value.length === 0) {
    ElMessage.warning('请至少添加一道题目')
    return
  }
  
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择考试时间')
    return
  }
  
  try {
    submitting.value = true
    
    const data = {
      courseId: examForm.courseId,
      teacherId: localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
      examTitle: examForm.examTitle,
      examDescription: examForm.examDescription || '',
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
      duration: examForm.duration || 60,
      totalScore: examForm.totalScore,
      passScore: examForm.passScore,
      questions: processQuestionsForSubmit(manualQuestions.value)
    }
    
    const response = await createExam(data)
    
    if (response.code === 200 || response.success) {
      const examId = response.data
      
      ElMessage.success('考试创建成功！')
      
      ElMessageBox.confirm(
        `考试创建成功！是否立即查看？`,
        '创建成功',
        {
          confirmButtonText: '查看考试',
          cancelButtonText: '返回列表',
          type: 'success'
        }
      ).then(() => {
        router.push(`/teacher/exam/${examId}`)
      }).catch(() => {
        router.push('/teacher/exams')
      })
    } else {
      ElMessage.error(response.message || '创建考试失败')
    }
  } catch (error) {
    console.error('创建考试失败:', error)
    ElMessage.error('创建考试失败')
  } finally {
    submitting.value = false
  }
}

const confirmCreateWithAi = async () => {
  if (aiQuestions.value.length === 0) {
    ElMessage.warning('没有可用的题目')
    return
  }
  
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择考试时间')
    return
  }
  
  try {
    submitting.value = true
    
    const totalScore = aiQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
    const passScore = Math.floor(totalScore * 0.6)
    
    const data = {
      courseId: examForm.courseId,
      teacherId: localStorage.getItem('teacherId') || localStorage.getItem('t_id'),
      examTitle: examForm.examTitle,
      examDescription: `AI 自动生成试卷 - ${aiForm.courseName}`,
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
      duration: examForm.duration || 60,
      totalScore: totalScore,
      passScore: passScore,
      questions: processQuestionsForSubmit(aiQuestions.value)
    }
    
    const response = await createExam(data)
    
    if (response.code === 200 || response.success) {
      const examId = response.data
      
      ElMessage.success('考试创建成功！')
      
      ElMessageBox.confirm(
        `考试创建成功！是否立即查看？`,
        '创建成功',
        {
          confirmButtonText: '查看考试',
          cancelButtonText: '返回列表',
          type: 'success'
        }
      ).then(() => {
        router.push(`/teacher/exam/${examId}`)
      }).catch(() => {
        router.push('/teacher/exams')
      })
    } else {
      ElMessage.error(response.message || '创建考试失败')
    }
  } catch (error) {
    console.error('创建考试失败:', error)
    ElMessage.error('创建考试失败')
  } finally {
    submitting.value = false
  }
}

const confirmUpdate = async () => {
  if (!examForm.examTitle) {
    ElMessage.warning('请输入考试标题')
    return
  }
  
  if (manualQuestions.value.length === 0) {
    ElMessage.warning('请至少添加一道题目')
    return
  }
  
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择考试时间')
    return
  }
  
  try {
    submitting.value = true
    const examId = route.params.id
    
    // 1. 更新考试基础信息
    const examInfo = {
      courseId: examForm.courseId,
      examTitle: examForm.examTitle,
      examDescription: examForm.examDescription || '',
      startTime: timeRange.value[0],
      endTime: timeRange.value[1],
      duration: examForm.duration,
      totalScore: examForm.totalScore,
      passScore: examForm.passScore
    }
    
    const updateRes = await updateExam(examId, examInfo)
    if (!updateRes.success && updateRes.code !== 200) {
      throw new Error(updateRes.message || '更新考试基础信息失败')
    }
    
    // 2. 更新试题
    const questionsData = processQuestionsForSubmit(manualQuestions.value)
    
    const questionsRes = await saveExamQuestions(examId, questionsData)
    if (!questionsRes.success && questionsRes.code !== 200) {
      throw new Error(questionsRes.message || '保存试题失败')
    }
    
    ElMessage.success('考试更新成功！')
    router.push(`/teacher/exam/${examId}`)
  } catch (error) {
    console.error('更新考试失败:', error)
    ElMessage.error(error.message || '更新考试失败')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}

const fetchExamData = async () => {
  if (!isEdit.value) return
  
  try {
    const examId = route.params.id
    const response = await getExamDetail(examId)
    if (response.success && response.data) {
      const { exam, questions: examQuestions } = response.data
      
      // 填充基础信息
      Object.assign(examForm, {
        examTitle: exam.examTitle,
        courseId: exam.courseId,
        examDescription: exam.examDescription,
        duration: exam.duration,
        totalScore: exam.totalScore,
        passScore: exam.passScore
      })
      
      // 填充时间
      if (exam.startTime && exam.endTime) {
        timeRange.value = [
          exam.startTime,
          exam.endTime
        ]
      }
      
      // 填充题目
      manualQuestions.value = examQuestions.map(q => ({
        questionType: q.questionType,
        questionContent: q.questionContent,
        questionOptions: q.questionOptions,
        answer: q.answer || q.correctAnswer,
        score: q.score,
        analysis: q.analysis,
        questionOrder: q.questionOrder
      }))
      
      calculateTotal()
    }
  } catch (error) {
    console.error('获取考试详情失败:', error)
    ElMessage.error('获取考试详情失败')
  }
}

onMounted(() => {
  loadCourses()
  if (isEdit.value) {
    fetchExamData()
  }
})
</script>

<style scoped>
@import '@/assets/css/teacher/exam-form.css';
</style>
