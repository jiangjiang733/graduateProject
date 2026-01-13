<template>
  <div class="course-students">
    <div class="actions-bar">
      <div class="stat-info">
        已加入学生：<span class="count">{{ students.length }}</span> 人
      </div>
      <div class="right-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索姓名或ID..."
          prefix-icon="Search"
          class="search-input glass-input"
          clearable
        />
        <el-button type="primary" class="glass-btn primary-glass-btn" @click="inviteDialogVisible = true">
          <el-icon><Plus /></el-icon> 邀请学生
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="students-container">
      <el-empty v-if="pagedStudents.length === 0 && !loading" :description="searchQuery ? '未找到相关学生' : '暂无学生加入本课程'" />
      
      <div v-else class="students-content">
        <div class="students-grid">
          <div v-for="student in pagedStudents" :key="student.id" class="student-card glass-panel animate-slide-up">
            <div class="student-header">
              <el-avatar :size="48" :src="getStudentAvatar(student)" class="student-avatar">
                {{ getStudentInitial(student) }}
              </el-avatar>
              <div class="activity-badge"></div>
            </div>
            
            <div class="student-body">
              <h4 class="student-name">{{ student.studentName || '未知学生' }}</h4>
              <div class="enroll-time">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(student.applyTime) }} 加入
              </div>
            </div>

            <div class="student-footer">
               <el-button type="danger" plain size="small" class="remove-btn" @click="handleRemove(student)">
                 <el-icon><Delete /></el-icon> 移除
               </el-button>
            </div>
          </div>
        </div>
        
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredStudents.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
          />
        </div>
      </div>
    </div>

    <!-- 邀请对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请学生加入课程" width="400px" custom-class="glass-dialog">
      <el-form :model="inviteForm" ref="inviteFormRef" :rules="inviteRules" label-position="top">
        <el-form-item label="学生账户ID" prop="studentId">
          <el-input 
            v-model="inviteForm.studentId" 
            placeholder="请输入学生ID" 
            prefix-icon="User"
            class="glass-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="inviteDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="inviteSubmitting" @click="submitInvite">确定邀请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Plus, Delete, User, Calendar, Search } from '@element-plus/icons-vue'
import { useCourseStudents } from '@/assets/js/teacher/course-students'

const props = defineProps({
  courseId: {
    type: String,
    required: true
  }
})

const {
  loading,
  students,
  inviteDialogVisible,
  inviteSubmitting,
  inviteFormRef,
  searchQuery,
  currentPage,
  pageSize,
  inviteForm,
  inviteRules,
  filteredStudents,
  pagedStudents,
  handleSizeChange,
  handleCurrentChange,
  handleRemove,
  submitInvite,
  formatDate,
  getStudentAvatar,
  getStudentInitial
} = useCourseStudents(props)
</script>

<style scoped>
@import '@/assets/css/teacher/course-students.css';
</style>
