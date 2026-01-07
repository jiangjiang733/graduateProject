<template>
  <div class="homework-management modern-page">
    <!-- 页面头部 -->


    <!-- 筛选和搜索控制栏 -->
    <!-- 筛选和搜索控制栏 -->
    <div class="filter-section animate-slide-up">
      <div class="filter-wrapper">
        <div class="filter-left">
          <div class="filter-item">
            <span class="filter-label">关联课程</span>
            <el-select 
              v-model="filterForm.courseId" 
              placeholder="全部课程" 
              class="ketangpai-select" 
              @change="loadHomeworks"
              clearable
              style="width: 240px"
            >
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
            <span class="filter-label">作业状态</span>
            <el-select 
              v-model="filterForm.status" 
              placeholder="全部状态" 
              class="ketangpai-select" 
              @change="loadHomeworks"
              clearable
              style="width: 160px"
            >
              <el-option label="全部" value="" />
              <el-option label="草稿" :value="0" />
              <el-option label="进行中" :value="1" />
              <el-option label="已截止" :value="2" />
            </el-select>
          </div>
          <div class="search-input-wrap">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索作业标题..."
              class="ketangpai-search"
              clearable
              @keyup.enter="loadHomeworks"
            />
            <el-button class="search-btn" @click="loadHomeworks">
              搜索
            </el-button>
          </div>
        </div>
        
        <div class="filter-right">
          <el-button class="create-btn" type="primary" @click="showCreateDialog">
             <el-icon><Plus /></el-icon> 发布作业
          </el-button>
        </div>
      </div>
    </div>

    <!-- 作业列表 -->
    <div v-loading="loading" class="content-list animate-slide-up">
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
        class="homework-card"
      >
        <div class="card-main">
          <div class="card-info">
            <div class="title-wrap">
              <h3 class="homework-title" @click="viewHomework(homework)">{{ homework.title }}</h3>
              <span class="status-tag" :class="getStatusType(homework.status)">
                {{ getStatusText(homework.status) }}
              </span>
            </div>
            <div class="meta-info">
              <span class="meta-item"><el-icon><Reading /></el-icon> {{ homework.courseName }}</span>
              <span class="meta-item"><el-icon><Calendar /></el-icon> 截止: {{ formatDate(homework.deadline) }}</span>
              <span class="meta-item"><el-icon><User /></el-icon> 提交: {{ homework.submittedCount }}/{{ homework.totalStudents }}</span>
            </div>
          </div>
          <div class="card-ops">
            <el-tooltip content="详情" placement="top"><el-button link @click="viewHomework(homework)"><el-icon><Document /></el-icon></el-button></el-tooltip>
            <el-tooltip content="编辑" placement="top"><el-button link @click="editHomework(homework)"><el-icon><Edit /></el-icon></el-button></el-tooltip>
            <el-tooltip content="批改" placement="top"><el-button link type="primary" @click="gradeHomework(homework)"><el-icon><Checked /></el-icon></el-button></el-tooltip>
            <el-tooltip content="删除" placement="top"><el-button link type="danger" @click="deleteHomeworkItem(homework)"><el-icon><Delete /></el-icon></el-button></el-tooltip>
          </div>
        </div>
        <div class="card-footer">
           <div class="progress-wrap">
              <span class="p-text">提交进度</span>
              <el-progress :percentage="getSubmitProgress(homework)" :color="getProgressColor(homework)" :stroke-width="4" :show-text="false" />
           </div>
        </div>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-footer" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          background
        />
      </div>
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
              <el-button link class="import-link" @click="openQuestionBank">
                <el-icon><List /></el-icon> 引用题库
              </el-button>
              <el-button link type="primary" class="ai-btn" @click="openAiDialog">
                <el-icon><MagicStick /></el-icon> AI 出题
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
                  <el-button link size="small" type="success" @click="saveToBank(q)"><el-icon><Checked /></el-icon> 存入题库</el-button>
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
          <el-table-column label="难度" width="100" align="center">
            <template #default="{row}">
              <span class="diff-stars">{{ '★'.repeat(row.difficulty || 1) }}</span>
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
            <el-slider v-model="aiForm.count" :min="1" :max="10" show-input />
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
      title="编辑题目"
      width="700px"
      append-to-body
      class="modern-dialog"
    >
      <el-form label-position="top">
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
  ArrowUp, ArrowDown
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
  editingQuestion,
  openEditQuestion,
  saveEditQuestion,
  addOption,
  removeOption,
  saveToBank
} = useHomeworkManagement()
</script>

<style scoped>
.homework-management {
  padding: 32px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* Filter Section */
.filter-section {
  margin-bottom: 24px;
}

.filter-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  color: #5f6368;
  white-space: nowrap;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 400px;
}

:deep(.ketangpai-select) .el-input__wrapper,
:deep(.ketangpai-search) .el-input__wrapper {
  background-color: #f8fafc !important;
  box-shadow: none !important;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.search-btn {
  background: #3c4043;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0 20px;
  height: 36px;
}

.search-btn:hover {
  background: #202124;
}

.create-btn {
  background: #10b981;
  border: none;
  border-radius: 6px;
  height: 36px;
  font-weight: 600;
}

.create-btn:hover {
  background: #059669;
}

/* Homework Cards */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.homework-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  transition: all 0.2s;
  overflow: hidden;
}

.homework-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-main {
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
}

.card-info {
  flex: 1;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.homework-title {
  font-size: 18px;
  font-weight: 600;
  color: #202124;
  margin: 0;
  cursor: pointer;
}

.homework-title:hover {
  color: #10b981;
}

.status-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.status-tag.success { background: #e6f7ff; color: #1890ff; }
.status-tag.warning { background: #fff7e6; color: #fa8c16; }
.status-tag.info { background: #f5f5f5; color: #8c8c8c; }

.meta-info {
  display: flex;
  gap: 24px;
  color: #5f6368;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-ops {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-ops .el-button {
  font-size: 18px;
  color: #5f6368;
}

.card-ops .el-button:hover {
  color: #10b981;
}

.card-footer {
  background: #fafafa;
  padding: 12px 24px;
  border-top: 1px solid #f1f3f4;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.p-text {
  font-size: 12px;
  color: #70757a;
}

:deep(.el-progress) {
  flex: 1;
  max-width: 200px;
}

/* Empty State */
.empty-state {
  padding: 100px 0;
  text-align: center;
  background: white;
  border-radius: 8px;
}

.empty-img {
  width: 160px;
  opacity: 0.6;
}

.empty-text {
  margin-top: 16px;
  color: #70757a;
  font-size: 15px;
}

/* Dialog Styling */
:deep(.ketangpai-dialog) {
  border-radius: 12px;
}

:deep(.ketangpai-dialog .el-dialog__header) {
  padding: 24px;
  margin: 0;
  border-bottom: 1px solid #f1f3f4;
}

:deep(.ketangpai-dialog .el-dialog__title) {
  font-weight: 600;
  color: #202124;
}

:deep(.ketangpai-dialog .el-dialog__body) {
  padding: 24px 40px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #3c4043;
}

:deep(.el-textarea__inner), :deep(.el-input__inner) {
  background: #f8fafc;
  border-color: #e2e8f0;
}

:deep(.el-textarea__inner:focus), :deep(.el-input__inner:focus) {
  border-color: #10b981;
}

.textarea-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.import-link {
  color: #10b981;
  font-weight: 600;
  padding: 0;
}

.import-link:hover {
  color: #059669;
}

.ai-btn {
  font-weight: 600;
  margin-left: 12px;
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  border: 1px solid #10b981;
  padding: 2px 10px;
  border-radius: 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.ai-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Questions Management */
.questions-management-section {
    margin-top: 32px;
    background: #fcfcfc;
    border: 1px solid #edf2f7;
    border-radius: 12px;
    overflow: hidden;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #edf2f7;
}

.section-title {
    font-size: 15px;
    font-weight: 700;
    color: #2d3748;
}

.section-tip {
    font-size: 12px;
    color: #a0aec0;
    margin-left: 12px;
}

.questions-list {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.q-manage-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    transition: all 0.2s;
}

.q-manage-item:hover {
    border-color: #10b981;
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}

.q-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.q-idx {
    width: 24px;
    height: 24px;
    background: #edf2f7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    color: #4a5568;
}

.q-score-set {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
}

.q-score-set .unit {
    font-size: 12px;
    color: #718096;
}

.q-actions {
    display: flex;
    gap: 4px;
    margin-left: 12px;
}

.q-content-preview {
    font-size: 14px;
    color: #1a202c;
    line-height: 1.6;
    font-weight: 500;
    margin-bottom: 12px;
}

.q-options-preview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.opt-preview-item {
    font-size: 13px;
    padding: 6px 12px;
    background: #f7fafc;
    border-radius: 6px;
    color: #4a5568;
    display: flex;
    gap: 8px;
}

.opt-preview-item.correct {
    background: #f0fff4;
    color: #38a169;
    font-weight: 600;
}

.opt-label {
    opacity: 0.6;
}

.empty-questions {
    padding: 30px 0;
}

.upload-tip {
  font-size: 12px;
  color: #70757a;
  margin-top: 8px;
}

.content-tip {
  font-size: 13px;
  color: #5f6368;
  margin-right: 8px;
}

.ketangpai-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 40px 24px;
}

.k-btn {
  border-radius: 6px;
  height: 38px;
  padding: 0 24px;
  font-weight: 600;
}

.k-btn.cancel {
  border: 1px solid #dadce0;
  color: #3c4043;
}

.k-btn.draft {
  border: 1px solid #dadce0;
  color: #3c4043;
}

.k-btn.submit {
  background: #10b981;
  border: none;
}

/* Bank Picker Styles remain similar but consistent */
.bank-picker-container {
  padding: 0;
}

.picker-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.selected-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .filter-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-right {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-right {
    flex-direction: column;
    align-items: stretch;
  }
  .search-group {
    flex-direction: column;
  }
  .premium-search, .premium-select {
    width: 100%;
  }
}
</style>
