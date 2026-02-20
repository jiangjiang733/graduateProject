<template>
  <div class="homework-detail modern-page">
    <div class="page-header glass-panel animate-slide-up">
      <div class="header-left">
        <el-button link @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回列表
        </el-button>
        <h1 class="page-title">{{ homework.reportTitle || '作业详情' }}</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" class="glass-btn primary" @click="editHomework">
          <el-icon><Edit /></el-icon> 编辑作业
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-container">
      <div class="left-section">
        <!-- 基本信息卡片 -->
        <div class="detail-card glass-panel animate-slide-up" style="animation-delay: 0.1s">
          <div class="card-title-row">
            <h2 class="section-title">作业要求</h2>
            <el-tag :type="getStatusType(currentStatus)" effect="dark" round>
               {{ getStatusText(currentStatus) }}
            </el-tag>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">所属课程：</span>
              <span class="value">{{ homework.courseName || '未分配课程' }}</span>
            </div>
            <div class="info-item">
              <span class="label">截止时间：</span>
              <span class="value">{{ formatDate(homework.deadline) }}</span>
            </div>
            <div class="info-item">
              <span class="label">总分：</span>
              <span class="value">{{ homework.totalScore }} 分</span>
            </div>
          </div>

          <el-divider />

          <div class="description-content">
            <p v-for="(line, index) in descriptionLines" :key="index" :class="{ 'question-header': line.startsWith('【') }">
              {{ line }}
            </p>
          </div>

          <div v-if="homework.attachmentUrl" class="attachment-box">
             <el-icon><Document /></el-icon>
             <span class="file-name">附件已上传</span>
             <el-link :href="`/api/${homework.attachmentUrl}`" target="_blank" type="primary">点击查阅</el-link>
          </div>

          <!-- 结构化题目预览 -->
          <div v-if="groupedQuestions.length > 0" class="questions-preview-section">
            <el-divider><el-icon><List /></el-icon> 试题列表</el-divider>
            
            <div v-for="group in groupedQuestions" :key="group.typeName" class="question-type-group">
              <div class="type-group-header">
                <h3>{{ group.typeName }}（{{ group.questions.length }}题）</h3>
              </div>

              <div v-for="(q, qIndex) in group.questions" :key="qIndex" class="q-detail-item">
                <div class="q-item-header">
                  <span class="q-num">{{ q.globalIndex }}</span>
                  <el-tag size="small" :type="getQuestionTypeTag(q.questionType)">{{ getQuestionTypeText(q.questionType) }}</el-tag>
                  <span class="q-score">({{ q.score }}分)</span>
                </div>
                <div class="q-item-content">{{ q.questionContent }}</div>
                
                <!-- 选项列表 -->
                <div v-if="['SINGLE', 'MULTIPLE', '1', '2'].includes(String(q.questionType))" class="q-item-options">
                  <div v-for="(opt, oIdx) in parseOptions(q.questionOptions)" :key="oIdx" class="opt-line" :class="{correct: isCorrect(opt, oIdx, q)}">
                    <span class="opt-label">{{ String.fromCharCode(65+oIdx) }}</span>
                    <span class="opt-text">{{ opt.text || opt }}</span>
                    <el-icon v-if="isCorrect(opt, oIdx, q)" class="correct-icon"><Check /></el-icon>
                  </div>
                </div>
                <!-- 判断题 -->
                <div v-else-if="q.questionType === 'JUDGE' || q.questionType === '3'" class="q-item-options">
                    <div class="opt-line" :class="{correct: q.correctAnswer === 'A' || q.correctAnswer === '正确' || q.answer === '正确'}">
                      <span class="opt-label">A</span>
                      <span class="opt-text">正确</span>
                      <el-icon v-if="q.correctAnswer === 'A' || q.correctAnswer === '正确' || q.answer === '正确'" class="correct-icon"><Check /></el-icon>
                    </div>
                    <div class="opt-line" :class="{correct: q.correctAnswer === 'B' || q.correctAnswer === '错误' || q.answer === '错误'}">
                      <span class="opt-label">B</span>
                      <span class="opt-text">错误</span>
                      <el-icon v-if="q.correctAnswer === 'B' || q.correctAnswer === '错误' || q.answer === '错误'" class="correct-icon"><Check /></el-icon>
                    </div>
                </div>

                <div class="q-item-analysis" v-if="q.analysis">
                  <div class="analysis-label">【解析】</div>
                  <div class="analysis-text">{{ q.analysis }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <!-- 统计信息 -->
        <div class="stats-card glass-panel animate-slide-up" style="animation-delay: 0.2s">
          <h2 class="section-title">提交统计</h2>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">{{ homework.submittedCount || 0 }}</div>
              <div class="stat-label">已提交</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">{{ homework.totalStudents || 0 }}</div>
              <div class="stat-label">总人数</div>
            </div>
          </div>
          <div class="progress-wrap">
             <div class="progress-info">
               <span>提交进度</span>
               <span>{{ submitPercentage }}%</span>
             </div>
             <el-progress :percentage="submitPercentage" :show-text="false" stroke-width="12" />
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="actions-card glass-panel animate-slide-up" style="animation-delay: 0.3s">
          <h2 class="section-title">快速操作</h2>
          <div class="action-buttons">
            <el-button class="full-btn" @click="goToGrading">
              <el-icon><Check /></el-icon> 进入批改系统
            </el-button>
            <!-- 只有在实时状态为"进行中"时才显示提前截止按钮 -->
            <el-button class="full-btn warning" @click="closeHomework" v-if="currentStatus === 1">
              <el-icon><CircleClose /></el-icon> 提前截止作业
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑作业对话框 (复用列表页逻辑) -->
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
          <!-- 编辑模式：只显示确定按钮 -->
          <template v-if="isEdit">
            <el-button type="primary" @click="submitHomework" :loading="submitting" class="k-btn submit">确定</el-button>
          </template>
          <!-- 新建模式：显示保存草稿和发布作业 -->
          <template v-else>
            <el-button @click="saveAsDraft" :loading="submitting" class="k-btn draft">保存草稿</el-button>
            <el-button type="primary" @click="submitHomework" :loading="submitting" class="k-btn submit">发布作业</el-button>
          </template>
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
          <!-- 判断题答案 -->
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
  ArrowLeft,
  Edit,
  Document,
  Check,
  CircleClose,
  List,
  Plus,
  Delete,
  MagicStick,
  ArrowUp,
  ArrowDown,
  Checked
} from '@element-plus/icons-vue'
import { useHomeworkDetail } from '@/assets/js/teacher/homework-detail'

const {
  homework,
  loading,
  descriptionLines,
  submitPercentage,
  currentStatus,
  getStatusType,
  getStatusText,
  questionList,
  groupedQuestions,
  getQuestionTypeText,
  getQuestionTypeTag,
  parseOptions,
  isCorrect,
  formatDate,
  editHomework,
  goToGrading,
  closeHomework,
  
  // 编辑弹窗相关
  dialogVisible,
  homeworkForm,
  isEdit,
  submitting,
  formRef,
  courses,
  fileList,
  rules,
  
  // 题库相关
  bankDialogVisible,
  bankLoading,
  bankQuestions,
  bankFilter,
  bankPagination,
  selectedQuestions,
  openQuestionBank,
  searchBank,
  handleBankSelection,
  confirmImportQuestions,
  
  // AI 生成相关
  aiDialogVisible,
  aiLoading,
  aiForm,
  openAiDialog,
  handleAiGenerate,
  
  // 题目编辑相关
  editQuestionDialogVisible,
  editingQuestion,
  openEditQuestion,
  saveEditQuestion,
  addOption,
  removeOption,
  
  // 其他方法
  handleFileChange,
  saveAsDraft,
  submitHomework,
  removeHomeworkQuestion,
  moveHomeworkQuestion,
  calculateHomeworkTotalScore,
  saveToBank
} = useHomeworkDetail()
</script>

<style scoped>
@import '@/assets/css/teacher/homework-detail.css';
@import '@/assets/css/teacher/homework-management.css';
</style>
