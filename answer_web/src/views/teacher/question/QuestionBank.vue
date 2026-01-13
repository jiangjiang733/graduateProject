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
            <span class="type-tag" :class="q.type?.toLowerCase()">{{ getTypeLabel(q.type) }}</span>
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

          <ul class="option-list" v-if="['SINGLE', 'MULTIPLE', 'JUDGE'].includes(q.type)">
          
            <template v-if="q.type === 'JUDGE'">
              <li :class="{ 'is-correct': q.answer === 'A' || q.answer === '错误' }">
                <span class="prefix">A</span>
                <span class="text">正确</span>
                <el-icon v-if="q.answer === 'A' || q.answer === '错误'" class="check-mark"><Check /></el-icon>
              </li>
              <li :class="{ 'is-correct': q.answer === 'B' || q.answer === '正确' }">
                <span class="prefix">B</span>
                <span class="text">错误</span>
                <el-icon v-if="q.answer === 'B' || q.answer === '正确'" class="check-mark"><Check /></el-icon>
              </li>
            </template>
            <!-- 单选/多选：显示数据库中的选项 -->
            <template v-else>
              <li v-for="(opt, oIdx) in q.options" :key="oIdx" :class="{ 'is-correct': opt.isCorrect }">
                <span class="prefix">{{ String.fromCharCode(65 + oIdx) }}</span>
                <span class="text">{{ opt.text }}</span>
                <el-icon v-if="opt.isCorrect" class="check-mark"><Check /></el-icon>
              </li>
            </template>
          </ul>

          <div class="answer-box" v-else-if="q.type === 'ESSAY'">
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
            <el-radio label="A">A. 正确</el-radio>
            <el-radio label="B">B. 错误</el-radio>
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
import {
  Plus, Upload, Search, Check, Delete, MoreFilled,
  Notebook, DocumentDelete, CircleClose, Clock
} from '@element-plus/icons-vue'
import { useQuestionBank } from '@/assets/js/teacher/question-bank.js'

const {
  filter,
  questions,
  courses,
  loading,
  dialogVisible,
  isEdit,
  pagination,
  form,
  loadQuestions,
  handleSearch,
  openCreateDialog,
  editQuestion,
  saveQuestion,
  handleDeleteQuestion,
  handleTypeChange,
  addOption,
  removeOption,
  getTypeLabel,
  getCourseName,
  handleBatchImport
} = useQuestionBank()
</script>

<style scoped>
@import '@/assets/css/teacher/question-bank.css';
</style>