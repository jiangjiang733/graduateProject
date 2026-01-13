<template>
  <div class="homework-grade modern-page">
    <div class="modern-bg">
      <div class="bg-blob-1"></div>
      <div class="bg-blob-2"></div>
      <div class="bg-blob-3"></div>
    </div>
    <div class="page-header glass-panel animate-slide-up">
      <div class="header-left">
        <el-button link @click="$router.back()">
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

    <div v-loading="loading" class="grade-container">
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
import { 
  ArrowLeft, Search, Document, View, Download, CircleCheck 
} from '@element-plus/icons-vue'
import { useHomeworkGrade } from '@/assets/js/teacher/homework-grade'

const {
  homework,
  submissions,
  loading,
  searchKeyword,
  currentSubmission,
  activeTab,
  submitting,
  gradeForm,
  questionList,
  filteredSubmissions,
  gradedCount,
  selectSubmission,
  formatDate,
  downloadFile,
  submitGrade,
  getStudentAnswer,
  getCorrectAnswer,
  isCorrect,
  applyAutoScore,
  getQuestionTypeText
} = useHomeworkGrade()
</script>

<style scoped>
@import '@/assets/css/teacher/homework-grade.css';
</style>
