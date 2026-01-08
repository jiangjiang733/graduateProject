<template>
  <div class="homework-submit">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">提交作业</span>
      </template>
    </el-page-header>

    <el-card v-loading="loading" class="homework-card" shadow="never">
      <!-- 作业信息 -->
      <div class="homework-info-section">
        <div class="title-row">
          <h2 class="report-title">{{ homework.reportTitle }}</h2>
          <el-tag :type="homework.questionList?.length > 0 ? 'primary' : 'success'" effect="dark">
            {{ homework.questionList?.length > 0 ? '在线测评模式' : '常规作业模式' }}
          </el-tag>
        </div>
        
        <div class="info-items">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <span>截止时间: {{ formatDate(homework.deadline) }}</span>
            <el-tag v-if="isOverdue" type="danger" size="small" style="margin-left: 8px">已逾期</el-tag>
          </div>
          <div class="info-item">
            <el-icon><Star /></el-icon>
            <span>总分: {{ homework.totalScore }}分</span>
          </div>
        </div>

        <div class="homework-description-compact">
          <div class="desc-header">
            <el-icon><InfoFilled /></el-icon>
            <span>作业要求与说明</span>
          </div>
          <div class="desc-body">
            {{ homework.reportDescription || '暂无详细要求' }}
          </div>
        </div>

        <!-- 结构化题目作答区：核心区 -->
        <div v-if="homework.questionList?.length > 0" class="homework-questions-section animate-fade-in">
          <div class="section-badge">
             <el-icon><EditPen /></el-icon>
             在线作答
          </div>
          <div v-for="(q, index) in homework.questionList" :key="index" class="question-item">
            <div class="q-header">
              <span class="q-idx">{{ index + 1 }}.</span>
              <el-tag size="small" :type="getQuestionTypeTag(q.questionType)">{{ getQuestionTypeText(q.questionType) }}</el-tag>
              <span class="q-score">({{ q.score }}分)</span>
            </div>
            <div class="q-content">{{ q.questionContent }}</div>
            
            <div v-if="q.questionType === 'SINGLE'" class="q-options">
              <el-radio-group v-model="submitForm.answers[index]">
                <el-radio v-for="(opt, oIdx) in q.options" :key="oIdx" :label="String.fromCharCode(65 + oIdx)" class="opt-radio">
                  <span class="opt-label">{{ String.fromCharCode(65 + oIdx) }}.</span>
                  <span class="opt-text">{{ opt.text || opt }}</span>
                </el-radio>
              </el-radio-group>
            </div>
            <div v-else-if="q.questionType === 'MULTIPLE'" class="q-options">
              <el-checkbox-group v-model="submitForm.multiAnswers[index]">
                <el-checkbox v-for="(opt, oIdx) in q.options" :key="oIdx" :label="String.fromCharCode(65 + oIdx)" class="opt-checkbox">
                  <span class="opt-label">{{ String.fromCharCode(65 + oIdx) }}.</span>
                  <span class="opt-text">{{ opt.text || opt }}</span>
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div v-else-if="q.questionType === 'JUDGE'" class="q-options">
              <el-radio-group v-model="submitForm.answers[index]">
                <el-radio label="A">A. 正确</el-radio>
                <el-radio label="B">B. 错误</el-radio>
              </el-radio-group>
            </div>
            <div v-else-if="q.questionType === 'ESSAY'" class="q-options">
              <el-input v-model="submitForm.answers[index]" type="textarea" :rows="3" placeholder="请输入您的回答..." />
            </div>
          </div>
        </div>

        <div v-if="homework.attachmentUrl && !(homework.questionList?.length > 0)" class="homework-attachment">
          <div class="section-title">作业附件下载</div>
          <el-link :href="`/api/${homework.attachmentUrl}`" target="_blank" type="primary" class="attachment-link">
            <el-icon><Download /></el-icon>
            {{ homework.attachmentUrl.split('/').pop() || '点击下载附件' }}
          </el-link>
        </div>
      </div>

      <el-divider v-if="!(homework.questionList?.length > 0)" />

      <!-- 提交表单：仅在没有在线题目时显示内容和附件（学习通逻辑） -->
      <el-form v-if="!(homework.questionList?.length > 0)" ref="formRef" :model="submitForm" :rules="rules" label-position="top">
        <el-form-item label="作业正文" prop="content">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入作业完成情况或直接在此填写作业内容"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传作业文档" class="upload-form-item">
          <el-upload
            ref="uploadRef"
            class="modern-uploader"
            drag
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button size="large" @click="goBack" class="btn-cancel">取消</el-button>
        <el-button type="primary" size="large" :loading="submitting" @click="submitHomework" class="btn-submit-main">
          <el-icon><CircleCheck /></el-icon>
          {{ route.query.studentReportId ? '确认更新' : '立即提交' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar,
  Star,
  Download,
  Upload,
  UploadFilled,
  InfoFilled,
  EditPen,
  CircleCheck
} from '@element-plus/icons-vue'
import { getLabReportDetail, getStudentSubmission } from '@/api/homework'
import { submitLabReport as submitLabReportAPI } from '@/api/homework'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)

const homework = ref({})
const fileList = ref([])
const currentFile = ref(null)

const submitForm = reactive({
  content: '',
  answers: {},
  multiAnswers: {}
})

const getQuestionTypeText = (type) => {
  const types = { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题' }
  return types[type] || type
}

const getQuestionTypeTag = (type) => {
  const tags = { SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info' }
  return tags[type] || ''
}

const rules = {
  content: [
    { required: false, trigger: 'blur' }
  ]
}

// 从localStorage获取学生信息
const studentId = localStorage.getItem('s_id') || localStorage.getItem('studentId')
const studentName = localStorage.getItem('studentName') || localStorage.getItem('username') || localStorage.getItem('s_name') || '学生'

// 是否逾期
const isOverdue = computed(() => {
  if (!homework.value.deadline) return false
  return new Date(homework.value.deadline) < new Date()
})

// 加载作业详情
const loadHomework = async () => {
  loading.value = true
  try {
    const reportId = route.params.id
    const response = await getLabReportDetail(reportId)
    const data = response.data || {}
    
    // 解析题目列表
    if (data.questionList) {
        try {
            data.questionList = typeof data.questionList === 'string' ? JSON.parse(data.questionList) : data.questionList
            // 强制初始化所有答案槽位，防止出现 null
            data.questionList.forEach((q, idx) => {
                submitForm.answers[idx] = ''
                if (q.questionType === 'MULTIPLE') {
                    submitForm.multiAnswers[idx] = []
                }
                // ... (解析选项逻辑保持)
                
                // 解析选项
                if (q.questionOptions) {
                    try {
                        q.options = typeof q.questionOptions === 'string' ? JSON.parse(q.questionOptions) : q.questionOptions
                    } catch (e) { q.options = [] }
                }
            })
        } catch (e) {
            console.error('解析题目失败:', e)
            data.questionList = []
        }
    }
    
    homework.value = data

    // 如果有已提交的记录，加载它
    const studentReportId = route.query.studentReportId
    if (studentReportId) {
        const subRes = await getStudentSubmission(studentReportId)
        if (subRes && subRes.data) {
            const subData = subRes.data
            submitForm.content = subData.content
            
            if (subData.structuredAnswers) {
                try {
                    const sAns = JSON.parse(subData.structuredAnswers)
                    sAns.forEach((item, idx) => {
                        if (item.type === 'MULTIPLE') {
                            submitForm.multiAnswers[idx] = item.answer ? item.answer.split('') : []
                        } else {
                            submitForm.answers[idx] = item.answer
                        }
                    })
                } catch (e) {
                    console.error('解析已提交答案失败:', e)
                }
            }
            
            if (subData.attachmentUrl) {
                fileList.value = [{ name: '已上传的附件 (修改将覆盖)', url: subData.attachmentUrl }]
            }
        }
    }
  } catch (error) {
    console.error('加载作业失败:', error)
    ElMessage.error('加载作业失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 文件选择
const handleFileChange = (file, fileList) => {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过10MB')
    fileList.pop()
    return
  }
  currentFile.value = file.raw
}

// 提交作业
const submitHomework = async () => {
  // 学习通逻辑：如果有在线题目，表单被隐藏了，不需要校验 formRef
  const hasQuestions = homework.value.questionList?.length > 0
  
  if (!hasQuestions && formRef.value) {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
  }

  try {
    await ElMessageBox.confirm('确认提交作业吗?', '提示', {
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
      type: 'warning'
    })

    submitting.value = true

    // 合并结构化答案
    const structuredAnswers = homework.value.questionList?.map((q, idx) => {
        let ans = submitForm.answers[idx]
        if (q.questionType === 'MULTIPLE') {
            ans = (submitForm.multiAnswers[idx] || []).sort().join('')
        }
        return {
            type: q.questionType,
            content: q.questionContent,
            answer: ans || ''
        }
    }) || []

    const submissionData = {
      studentId: studentId,
      studentName: studentName,
      content: submitForm.content || '',
      structuredAnswers: JSON.stringify(structuredAnswers)
    }

      const response = await submitLabReportAPI(route.params.id, submissionData, currentFile.value)
      const studentReportId = response.data?.studentReportId || response.studentReportId || route.query.studentReportId

      ElMessage.success('作业提交成功')
      
      if (hasQuestions && studentReportId) {
        // 如果是测评模式，提交后立即跳转到详情页查看答案
        router.push({ name: 'student_homework_detail', params: { id: studentReportId } })
      } else {
        router.push({ name: 'student_homework' })
      }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
      ElMessage.error(error.response?.data?.message || '提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadHomework()
})
</script>

<style scoped>
.homework-submit {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-title {
  font-weight: 800;
  font-size: 20px;
  color: #1e293b;
}

.homework-card {
  margin-top: 24px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.report-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.info-items {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  background: white;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.homework-description-compact {
  background: #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
}

.desc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
  font-size: 14px;
}

.desc-body {
  font-size: 15px;
  line-height: 1.6;
  color: #1e293b;
  white-space: pre-wrap;
}

.homework-questions-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  color: #3b82f6;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 24px;
}

.question-item {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px dashed #f1f5f9;
}

.question-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.q-header {
    font-size: 15px;
    color: #334155;
    line-height: 1.6;
    margin-bottom: 16px;
    font-weight: 500;
}
.q-idx { font-weight: 800; font-size: 18px; color: #1e293b; }
.q-score { color: #94a3b8; font-size: 13px; }
.q-content { font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 20px; font-weight: 500; }

.q-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 12px;
}

.opt-radio, .opt-checkbox {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  white-space: normal;
}

.opt-label { font-weight: 700; margin-right: 8px; }

.homework-attachment {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.attachment-link { font-weight: 600; }

.upload-form-item { margin-top: 24px; }

.modern-uploader :deep(.el-upload-dragger) {
  border-radius: 16px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  transition: all 0.3s;
}

.modern-uploader :deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel { border-radius: 12px; width: 120px; }
.btn-submit-main { border-radius: 12px; padding: 0 32px; font-weight: 700; height: 48px; }

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.el-radio), :deep(.el-checkbox) {
    height: auto;
    padding: 8px 0;
}
</style>
