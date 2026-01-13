<template>
  <div class="exam-questions modern-page">
    <!-- Header -->
    <div class="page-header animate-fade-in">
      <div class="header-content">
        <el-button icon="ArrowLeft" circle class="back-btn glass-btn" @click="$router.push('/teacher/exams')" />
        <div>
          <h1 class="page-title">{{ exam.examTitle || '加载中...' }}</h1>
          <p class="page-subtitle">试题管理 & 配置</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button class="glass-btn" @click="loadExamData" icon="Refresh">刷新</el-button>
        <el-button class="glass-btn primary" @click="saveAll" :loading="saving">
          <el-icon><CircleCheck /></el-icon> 保存配置
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <!-- Question List -->
      <div class="question-list-container glass-panel animate-slide-up">
        <div class="list-header">
          <div class="list-info">
             <span class="list-title">试题列表</span>
             <el-tag effect="dark" round class="score-tag">共 {{ questions.length }} 题 / 总分 {{ totalScore }}</el-tag>
          </div>
          <div class="list-actions">
              <el-button class="glass-btn" @click="openBankDialog">
                <el-icon><Collection /></el-icon> 引用题库
              </el-button>
              <el-button class="glass-btn ai-btn" @click="openAiDialog">
                <el-icon><MagicStick /></el-icon> AI智能出题
              </el-button>
              <el-button class="glass-btn success" @click="openCreateDialog">
                <el-icon><Plus /></el-icon> 新建试题
              </el-button>
          </div>
        </div>

        <div v-if="questions.length === 0" class="empty-state">
           <el-empty :description="null" :image-size="160" />
        </div>

        <div v-else class="q-list">
           <div v-for="(q, index) in questions" :key="index" class="q-item">
              <div class="q-item-header">
                 <div class="q-seq-box">
                    <span class="q-seq-num">{{ index + 1 }}</span>
                 </div>
                 <div class="q-meta">
                    <el-tag :type="getTypeTag(q.questionType)" effect="light">{{ getTypeLabel(q.questionType) }}</el-tag>
                     <div class="score-input-box">
                        <el-input-number v-model="q.score" :min="0" :max="100" size="small" controls-position="right" />
                        <span class="unit">分</span>
                     </div>
                 </div>
                 <div class="q-ops">
                    <el-button link type="primary" @click="editQuestion(index)">编辑</el-button>
                    <el-button link type="danger" @click="removeQuestion(index)">移除</el-button>
                    <div class="move-btns">
                       <el-button link size="small" :disabled="index===0" @click="moveQuestion(index, -1)">
                         <el-icon><ArrowUp /></el-icon>
                       </el-button>
                       <el-button link size="small" :disabled="index===questions.length-1" @click="moveQuestion(index, 1)">
                         <el-icon><ArrowDown /></el-icon>
                       </el-button>
                    </div>
                 </div>
              </div>
              <div class="q-item-content">
                 <div class="q-stem" v-html="q.questionContent"></div>
                 <!-- Options -->
                 <div class="q-options" v-if="['SINGLE', 'MULTIPLE'].includes(q.questionType)">
                    <div v-for="(opt, idx) in parseOptions(q.questionOptions)" :key="idx" class="opt-row" :class="{correct: isCorrect(opt, idx, q)}">
                       <div class="opt-idx-circle">{{ String.fromCharCode(65+idx) }}</div>
                       <span class="opt-txt">{{ opt.text || opt.value }}</span>
                       <el-icon v-if="isCorrect(opt, idx, q)" color="#10b981" class="check-icon"><Check /></el-icon>
                    </div>
                 </div>
                 <!-- Answer for text -->
                 <div v-if="['JUDGE', 'ESSAY'].includes(q.questionType)" class="q-answer-box">
                    <span class="label">参考答案</span>
                    <div class="value">{{ q.correctAnswer }}</div>
                 </div>
                 <div class="q-analysis-box" v-if="q.analysis">
                    <span class="label">解析</span>
                    <div class="value">{{ q.analysis }}</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
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

    <el-dialog v-model="createDialogVisible" :title="isEditIndex > -1 ? '编辑试题' : '新建试题'" width="650px" class="glass-dialog" :close-on-click-modal="false">
       <el-form :model="form" label-width="80px" class="question-form">
          <el-form-item label="题型" v-if="isEditIndex === -1">
             <el-radio-group v-model="form.questionType" class="type-radio-group">
                <el-radio-button label="SINGLE">单选</el-radio-button>
                <el-radio-button label="MULTIPLE">多选</el-radio-button>
                <el-radio-button label="JUDGE">判断</el-radio-button>
                <el-radio-button label="ESSAY">简答</el-radio-button>
             </el-radio-group>
          </el-form-item>
          <el-form-item label="分值">
             <el-input-number v-model="form.score" :min="0" :max="100" controls-position="right" />
             <span class="form-tip">（设为0表示不计分，上限100）</span>
          </el-form-item>
          <el-form-item label="题目内容">
             <el-input v-model="form.questionContent" type="textarea" :rows="3" placeholder="请输入题目描述..." />
          </el-form-item>

          <!-- Options Editor for Choice -->
          <template v-if="['SINGLE', 'MULTIPLE'].includes(form.questionType)">
              <div class="options-label">选项设置</div>
              <div v-for="(opt, idx) in form.options" :key="idx" class="form-opt-row animate-fade-in">
                  <div class="opt-check">
                      <el-checkbox v-model="opt.isCorrect" v-if="form.questionType==='MULTIPLE'"/>
                      <el-radio v-model="form.correctIndex" :label="idx" v-else>&nbsp;</el-radio>
                  </div>
                  <span class="opt-idx-label">{{ String.fromCharCode(65+idx) }}</span>
                  <el-input v-model="opt.text" placeholder="选项内容" />
                  <el-button link type="danger" class="del-opt-btn" @click="form.options.splice(idx,1)">
                      <el-icon><Delete /></el-icon>
                  </el-button>
              </div>
              <el-button class="add-opt-btn" link type="primary" @click="form.options.push({text:'', isCorrect:false})">
                  <el-icon><Plus /></el-icon> 添加选项
              </el-button>
          </template>
          
          <el-form-item label="参考答案" v-if="['JUDGE', 'ESSAY'].includes(form.questionType)" style="margin-top: 16px;">
              <el-input v-model="form.correctAnswer" type="textarea" :rows="3" v-if="form.questionType==='ESSAY'" placeholder="请输入参考答案" />
              <el-radio-group v-model="form.correctAnswer" v-else>
                 <el-radio label="正确">正确</el-radio>
                 <el-radio label="错误">错误</el-radio>
              </el-radio-group>
          </el-form-item>
          
          <el-form-item label="解析">
             <el-input v-model="form.analysis" type="textarea" :rows="2" placeholder="请输入题目解析（可选）" />
          </el-form-item>
       </el-form>
       <template #footer>
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveLocalQuestion">确定</el-button>
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
  ArrowLeft, Refresh, CircleCheck, Plus, Collection, Check, Delete, Search, ArrowUp, ArrowDown, MagicStick
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
  isCorrect
} = useExamQuestions(examId)
</script>

<style scoped>
@import '@/assets/css/teacher/exam-questions.css';
</style>
