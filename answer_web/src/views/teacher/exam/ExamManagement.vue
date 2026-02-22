<template>
  <div class="exam-management modern-page">

    <!-- 筛选和搜索控制栏 -->
    <div class="filter-section animate-slide-up">
      <div class="glass-panel filter-wrapper">
        <div class="filter-left">
          <div class="filter-group">
            <div class="filter-item">
              <label>关联课程</label>
              <el-select 
                v-model="filterForm.courseId" 
                placeholder="选择课程" 
                class="premium-select" 
                @change="loadExams"
                clearable
              >
                <template #prefix>
                  <el-icon><Reading /></el-icon>
                </template>
                <el-option label="全部课程" value="" />
                <el-option
                  v-for="course in courses"
                  :key="course.id"
                  :label="course.courseName || course.name"
                  :value="course.id"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <label>考试状态</label>
              <el-select 
                v-model="filterForm.status" 
                placeholder="全部状态" 
                class="premium-select" 
                @change="loadExams"
                clearable
              >
                <template #prefix>
                  <el-icon><Clock /></el-icon>
                </template>
                <el-option label="全部状态" value="" />
                <el-option label="草稿" value="DRAFT" />
                <el-option label="已发布" value="PUBLISHED" />
                <el-option label="进行中" value="ONGOING" />
                <el-option label="已结束" value="ENDED" />
              </el-select>
            </div>
          </div>
        </div>
        
        <div class="filter-right">
          <div class="search-group">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索考试标题或内容..."
              class="premium-search"
              clearable
              @keyup.enter="loadExams"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button class="search-btn" @click="loadExams" type="primary">
              搜索
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 考试列表 -->
    <!-- 考试管理列表 标题与发布按钮 (独立卡片) -->
    <div class="exam-top-card animate-slide-up">
      <div class="top-card-left">
        <div class="icon-wrapper">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <h2 class="title">考试管理列表</h2>
      </div>
      <el-button color="#2563eb" class="publish-btn" @click="showCreateDialog">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发布新考试
      </el-button>
    </div>

    <!-- 考试列表 (独立卡片) -->
    <div v-loading="loading" class="exam-list-card animate-slide-up" style="animation-delay: 0.1s">
      <div class="exam-list-wrapper">
        <!-- 表头 -->
        <div class="exam-grid-header">
          <div class="col-name">考试名称</div>
          <div class="col-course">关联课程</div>
          <div class="col-status">状态</div>
          <div class="col-action">操作</div>
        </div>

        <!-- 列表为空 -->
        <div v-if="exams.length === 0" class="empty-list">
          <el-empty description="暂无考试数据" :image-size="120" />
        </div>

        <!-- 表格行 -->
        <div 
          v-for="exam in paginatedExams" 
          :key="exam.examId"
          class="exam-grid-row"
        >
          <!-- 考试名称 -->
          <div class="col-name row-title">
            {{ exam.examTitle }}
          </div>
          
          <!-- 关联课程 -->
          <div class="col-course row-course">
            {{ exam.courseName || '尚未关联课程' }}
          </div>
          
          <!-- 状态 Badge -->
          <div class="col-status">
            <span :class="getStatusClasses(exam.statusText || exam.status)">
              {{ getStatusText(exam.statusText || exam.status) }}
            </span>
          </div>
          
          <!-- 操作区：悬停显现 -->
          <div class="col-action row-actions">
            <span class="detail-text-btn" @click.stop="viewExam(exam)">查看详情</span>
            
            <el-dropdown trigger="hover" placement="bottom-end">
              <div class="more-action-btn" @click.stop>
                 <el-icon><MoreFilled /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="viewScores(exam)">成绩</el-dropdown-item>
                  <el-dropdown-item @click="manageQuestions(exam)">试题</el-dropdown-item>
                  <el-dropdown-item v-if="exam.status === 0 || exam.statusText === 'DRAFT'" @click="editExam(exam)">编辑</el-dropdown-item>
                  <el-dropdown-item v-if="exam.status === 0 || exam.statusText === 'DRAFT'" @click="publishExam(exam)">发布</el-dropdown-item>
                  <el-dropdown-item v-if="exam.status !== 0 && exam.statusText !== 'DRAFT'" @click="unpublishExamAction(exam)">转为草稿</el-dropdown-item>
                  <el-dropdown-item divided type="danger" @click="deleteExam(exam)" class="text-red-500">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 独立的分页块 - 位于列表外部底部中间 -->
    <div class="pagination-container pagination-outside" v-if="exams.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="exams.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="premium-pagination"
      />
    </div>

    <!-- 创建/编辑考试对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑考试' : '创建考试'"
      width="800px"
      :close-on-click-modal="false"
      class="glass-dialog exam-create-dialog"
    >
      <!-- 步骤指示器 -->
      <div class="exam-steps-header">
        <div class="step-item" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-title">基本信息</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step-item" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-title">试题设置</div>
        </div>
      </div>

      <!-- Step 1: 基本信息 -->
      <div v-show="currentStep === 1" class="step-content">
        <el-form ref="formRef" :model="examForm" :rules="rules" label-width="100px" class="exam-basic-form">
          <el-form-item label="考试标题" prop="examTitle">
            <el-input v-model="examForm.examTitle" placeholder="请输入考试标题" maxlength="100" show-word-limit />
          </el-form-item>

          <el-form-item label="所属课程" prop="courseId">
            <el-select v-model="examForm.courseId" placeholder="选择课程" style="width: 100%" @change="onCourseSelected">
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.courseName || course.name"
                :value="course.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="考试时间" prop="timeRange">
            <el-date-picker
              v-model="examForm.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <div class="form-row-inline">
            <el-form-item label="考试时长" prop="duration">
              <el-input-number v-model="examForm.duration" :min="10" :max="300" />
              <span class="form-unit">分钟</span>
            </el-form-item>

            <el-form-item label="总分" prop="totalScore">
              <el-input-number v-model="examForm.totalScore" :min="10" :max="500" />
              <span class="form-unit">分</span>
            </el-form-item>
          </div>

          <el-form-item label="及格分">
            <el-input-number :model-value="calculatedPassScore" disabled />
            <span class="form-tip">（自动计算为总分的60%）</span>
          </el-form-item>
        </el-form>
      </div>

      <!-- Step 2: 试题设置 -->
      <div v-show="currentStep === 2" class="step-content">
        <div class="questions-section">
          <div class="questions-header">
            <div class="section-title">
              <span>题目列表</span>
              <el-tag effect="dark" round class="score-summary">
                已添加 {{ examQuestions.length }} 题 / 共 {{ totalQuestionScore }} 分
              </el-tag>
            </div>
            <div class="section-actions">
              <el-button :icon="Document" @click="openBankPicker" :disabled="!examForm.courseId">
                从题库添加
              </el-button>
              <el-button :icon="Plus" @click="addNewQuestion">
                手动添加
              </el-button>
              <el-button type="primary" :icon="MagicStick" @click="openAiPicker" :disabled="!examForm.courseId">
                AI智能出题
              </el-button>
            </div>
          </div>

          <div v-if="examQuestions.length === 0" class="empty-questions">
            <el-empty description="暂无题目，请选择添加方式">
              <div class="empty-actions">
                <el-button :icon="Document" @click="openBankPicker" :disabled="!examForm.courseId">
                  从题库添加
                </el-button>
                <el-button :icon="Plus" @click="addNewQuestion">
                  手动添加
                </el-button>
                <el-button type="primary" :icon="MagicStick" @click="openAiPicker" :disabled="!examForm.courseId">
                  AI智能出题
                </el-button>
              </div>
            </el-empty>
          </div>

          <div v-else class="questions-list">
            <div v-for="(q, index) in examQuestions" :key="index" class="question-item-card">
              <div class="q-card-header">
                <div class="q-meta">
                  <span class="q-number">第 {{ index + 1 }} 题</span>
                  <el-tag :type="getQuestionTypeTag(q.questionType)" size="small">
                    {{ getQuestionTypeText(q.questionType) }}
                  </el-tag>
                  <div class="q-score-input">
                    <el-input-number 
                      v-model="q.score" 
                      :min="1" 
                      :max="100" 
                      size="small" 
                      controls-position="right"
                      @change="syncTotalScore"
                    />
                    <span class="unit">分</span>
                  </div>
                </div>
                <div class="q-actions">
                  <el-button link type="success" @click="addSingleQuestionToBank(index)">加入题库</el-button>
                  <el-button link type="primary" @click="editQuestion(index)">编辑</el-button>
                  <el-button link type="danger" @click="removeQuestion(index)">移除</el-button>
                </div>
              </div>
              <div class="q-card-body">
                <div class="q-content">{{ q.questionContent }}</div>
                <div v-if="['SINGLE', 'MULTIPLE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.questionType)" class="q-options">
                  <div v-for="(opt, oIdx) in parseQuestionOptions(q.questionOptions)" :key="oIdx" class="opt-item" :class="{ correct: isOptionCorrect(q, oIdx) }">
                    <span class="opt-letter">{{ String.fromCharCode(65 + oIdx) }}.</span>
                    <span class="opt-text">{{ typeof opt === 'object' ? (opt.text || JSON.stringify(opt)) : opt }}</span>
                  </div>
                </div>
                <div v-else-if="['JUDGE', 'TRUE_FALSE'].includes(q.questionType)" class="q-options">
                  <div class="opt-item" :class="{ correct: q.answer === 'A' || q.answer === '对' }">
                    <span class="opt-letter">A.</span>
                    <span class="opt-text">正确</span>
                  </div>
                  <div class="opt-item" :class="{ correct: q.answer === 'B' || q.answer === '错' }">
                    <span class="opt-letter">B.</span>
                    <span class="opt-text">错误</span>
                  </div>
                </div>
                <div v-if="['JUDGE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER'].includes(q.questionType)" class="q-answer">
                  <strong>答案:</strong> {{ q.answer || q.correctAnswer }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer-steps">
          <el-button v-if="currentStep > 1" @click="prevStep">上一步</el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="currentStep < 2" type="primary" @click="nextStep" :disabled="!canGoNext">
            下一步
          </el-button>
          <template v-if="currentStep === 2">
            <el-button @click="saveAsDraft" :loading="submitting">
              {{ isEdit ? '保存修改' : '保存草稿' }}
            </el-button>
            <el-button type="success" @click="submitExam" :loading="submitting" :disabled="examQuestions.length === 0">
              {{ isEdit ? '确定发布' : '确定并发布' }}
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>

    <!-- 题库选题对话框 -->
    <el-dialog v-model="bankPickerVisible" title="从题库选题" width="900px" class="bank-picker-dialog">
      <div class="bank-picker-content">
        <div class="bank-filter-row">
          <el-select v-model="bankFilter.courseId" placeholder="所属课程" clearable style="width: 180px">
            <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
          <el-select v-model="bankFilter.type" placeholder="题型" clearable style="width: 120px">
            <el-option label="单选" value="SINGLE" />
            <el-option label="多选" value="MULTIPLE" />
            <el-option label="判断" value="JUDGE" />
            <el-option label="填空" value="FILL_BLANK" />
            <el-option label="简答" value="SHORT_ANSWER" />
          </el-select>
          <el-input v-model="bankFilter.keyword" placeholder="搜索题目..." :prefix-icon="Search" clearable style="width: 220px" @keyup.enter="searchBankQuestions" />
          <el-button type="primary" :icon="Search" @click="searchBankQuestions">搜索</el-button>
        </div>

        <el-table :data="bankQuestions" height="350px" v-loading="bankLoading" @selection-change="onBankSelectionChange">
          <el-table-column type="selection" width="50" />
          <el-table-column label="题型" width="80">
            <template #default="{row}">
              <el-tag size="small" :type="getQuestionTypeTag(row.type || row.questionType)">
                {{ getQuestionTypeText(row.type || row.questionType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="题目内容" show-overflow-tooltip>
            <template #default="{row}">{{ row.content || row.questionContent }}</template>
          </el-table-column>

        </el-table>

        <div class="bank-picker-footer">
          <span>已选择 {{ selectedBankQuestions.length }} 题</span>
          <el-pagination
            v-model:current-page="bankPagination.current"
            v-model:page-size="bankPagination.size"
            :total="bankPagination.total"
            layout="prev, pager, next"
            @current-change="searchBankQuestions"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="bankPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImportBank" :disabled="selectedBankQuestions.length === 0">
          确认导入 {{ selectedBankQuestions.length }} 题
        </el-button>
      </template>
    </el-dialog>

    <!-- AI智能出题对话框 -->
    <el-dialog v-model="aiPickerVisible" title="AI智能出题" width="700px" class="ai-picker-dialog">
      <div class="ai-picker-content">
        <div class="ai-picker-hero">
          <div class="ai-picker-icon">
            <el-icon :size="32"><MagicStick /></el-icon>
          </div>
          <div class="ai-picker-text">
            <h3>AI智能出题助手</h3>
          </div>
        </div>

        <el-form :model="aiConfig" label-width="100px" class="ai-picker-form">
          <el-form-item label="识别课程名" required>
            <el-input v-model="aiConfig.courseName" placeholder="如：数据结构、高等数学" />
          </el-form-item>

          <div class="ai-picker-row">
            <el-form-item label="期望题数">
              <el-input-number v-model="aiConfig.questionCount" :min="1" :max="30" />
            </el-form-item>
            <el-form-item label="每题分值">
              <el-input-number v-model="aiConfig.defaultScore" :min="1" :max="50" />
            </el-form-item>
          </div>

          <el-form-item label="题型组合" required>
            <el-checkbox-group v-model="aiConfig.questionTypes">
              <el-checkbox label="SINGLE">单选题</el-checkbox>
              <el-checkbox label="MULTIPLE">多选题</el-checkbox>
              <el-checkbox label="JUDGE">判断题</el-checkbox>
              <el-checkbox label="FILL_BLANK">填空题</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="aiPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="generateWithAiAndAdd" :loading="aiLoading" :disabled="!canGenerateAi">
          <el-icon><MagicStick /></el-icon> 生成并添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 手动添加/编辑题目对话框 -->
    <el-dialog v-model="questionEditVisible" :title="isEditingQuestion ? '编辑题目' : '添加题目'" width="650px">
      <el-form :model="currentQuestion" label-width="100px">
        <el-form-item label="题目类型" required>
          <el-select v-model="currentQuestion.questionType" style="width: 100%">
            <el-option label="单选题" value="SINGLE" />
            <el-option label="多选题" value="MULTIPLE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="填空题" value="FILL_BLANK" />
            <el-option label="简答题" value="SHORT_ANSWER" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目内容" required>
          <el-input v-model="currentQuestion.questionContent" type="textarea" :rows="4" placeholder="请输入题目内容" />
        </el-form-item>

        <el-form-item v-if="['SINGLE', 'MULTIPLE'].includes(currentQuestion.questionType)" label="选项" required>
          <div v-for="(opt, idx) in currentQuestion.options" :key="idx" class="option-row">
            <span class="option-letter">{{ String.fromCharCode(65 + idx) }}.</span>
            <el-input v-model="currentQuestion.options[idx]" placeholder="输入选项内容" style="flex: 1" />
            <el-checkbox v-model="currentQuestion.correctMap[idx]">
              {{ ['SINGLE'].includes(currentQuestion.questionType) ? '正确答案' : '正确' }}
            </el-checkbox>
            <el-button v-if="currentQuestion.options.length > 2" :icon="Delete" circle size="small" @click="removeOption(idx)" />
          </div>
          <el-button v-if="currentQuestion.options.length < 6" size="small" @click="addOption">+ 添加选项</el-button>
        </el-form-item>

        <el-form-item v-if="currentQuestion.questionType === 'JUDGE'" label="正确答案" required>
          <el-radio-group v-model="currentQuestion.answer">
            <el-radio label="A">正确</el-radio>
            <el-radio label="B">错误</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="['FILL_BLANK', 'SHORT_ANSWER'].includes(currentQuestion.questionType)" label="参考答案" required>
          <el-input v-model="currentQuestion.answer" type="textarea" :rows="3" placeholder="请输入参考答案">
            <template v-if="currentQuestion.questionType === 'FILL_BLANK'" #append>
              <el-tooltip content="多个空格用 | 分隔" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="分值" required>
          <el-input-number v-model="currentQuestion.score" :min="1" :max="100" />
        </el-form-item>

        <el-form-item label="解析">
          <el-input v-model="currentQuestion.analysis" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="questionEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestionToExam">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import {
  Plus, Search, Reading, Clock, Calendar, User, Document, MoreFilled, Delete, QuestionFilled, MagicStick, DocumentChecked
} from '@element-plus/icons-vue'
import { useExamManagement } from '@/assets/js/teacher/exam-management'

const getStatusClasses = (status) => {
  const base = 'status-badge ';
  const s = String(status).toUpperCase();
  if (s === 'ONGOING' || s.includes('进行中')) {
    return base + 'badge-ongoing';
  } else if (s === 'ENDED' || s.includes('已结束')) {
    return base + 'badge-ended';
  } else if (s === 'PUBLISHED' || s.includes('已发布')) {
    return base + 'badge-published';
  } else if (s === 'DRAFT' || s.includes('草稿')) {
    return base + 'badge-draft';
  }
  return base + 'badge-published';
}

const {
  loading,
  dialogVisible,
  isEdit,
  submitting,
  formRef,
  courses,
  exams,
  paginatedExams,
  currentPage,
  pageSize,
  handleCurrentChange,
  handleSizeChange,
  filterForm,
  examForm,
  rules,
  loadExams,
  showCreateDialog,
  saveAsDraft,
  submitExam,
  viewExam,
  manageQuestions,
  viewScores,
  editExam,
  publishExam,
  unpublishExamAction,
  deleteExam,
  getStatusType,
  getStatusText,
  formatDate,
  currentStep,
  examQuestions,
  calculatedPassScore,
  totalQuestionScore,
  canGoNext,
  nextStep,
  prevStep,
  onCourseSelected,
  bankPickerVisible,
  bankLoading,
  bankQuestions,
  bankFilter,
  bankPagination,
  selectedBankQuestions,
  openBankPicker,
  searchBankQuestions,
  onBankSelectionChange,
  confirmImportBank,
  questionEditVisible,
  isEditingQuestion,
  currentQuestion,
  addNewQuestion,
  editQuestion,
  removeQuestion,
  addOption,
  removeOption,
  saveQuestionToExam,
  calculateQuestionTotal,
  parseQuestionOptions,
  isOptionCorrect,
  getQuestionTypeTag,
  getQuestionTypeText,
  aiLoading,
  aiPickerVisible,
  aiConfig,
  canGenerateAi,
  openAiPicker,
  generateWithAiAndAdd,
  syncTotalScore,
  bankImportVisible,
  questionsToImport,
  selectedImportQuestions,
  isImportingToBank,
  onImportSelectionChange,
  confirmImportToBank,
  cancelImportToBank,
  addSingleQuestionToBank
} = useExamManagement()
</script>

<style scoped>
@import '@/assets/css/teacher/exam-management.css';
</style>
