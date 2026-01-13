<template>
  <div class="management-container modern-page">
    <el-card class="content-card table-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon color="#10b981"><Bell /></el-icon>
            <span>系统通告发布中心</span>
          </div>
          <el-button type="success" class="btn-rounded" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 发布新公告
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-toolbar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索公告标题或关键词..."
          class="modern-input"
          style="width: 280px"
          clearable
          @keyup.enter="loadAnnouncements"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="searchForm.targetType" placeholder="通知对象" clearable style="width: 150px; margin-left: 12px" @change="loadAnnouncements">
          <el-option label="所有人" value="ALL" />
          <el-option label="学生" value="STUDENT" />
          <el-option label="教师" value="TEACHER" />
        </el-select>

        <el-button type="primary" link @click="loadAnnouncements" style="margin-left: 12px">刷新看板</el-button>
      </div>
      
      <!-- 数据表格 -->
      <el-table
        :data="announcements"
        v-loading="loading"
        class="modern-table"
      >
        <el-table-column label="公告主题" min-width="250">
          <template #default="{ row }">
            <div class="announcement-title">{{ row.title }}</div>
            <div class="announcement-time">
              <el-icon><Calendar /></el-icon>
              {{ row.createTime || '最近发布' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="通知范围" width="120">
          <template #default="{ row }">
            <el-tag :type="row.targetType === 'ALL' ? 'warning' : 'info'" effect="light">
              {{ row.targetType === 'ALL' ? '所有人' : (row.targetType === 'STUDENT' ? '全体学生' : '全体教师') }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="优先级" width="120">
          <template #default="{ row }">
            <el-tag :type="row.priority === 3 ? 'danger' : (row.priority === 2 ? 'warning' : 'success')" size="small">
              {{ row.priority === 3 ? '紧急' : (row.priority === 2 ? '重要' : '普通') }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="管理操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" link :type="row.expireTime ? 'success' : 'warning'" @click="row.expireTime ? handlePublish(row) : handleWithdraw(row)">
                {{ row.expireTime ? '重发' : '撤回' }}
              </el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNumber"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          background
          @current-change="loadAnnouncements"
        />
      </div>
    </el-card>
    
    <!-- 发布/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告档案' : '拟定系统新公告'"
      width="650px"
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="modern-form"
      >
        <el-form-item label="公告主题" prop="title">
          <el-input v-model="form.title" placeholder="给公告起一个醒目的标题..." />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="通告对象" prop="targetType">
              <el-select v-model="form.targetType" style="width: 100%">
                <el-option label="所有人" value="ALL" />
                <el-option label="全体学生" value="STUDENT" />
                <el-option label="全体教师" value="TEACHER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
               <el-select v-model="form.priority" style="width: 100%">
                 <el-option :value="1" label="普通通知" />
                 <el-option :value="2" label="重要系统公告" />
                 <el-option :value="3" label="紧急红色通告" />
               </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="详细内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请在此输入公告的具体细节..."
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="padding-top: 10px">
          <el-button @click="dialogVisible = false" class="btn-rounded">取消</el-button>
          <el-button type="success" @click="handleSubmit" :loading="submitting" class="btn-rounded">
            {{ isEdit ? '确认修改' : '立即发布' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus, Search, Bell, Calendar } from '@element-plus/icons-vue'
import { useAnnouncementManagement } from '@/assets/js/announcement-management'

const {
  loading,
  submitting,
  dialogVisible,
  isEdit,
  formRef,
  announcements,
  searchForm,
  pagination,
  form,
  formRules,
  loadAnnouncements,
  showAddDialog,
  handleEdit,
  handleSubmit,
  handleDelete,
  handleWithdraw,
  handlePublish
} = useAnnouncementManagement()

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
@import '@/assets/css/variables.css';
@import '@/assets/css/content-management.css';
@import '@/assets/css/user-management.css';
</style>
