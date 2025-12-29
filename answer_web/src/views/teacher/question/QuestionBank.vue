<template>
  <div class="question-bank modern-page">
    <header class="page-header">
      <div class="title-group">
        <h1 class="main-title">题库管理</h1>
        <div class="status-badge">
          <span class="dot"></span> 实时同步中
        </div>
      </div>
      <div class="action-group">
        <el-button class="action-btn import" plain>
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
        <el-button class="action-btn create" type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>新增试题
        </el-button>
      </div>
    </header>

    <section class="search-bar-container">
      <div class="search-inner">
        <el-select v-model="filter.courseId" placeholder="所有课程" clearable class="custom-select">
          <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
        </el-select>

        <el-select v-model="filter.type" placeholder="所有题型" clearable class="custom-select">
          <el-option label="单选题" value="SINGLE" />
          <el-option label="多选题" value="MULTIPLE" />
          <el-option label="判断题" value="JUDGE" />
          <el-option label="简答题" value="ESSAY" />
        </el-select>

        <div class="search-input-wrapper">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
              v-model="filter.keyword"
              type="text"
              placeholder="搜索题目关键内容..."
              @keyup.enter="handleSearch"
          >
        </div>

        <button class="search-submit" @click="handleSearch">检索</button>
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
const pagination = ref({ current: 1, size: 8, total: 0 })

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
    if(data.type === 'SINGLE') data.options.forEach((o, i) => o.isCorrect = (i === data.correctIndex))
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
/* 1. 基础排版 */
.modern-page {
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* 2. 顶部 Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.main-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

/* 3. 筛选栏 Search Bar */
.search-bar-container {
  margin-bottom: 2rem;
}

.search-inner {
  display: flex;
  background: #fff;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  gap: 0.75rem;
}

.custom-select :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.search-input-wrapper input {
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  font-size: 0.9rem;
}

.search-submit {
  background: #1e293b;
  color: #fff;
  border: none;
  padding: 0 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.search-submit:hover { opacity: 0.9; }

/* 4. 试题网格 Grid */
.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.q-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideUp 0.5s ease forwards;
  opacity: 0;
  display: flex;
  flex-direction: column;
}

.q-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
  border-color: #cbd5e1;
}

.q-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.type-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 700;
  background: #f1f5f9;
}

.type-tag.single { color: #3b82f6; background: #eff6ff; }
.type-tag.multiple { color: #8b5cf6; background: #f5f3ff; }
.type-tag.judge { color: #f59e0b; background: #fffbeb; }

.stem-text {
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 选项列表 */
.option-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
  flex: 1;
}

.option-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  background: #f8fafc;
}

.option-list li.is-correct {
  background: #ecfdf5;
  color: #059669;
  font-weight: 600;
}

.prefix {
  width: 24px;
  height: 24px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 0.75rem;
}

.is-correct .prefix {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

.q-card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #94a3b8;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}

/* 动画 */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 空状态 */
.empty-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 0;
  color: #94a3b8;
}

.empty-icon-wrap {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}
</style>