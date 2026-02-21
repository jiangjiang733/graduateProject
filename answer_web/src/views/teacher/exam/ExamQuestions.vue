<template>
  <div class="exam-questions modern-page">
    <div class="page-header sticky-header animate-fade-in">
      <div class="header-left">
        <el-button class="back-btn" @click="$router.push('/teacher/exams')" icon="ArrowLeft" text></el-button>
        <h2>{{ exam.examTitle || '加载中...' }}</h2>
      </div>

      <div class="segmented-control">
        <div class="segment" @click="$router.push(`/teacher/exam/${examId}`)">试卷综合预览</div>
        <div class="segment active">编辑试题内容</div>
        <div class="segment" @click="$router.push(`/teacher/exam/${examId}/scores`)">作答数据分析</div>
      </div>

      <div class="header-actions">
        <el-button class="glass-btn" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新建试题
        </el-button>
        <el-button class="glass-btn" @click="openAiDialog">
          <el-icon><MagicStick /></el-icon> AI出题
        </el-button>
        <el-button class="glass-btn" @click="loadExamData" icon="Refresh">刷新</el-button>
       
      </div>
    </div>

    <div class="main-content">
      <!-- Left Panel: Question Bank (matches image 0) -->
      <div class="panel animate-slide-left">
        <div class="panel-header blue">
          <div class="panel-title">
            <el-icon><Collection /></el-icon>
            题库 ({{ bankQuestions.length }}道)
          </div>
        </div>
        <div class="panel-body">
          <div class="panel-search">
             <el-input 
               v-model="bankFilter.keyword" 
               placeholder="搜索题目内容..." 
               prefix-icon="Search" 
               clearable
               class="search-input"
               @keyup.enter="searchBank"
             />
          </div>
          <div v-loading="loadingBank" class="q-card-list">
             <div 
               v-for="q in bankQuestions" 
               :key="q.id" 
               class="q-card-item"
               :class="{ 'already-added': isQuestionInExam(q) }"
             >
                <div class="q-card-top">
                  <div class="q-card-tags">
                     <span class="type-badge" :class="q.type?.toLowerCase()">{{ getTypeLabel(q.type) }}</span>
                     <span class="score-badge">5分</span>
                  </div>
                  <div 
                    class="q-action-btn" 
                    :class="isQuestionInExam(q) ? 'added' : 'add'" 
                    @click="isQuestionInExam(q) ? null : addFromBank(q)"
                  >
                     <el-icon v-if="isQuestionInExam(q)"><Check /></el-icon>
                     <el-icon v-else><Plus /></el-icon>
                  </div>
                </div>
                <div class="q-stem-preview">{{ q.content }}</div>
                <div class="q-options-preview" v-if="q.options">
                   {{ formatOptionsPreview(q.options) }}
                </div>
             </div>
             <el-empty v-if="bankQuestions.length === 0" description="暂无试题" />
          </div>
        </div>
      </div>

      <!-- Right Panel: Exam Questions (matches image 0) -->
      <div class="panel animate-slide-right">
        <div class="panel-header green">
          <div class="panel-title">
            <el-icon><Document /></el-icon>
            试卷题目 ({{ questions.length }}道)
          </div>
          <div class="total-score">总分: {{ totalScore }}</div>
        </div>
        <div class="panel-body">
          <div class="q-card-list">
             <div v-for="(q, index) in questions" :key="index" class="q-card-item">
                <div class="q-card-top">
                  <div class="exam-item-header">
                     <div class="q-num">{{ index + 1 }}</div>
                     <div class="q-card-tags">
                        <span class="type-badge" :class="q.questionType?.toLowerCase()">{{ getTypeLabel(q.questionType) }}</span>
                        <div class="score-badge">
                           <el-input-number v-model="q.score" :min="0" :max="100" size="small" controls-position="right" style="width: 80px" /> 分
                        </div>
                     </div>
                  </div>
                  <div class="item-ops">
                     <el-button link type="primary" @click="editQuestion(index)">编辑</el-button>
                     <el-button link type="danger" @click="removeQuestion(index)">移除</el-button>
                  </div>
                </div>
                <div class="q-stem-preview" v-html="q.questionContent"></div>
                <div class="q-options-preview" v-if="q.questionOptions">
                   {{ formatOptionsPreview(q.questionOptions) }}
                </div>
                <div class="q-answer-preview">
                   <span class="label">正确答案:</span>
                   <span class="value">{{ q.answer || q.correctAnswer || '未设置' }}</span>
                </div>
             </div>
             <el-empty v-if="questions.length === 0" description="试卷尚无题目，请从左侧添加" />
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Actions -->
    <div class="fixed-footer">
       <el-button type="info" @click="$router.push('/teacher/exams')" class="glass-btn">返回试卷列表</el-button>
       <el-button type="success" @click="saveAll" :loading="saving" class="bottom-save-btn">
          <el-icon><CircleCheck /></el-icon> 保存配置并发布
       </el-button>
    </div>

    <!-- Dialog: Import from Bank -->
    <el-dialog v-model="bankDialogVisible" title="引用题库试题" width="850px" class="glass-dialog" :close-on-click-modal="false">
      <div class="bank-filter glass-form-row">
         <el-select v-model="bankFilter.type" placeholder="题型" clearable class="glass-select" style="width: 120px">
            <el-option label="单选" value="SINGLE" />
            <el-option label="多选" value="MULTIPLE" />
            <el-option label="判断" value="JUDGE" />
            <el-option label="简答" value="ESSAY" />
         </el-select>
         <el-input v-model="bankFilter.keyword" placeholder="搜索题目内容..." class="glass-input" style="width: 240px" prefix-icon="Search" @keyup.enter="searchBank" />
         <el-button class="glass-btn primary" @click="searchBank">搜索</el-button>
      </div>
      <el-table :data="bankQuestions" height="400px" style="width: 100%" @selection-change="handleBankSelection" class="glass-table">
         <el-table-column type="selection" width="50" />
         <el-table-column label="题型" width="90">
            <template #default="{row}">
               <el-tag size="small" :type="getTypeTag(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
            </template>
         </el-table-column>
         <el-table-column label="题目内容" show-overflow-tooltip>
            <template #default="{row}">
               <div class="truncate-2-lines" v-html="row.content"></div>
            </template>
         </el-table-column>
         <el-table-column label="难度" width="80" align="center">
            <template #default="{row}">{{ getDiffLabel(row.difficulty) }}</template>
         </el-table-column>
      </el-table>
      <div class="pagination-row">
         <el-pagination layout="prev, pager, next" :total="bankTotal" v-model:current-page="bankPage" :page-size="10" @current-change="searchBank" background />
      </div>
      <template #footer>
         <el-button @click="bankDialogVisible = false">取消</el-button>
         <el-button type="primary" @click="confirmImport">确认引用 ({{ selectedBankQuestions.length }})</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createDialogVisible" :title="isEditIndex > -1 ? '编辑试题' : '新建试题'" width="700px" class="premium-dialog" :close-on-click-modal="false" destroy-on-close>
       
       <div class="dialog-body-content">
           <!-- Custom Tabs -->
           <div class="custom-tabs" v-if="isEditIndex === -1">
               <div class="tab-item" :class="{ active: form.questionType === 'SINGLE' }" @click="form.questionType = 'SINGLE'">单选题</div>
               <div class="tab-item" :class="{ active: form.questionType === 'MULTIPLE' }" @click="form.questionType = 'MULTIPLE'">多选题</div>
               <div class="tab-item" :class="{ active: form.questionType === 'JUDGE' }" @click="form.questionType = 'JUDGE'">判断题</div>
               <div class="tab-item" :class="{ active: form.questionType === 'ESSAY' }" @click="form.questionType = 'ESSAY'">填空/简答</div>
           </div>

           <!-- Content Section -->
           <div class="form-section">
               <div class="section-title">题目干内容</div>
               <el-input 
                   v-model="form.questionContent" 
                   type="textarea" 
                   :rows="4" 
                   placeholder="在此输入题目描述信息..." 
                   class="clean-textarea"
                   resize="none"
               />
           </div>

           <!-- Options Section -->
           <div class="form-section" v-if="['SINGLE', 'MULTIPLE'].includes(form.questionType)">
               <div class="section-header">
                   <div class="section-title">题目选项配置 (最多6项)</div>
                   <el-button link type="primary" size="small" @click="form.options.push({text:'', isCorrect:false})" :disabled="form.options.length >= 6">
                       <el-icon><Plus /></el-icon> 添加
                   </el-button>
               </div>
               
               <div class="options-container">
                   <div v-for="(opt, idx) in form.options" :key="idx" class="styled-option-row">
                       <!-- Badge / Checkbox -->
                       <div class="option-prefix" :class="{ active: opt.isCorrect }" @click="toggleCorrect(idx)">
                           <span v-if="!opt.isCorrect">{{ String.fromCharCode(65+idx) }}</span>
                           <el-icon v-else><Check /></el-icon>
                       </div>
                       
                       <!-- Input -->
                       <el-input 
                           v-model="opt.text" 
                           :placeholder="`请输入选项 ${String.fromCharCode(65+idx)} 内容...`" 
                           class="clean-input"
                       />
                       
                       <!-- Delete -->
                       <el-button link type="danger" class="del-btn" @click="form.options.splice(idx,1)" v-if="form.options.length > 2">
                           <el-icon><Delete /></el-icon>
                       </el-button>
                   </div>
               </div>
           </div>

           <!-- Answer Section for Judge/Essay -->
           <div class="form-section" v-if="['JUDGE', 'ESSAY'].includes(form.questionType)">
               <div class="section-title">正确答案设置</div>
               
               <div v-if="form.questionType === 'JUDGE'" class="judge-options">
                   <div class="judge-item" :class="{ active: form.correctAnswer === '正确' || form.correctAnswer === 'A' }" @click="form.correctAnswer = 'A'">
                       <div class="radio-circle"></div>
                       <span>A. 正确</span>
                   </div>
                   <div class="judge-item" :class="{ active: form.correctAnswer === '错误' || form.correctAnswer === 'B' }" @click="form.correctAnswer = 'B'">
                       <div class="radio-circle"></div>
                       <span>B. 错误</span>
                   </div>
               </div>

               <el-input 
                   v-if="form.questionType === 'ESSAY'"
                   v-model="form.correctAnswer"
                   type="textarea" 
                   :rows="3" 
                   placeholder="在此输入参考答案..." 
                   class="clean-textarea"
               />
           </div>
           
           <!-- Analysis Section -->
           <div class="form-section">
               <div class="section-title">题目解析 (可选)</div>
               <el-input 
                   v-model="form.analysis" 
                   type="textarea" 
                   :rows="2" 
                   placeholder="输入题目解析..." 
                   class="clean-textarea"
               />
           </div>
           
           <!-- Score Section -->
           <div class="score-row">
                <span class="label">本题分值:</span>
                <el-input-number v-model="form.score" :min="0" :max="100" controls-position="right" size="default" />
           </div>

       </div>

       <template #footer>
          <div class="dialog-footer">
              <el-button @click="createDialogVisible = false" class="cancel-btn">取消</el-button>
              <el-button type="primary" @click="saveLocalQuestion" class="save-btn">保存题目</el-button>
          </div>
       </template>
    </el-dialog>
    
    <!-- Dialog: AI Generation -->
    <el-dialog v-model="aiDialogVisible" title="AI 智能出题" width="500px" class="glass-dialog ai-dialog">
       <div class="ai-intro">
          <el-icon><MagicStick /></el-icon>
          <p>AI 将根据当前课程内容为您智能生成相关试题</p>
       </div>
       <el-form :model="aiForm" label-width="100px" class="ai-config-form">
          <el-form-item label="生成课程">
             <el-input v-model="aiForm.courseName" placeholder="例如：Java Web 程序设计" />
          </el-form-item>
          <el-form-item label="题目数量">
             <el-input-number v-model="aiForm.questionCount" :min="1" :max="20" />
          </el-form-item>
          <el-form-item label="期望题型">
             <el-checkbox-group v-model="aiForm.selectedTypes">
                <el-checkbox label="SINGLE">单选题</el-checkbox>
                <el-checkbox label="MULTIPLE">多选题</el-checkbox>
                <el-checkbox label="JUDGE">判断题</el-checkbox>
                <el-checkbox label="ESSAY">简答题</el-checkbox>
             </el-checkbox-group>
          </el-form-item>
       </el-form>
       <template #footer>
          <el-button @click="aiDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="aiLoading" @click="handleAiGenerate">
             开始生成试题
          </el-button>
       </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { 
  ArrowLeft, Refresh, CircleCheck, Plus, Collection, Check, Delete, Search, ArrowUp, ArrowDown, MagicStick, Document
} from '@element-plus/icons-vue'
import { useExamQuestions } from '@/assets/js/teacher/exam-questions'

const route = useRoute()
const examId = route.params.id

const {
  exam,
  questions,
  saving,
  bankDialogVisible,
  bankQuestions,
  bankFilter,
  bankPage,
  bankTotal,
  selectedBankQuestions,
  createDialogVisible,
  isEditIndex,
  form,
  aiDialogVisible,
  aiLoading,
  aiForm,
  totalScore,
  loadExamData,
  saveAll,
  openBankDialog,
  searchBank,
  handleBankSelection,
  confirmImport,
  openCreateDialog,
  editQuestion,
  saveLocalQuestion,
  removeQuestion,
  moveQuestion,
  openAiDialog,
  handleAiGenerate,
  getTypeTag,
  getTypeLabel,
  getDiffLabel,
  parseOptions,
  isCorrect,
  loadingBank,
  addFromBank,
  formatOptionsPreview,
  toggleCorrect
} = useExamQuestions(examId)

// 判断题库中的题目是否已在试卷中
const isQuestionInExam = (bankQuestion) => {
  return questions.value.some(q => 
    q.questionId === bankQuestion.id || 
    q.questionContent === bankQuestion.content
  )
}

</script>

<style scoped>
@import '@/assets/css/teacher/exam-questions.css';
</style>
