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
        <div class="students-grid custom-grid">
          <div v-for="student in pagedStudents" :key="student.id" class="student-item-card">
            
            <div class="student-info-view">
              <el-avatar :size="64" :src="getStudentAvatar(student)" class="student-avatar-lg">
                {{ getStudentInitial(student) }}
              </el-avatar>
              <h4 class="student-name-lg">{{ student.studentName || '未知学生' }}</h4>
            </div>

            <!-- Hover Overlay -->
            <div class="hover-overlay">
               <div class="overlay-actions">
                 <el-button type="danger" circle @click="handleRemove(student)" title="移除学生">
                   <el-icon><Delete /></el-icon>
                 </el-button>
               </div>
            </div>

          </div>
        </div>
        
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36, 48]"
            layout="prev, pager, next"
            :total="filteredStudents.length"
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
