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
import { 
  ArrowLeft, Plus, Delete, MagicStick, DocumentChecked, Check, QuestionFilled, Notebook, Collection 
} from '@element-plus/icons-vue'
import { useExamForm } from '@/assets/js/teacher/exam-form.js'

const {
  // State
  isEdit,
  activeTab,
  submitting,
  courses,
  timeRange,
  examForm,
  manualQuestions,
  aiForm,
  aiQuestions,
  aiLoading,
  bankDialogVisible,
  bankLoading,
  bankQuestions,
  bankFilter,
  bankPagination,
  selectedBankQuestions,
  questionDialogVisible,
  isEditQuestion,
  questionForm,
  
  // Computed
  canGenerateAi,
  totalAiScore,
  totalManualScore,
  canCreateManual,
  
  // Methods
  handleCourseChange,
  addManualQuestion,
  editManualQuestion,
  deleteManualQuestion,
  openBankSelection,
  searchBank,
  handleBankSelection,
  confirmImportFromBank,
  isCorrectOption,
  getQuestionTypeTag,
  getQuestionTypeText,
  parseOptions,
  generateWithAi,
  editAiQuestion,
  deleteAiQuestion,
  addOption,
  removeOption,
  saveQuestion,
  confirmCreateManual,
  confirmCreateWithAi,
  confirmUpdate,
  goBack
} = useExamForm()
</script>

<style scoped>
@import '@/assets/css/teacher/exam-form.css';
</style>
