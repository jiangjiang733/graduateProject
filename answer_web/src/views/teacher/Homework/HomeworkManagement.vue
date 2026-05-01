<template>
  <div class="homework-management modern-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><EditPen /></el-icon>
        </div>
        <h1 class="page-title">作业管理</h1>
      </div>
      <div class="header-right">
        <div class="header-search">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索作业名称..."
            class="header-search-input"
            clearable
            @keyup.enter="loadHomeworks"
            :prefix-icon="Search"
          />
        </div>
        <div class="status-tabs">
          <span 
            class="tab-item" 
            :class="{active: filterForm.status === '' || filterForm.status === null || filterForm.status === undefined}" 
            @click="setFilterStatus('')"
          >
            全部
          </span>
          <span 
            class="tab-item" 
            :class="{active: filterForm.status === 1 || filterForm.status === '1'}" 
            @click="setFilterStatus(1)"
          >
            进行中
          </span>
          <span 
            class="tab-item" 
            :class="{active: filterForm.status === 2 || filterForm.status === '2'}" 
            @click="setFilterStatus(2)"
          >
            已结束
          </span>
          <span 
            class="tab-item pending-tab" 
            :class="{active: filterForm.status === 'UNGRADED'}" 
            @click="setFilterStatus('UNGRADED')"
          >
            待批改
          </span>
          <span 
            class="tab-item graded-tab" 
            :class="{active: filterForm.status === 'GRADED'}" 
            @click="setFilterStatus('GRADED')"
          >
            已批改
          </span>
        </div>
        <el-button class="create-homework-btn" @click="showCreateDialog">
          <el-icon><Plus /></el-icon> 布置新作业
        </el-button>
      </div>
    </div>

    <!-- 作业列表卡片网格 -->
    <div class="homework-grid" v-loading="loading">
      <div v-if="homeworks.length === 0" class="empty-state">
        <el-empty description="暂无作业，点击上方发布作业" :image-size="120">
          <template #image>
            <el-icon size="60" color="#10b981"><Document /></el-icon>
          </template>
        </el-empty>
      </div>

      <div
        v-for="homework in homeworks"
        :key="homework.id"
        class="homework-card-new"
      >
        <div class="card-header-row">
          <h3 class="card-title" @click="viewHomework(homework)">{{ homework.title }}</h3>
          <div class="card-header-right">
            <span class="card-status-tag" :class="getStatusType(homework.status)">
              {{ getStatusText(homework.status) }}
            </span>
            <div class="card-actions">
              <el-tooltip content="编辑" placement="top">
                <div class="action-btn" @click="editHomework(homework)">
                  <el-icon><Edit /></el-icon>
                </div>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <div class="action-btn delete-btn" @click="deleteHomeworkItem(homework)">
                  <el-icon><Delete /></el-icon>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>

        <div class="card-course-tag">
          {{ homework.courseName }}
        </div>

        <div class="card-progress-row">
          <div class="progress-info">
            <el-icon><Clock /></el-icon>
            <span class="deadline-text">截止: {{ formatDate(homework.deadline) }}</span>
          </div>
          <div class="submitted-count" style="font-size: 13px; color: #64748b;">
            已批改 <span style="font-weight: bold; color: #10b981;">{{ homework.gradedCount || 0 }}</span> / 
            待批改 <span style="font-weight: bold; color: #f59e0b;">{{ Math.max(0, (homework.submittedCount || 0) - (homework.gradedCount || 0) - (homework.returnedCount || 0)) }}</span> / 
            已退回 <span style="font-weight: bold; color: #ef4444;">{{ homework.returnedCount || 0 }}</span>
          </div>
        </div>

        <div class="progress-bar-container">
          <el-progress 
            :percentage="getGradeProgress(homework)" 
            :color="getGradeProgressColor(homework)" 
            :stroke-width="8" 
            :show-text="false" 
          />
        </div>

        <div class="card-footer-buttons">
          <el-button class="grade-btn" @click="gradeHomework(homework)">
            批改
          </el-button>
          <el-button class="stats-btn" @click="viewHomework(homework)">
            详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-container pagination-outside" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="premium-pagination"
      />
    </div>

    <!-- 创建/编辑作业对话框 (Ketangpai Style) -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑作业' : '发布作业'"
      width="800px"
      :close-on-click-modal="false"
      class="ketangpai-dialog"
    >
      <el-form ref="formRef" :model="homeworkForm" :rules="rules" label-position="left" label-width="100px">
        <el-form-item label="题目名称" prop="title" required>
          <el-input 
            v-model="homeworkForm.title" 
            placeholder="请输入题目名称 (如: 实验一 进程调度算法)" 
            maxlength="100" 
            show-word-limit 
          />
        </el-form-item>

        <el-form-item label="所属课程" prop="courseId" required>
          <el-select v-model="homeworkForm.courseId" placeholder="选择作业所属课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="作业内容" prop="description">
          <div class="textarea-header">
            <span class="content-tip">输入总体要求/说明（选填）</span>
          </div>
          <el-input
            v-model="homeworkForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入作业总体说明..."
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <!-- 结构化题目部分 -->
        <div class="questions-management-section">
          <div class="section-header">
            <div class="h-left">
              <span class="section-title">作业试题 ({{ homeworkForm.questions?.length || 0 }})</span>
              <span class="section-tip">学生可直接在页面上作答</span>
            </div>
            <div class="h-right">
              <el-button link class="import-link" @click="openCreateQuestion">
                <el-icon><Plus /></el-icon> 添加试题
              </el-button>
              <el-button link class="import-link" @click="openQuestionBank">
                <el-icon><List /></el-icon> 引用题库
              </el-button>
              <el-button link type="primary" class="ai-btn" @click="openAiDialog">
                AI 出题
              </el-button>
            </div>
          </div>

          <div class="questions-list" v-if="homeworkForm.questions?.length > 0">
            <div v-for="(q, index) in homeworkForm.questions" :key="index" class="q-manage-item">
              <div class="q-header">
                <div class="q-idx">{{ index + 1 }}</div>
                <el-tag size="small" :type="getQuestionTypeTag(q.questionType)">{{ getQuestionTypeText(q.questionType) }}</el-tag>
                <div class="q-score-set">
                  <el-input-number v-model="q.score" :min="1" :max="100" size="small" controls-position="right" @change="calculateHomeworkTotalScore" />
                  <span class="unit">分</span>
                </div>
                <div class="q-actions">
                  <el-button link size="small" type="primary" @click="openEditQuestion(index)"><el-icon><Edit /></el-icon> 编辑</el-button>
                  <el-button link size="small" :type="q._savedToBank ? 'info' : 'success'" :disabled="q._savedToBank" @click="saveToBank(q)">
                    <el-icon><Checked /></el-icon> {{ q._savedToBank ? '已存题库' : '存入题库' }}
                  </el-button>
                  <el-button link size="small" :disabled="index === 0" @click="moveHomeworkQuestion(index, -1)"><el-icon><ArrowUp /></el-icon></el-button>
                  <el-button link size="small" :disabled="index === homeworkForm.questions.length - 1" @click="moveHomeworkQuestion(index, 1)"><el-icon><ArrowDown /></el-icon></el-button>
                  <el-button link type="danger" size="small" @click="removeHomeworkQuestion(index)"><el-icon><Delete /></el-icon></el-button>
                </div>
              </div>
              <div class="q-body">
                <div class="q-content-preview">{{ q.questionContent }}</div>
                
                <!-- 单选/多选预览 -->
                <div class="q-options-preview" v-if="['SINGLE', 'MULTIPLE'].includes(q.questionType)">
                   <div v-for="(opt, oIdx) in parseOptions(q.questionOptions)" :key="oIdx" class="opt-preview-item" :class="{correct: isCorrect(opt, oIdx, q)}">
                      <span class="opt-label">{{ String.fromCharCode(65+oIdx) }}</span>
                      <span class="opt-text">{{ opt.text || opt }}</span>
                   </div>
                </div>

                <!-- 判断题预览 -->
                <div class="q-options-preview" v-else-if="q.questionType === 'JUDGE'">
                   <!-- 支持多种匹配格式 (A正确 B错误) -->
                   <div class="opt-preview-item" :class="{correct: q.correctAnswer === 'A' || q.correctAnswer === '正确' || q.correctAnswer === '对' || q.answer === '正确' || q.answer === '对'}">
                      <span class="opt-label">A</span>
                      <span class="opt-text">正确</span>
                   </div>
                   <div class="opt-preview-item" :class="{correct: q.correctAnswer === 'B' || q.correctAnswer === '错误' || q.correctAnswer === '错' || q.answer === '错误' || q.answer === '错'}">
                      <span class="opt-label">B</span>
                      <span class="opt-text">错误</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-questions" v-else>
            <el-empty :image-size="60" description="点击上方按钮添加结构化题目" />
          </div>
        </div>

        <el-form-item label="截止时间" prop="deadline" required>
          <el-date-picker
            v-model="homeworkForm.deadline"
            type="datetime"
            placeholder="选择截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="总分" prop="totalScore">
          <el-input-number 
            v-model="homeworkForm.totalScore" 
            :min="0" 
            :max="1000" 
            controls-position="right"
            placeholder="不填默认为0" 
            style="width: 140px;"
          />
          <span class="tip-text">分 (选填，不填则不计分或手动打分)</span>
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            class="upload-area"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="5"
          >
            <el-button size="default">选择文件</el-button>
            <template #tip>
              <div class="upload-tip">支持上传内容补充文件 (可选)</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="ketangpai-footer">
          <el-button @click="dialogVisible = false" class="k-btn cancel">取消</el-button>
          <el-button @click="saveAsDraft" :loading="submitting" class="k-btn draft">保存草稿</el-button>
          <el-button type="primary" @click="submitHomework" :loading="submitting" class="k-btn submit">发布作业</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 题目选择对话框 (题库引用) -->
    <el-dialog
      v-model="bankDialogVisible"
      title="引用题库试题"
      width="850px"
      append-to-body
      class="glass-dialog bank-picker"
    >
      <div class="bank-picker-container">
        <div class="picker-filter">
          <el-select v-model="bankFilter.type" placeholder="题型" clearable @change="searchBank" class="glass-select" style="width: 120px">
            <el-option label="单选" value="SINGLE" />
            <el-option label="多选" value="MULTIPLE" />
            <el-option label="判断" value="JUDGE" />
            <el-option label="简答" value="ESSAY" />
          </el-select>
          <el-input 
            v-model="bankFilter.keyword" 
            placeholder="搜索题目内容..." 
            prefix-icon="Search" 
            @keyup.enter="searchBank"
            class="glass-input"
            style="width: 280px"
          />
          <el-button type="primary" @click="searchBank" class="premium-btn primary">搜索</el-button>
        </div>

        <el-table 
          :data="bankQuestions" 
          v-loading="bankLoading" 
          height="400px" 
          @selection-change="handleBankSelection"
          class="glass-table"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="题型" width="100">
            <template #default="{row}">
              <el-tag size="small">{{ getQuestionTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="题目内容" min-width="400" show-overflow-tooltip>
            <template #default="{row}">
              <div class="question-preview">{{ row.content }}</div>
            </template>
          </el-table-column>

        </el-table>

        <div class="picker-footer">
          <span class="selected-badge">已选 {{ selectedQuestions.length }} 题</span>
          <el-pagination 
            v-model:current-page="bankPagination.current" 
            v-model:page-size="bankPagination.size"
            :total="bankPagination.total"
            layout="prev, pager, next"
            @current-change="searchBank"
            background
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="bankDialogVisible = false" class="premium-btn ghost">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmImportQuestions" 
            :disabled="selectedQuestions.length === 0"
            class="premium-btn primary"
          >
            确认引用到作业
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI 生成对话框 -->
    <el-dialog
      v-model="aiDialogVisible"
      title="AI 智能生成题目"
      width="600px"
      append-to-body
      class="ketangpai-dialog"
    >
      <div v-loading="aiLoading" element-loading-text="AI 正在思考生成中...">
        <el-form label-position="top">
          <el-form-item label="生成主题 / 课程内容">
            <el-input 
              v-model="aiForm.topic" 
              placeholder="请输入想要生成的主题，例如：Java多线程、操作系统进程调度..." 
              clearable
            />
          </el-form-item>
          
          <el-form-item label="题目数量">
            <el-input-number  v-model="aiForm.count" :min="1"  show-input />
          </el-form-item>
          
          <el-form-item label="包含题型">
            <el-checkbox-group v-model="aiForm.types">
              <el-checkbox label="SINGLE">单选题</el-checkbox>
              <el-checkbox label="MULTIPLE">多选题</el-checkbox>
              <el-checkbox label="JUDGE">判断题</el-checkbox>
              <el-checkbox label="ESSAY">简答题</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="aiDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAiGenerate" :loading="aiLoading">
            开始生成
          </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 题目编辑弹窗 -->
    <el-dialog
      v-model="editQuestionDialogVisible"
      :title="editingQuestionIndex === -1 ? '添加题目' : '编辑题目'"
      width="700px"
      append-to-body
      class="modern-dialog"
    >
      <el-form label-position="top">
        <el-form-item label="题型" v-if="editingQuestionIndex === -1">
          <el-radio-group v-model="editingQuestion.questionType">
             <el-radio label="SINGLE">单选题</el-radio>
             <el-radio label="MULTIPLE">多选题</el-radio>
             <el-radio label="JUDGE">判断题</el-radio>
             <el-radio label="ESSAY">简答题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="题目内容">
          <el-input v-model="editingQuestion.questionContent" type="textarea" :rows="4" />
        </el-form-item>
        
        <!-- 选项编辑 (单选/多选) -->
        <div v-if="['SINGLE', 'MULTIPLE'].includes(editingQuestion.questionType)" class="options-edit-area">
          <div class="sub-title">选项设置</div>
          <div v-for="(opt, idx) in editingQuestion.options" :key="idx" class="opt-edit-row">
            <span class="opt-tag">{{ String.fromCharCode(65+idx) }}.</span>
            <el-input v-model="opt.text" placeholder="输入选项内容" />
            <el-button link type="danger" @click="removeOption(idx)"><el-icon><Delete /></el-icon></el-button>
          </div>
          <el-button link type="primary" @click="addOption"><el-icon><Plus /></el-icon> 添加选项</el-button>
        </div>

        <el-form-item label="正确答案">
          <!-- 单选答案 -->
          <el-radio-group v-if="editingQuestion.questionType === 'SINGLE'" v-model="editingQuestion.correctAnswer">
            <el-radio v-for="(opt, idx) in editingQuestion.options" :key="idx" :label="String.fromCharCode(65+idx)">
              {{ String.fromCharCode(65+idx) }}
            </el-radio>
          </el-radio-group>
          <!-- 多选答案 -->
          <el-checkbox-group v-else-if="editingQuestion.questionType === 'MULTIPLE'" v-model="editingQuestion.correctAnswers">
             <el-checkbox v-for="(opt, idx) in editingQuestion.options" :key="idx" :label="String.fromCharCode(65+idx)">
               {{ String.fromCharCode(65+idx) }}
             </el-checkbox>
          </el-checkbox-group>
          <!-- 判断题答案 (根据用户要求：A正确 B错误) -->
          <el-radio-group v-else-if="editingQuestion.questionType === 'JUDGE'" v-model="editingQuestion.correctAnswer">
            <el-radio label="A">A. 正确</el-radio>
            <el-radio label="B">B. 错误</el-radio>
          </el-radio-group>
          <!-- 简答题答案 -->
          <el-input v-else v-model="editingQuestion.correctAnswer" type="textarea" :rows="3" />
        </el-form-item>

        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
           <el-form-item label="分值">
             <el-input-number v-model="editingQuestion.score" :min="1" />
           </el-form-item>
        </div>

        <el-form-item label="解析">
          <el-input v-model="editingQuestion.analysis" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editQuestionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEditQuestion">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  Plus, Document, Search, Reading, Calendar, User, Check, List, Edit, Delete, Checked, MagicStick,
  ArrowUp, ArrowDown, EditPen, Clock
} from '@element-plus/icons-vue'
import { useHomeworkManagement } from '@/assets/js/teacher/homework-management.js'
import '@/assets/css/teacher/modern-theme.css'

// 辅助方法，用于 UI 展示
const parseOptions = (json) => {
    try {
        return typeof json === 'string' ? JSON.parse(json) : json
    } catch(e) { return [] }
}

const isCorrect = (opt, idx, q) => {
    const ans = q.correctAnswer || q.answer
    if (!ans) return false
    const ansStr = String(ans)
    const char = String.fromCharCode(65 + idx)
    return ansStr.includes(char) || ansStr === String(idx)
}

const getQuestionTypeTag = (type) => {
    const maps = { SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info' }
    return maps[type] || ''
}

const {
  loading,
  dialogVisible,
  isEdit,
  submitting,
  formRef,
  courses,
  homeworks,
  filterForm,
  homeworkForm,
  fileList,
  rules,
  bankDialogVisible,
  bankLoading,
  bankQuestions,
  bankFilter,
  bankPagination,
  selectedQuestions,
  loadHomeworks,
  setFilterStatus,
  showCreateDialog,
  handleFileChange,
  saveAsDraft,
  submitHomework,
  viewHomework,
  gradeHomework,
  editHomework,
  deleteHomeworkItem,
  getStatusType,
  getStatusText,
  formatDate,
  getSubmitProgress,
  getProgressColor,
  getGradeProgress,
  getGradeProgressColor,
  openQuestionBank,
  searchBank,
  handleBankSelection,
  confirmImportQuestions,
  getQuestionTypeText,
  pagination,
  handlePageChange,
  handleSizeChange,
  aiDialogVisible,
  aiLoading,
  aiForm,
  openAiDialog,
  handleAiGenerate,
  removeHomeworkQuestion,
  moveHomeworkQuestion,
  calculateHomeworkTotalScore,
  editQuestionDialogVisible,
  editingQuestionIndex,
  editingQuestion,
  openCreateQuestion,
  openEditQuestion,
  saveEditQuestion,
  addOption,
  removeOption,
  saveToBank
} = useHomeworkManagement()
</script>

<style scoped>
@import '@/assets/css/teacher/homework-management.css';
</style>
