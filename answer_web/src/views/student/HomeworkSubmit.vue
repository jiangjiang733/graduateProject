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
          <div class="section-badge">作业附件下载</div>
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
import {
  Calendar,
  Star,
  Download,
  UploadFilled,
  InfoFilled,
  EditPen,
  CircleCheck
} from '@element-plus/icons-vue'
import { useHomeworkSubmit } from '@/assets/js/student/homework-submit'

const {
  loading,
  submitting,
  formRef,
  homework,
  fileList,
  submitForm,
  isOverdue,
  getQuestionTypeText,
  getQuestionTypeTag,
  rules,
  formatDate,
  handleFileChange,
  submitHomework,
  goBack,
  route
} = useHomeworkSubmit()
</script>

<style scoped>
@import '@/assets/css/student/homework-submit.css';
</style>
