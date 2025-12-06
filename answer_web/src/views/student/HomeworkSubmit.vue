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
            <span>总分: {{ homework.totalScore }}</span>
          </div>
        </div>
        <div class="homework-description">
          <h3>作业要求</h3>
          <p>{{ homework.reportDescription }}</p>
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
  content: ''
})

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
    homework.value = response.data || {}
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

      const submissionData = {
        studentId: studentInfo.studentsId,
        studentName: studentInfo.studentsUsername,
        content: submitForm.content
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
</style>
