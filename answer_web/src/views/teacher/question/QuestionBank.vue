<template>
  <div class="question-bank modern-page">
    <header class="page-header animate-fade-in">
      <div class="header-right">
        <el-button class="premium-btn ghost" @click="handleBatchImport">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
        <el-button class="premium-btn primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>新增试题
        </el-button>
      </div>
    </header>

    <section class="filter-section animate-slide-up">
      <div class="glass-panel filter-wrapper">
        <div class="filter-left">
          <div class="filter-group">
            <div class="filter-item">
              <label>所属课程</label>
              <el-select v-model="filter.courseId" placeholder="全部课程" clearable class="premium-select" @change="handleSearch">
                <template #prefix><el-icon><Notebook /></el-icon></template>
                <el-option label="全部课程" value="" />
                <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
              </el-select>
            </div>
            <div class="filter-item">
              <label>题目类型</label>
              <el-select v-model="filter.type" placeholder="全部题型" clearable class="premium-select" @change="handleSearch">
                <template #prefix><el-icon><Clock /></el-icon></template>
                <el-option label="全部题型" value="" />
                <el-option label="单选题" value="SINGLE" />
                <el-option label="多选题" value="MULTIPLE" />
                <el-option label="判断题" value="JUDGE" />
                <el-option label="简答题" value="ESSAY" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="filter-right">
          <div class="search-group">
            <el-input
              v-model="filter.keyword"
              placeholder="搜索题目题干或内容..."
              class="premium-search"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button class="search-btn" @click="handleSearch" type="primary">
              搜索
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <main class="question-grid" v-loading="loading">
      <div v-if="questions.length === 0 && !loading" class="empty-placeholder">
        <div class="empty-icon-wrap">
          <el-icon><DocumentDelete /></el-icon>
        </div>
        <p>空空如也，快去添加第一道试题吧</p>
      </div>
      <article v-for="(q, idx) in questions"
               :key="q.id"
               class="q-card"
               :style="{ '--delay': idx }">
        <div class="q-card-header">
          <div class="tags">
            <span class="type-tag" :class="q.type.toLowerCase()">{{ getTypeLabel(q.type) }}</span>
            <span class="diff-tag">难度 {{ '★'.repeat(q.difficulty) }}</span>
          </div>
          <div class="more-actions">
            <el-dropdown trigger="click">
              <el-icon class="more-icon"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editQuestion(q)">编辑题目</el-dropdown-item>
                  <el-dropdown-item divided @click="handleDeleteQuestion(q)" style="color: #f56c6c">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="q-card-content">
          <p class="stem-text">{{ q.content }}</p>

          <ul class="option-list" v-if="['SINGLE', 'MULTIPLE'].includes(q.type)">
            <li v-for="(opt, oIdx) in q.options" :key="oIdx" :class="{ 'is-correct': opt.isCorrect }">
              <span class="prefix">{{ String.fromCharCode(65 + oIdx) }}</span>
              <span class="text">{{ opt.text }}</span>
              <el-icon v-if="opt.isCorrect" class="check-mark"><Check /></el-icon>
            </li>
          </ul>

          <div class="answer-box" v-else>
            <div class="answer-label">参考答案</div>
            <div class="answer-content">{{ q.answer }}</div>
          </div>
        </div>

        <footer class="q-card-footer">
          <span class="course-name"><el-icon><Notebook /></el-icon> {{ getCourseName(q.courseId) }}</span>
          <span class="update-time">{{ q.updateTime?.split(' ')[0] }}</span>
        </footer>
      </article>
    </main>

    <div class="pagination-container" v-if="pagination.total > 0">
      <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="loadQuestions"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑题目' : '新增题目'" width="600px" custom-class="custom-dialog">
      <el-form :model="form" label-position="top">
        <el-form-item label="关联课程">
          <el-select v-model="form.courseId" placeholder="选择题目所属课程" style="width: 100%">
            <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
        </el-form-item>

        <div class="form-row-2">
          <el-form-item label="题型选择">
            <el-radio-group v-model="form.type" @change="handleTypeChange">
              <el-radio-button label="SINGLE">单选</el-radio-button>
              <el-radio-button label="MULTIPLE">多选</el-radio-button>
              <el-radio-button label="JUDGE">判断</el-radio-button>
              <el-radio-button label="ESSAY">简答</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="难度设定">
            <el-rate v-model="form.difficulty" :max="3" />
          </el-form-item>
        </div>

        <el-form-item label="题目题干">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入题目详细描述..." />
        </el-form-item>

        <div v-if="['SINGLE', 'MULTIPLE'].includes(form.type)" class="options-editor">
          <div class="editor-header">
            <span>选项配置</span>
            <el-button link type="primary" @click="addOption" :disabled="form.options?.length >= 6">+ 添加选项</el-button>
          </div>
          <div v-for="(opt, idx) in form.options" :key="idx" class="option-edit-item">
            <el-checkbox v-model="opt.isCorrect" v-if="form.type === 'MULTIPLE'" />
            <el-radio v-model="form.correctIndex" :label="idx" v-else>&nbsp;</el-radio>
            <el-input v-model="opt.text" placeholder="填写选项内容" />
            <el-icon class="del-opt" @click="removeOption(idx)"><CircleClose /></el-icon>
          </div>
        </div>

        <el-form-item label="正确答案" v-if="form.type === 'JUDGE'">
          <el-radio-group v-model="form.answer">
            <el-radio label="正确">正确</el-radio>
            <el-radio label="错误">错误</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="答案解析 / 参考内容" v-if="form.type === 'ESSAY'">
          <el-input v-model="form.answer" type="textarea" placeholder="输入采分点或标准答案..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="saveQuestion" class="confirm-btn">确认提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Plus, Upload, Search, Check, Delete, MoreFilled,
  Notebook, DocumentDelete, CircleClose
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestionList, createQuestion, updateQuestion, deleteQuestion } from '@/api/question.js'
import { getCourseList } from '@/api/course.js'

// --- 数据定义 ---
const filter = ref({ type: '', difficulty: '', keyword: '', courseId: '' })
const questions = ref([])
const courses = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const pagination = ref({ current: 1, size: 6, total: 0 })

const form = ref({
  courseId: '', type: 'SINGLE', difficulty: 1, content: '',
  options: [{text:'', isCorrect: false}, {text:'', isCorrect: false}],
  correctIndex: 0, answer: ''
})

// --- 核心方法 ---
const getTeacherId = () => localStorage.getItem('teacherId') || '1'

const loadCourses = async () => {
  const res = await getCourseList({ pageNumber: 1, pageSize: 100, teacherId: getTeacherId() })
  if(res.success) courses.value = res.data.list
}

const loadQuestions = async () => {
  loading.value = true
  try {
    const res = await getQuestionList({
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
      teacherId: getTeacherId(),
      ...filter.value
    })
    if(res.success) {
      questions.value = res.data.records.map(q => {
        if(typeof q.options === 'string') q.options = JSON.parse(q.options)
        return q
      })
      pagination.value.total = res.data.total
    }
  } finally { loading.value = false }
}

const handleSearch = () => { pagination.value.current = 1; loadQuestions() }

const openCreateDialog = () => {
  isEdit.value = false
  form.value = {
    courseId: courses.value[0]?.id || '', type: 'SINGLE', difficulty: 1,
    content: '', options: [{text:'', isCorrect: false}, {text:'', isCorrect: false}],
    correctIndex: 0, answer: ''
  }
  dialogVisible.value = true
}

const editQuestion = (q) => {
  isEdit.value = true
  const qCopy = JSON.parse(JSON.stringify(q))
  if(qCopy.type === 'SINGLE') {
    qCopy.correctIndex = qCopy.options.findIndex(o => o.isCorrect)
  }
  form.value = qCopy
  dialogVisible.value = true
}

const saveQuestion = async () => {
  const data = { ...form.value, teacherId: getTeacherId() }
  if(['SINGLE', 'MULTIPLE'].includes(data.type)) {
    if(data.type === 'SINGLE') {
      data.options.forEach((o, i) => o.isCorrect = (i === data.correctIndex))

      data.answer = String.fromCharCode(65 + data.correctIndex)
    } else {
      // 多选题：收集正确选项的字母
      const correctChars = data.options
        .map((o, i) => o.isCorrect ? String.fromCharCode(65 + i) : null)
        .filter(c => c !== null)
      data.answer = correctChars.join('')
    }
    data.options = JSON.stringify(data.options)
  }

  const res = isEdit.value ? await updateQuestion(data) : await createQuestion(data)
  if(res.success) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    loadQuestions()
  }
}

const handleDeleteQuestion = (q) => {
  ElMessageBox.confirm('确定删除该试题？', '警告', { type: 'error' }).then(async () => {
    const res = await deleteQuestion(q.id)
    if(res.success) { ElMessage.success('已删除'); loadQuestions() }
  })
}

// 辅助函数
const handleTypeChange = (v) => { if(v === 'JUDGE') form.value.answer = '正确' }
const addOption = () => form.value.options.push({ text: '', isCorrect: false })
const removeOption = (idx) => form.value.options.splice(idx, 1)
const getTypeLabel = (t) => ({ SINGLE:'单选', MULTIPLE:'多选', JUDGE:'判断', ESSAY:'简答' }[t])
const getCourseName = (id) => courses.value.find(c => c.id === id)?.courseName || '未知课程'

onMounted(() => { loadCourses(); loadQuestions() })
</script>

<style scoped>
.question-bank {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.main-title {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  position: relative;
}

.pulse-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 4px solid rgba(16, 185, 129, 0.2);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

.header-right {
  display: flex;
  gap: 12px;
}

.premium-btn {
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 700;
  transition: all 0.3s;
}

.premium-btn.primary {
  background: #10b981;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
}

.premium-btn.primary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.premium-btn.ghost {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.premium-btn.ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* Filter Bar */
.filter-section {
  margin-bottom: 32px;
}

.filter-wrapper {
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
}

.filter-group {
  display: flex;
  gap: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 2px;
}

:deep(.premium-select) {
  width: 180px;
}

:deep(.premium-select .el-input__wrapper),
:deep(.premium-search .el-input__wrapper) {
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 8px 16px;
  transition: all 0.3s;
}

:deep(.premium-select .el-input__wrapper:hover),
:deep(.premium-search .el-input__wrapper:hover) {
  background-color: #e2e8f0 !important;
}

:deep(.premium-select .el-input__wrapper.is-focus),
:deep(.premium-search .el-input__wrapper.is-focus) {
  background-color: white !important;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
}

.search-group {
  display: flex;
  gap: 8px;
}

.premium-search {
  width: 300px;
}

.search-btn {
  border-radius: 12px;
  padding: 0 24px;
  font-weight: 600;
  background: #1f2937;
  border: none;
}

/* Question Grid */
.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.q-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
}

.q-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: #10b981;
}

.q-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tags {
  display: flex;
  gap: 8px;
}

.type-tag {
  font-size: 11px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.type-tag.single { color: #3b82f6; background: #eff6ff; }
.type-tag.multiple { color: #8b5cf6; background: #f5f3ff; }
.type-tag.judge { color: #f59e0b; background: #fffbeb; }
.type-tag.essay { color: #10b981; background: #ecfdf5; }

.diff-tag {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.stem-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 72px;
}

.option-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
  flex: 1;
}

.option-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  background: #f8fafc;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.option-list li.is-correct {
  background: #ecfdf5;
  color: #059669;
  border-color: #10b981;
}

.prefix {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.is-correct .prefix {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.answer-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 20px;
}

.answer-label {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.answer-content {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
}

.q-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.course-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.update-time {
  font-size: 12px;
  color: #94a3b8;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

.pagination-container {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.empty-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 0;
  background: white;
  border-radius: 24px;
  border: 2px dashed #e2e8f0;
}

.empty-icon-wrap {
  font-size: 64px;
  color: #e2e8f0;
  margin-bottom: 16px;
}
</style>