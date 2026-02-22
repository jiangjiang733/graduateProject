<template>
  <div class="exam-detail-container">
    <!-- 页面头部 -->
    <div class="page-header sticky-header">
      <div class="header-left">
        <el-button class="back-btn" @click="router.push('/teacher/exams')" icon="ArrowLeft" text></el-button>
        <h2>{{ exam.examTitle }}</h2>
      </div>
      
      <div class="segmented-control">
        <div class="segment active">试卷综合预览</div>
        <div class="segment" @click="manageQuestions">编辑试题内容</div>
        <div class="segment" @click="viewScores">作答数据分析</div>
      </div>

      <div class="header-actions">
        <el-button v-if="exam.status === 0 || String(exam.status).toUpperCase() === 'DRAFT'" type="primary" @click="publishExam" round>发布</el-button>
        <el-button v-if="exam.status === 1 || String(exam.status).toUpperCase() === 'PUBLISHED'" type="warning" @click="unpublishExam" round>取消发布</el-button>
        <el-button class="edit-btn" @click="editExam" icon="Edit" round>编辑试卷</el-button>
        <el-button type="danger" @click="deleteExam" round plain>删除</el-button>
      </div>
    </div>

    <!-- 待批改提醒 -->
    <el-alert
      v-if="hasPendingSubjective"
      title="📝 有学生提交了含简答题的试卷，需要手动批改"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px; border-radius: 12px;"
    >
      <template #default>
        <span>共 <b>{{ pendingCount }}</b> 份答卷等待批改。</span>
        <el-button type="warning" size="small" style="margin-left: 16px;" @click="viewScores">
          前往批改
        </el-button>
      </template>
    </el-alert>

    <!-- 考试信息卡片 -->
    <el-card class="exam-info-card" v-loading="loading">
      <template #header>
        <div class="info-card-header">
          <span class="card-title-text">考试信息</span>
          <el-tag :type="getStatusType(exam.status)" round effect="light" class="status-tag">
            {{ getStatusText(exam.status) }}
          </el-tag>
        </div>
      </template>
      
      <div class="modern-info-grid">
        <div class="info-item">
          <div class="info-label">所属课程</div>
          <div class="info-value">{{ exam.courseName || '未分配课程' }}</div>
        </div>
        <div class="info-item span-2">
          <div class="info-label">考试标题</div>
          <div class="info-value">{{ exam.examTitle || '-' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">考试时长</div>
          <div class="info-value">{{ exam.duration }} 分钟</div>
        </div>
        <div class="info-item span-2">
          <div class="info-label">分值设定</div>
          <div class="info-value">
            <span class="score-text">总分 <span class="highlight">{{ exam.totalScore }}</span> 分</span>
            <el-tag size="small" type="info" round class="pass-tag">及格 {{ Math.floor(exam.totalScore * 0.6) }} 分</el-tag>
          </div>
        </div>
        <div class="info-item span-2">
          <div class="info-label">有效时间</div>
          <div class="info-value time-value">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(exam.startTime) }} <span class="to-text">至</span> {{ formatDate(exam.endTime) }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">提交进度</div>
          <div class="info-value">
             <span class="highlight">{{ exam.submittedCount }}</span> / {{ exam.totalStudents }} 人
          </div>
        </div>
      </div>
    </el-card>

    <!-- 试题列表 -->
    <el-card class="questions-card">
      <template #header>
        <div class="card-header">
          <span>试题列表（共 {{ questions.length }} 题）</span>
          <el-button type="primary" size="small" @click="manageQuestions">管理试题</el-button>
        </div>
      </template>
      
      <div v-if="questions.length === 0" class="empty-state">
        <el-empty description="暂无试题">
          <el-button type="primary" @click="manageQuestions">添加试题</el-button>
        </el-empty>
      </div>
      
      <div v-else class="questions-list">
        <!-- 按题型分组显示 -->
        <div v-for="(group, typeKey) in groupedQuestions" :key="typeKey" class="question-type-group">
          <div class="type-group-header">
            <h3>{{ group.typeName }}（{{ group.questions.length }}题）</h3>
          </div>
          
          <div 
            v-for="(question, index) in group.questions" 
            :key="question.questionId"
            class="question-item"
          >
            <div class="question-header">
              <span class="question-number">{{ question.globalIndex }}. </span>
              <el-tag :type="getQuestionTypeColor(question.questionType)" size="small">
                {{ getQuestionTypeName(question.questionType) }}
              </el-tag>
              <span class="question-score">{{ question.score }} 分</span>
            </div>
            
            <div class="question-content">
              <p class="question-text">{{ formatQuestionContent(question) }}</p>
              
              <!-- 选项显示：普通题目或判断题 -->
              <div v-if="question.questionOptions || question.questionType === 'JUDGE'" class="question-options">
                <div 
                  v-for="(option, optIndex) in getQuestionOptions(question)" 
                  :key="optIndex"
                  class="option-item"
                >
                  <span class="opt-prefix">{{ String.fromCharCode(65 + optIndex) }}</span>
                  {{ typeof option === 'object' ? option.text : option }}
                </div>
              </div>
              
              <div class="question-answer" :class="{ 'is-multi': ['SINGLE', 'MULTIPLE'].includes(question.questionType) }">
                <strong>正确答案：</strong>
                <span class="correct-answer">{{ formatAnswer(question) }}</span>
              </div>
              
              <div v-if="question.analysis" class="question-analysis">
                <strong>解析：</strong>{{ question.analysis }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 编辑考试对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑考试"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="考试标题" prop="examTitle">
          <el-input v-model="editForm.examTitle" placeholder="请输入考试标题" maxlength="100" show-word-limit />
        </el-form-item>
        
        <el-form-item label="考试时间" prop="timeRange">
          <el-date-picker
            v-model="editForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="考试时长" prop="duration">
          <el-input-number v-model="editForm.duration" :min="10" :max="300" />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>
        
        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="editForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        
        <el-form-item label="及格分">
          <el-input-number :model-value="calculatedPassScore" disabled />
          <span style="margin-left: 8px; color: #909399;">（自动计算为总分的60%）</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveExamEdit" :loading="submitting">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar } from '@element-plus/icons-vue'
import { useExamDetail } from '@/assets/js/teacher/exam-detail.js'
import { getStudentExams } from '@/api/exam.js'

const router = useRouter()
const route = useRoute()

const {
  loading,
  exam,
  questions,
  groupedQuestions,
  unpublishExam,
  goBack,
  editExam,
  publishExam,
  deleteExam,
  parseOptions,
  getQuestionOptions,
  formatQuestionContent,
  formatAnswer,
  formatDate,
  getStatusType,
  getStatusText,
  getQuestionTypeName,
  getQuestionTypeColor,
  // 编辑考试弹窗相关
  editDialogVisible,
  editForm,
  editFormRef,
  editRules,
  calculatedPassScore,
  saveExamEdit,
  submitting
} = useExamDetail()

// 查看成绩页面
const viewScores = () => {
  router.push(`/teacher/exam/${route.params.id}/scores`)
}

// 管理试题
const manageQuestions = () => {
  router.push(`/teacher/exam/${route.params.id}/questions`)
}

// ===== 待批改提醒 =====
const studentExamList = ref([])

const subjectiveTypes = ['ESSAY', 'SHORT', 'SHORT_ANSWER', 'FILL', 'FILL_BLANK']

// 是否有简答题
const hasSubjectiveQuestion = computed(() => {
  return questions.value.some(q => subjectiveTypes.includes(q.questionType))
})

// 待批改的数量 (status=2)
const pendingCount = computed(() => {
  return studentExamList.value.filter(s => s.status === 2 || s.status === '2').length
})

// 显示待批改提醒
const hasPendingSubjective = computed(() => {
  return hasSubjectiveQuestion.value && pendingCount.value > 0
})

onMounted(async () => {
  try {
    const res = await getStudentExams(route.params.id)
    if (res.code === 200 && res.data) {
      studentExamList.value = res.data
    }
  } catch (e) {
    // 静默忽略，不影响主页面
  }
})
</script>

<style scoped>
 @import'@/assets/css/teacher/exam-detail.css';

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Element Plus 组件暗黑模式 */
.dark-theme :deep(.el-card) {
  background: #1e293b;
  border-color: #334155;
}

.dark-theme :deep(.el-card__header) {
  background: #0f172a;
  border-bottom-color: #334155;
  color: #f1f5f9;
}

.dark-theme :deep(.el-descriptions__label) {
  color: #94a3b8;
}

.dark-theme :deep(.el-descriptions__content) {
  color: #f1f5f9;
}

.dark-theme :deep(.el-descriptions__cell) {
  border-color: #334155;
}

.dark-theme :deep(.el-empty__description) {
  color: #94a3b8;
}
</style>
