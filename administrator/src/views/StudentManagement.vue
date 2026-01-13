<template>
  <div class="management-container modern-page">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon color="#3b82f6"><User /></el-icon>
            <span>学生账号管理中心</span>
          </div>
          <el-button type="primary" class="btn-rounded" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增学生
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-toolbar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索学生姓名、学号、邮箱..."
          class="modern-input"
          style="width: 320px"
          clearable
          @keyup.enter="loadStudents"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" link @click="loadStudents">刷新列表</el-button>
        
        <div style="flex: 1"></div>
        
        <el-button
          type="danger"
          plain
          class="btn-rounded"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon> 批量注销 ({{ selectedIds.length }})
        </el-button>
      </div>
      
      <!-- 数据表格 -->
      <el-table
        :data="students"
        v-loading="loading"
        class="modern-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentsId" label="学号" width="100" />
        <el-table-column label="学生信息" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar-mini">{{ row.studentsUsername.charAt(0) }}</div>
              <div class="user-detail">
                <div style="font-weight: 600; color: #1e293b;">{{ row.studentsUsername }}</div>
                <div style="font-size: 12px; color: #64748b;">{{ row.studentsEmail }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="studentsMajor" label="专业领域" width="160" />
        <el-table-column prop="studentsGrade" label="所在年级" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.studentsGrade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账户安全" width="180">
          <template #default="{ row }">
            <div class="password-display">
              <span v-if="visiblePasswords[row.studentsId]">
                {{ row.studentsPassword || '********' }}
              </span>
              <span v-else>••••••••</span>
              <el-button 
                type="primary" 
                link 
                @click="togglePasswordVisibility(row.studentsId)"
              >
                <el-icon><View v-if="!visiblePasswords[row.studentsId]" /><Hide v-else /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作管理" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button size="small" plain @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="info" plain @click="handleResetPassword(row)">重置</el-button>
              <el-button size="small" type="danger" plain @click="handleDelete(row)">注销</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 页码导航 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNumber"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadStudents"
          @current-change="loadStudents"
        />
      </div>
    </el-card>
    
    <!-- 维护对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑学生档案' : '录入新学生'"
      width="500px"
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="modern-form"
      >
        <el-form-item label="真实姓名" prop="studentsUsername">
          <el-input v-model="form.studentsUsername" placeholder="请输入学生姓名" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学籍邮箱" prop="studentsEmail">
              <el-input v-model="form.studentsEmail" placeholder="example@edu.com" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在年级" prop="studentsGrade">
              <el-input v-model="form.studentsGrade" placeholder="例如：2023级" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="主修专业" prop="studentsMajor">
          <el-input v-model="form.studentsMajor" placeholder="请输入所属学院及专业" />
        </el-form-item>
        
        <el-form-item label="初始密码" prop="studentsPassword" v-if="!isEdit">
          <el-input v-model="form.studentsPassword" type="password" show-password placeholder="设置初始登录密码" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="padding-top: 10px">
          <el-button @click="dialogVisible = false" class="btn-rounded">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" class="btn-rounded">
            同步数据
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus, Search, View, Hide, User, Delete } from '@element-plus/icons-vue'
import { useStudentManagement } from '@/assets/js/student-management'

const {
  loading,
  submitting,
  dialogVisible,
  isEdit,
  formRef,
  students,
  selectedIds,
  visiblePasswords,
  searchForm,
  pagination,
  form,
  formRules,
  loadStudents,
  showAddDialog,
  handleEdit,
  handleSubmit,
  handleDelete,
  handleBatchDelete,
  handleResetPassword,
  handleSelectionChange,
  togglePasswordVisibility
} = useStudentManagement()

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
@import '@/assets/css/variables.css';
@import '@/assets/css/user-management.css';
</style>
