<template>
  <div class="homework-grade modern-page">
    <div class="modern-bg">
      <div class="bg-blob-1"></div>
      <div class="bg-blob-2"></div>
      <div class="bg-blob-3"></div>
    </div>
    <div class="page-header glass-panel animate-slide-up">
      <div class="header-left">
        <el-button link @click="router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h1 class="page-title">作业批改：{{ homework.reportTitle || '加载中...' }}</h1>
      </div>
      <div class="header-right">
        <div class="stats-mini">
          <span class="stat-item">已提交: <strong>{{ submissions.length }}</strong></span>
          <span class="stat-item">已批改: <strong>{{ gradedCount }}</strong></span>
        </div>
      </div>
    </div>

    <div class="grade-container">
      <!-- 左侧学生列表 -->
      <div class="student-list-section glass-panel animate-slide-up" style="animation-delay: 0.1s">
        <div class="list-header">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索姓名或学号..."
            prefix-icon="Search"
            clearable
            class="ketangpai-search"
          />
        </div>
        
        <div class="list-content">
          <div 
            v-for="sub in filteredSubmissions" 
            :key="sub.studentReportId" 
            class="student-item"
            :class="{ active: currentSubmission?.studentReportId === sub.studentReportId, graded: sub.status === 2 }"
            @click="selectSubmission(sub)"
          >
            <div class="student-avatar">
              {{ sub.studentName?.charAt(0) || 'S' }}
            </div>
            <div class="student-info">
              <div class="name-row">
                <span class="name">{{ sub.studentName }}</span>
                <el-tag v-if="sub.status === 2" type="success" size="small" effect="plain">已批改</el-tag>
                <el-tag v-else type="warning" size="small" effect="plain">待批改</el-tag>
              </div>
              <div class="time-info">{{ formatDate(sub.submitTime) }}</div>
            </div>
            <div v-if="sub.status === 2" class="score-badge">{{ sub.score }}</div>
          </div>
          
          <el-empty v-if="filteredSubmissions.length === 0" description="没有找到匹配的提交" :image-size="80" />
        </div>
      </div>

      <!-- 右侧批改详情 -->
      <div class="grade-detail-section glass-panel animate-slide-up" style="animation-delay: 0.2s">
        <div v-if="currentSubmission" class="detail-content">
          <div class="detail-header">
            <h3>{{ currentSubmission.studentName }} 的提交内容</h3>
            <div class="submission-meta">
              <span>提交时间: {{ formatDate(currentSubmission.submitTime) }}</span>
            </div>
          </div>

          <el-tabs v-model="activeTab" class="grade-tabs">
            <el-tab-pane label="文本回复" name="content">
              <div class="text-content">
                {{ currentSubmission.content || '未填写文字回复' }}
              </div>
            </el-tab-pane>
            <el-tab-pane label="在线题目" name="questions" v-if="questionList.length > 0">
               <div class="structured-ans-list">
                  <div v-for="(q, index) in questionList" :key="index" class="q-ans-item">
                     <div class="q-title">
                        <span class="q-num">{{ index + 1 }}.</span>
                        <span class="q-text">{{ q.questionContent }}</span>
                        <el-tag size="small" style="margin-left: 10px">{{ getQuestionTypeText(q.questionType) }}</el-tag>
                     </div>
                     <div class="ans-comparison">
                        <div class="ans-unit student">
                           <span class="label">学生作答:</span>
                           <span class="val" :class="{correct: isCorrect(index, q), wrong: !isCorrect(index, q)}">
                             {{ getStudentAnswer(index, q) || '未作答' }}
                           </span>
                        </div>
                        <div class="ans-unit standard">
                           <span class="label">标准答案:</span>
                           <span class="val">{{ getCorrectAnswer(q) }}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </el-tab-pane>
            <el-tab-pane label="附件预览" name="attachment">
              <div v-if="currentSubmission.attachmentUrl" class="attachment-viewer">
                <div class="file-info">
                  <el-icon size="40"><Document /></el-icon>
                  <div class="file-text">
                    <span class="name">提交的附件文件</span>
                    <span class="tip">由于浏览器限制，某些格式可能无法直接预览，请点击下载查看。</span>
                  </div>
                </div>
                <div class="viewer-actions">
                  <el-link :href="`/api/${currentSubmission.attachmentUrl}`" target="_blank" type="primary" class="preview-link">
                    <el-icon><View /></el-icon> 在新窗口打开预览
                  </el-link>
                  <el-button type="primary" @click="downloadFile(currentSubmission.attachmentUrl)">
                    <el-icon><Download /></el-icon> 下载文件
                  </el-button>
                </div>
              </div>
              <el-empty v-else description="该学生未上传附件" />
            </el-tab-pane>
          </el-tabs>

          <!-- 教师评分区 -->
          <div class="grading-form-section">
            <h3 class="section-title">批改与评分</h3>
            <el-form label-position="top">
              <div class="grading-row">
                <el-form-item label="分值">
                  <el-input-number 
                    v-model="gradeForm.score" 
                    :min="0" 
                    :max="homework.totalScore || 100" 
                    size="large"
                  />
                  <span class="total-score"> / {{ homework.totalScore || 100 }}</span>
                </el-form-item>
                <div class="suggest-score" v-if="questionList.length > 0">
                  <el-button link type="primary" @click="applyAutoScore">应用客观题自动评分</el-button>
                </div>
              </div>

              <el-form-item label="批改评语">
                <el-input
                  v-model="gradeForm.teacherComment"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入您的评语，鼓励学生或指出不足..."
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>

              <div class="submit-actions">
                <el-button type="primary" size="large" :loading="submitting" @click="submitGrade">
                  <el-icon><CircleCheck /></el-icon> 确认批改
                </el-button>
              </div>
            </el-form>
          </div>
        </div>
        <div v-else class="empty-detail">
          <el-empty description="请从左侧选择一名学生开始批改" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Search, Document, View, Download, CircleCheck 
} from '@element-plus/icons-vue'
import { getLabReportDetail, getSubmissions, gradeLabReport } from '@/api/homework.js'
import '@/assets/css/teacher/modern-theme.css'
import '@/assets/css/teacher/homework-grade.css'

const route = useRoute()
const router = useRouter()

const homework = ref({})
const submissions = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentSubmission = ref(null)
const activeTab = ref('content')
const submitting = ref(false)

const gradeForm = reactive({
  score: 0,
  teacherComment: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const hwRes = await getLabReportDetail(id)
    if (hwRes.success) homework.value = hwRes.data

    const subRes = await getSubmissions(id)
    if (subRes.success) {
      submissions.value = subRes.data || []
      // 如果没有选择当前项且有列表，默认选第一个
      if (!currentSubmission.value && submissions.value.length > 0) {
        selectSubmission(submissions.value[0])
      }
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const filteredSubmissions = computed(() => {
  if (!searchKeyword.value) return submissions.value
  const kw = searchKeyword.value.toLowerCase()
  return submissions.value.filter(s => 
    s.studentName.toLowerCase().includes(kw) || 
    (s.studentId && s.studentId.toLowerCase().includes(kw))
  )
})

const gradedCount = computed(() => {
  return submissions.value.filter(s => s.status === 2).length
})

const selectSubmission = (sub) => {
  currentSubmission.value = sub
  gradeForm.score = sub.score || 0
  gradeForm.teacherComment = sub.teacherComment || ''
  
  // 根据作业内容自动调整界面
  if (questionList.value.length > 0) {
      activeTab.value = 'questions'
      // 如果未评分，自动预览得分
      if (sub.status !== 2 && (!sub.score || sub.score === 0)) {
          applyAutoScore(false) 
      }
  } else if (sub.attachmentUrl) {
      activeTab.value = 'attachment'
  } else {
      activeTab.value = 'content'
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const downloadFile = (url) => {
  const link = document.createElement('a')
  link.href = `/api/${url}`
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const submitGrade = async () => {
    if (!currentSubmission.value) return
    
    submitting.value = true
    try {
        const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
        const response = await gradeLabReport(currentSubmission.value.studentReportId, {
            score: gradeForm.score,
            teacherComment: gradeForm.teacherComment,
            teacherId: teacherId
        })
        
        if (response.success) {
            ElMessage.success('批改成功')
            // 更新本地列表状态
            currentSubmission.value.status = 2
            currentSubmission.value.score = gradeForm.score
            currentSubmission.value.teacherComment = gradeForm.teacherComment
            
            // 尝试自动跳到下一个待批改的
            const pendingIndex = submissions.value.findIndex(s => s.status !== 2)
            if (pendingIndex !== -1) {
               selectSubmission(submissions.value[pendingIndex])
            }
        }
    } catch (e) {
        ElMessage.error('批改保存失败')
    } finally {
        submitting.value = false
    }
}

// 题目相关逻辑
const questionList = computed(() => {
    const qList = homework.value.questionList || homework.value.questions
    if (!qList) return []
    try {
        return typeof qList === 'string' ? JSON.parse(qList) : qList
    } catch (e) { return [] }
})

const getStudentAnswer = (idx, q) => {
   if (!currentSubmission.value?.structuredAnswers) return ''
   try {
       const ansList = JSON.parse(currentSubmission.value.structuredAnswers)
       return ansList[idx]?.answer || ''
   } catch (e) { return '' }
}

const getCorrectAnswer = (q) => {
   return q.correctAnswer || q.answer || ''
}

const isCorrect = (idx, q) => {
   const sAns = getStudentAnswer(idx, q)
   const cAns = getCorrectAnswer(q)
   if (!sAns || !cAns) return false
   return String(sAns).trim() === String(cAns).trim()
}

const getQuestionTypeText = (type) => {
    const types = { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题' }
    return types[type] || type
}

const applyAutoScore = (showMessage = true) => {
   let total = 0
   questionList.value.forEach((q, idx) => {
      if (['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.questionType)) {
         if (isCorrect(idx, q)) {
            total += (q.score || 0)
         }
      }
   })
   gradeForm.score = total
   if (showMessage) {
      ElMessage.success(`客观题自动评分为: ${total} 分`)
   }
}

onMounted(loadData)
</script>

<style scoped>
.homework-grade {
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 16px 24px;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.page-title { font-size: 20px; font-weight: 800; color: #1f2937; margin: 0; }

.stats-mini {
  display: flex;
  gap: 20px;
  background: rgba(255, 255, 255, 0.5);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.stat-item strong { color: #3b82f6; }

.grade-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  height: calc(100vh - 120px);
}

.student-list-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.student-item:hover {
  background: #f1f5f9;
}

.student-item.active {
  background: #eff6ff;
  border: 1px solid #3b82f6;
}

.student-avatar {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-right: 12px;
}

.student-info { flex: 1; min-width: 0; }
.name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.name { font-weight: 600; font-size: 14px; color: #1e293b; }
.time-info { font-size: 12px; color: #64748b; }

.score-badge {
  background: #10b981;
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

/* Detail Section */
.grade-detail-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 32px;
}

.detail-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header { margin-bottom: 24px; }
.detail-header h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; }
.submission-meta { font-size: 13px; color: #64748b; }

.grade-tabs { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
:deep(.el-tabs__content) { flex: 1; overflow-y: auto; padding-top: 16px; }

.text-content {
  background: #f8fafc;
  padding: 24px;
  border-radius: 12px;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
}

.attachment-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
}

.file-info { display: flex; align-items: center; gap: 16px; }
.file-text { display: flex; flex-direction: column; }
.file-text .name { font-weight: 700; font-size: 18px; color: #1e293b; }
.file-text .tip { font-size: 12px; color: #64748b; }

.viewer-actions { display: flex; gap: 16px; align-items: center; }

/* Grading Form */
.grading-form-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #1e293b; }

.grading-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.total-score { font-size: 18px; color: #94a3b8; font-weight: 600; }

.submit-actions { display: flex; justify-content: flex-end; margin-top: 12px; }

/* Structured Ans */
.q-ans-item {
    margin-bottom: 24px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    border: 1px solid #edf2f7;
}
.q-title { font-weight: 700; margin-bottom: 12px; font-size: 15px; }
.ans-comparison { display: flex; gap: 32px; font-size: 14px; }
.ans-unit { display: flex; gap: 8px; }
.ans-unit .label { color: #64748b; }
.ans-unit .val { font-weight: 700; }
.ans-unit .val.correct { color: #10b981; }
.ans-unit .val.wrong { color: #ef4444; }
.ans-unit.standard .val { color: #3b82f6; }
</style>
