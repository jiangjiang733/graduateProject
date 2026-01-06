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

    <!-- Main Content -->
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
           <!-- Removed text description as requested -->
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
                        <el-input-number v-model="q.score" :min="0" :max="100" size="small" controls-position="right" @change="calculateTotal" />
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  ArrowLeft, Refresh, CircleCheck, Plus, Collection, Check, Delete, Search, ArrowUp, ArrowDown, MagicStick
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import '@/assets/css/teacher/modern-theme.css'
import { getExamDetail, saveExamQuestions, generateQuestionsWithAi } from '@/api/exam.js'
import { getQuestionList, createQuestion as createBankQuestion } from '@/api/question.js'

const route = useRoute()
const examId = route.params.id

const exam = ref({})
const questions = ref([])
const saving = ref(false)

// Bank Dialog
const bankDialogVisible = ref(false)
const bankQuestions = ref([])
const bankFilter = ref({ type: '', keyword: '' })
const bankPage = ref(1)
const bankTotal = ref(0)
const selectedBankQuestions = ref([])

// Create/Edit Dialog
const createDialogVisible = ref(false)
const isEditIndex = ref(-1)
const form = ref({
    questionType: 'SINGLE',
    score: 5,
    questionContent: '',
    options: [{text:'', isCorrect:false}, {text:'', isCorrect:false}],
    correctIndex: 0,
    correctAnswer: '',
    analysis: ''
})

// AI Dialog
const aiDialogVisible = ref(false)
const aiLoading = ref(false)
const aiForm = ref({
    courseName: '',
    questionCount: 5,
    selectedTypes: ['SINGLE', 'MULTIPLE']
})

const totalScore = computed(() => questions.value.reduce((sum, q) => sum + (q.score || 0), 0))

const loadExamData = async () => {
    try {
        const res = await getExamDetail(examId)
        if(res.success && res.data) {
            exam.value = res.data.exam || {}
            questions.value = (res.data.questions || []).map(q => ({...q}))
        }
    } catch(e) {
        ElMessage.error('加载失败')
    }
}

const saveAll = async () => {
    saving.value = true
    try {
        const dataToSave = questions.value.map((q, idx) => ({
             ...q,
             questionOrder: idx + 1
        }))
        const res = await saveExamQuestions(examId, dataToSave)
        if(res.success) {
            ElMessage.success('保存成功')
            loadExamData()
        } else {
             ElMessage.error(res.message)
        }
    } catch(e) {
        ElMessage.error('保存失败')
    } finally {
        saving.value = false
    }
}

// ------ Bank Logic ------
const openBankDialog = () => {
    bankDialogVisible.value = true
    searchBank()
}

const searchBank = async () => {
    try {
        const params = {
            pageNum: bankPage.value,
            pageSize: 10,
            courseId: exam.value.courseId, 
            type: bankFilter.value.type,
            keyword: bankFilter.value.keyword
        }
        const res = await getQuestionList(params)
        if(res.success) {
            bankQuestions.value = res.data.records
            bankTotal.value = res.data.total
        }
    } catch(e) {}
}

const handleBankSelection = (selection) => {
    selectedBankQuestions.value = selection
}

const confirmImport = () => {
    if(selectedBankQuestions.value.length === 0) return
    const newQs = selectedBankQuestions.value.map(bq => {
         let opts = bq.options
         if(typeof opts === 'object' && opts !== null) opts = JSON.stringify(opts)
         
         return {
             examId: examId,
             questionType: bq.type,
             questionContent: bq.content,
             questionOptions: opts,
             correctAnswer: bq.answer,
             score: 5, 
             analysis: bq.analysis
         }
    })
    questions.value.push(...newQs)
    bankDialogVisible.value = false
    ElMessage.success(`已添加 ${newQs.length} 道试题`)
}

// ------ Create/Edit Logic ------
const openCreateDialog = () => {
    isEditIndex.value = -1
    form.value = {
        questionType: 'SINGLE',
        score: 5,
        questionContent: '',
        options: [{text:'', isCorrect:false}, {text:'', isCorrect:false}],
        correctIndex: 0,
        correctAnswer: '',
        analysis: ''
    }
    createDialogVisible.value = true
}

const editQuestion = (index) => {
    isEditIndex.value = index
    const q = questions.value[index]
    
    let opts = []
    let correctIndex = 0
    try {
        if(q.questionOptions) {
             opts = JSON.parse(q.questionOptions)
             if(Array.isArray(opts)) {
                 if(q.questionType === 'SINGLE') {
                     correctIndex = opts.findIndex(o => o.isCorrect) || 0
                 }
             }
        }
    } catch(e) { opts = [] }
    if(opts.length === 0) opts = [{text:'', isCorrect:false}, {text:'', isCorrect:false}]

    form.value = {
        questionType: q.questionType,
        score: q.score,
        questionContent: q.questionContent,
        options: opts,
        correctIndex: correctIndex,
        correctAnswer: q.answer || q.correctAnswer,
        analysis: q.analysis
    }
    createDialogVisible.value = true
}

const saveLocalQuestion = async () => {
    // 1. Process Data
    const f = form.value
    let optsStr = null
    let ans = f.correctAnswer

    if(['SINGLE', 'MULTIPLE'].includes(f.questionType)) {
        if(f.questionType === 'SINGLE') {
            f.options.forEach((o, i) => o.isCorrect = (i === f.correctIndex))
            ans = String.fromCharCode(65 + f.correctIndex)
        } else {
            // 对于多选，收集所有 isCorrect 为 true 的字母
            const correctChars = f.options
                .map((o, i) => o.isCorrect ? String.fromCharCode(65 + i) : null)
                .filter(c => c !== null)
            ans = correctChars.join('')
        }
        optsStr = JSON.stringify(f.options)
    }

    const qObj = {
        examId: examId,
        questionType: f.questionType,
        questionContent: f.questionContent,
        questionOptions: optsStr,
        answer: ans,
        score: f.score,
        analysis: f.analysis
    }

    if(isEditIndex.value > -1) {
        questions.value[isEditIndex.value] = qObj
        createDialogVisible.value = false
        ElMessage.success('试题已修改')
    } else {
        questions.value.push(qObj)
        createDialogVisible.value = false
        
        ElMessageBox.confirm(
            '试题已添加到试卷。是否同时也将其保存到【公共题库】中，以便在其他考试中复用？',
            '同步到题库',
            {
                confirmButtonText: '保存到题库',
                cancelButtonText: '仅保存到试卷',
                type: 'info',
                distinguishCancelAndClose: true
            }
        ).then(async () => {
            try {
                 const userId = localStorage.getItem('teacherId')
                 await createBankQuestion({
                     courseId: exam.value.courseId,
                     teacherId: userId,
                     type: f.questionType,
                     content: f.questionContent,
                     options: optsStr,
                     answer: ans,
                     difficulty: 1, 
                     analysis: f.analysis
                 })
                 ElMessage.success('已成功同步到题库')
            } catch(e) {
                 ElMessage.warning('添加到题库失败，但试题已保留在试卷中')
            }
        }).catch(() => {
        })
    }
}

const removeQuestion = (index) => {
    questions.value.splice(index, 1)
}

const moveQuestion = (index, delta) => {
    const newIdx = index + delta
    if(newIdx < 0 || newIdx >= questions.value.length) return
    const temp = questions.value[index]
    questions.value[index] = questions.value[newIdx]
    questions.value[newIdx] = temp
}

const calculateTotal = () => {
    // Total score is reactive via computed, but we can trigger update if needed
}

// ------ AI Logic ------
const openAiDialog = () => {
    aiForm.value.courseName = exam.value.courseName || ''
    aiDialogVisible.value = true
}

const handleAiGenerate = async () => {
    if (!aiForm.value.courseName) return ElMessage.warning('请输入课程名称以供 AI 参考')
    if (aiForm.value.selectedTypes.length === 0) return ElMessage.warning('请选择至少一种题型')
    
    aiLoading.value = true
    try {
        const params = {
            courseName: aiForm.value.courseName,
            questionCount: aiForm.value.questionCount,
            questionTypes: aiForm.value.selectedTypes.join(','),
            courseId: exam.value.courseId,
            teacherId: localStorage.getItem('teacherId') || '1'
        }
        
        const res = await generateQuestionsWithAi(params)
        if (res.success && res.data) {
            const aiQs = res.data.map(q => ({
                examId: examId,
                questionType: q.questionType,
                questionContent: q.questionContent,
                questionOptions: q.questionOptions,
                correctAnswer: q.correctAnswer,
                score: q.score || 5,
                analysis: q.analysis
            }))
            questions.value.push(...aiQs)
            ElMessage.success(`AI 已成功生成 ${aiQs.length} 道题目`)
            aiDialogVisible.value = false
        } else {
            ElMessage.error(res.message || 'AI 生成失败')
        }
    } catch (e) {
        console.error(e)
        ElMessage.error('AI 服务暂时不可用，请稍后再试')
    } finally {
        aiLoading.value = false
    }
}

// Helpers
const getTypeTag = (t) => ({ SINGLE: '', MULTIPLE: 'success', JUDGE: 'warning', ESSAY: 'info', SINGLE_CHOICE: '', MULTIPLE_CHOICE: 'success' }[t] || '')
const getTypeLabel = (t) => ({ SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', ESSAY: '简答题', SINGLE_CHOICE: '单选题', MULTIPLE_CHOICE: '多选题' }[t] || t)
const getDiffLabel = (d) => ({ 1: '简单', 2: '中等', 3: '困难' }[d] || d)
const parseOptions = (json) => {
    try {
        return typeof json === 'string' ? JSON.parse(json) : json
    } catch(e) { return [] }
}
const isCorrect = (opt, idx, q) => {
    if (q.questionType === 'SINGLE' || q.questionType === 'MULTIPLE' || q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
        // 1. 如果选项对象本身带有 isCorrect 标记，优先使用
        if (opt && typeof opt === 'object' && opt.isCorrect !== undefined) {
            return opt.isCorrect === true || opt.isCorrect === 'true'
        }
        
        // 2. 否则通过 answer/correctAnswer 字段匹配 (支持 "A", "0", "AB" 等格式)
        const ans = q.answer !== undefined ? q.answer : q.correctAnswer;
        if (ans !== undefined && ans !== null && ans !== '') {
            const ansStr = String(ans);
            const char = String.fromCharCode(65 + idx); // 'A', 'B', 'C'...
            const indexStr = String(idx); // '0', '1', '2'...
            
            if (q.questionType === 'SINGLE' || q.questionType === 'SINGLE_CHOICE') {
                return ansStr === char || ansStr === indexStr;
            } else {
                return ansStr.includes(char) || ansStr.includes(indexStr);
            }
        }
    }
    return false
}

onMounted(() => {
    if(examId) loadExamData()
})
</script>

<style scoped>
.page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
}
.header-content { display: flex; align-items: center; gap: 16px; }
.back-btn { background: white; border: none; font-size: 16px; width: 40px; height: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.page-title { margin: 0; font-size: 20px; color: #1f2937; font-weight: 700; }
.page-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

.question-list-container { padding: 0; min-height: 500px; padding-bottom: 40px; overflow: hidden; }
.list-header { 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 24px; background: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.3);
}
.list-info { display: flex; align-items: center; gap: 12px; }
.list-title { font-size: 18px; font-weight: 700; color: #374151; }
.score-tag { background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); color: #4b5563; }

.empty-state { padding: 60px 0; text-align: center; }

.q-list { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.q-item { 
    border-radius: 16px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.02); transition: all 0.3s; 
    border: 1px solid #f3f4f6; overflow: hidden;
}
.q-item:hover { box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08); transform: translateY(-3px); }

.q-item-header { 
    display: flex; align-items: center; padding: 12px 20px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; gap: 16px; 
}
.q-seq-box { 
    width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; color: #4b5563; 
    display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
}
.q-meta { display: flex; align-items: center; gap: 16px; flex: 1; }
.score-input-box { display: flex; align-items: center; gap: 4px; }
.score-input-box .unit { color: #6b7280; font-size: 12px; }

.q-ops { display: flex; align-items: center; gap: 12px; }
.move-btns { display: flex; background: #f3f4f6; border-radius: 6px; padding: 2px; }

.q-item-content { padding: 20px; }
.q-stem { font-size: 16px; margin-bottom: 16px; color: #1f2937; line-height: 1.6; font-weight: 500; }

.opt-row { 
    display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 10px 16px; border-radius: 10px; border: 1px solid transparent; background: #f9fafb; transition: all 0.2s;
}
.opt-row.correct { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
.opt-idx-circle { width: 24px; height: 24px; border-radius: 12px; background: white; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #6b7280; }
.opt-row.correct .opt-idx-circle { border-color: #10b981; color: #10b981; }
.opt-txt { flex: 1; font-size: 14px; }
.check-icon { font-size: 18px; }

.q-answer-box, .q-analysis-box { margin-top: 16px; background: #f9fafb; padding: 12px; border-radius: 8px; font-size: 14px; }
.q-answer-box .label, .q-analysis-box .label { display: block; font-size: 12px; color: #9ca3af; margin-bottom: 4px; font-weight: 700; }
.q-answer-box .value { color: #10b981; font-weight: 600; }
.q-analysis-box .value { color: #4b5563; }

/* Dialog Styles */
.bank-filter { display: flex; gap: 12px; margin-bottom: 20px; }
.glass-table { border-radius: 12px; overflow: hidden; }
.pagination-row { margin-top: 16px; display: flex; justify-content: flex-end; }

.question-form { padding: 0 10px; }
.options-label { margin: 16px 0 12px; font-weight: 700; color: #374151; font-size: 14px; }
.form-opt-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.opt-idx-label { width: 20px; text-align: center; font-weight: 700; color: #9ca3af; }
.add-opt-btn { margin-left: 32px; margin-top: 8px; }
.del-opt-btn { opacity: 0.5; transition: opacity 0.2s; }
.del-opt-btn:hover { opacity: 1; }

.truncate-2-lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.ai-btn {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: white !important;
    border: none !important;
}
.ai-btn:hover {
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
    opacity: 0.9;
}

.ai-intro {
    text-align: center;
    margin-bottom: 24px;
    color: #6366f1;
}
.ai-intro .el-icon {
    font-size: 40px;
    margin-bottom: 8px;
}
.ai-intro p {
    font-size: 14px;
    color: #6b7280;
}

.ai-config-form {
    padding: 0 20px;
}

.form-tip {
    font-size: 12px;
    color: #9ca3af;
    margin-left: 8px;
}
</style>
