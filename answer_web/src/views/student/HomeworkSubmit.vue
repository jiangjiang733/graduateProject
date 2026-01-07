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
        <h2>{{ homework.reportTitle }}</h2>
        <div class="info-items">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <span>截止时间: {{ formatDate(homework.deadline) }}</span>
            <el-tag v-if="isOverdue" type="danger" size="small">已逾期</el-tag>
          </div>
          <div class="info-item">
            <el-icon><Star /></el-icon>
            <span>总分: {{ homework.totalScore }}分</span>
          </div>
        </div>
        <div class="homework-description">
          <h3>作业要求</h3>
          <p>{{ homework.reportDescription || '暂无详细说明' }}</p>
        </div>

        <!-- 结构化题目作答区 -->
        <div v-if="homework.questionList?.length > 0" class="homework-questions-section">
          <div class="section-badge">在线作答题目</div>
          <div v-for="(q, index) in homework.questionList" :key="index" class="question-item">
            <div class="q-header">
              <span class="q-idx">{{ index + 1 }}.</span>
              <el-tag size="small" :type="getQuestionTypeTag(q.questionType)">{{ getQuestionTypeText(q.questionType) }}</el-tag>
              <span class="q-score">({{ q.score }}分)</span>
            </div>
            <div class="q-content">{{ q.questionContent }}</div>
            
            <!-- 单选题 -->
            <div v-if="q.questionType === 'SINGLE'" class="q-options">
              <el-radio-group v-model="submitForm.answers[index]">
                <el-radio v-for="(opt, oIdx) in q.options" :key="oIdx" :label="String.fromCharCode(65 + oIdx)" class="opt-radio">
                  <span class="opt-label">{{ String.fromCharCode(65 + oIdx) }}.</span>
                  <span class="opt-text">{{ opt.text || opt }}</span>
                </el-radio>
              </el-radio-group>
            </div>

            <!-- 多选题 -->
            <div v-else-if="q.questionType === 'MULTIPLE'" class="q-options">
              <el-checkbox-group v-model="submitForm.multiAnswers[index]">
                <el-checkbox v-for="(opt, oIdx) in q.options" :key="oIdx" :label="String.fromCharCode(65 + oIdx)" class="opt-checkbox">
                  <span class="opt-label">{{ String.fromCharCode(65 + oIdx) }}.</span>
                  <span class="opt-text">{{ opt.text || opt }}</span>
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 判断题 -->
            <div v-else-if="q.questionType === 'JUDGE'" class="q-options">
              <el-radio-group v-model="submitForm.answers[index]">
                <el-radio label="A">A. 正确</el-radio>
                <el-radio label="B">B. 错误</el-radio>
              </el-radio-group>
            </div>

            <!-- 简答题 -->
            <div v-else-if="q.questionType === 'ESSAY'" class="q-options">
              <el-input
                v-model="submitForm.answers[index]"
                type="textarea"
                :rows="3"
                placeholder="请输入您的回答..."
              />
            </div>
          </div>
        </div>

        <div v-if="homework.attachmentUrl" class="homework-attachment">
          <h3>作业附件</h3>
          <el-link :href="`/api/${homework.attachmentUrl}`" target="_blank" type="primary">
            <el-icon><Download /></el-icon>
            下载附件
          </el-link>
        </div>
      </div>

      <el-divider />

      <!-- 提交表单 -->
      <el-form ref="formRef" :model="submitForm" :rules="rules" label-width="100px">
        <el-form-item label="作业内容" prop="content">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入作业内容"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="附件上传">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="1"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">支持上传1个文件,文件大小不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHomework">
          提交作业
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
  Upload
} from '@element-plus/icons-vue'
import { getLabReportDetail } from '@/api/homework'
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
    { required: true, message: '请输入作业内容', trigger: 'blur' },
    { min: 10, message: '作业内容至少10个字符', trigger: 'blur' }
  ]
}

// 从localStorage获取学生信息
const studentInfo = JSON.parse(localStorage.getItem('student') || '{}')

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
            // 初始化多选题答案
            data.questionList.forEach((q, idx) => {
                if (q.questionType === 'MULTIPLE') {
                    submitForm.multiAnswers[idx] = []
                }
                
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
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await ElMessageBox.confirm('确认提交作业吗?提交后将无法修改', '提示', {
        confirmButtonText: '确认提交',
        cancelButtonText: '取消',
        type: 'warning'
      })

      submitting.value = true

      // 合并结构化答案到内容中，或者单独存储
      // 为了兼容现有逻辑，我们将结构化答案转为 JSON 存入辅助字段或 content 开头
      const structuredAnswers = homework.value.questionList?.map((q, idx) => {
          let ans = submitForm.answers[idx]
          if (q.questionType === 'MULTIPLE') {
              ans = submitForm.multiAnswers[idx]?.sort().join('')
          }
          return {
              type: q.questionType,
              content: q.questionContent,
              answer: ans || ''
          }
      })

      const submissionData = {
        studentId: studentInfo.studentsId,
        studentName: studentInfo.studentsUsername,
        content: submitForm.content,
        structuredAnswers: JSON.stringify(structuredAnswers) // 这里我们假设后端可以接收这个新字段，或者我们可以把它追加到内容里
      }

      await submitLabReportAPI(route.params.id, submissionData, currentFile.value)

      ElMessage.success('作业提交成功')
      router.push({ name: 'student_homework' })
    } catch (error) {
      if (error !== 'cancel') {
        console.error('提交失败:', error)
        ElMessage.error(error.response?.data?.message || '提交失败')
      }
    } finally {
      submitting.value = false
    }
  })
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
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.homework-card {
  margin-top: 20px;
}

.homework-info-section {
  margin-bottom: 24px;
}

.homework-info-section h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #303133;
}

.info-items {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.homework-description,
.homework-attachment {
  margin-top: 16px;
}

.homework-description h3,
.homework-attachment h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.homework-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.homework-questions-section {
    margin-top: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.section-badge {
    display: inline-block;
    padding: 4px 12px;
    background: #10b981;
    color: white;
    font-size: 12px;
    font-weight: 700;
    border-radius: 20px;
    margin-bottom: 20px;
}

.question-item {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 16px;
    border: 1px solid #edf2f7;
}

.q-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.q-idx {
    font-weight: 800;
    color: #1e293b;
}

.q-score {
    font-size: 12px;
    color: #94a3b8;
}

.q-content {
    font-size: 15px;
    color: #334155;
    line-height: 1.6;
    margin-bottom: 16px;
    font-weight: 500;
}

.q-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.opt-radio, .opt-checkbox {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    white-space: normal;
}

.opt-label {
    margin-right: 8px;
    font-weight: 600;
}

:deep(.el-radio), :deep(.el-checkbox) {
    height: auto;
    padding: 8px 0;
}
</style>
