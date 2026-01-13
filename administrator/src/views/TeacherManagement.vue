<template>
  <div class="management-container modern-page">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon color="#8b5cf6"><UserFilled /></el-icon>
            <span>教师人才库管理</span>
          </div>
          <el-button type="primary" class="btn-rounded" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 入库受聘教师
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-toolbar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="检索教师姓名、工号、院系..."
          class="modern-input"
          style="width: 320px"
          clearable
          @keyup.enter="loadTeachers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" link @click="loadTeachers">刷新数据</el-button>
        
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
        :data="teachers"
        v-loading="loading"
        class="modern-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="teacherId" label="工号" width="100" />
        <el-table-column label="教师名录" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar-mini" style="background: var(--admin-sidebar-active-bg); color: #8b5cf6;">
                {{ row.teacherUsername.charAt(0) }}
              </div>
              <div class="user-detail">
                <div style="font-weight: 600; color: #1e293b;">{{ row.teacherUsername }}</div>
                <div style="font-size: 12px; color: #64748b;">{{ row.teacherEmail || '未设置邮箱' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="teacherDepartment" label="所属院系" min-width="150" />
        <el-table-column prop="teacherLevel" label="专业职称" width="120">
          <template #default="{ row }">
            <el-tag :type="row.teacherLevel === '教授' ? 'danger' : 'success'" size="small" effect="dark">
              {{ row.teacherLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="teacherPhone" label="联系电话" width="140" />
        <el-table-column label="账户信息" width="160">
          <template #default="{ row }">
            <div class="password-display">
              <span v-if="visiblePasswords[row.teacherId]">
                {{ row.teacherPassword || '********' }}
              </span>
              <span v-else>••••••••</span>
              <el-button 
                type="primary" 
                link 
                @click="togglePasswordVisibility(row.teacherId)"
              >
                <el-icon><View v-if="!visiblePasswords[row.teacherId]" /><Hide v-else /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="权限操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button size="small" plain @click="handleEdit(row)">档案</el-button>
              <el-button size="small" type="info" plain @click="handleResetPassword(row)">锁屏</el-button>
              <el-button size="small" type="danger" plain @click="handleDelete(row)">解聘</el-button>
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
          @size-change="loadTeachers"
          @current-change="loadTeachers"
        />
      </div>
    </el-card>
    
    <!-- 维护对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '修改教职工档案' : '受聘新教师入库'"
      width="550px"
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="modern-form"
      >
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="工号/UID" prop="teacherId">
              <el-input v-model="form.teacherId" :disabled="isEdit" placeholder="唯一识别码" />
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="真实姓名" prop="teacherUsername">
              <el-input v-model="form.teacherUsername" placeholder="请输入教师姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="teacherEmail">
              <el-input v-model="form.teacherEmail" placeholder="edu@university.com" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="teacherPhone">
              <el-input v-model="form.teacherPhone" placeholder="11位手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属学部/院系" prop="teacherDepartment">
              <el-input v-model="form.teacherDepartment" placeholder="例如：计算机学院" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="获聘职称" prop="teacherLevel">
              <el-select v-model="form.teacherLevel" style="width: 100%" placeholder="请选择职称">
                <el-option label="助教" value="助教" />
                <el-option label="讲师" value="讲师" />
                <el-option label="副教授" value="副教授" />
                <el-option label="教授" value="教授" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="登录密码" prop="teacherPassword" v-if="!isEdit">
          <el-input v-model="form.teacherPassword" type="password" show-password placeholder="设置初始登录密钥" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="padding-top: 10px">
          <el-button @click="dialogVisible = false" class="btn-rounded">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" class="btn-rounded">
            同步至数据库
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus, Search, View, Hide, UserFilled, Delete } from '@element-plus/icons-vue'
import { useTeacherManagement } from '@/assets/js/teacher-management'

const {
  loading,
  submitting,
  dialogVisible,
  isEdit,
  formRef,
  teachers,
  selectedIds,
  visiblePasswords,
  searchForm,
  pagination,
  form,
  formRules,
  loadTeachers,
  showAddDialog,
  handleEdit,
  handleSubmit,
  handleDelete,
  handleBatchDelete,
  handleResetPassword,
  handleSelectionChange,
  togglePasswordVisibility
} = useTeacherManagement()

onMounted(() => {
  loadTeachers()
})
</script>

<style scoped>
@import '@/assets/css/variables.css';
@import '@/assets/css/user-management.css';
</style>
