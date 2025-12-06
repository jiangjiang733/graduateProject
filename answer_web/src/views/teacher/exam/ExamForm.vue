<template>
  <div class="exam-form-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2 class="page-title">{{ isEdit ? '编辑考试' : '创建考试' }}</h2>
    </div>

    <el-card class="form-card" shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 手动创建考试 -->
        <el-tab-pane label="手动创建考试" name="manual" v-if="!isEdit">
          <el-alert
            title="手动创建考试说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px;"
          >
            <p>1. 填写考试基本信息（课程、标题、时间等）</p>
            <p>2. 手动添加题目，支持单选、多选、判断、填空、简答题</p>
            <p>3. 确认题目无误后点击"创建考试"</p>
          </el-alert>

          <el-form :model="examForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="所属课程" required>
              <el-select 
                v-model="examForm.courseId" 
                placeholder="请选择课程" 
                style="width: 100%"
              >
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.courseName"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="考试标题" required>
              <el-input v-model="examForm.examTitle" placeholder="请输入考试标题" />
            </el-form-item>

            <el-form-item label="考试说明">
              <el-input 
                v-model="examForm.examDescription" 
                type="textarea"
                :rows="3"
                placeholder="请输入考试说明（可选）" 
              />
            </el-form-item>

            <el-form-item label="考试时间" required>
              <el-date-picker
                v-model="timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="考试时长">
              <el-input-number v-model="examForm.duration" :min="10" :max="300" />
              <span style="margin-left: 10px; color: #909399;">分钟</span>
            </el-form-item>

            <el-form-item label="总分">
              <el-input-number v-model="examForm.totalScore" :min="0" :max="1000" disabled />
              <span style="margin-left: 10px; color: #909399;">自动计算</span>
            </el-form-item>

            <el-form-item label="及格分">
              <el-input-number v-model="examForm.passScore" :min="0" :max="examForm.totalScore" />
            </el-form-item>
          </el-form>

          <el-divider />

          <!-- 题目列表 -->
          <div class="manual-questions">
            <div class="questions-header">
              <h3>
                <el-icon><DocumentChecked /></el-icon>
                题目列表（共 {{ manualQuestions.length }} 题，总分 {{ totalManualScore }} 分）
              </h3>
              <el-button type="primary" :icon="Plus" @click="addManualQuestion">
                添加题目
              </el-button>
            </div>

            <el-empty 
              v-if="manualQuestions.length === 0" 
              description="暂无题目，请点击上方按钮添加"
              :image-size="120"
            />

            <div v-else class="questions-list">
              <el-card 
                v-for="(q, index) in manualQuestions" 
                :key="index" 
                class="question-card"
                shadow="hover"
              >
                <div class="question-header">
                  <span class="question-number">第 {{ index + 1 }} 题</span>
                  <el-tag :type="getQuestionTypeTag(q.questionType)">
                    {{ getQuestionTypeText(q.questionType) }}
                  </el-tag>
                  <el-tag type="info">{{ q.score }} 分</el-tag>
                  <div class="question-actions">
                    <el-button size="small" @click="editManualQuestion(index)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteManualQuestion(index)">删除</el-button>
                  </div>
                </div>
                <p class="question-content">
                  <strong>{{ q.questionContent }}</strong>
                </p>
                <div v-if="q.questionOptions" class="question-options">
                  <div v-for="(option, optIdx) in parseOptions(q.questionOptions)" :key="optIdx" class="option-item">
                    {{ option }}
                  </div>
                </div>
                <div class="question-answer">
                  <span class="answer-label">正确答案：</span>
                  <el-tag type="success">{{ q.correctAnswer }}</el-tag>
                </div>
              </el-card>
            </div>
          </div>

          <el-divider />

          <div style="text-align: center; margin-top: 30px;">
            <el-button @click="goBack">取消</el-button>
            <el-button 
              type="primary" 
              size="large"
              @click="confirmCreateManual" 
              :loading="submitting"
              :disabled="!canCreateManual"
            >
              <el-icon><Check /></el-icon>
              创建考试
            </el-button>
          </div>
        </el-tab-pane>

        <!-- AI 智能出题 -->
        <el-tab-pane label="AI 智能出题" name="ai" v-if="!isEdit">
          <el-alert
            title="AI智能出题说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px;"
          >
            <p>1. 选择课程和填写考试标题</p>
            <p>2. AI将根据所选课程自动生成相关题目</p>
            <p>3. 生成后可预览、编辑题目，确认无误后点击"确认创建考试"</p>
          </el-alert>

          <el-form :model="aiForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="所属课程" required>
              <el-select 
                v-model="examForm.courseId" 
                placeholder="请选择课程" 
                style="width: 100%"
                @change="handleCourseChange"
              >
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.courseName"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="考试标题" required>
              <el-input v-model="examForm.examTitle" placeholder="请输入考试标题" />
            </el-form-item>

            <el-form-item label="课程名称" required>
              <el-input 
                v-model="aiForm.courseName" 
                placeholder="自动填充或手动输入" 
                :disabled="!!examForm.courseId"
              />
              <span style="color: #909399; font-size: 12px;">
                选择课程后自动填充，AI将根据此名称生成相关题目
              </span>
            </el-form-item>

            <el-form-item label="题目数量">
              <el-input-number v-model="aiForm.questionCount" :min="1" :max="20" />
              <span style="margin-left: 10px; color: #909399;">建议5-10题</span>
            </el-form-item>

            <el-form-item label="题型">
              <el-checkbox-group v-model="aiForm.questionTypes">
                <el-checkbox label="SINGLE">单选题</el-checkbox>
                <el-checkbox label="MULTIPLE">多选题</el-checkbox>
                <el-checkbox label="JUDGE">判断题</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="考试时间" required>
              <el-date-picker
                v-model="timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                @click="generateWithAi" 
                :loading="aiLoading"
                :disabled="!canGenerateAi"
              >
                <el-icon><MagicStick /></el-icon>
                AI智能生成题目
              </el-button>
              <el-button @click="goBack">取消</el-button>
            </el-form-item>
          </el-form>

          <!-- AI 生成的题目预览 -->
          <div v-if="aiQuestions.length > 0" class="ai-preview">
            <el-divider />
            <div class="preview-header">
              <h3>
                <el-icon><DocumentChecked /></el-icon>
                AI 生成题目预览（共 {{ aiQuestions.length }} 题，总分 {{ totalAiScore }} 分）
              </h3>
              <div class="preview-actions">
                <el-button @click="aiQuestions = []" :icon="Delete">
                  清空重新生成
                </el-button>
                <el-button type="success" size="large" @click="confirmCreateWithAi" :loading="submitting">
                  <el-icon><Check /></el-icon>
                  确认创建考试
                </el-button>
              </div>
            </div>
            
            <div class="ai-questions-list">
              <el-card 
                v-for="(q, index) in aiQuestions" 
                :key="index" 
                class="ai-question-card"
                shadow="hover"
              >
                <div class="question-header">
                  <span class="question-number">第 {{ index + 1 }} 题</span>
                  <el-tag :type="getQuestionTypeTag(q.questionType)">
                    {{ getQuestionTypeText(q.questionType) }}
                  </el-tag>
                  <el-tag type="info">{{ q.score }} 分</el-tag>
                  <div class="question-actions">
                    <el-button size="small" @click="editAiQuestion(index)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteAiQuestion(index)">删除</el-button>
                  </div>
                </div>
                <p class="question-content">
                  <strong>{{ q.questionContent }}</strong>
                </p>
                <div v-if="q.questionOptions" class="question-options">
                  <div v-for="(option, optIdx) in parseOptions(q.questionOptions)" :key="optIdx" class="option-item">
                    {{ option }}
                  </div>
                </div>
                <div class="question-answer">
                  <span class="answer-label">正确答案：</span>
                  <el-tag type="success">{{ q.correctAnswer }}</el-tag>
                </div>
              </el-card>
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
            <el-option label="对" value="对" />
            <el-option label="错" value="错" />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Plus, Delete, MagicStick, DocumentChecked, Check, QuestionFilled 
} from '@element-plus/icons-vue'
import { getCourseList } from '@/api/course.js'
import { createExam, generateQuestionsWithAi } from '@/api/exam.js'

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
  const total = manualQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
  examForm.totalScore = total
  if (examForm.passScore === 0 || examForm.passScore > total) {
    examForm.passScore = Math.floor(total * 0.6)
  }
  return total
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
  Object.assign(questionForm, {
    questionId: index,
    questionType: typeMapping[question.questionType] || 'SINGLE_CHOICE',
    questionContent: question.questionContent,
    options: parseOptions(question.questionOptions),
    correctAnswer: question.correctAnswer,
    correctAnswerArray: question.questionType === 'MULTIPLE' ? question.correctAnswer.split('') : [],
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
    ElMessage.success('删除成功')
  }).catch(() => {})
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
  Object.assign(questionForm, {
    questionId: index,
    questionType: typeMapping[question.questionType] || 'SINGLE_CHOICE',
    questionContent: question.questionContent,
    options: parseOptions(question.questionOptions),
    correctAnswer: question.correctAnswer,
    correctAnswerArray: question.questionType === 'MULTIPLE' ? question.correctAnswer.split('') : [],
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

  const questionData = {
    questionType: typeMap[questionForm.questionType] || questionForm.questionType,
    questionContent: questionForm.questionContent,
    questionOptions: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionForm.questionType)
      ? JSON.stringify(questionForm.options.filter(o => o))
      : null,
    correctAnswer: questionForm.correctAnswer,
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
      questions: manualQuestions.value
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
      questions: aiQuestions.value
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

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
@import '@/assets/css/teacher/exam-form.css';
</style>
