<template>
  <div class="question-bank modern-page">
    <header class="page-header animate-slide-down">
      <div class="header-left">
        <h1 class="page-title">题库管理中心</h1>
        <span class="current-date">{{ currentDate }} | 题库管理</span>
      </div>
      <div class="header-right">
        <el-input
          v-model="filter.keyword"
          placeholder="搜索题目..."
          class="search-input"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" class="add-btn" @click="openCreateDialog">
          <el-icon class="el-icon--left"><Plus /></el-icon> 添加试题
        </el-button>
      </div>
    </header>

    <div class="table-container animate-fade-in" v-loading="loading">
       <div class="filter-bar">
          <el-select v-model="filter.courseId" placeholder="全部课程" clearable class="filter-item" @change="handleSearch">
            <el-option label="全部课程" value="" />
            <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
          <el-select v-model="filter.type" placeholder="全部题型" clearable class="filter-item" @change="handleSearch">
             <el-option label="全部题型" value="" />
             <el-option label="单选题" value="SINGLE" />
             <el-option label="多选题" value="MULTIPLE" />
             <el-option label="判断题" value="JUDGE" />
             <el-option label="简答题" value="ESSAY" />
          </el-select>
       </div>

       <el-table :data="questions" class="no-border-table" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80">
             <template #default="{row, $index}">
                 <span class="id-text">#{{ $index + 1 }}</span>
             </template>
          </el-table-column>
          <el-table-column label="题目内容" min-width="300">
             <template #default="{row}">
               <div class="content-cell">
                  <div class="q-content truncate-2-lines">{{ row.content }}</div>
                  <div class="q-time">创建时间: {{ row.createTime || row.updateTime || '2025-01-19' }}</div>
               </div>
             </template>
          </el-table-column>
          <el-table-column label="类型" width="120">
             <template #default="{row}">
                <span class="type-tag" :class="row.type?.toLowerCase()">{{ getTypeLabel(row.type) }}</span>
             </template>
          </el-table-column>
          <el-table-column label="分值" width="100">
             <template #default>
                <span class="score-text">5</span>
             </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
             <template #default="{row}">
                <div class="ops-group">
                   <el-button type="primary" link class="edit-btn" @click="editQuestion(row)">编辑</el-button>
                   <el-button type="danger" link class="del-btn" @click="handleDeleteQuestion(row)">删除</el-button>
                </div>
             </template>
          </el-table-column>
          <template #empty>
             <el-empty description="暂无试题数据" />
          </template>
       </el-table>
       
       <div class="pagination-container" v-if="pagination.total > 0">
         <el-pagination
             v-model:current-page="pagination.current"
             v-model:page-size="pagination.size"
             :total="pagination.total"
             layout="total, prev, pager, next"
             @current-change="loadQuestions"
             background
         />
       </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑题目' : '新增题目'" width="700px" class="premium-dialog" :close-on-click-modal="false" destroy-on-close>
      
      <div class="dialog-body-content">
          <!-- Course & Difficulty Row -->
          <div class="form-section" style="display: flex; gap: 20px; padding: 16px;">
              <div style="flex: 1">
                  <div class="section-title" style="margin-bottom: 8px">所属课程</div>
                  <el-select v-model="form.courseId" placeholder="选择课程" class="glass-select" style="width: 100%">
                    <el-option v-for="c in courses" :key="c.id" :label="c.courseName" :value="c.id" />
                  </el-select>
              </div>
              <div>
                  <div class="section-title" style="margin-bottom: 8px">难度</div>
                  <el-rate v-model="form.difficulty" :max="3" :texts="['简单', '中等', '困难']" show-text />
              </div>
          </div>

          <!-- Type Tabs -->
          <div class="custom-tabs" v-if="!isEdit">
               <div class="tab-item" :class="{ active: form.type === 'SINGLE' }" @click="form.type = 'SINGLE'">单选题</div>
               <div class="tab-item" :class="{ active: form.type === 'MULTIPLE' }" @click="form.type = 'MULTIPLE'">多选题</div>
               <div class="tab-item" :class="{ active: form.type === 'JUDGE' }" @click="form.type = 'JUDGE'">判断题</div>
               <div class="tab-item" :class="{ active: form.type === 'ESSAY' }" @click="form.type = 'ESSAY'">简答题</div>
          </div>

          <!-- Content Section -->
          <div class="form-section">
               <div class="section-title">题目干内容</div>
               <el-input 
                   v-model="form.content" 
                   type="textarea" 
                   :rows="4" 
                   placeholder="在此输入题目描述信息..." 
                   class="clean-textarea"
                   resize="none"
               />
           </div>

           <!-- Options Section -->
           <div class="form-section" v-if="['SINGLE', 'MULTIPLE'].includes(form.type)">
               <div class="section-header">
                   <div class="section-title">题目选项配置 (最多6项)</div>
                   <el-button link type="primary" size="small" @click="addOption" :disabled="form.options.length >= 6">
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
                       <el-button link type="danger" class="del-btn" @click="removeOption(idx)" v-if="form.options.length > 2">
                           <el-icon><Delete /></el-icon>
                       </el-button>
                   </div>
               </div>
           </div>

           <!-- Answer Section for Judge/Essay -->
           <div class="form-section" v-if="['JUDGE', 'ESSAY'].includes(form.type)">
               <div class="section-title">正确答案/参考</div>
               
               <div v-if="form.type === 'JUDGE'" class="judge-options">
                   <div class="judge-item" :class="{ active: form.answer === 'A' }" @click="form.answer = 'A'">
                       <div class="radio-circle"></div>
                       <span>A. 正确</span>
                   </div>
                   <div class="judge-item" :class="{ active: form.answer === 'B' }" @click="form.answer = 'B'">
                       <div class="radio-circle"></div>
                       <span>B. 错误</span>
                   </div>
               </div>

               <el-input 
                   v-if="form.type === 'ESSAY'"
                   v-model="form.answer"
                   type="textarea" 
                   :rows="3" 
                   placeholder="在此输入参考答案或采分点..." 
                   class="clean-textarea"
               />
           </div>

      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="saveQuestion" class="save-btn">确认提交</el-button>
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