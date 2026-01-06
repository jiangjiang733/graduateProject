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
          :prefix-icon="Search"
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
              <el-avatar :size="48" :src="student.studentAvatar" class="student-avatar">
                {{ student.studentName?.charAt(0) || 'S' }}
              </el-avatar>
              <div class="activity-badge"></div>
            </div>
            
            <div class="student-body">
              <h4 class="student-name">{{ student.studentName }}</h4>
              <div class="student-meta">
                <span class="student-id">ID: {{ student.studentId }}</span>
              </div>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus, Delete, User, Calendar, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseEnrollments, cancelEnrollment, directEnroll } from '@/api/enrollment.js'

const props = defineProps({
  courseId: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const students = ref([])
const inviteDialogVisible = ref(false)
const inviteSubmitting = ref(false)
const inviteFormRef = ref()

// 搜索和分页状态
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(12)

const inviteForm = reactive({
  studentId: ''
})

const inviteRules = {
  studentId: [
    { required: true, message: '请输入学生ID', trigger: 'blur' }
  ]
}

// 过滤后的学生列表
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(s => 
    (s.studentName && s.studentName.toLowerCase().includes(query)) ||
    (s.studentId && s.studentId.toString().includes(query))
  )
})

// 分页后的学生列表
const pagedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredStudents.value.slice(start, end)
})

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 获取学生列表
const fetchStudents = async () => {
  if (!props.courseId) return
  loading.value = true
  try {
    const response = await getCourseEnrollments(props.courseId)
    if (response.success) {
      // 只显示已通过(approved)的学生
      students.value = (response.data || []).filter(item => item.status === 'approved')
    } else {
      students.value = []
    }
  } catch (error) {
    console.error('获取学生列表失败', error)
    ElMessage.error('无法加载学生列表')
  } finally {
    loading.value = false
  }
}

// 移除学生
const handleRemove = async (student) => {
  try {
    await ElMessageBox.confirm(
      `确定要将学生 "${student.studentName}" 从本课程中移除吗？`,
      '确认移除',
      {
        confirmButtonText: '移除',
        cancelButtonText: '取消',
        type: 'warning',
        icon: 'Warning'
      }
    )

    const response = await cancelEnrollment(student.id) // 这里的ID是enrollment的ID
    if (response.success) {
      ElMessage.success('移除成功')
      fetchStudents() // 刷新列表
    } else {
      ElMessage.error(response.message || '移除失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 邀请学生
const submitInvite = async () => {
  if (!inviteFormRef.value) return
  await inviteFormRef.value.validate(async (valid) => {
    if (valid) {
      inviteSubmitting.value = true
      try {
        const response = await directEnroll(inviteForm.studentId, props.courseId)
        if (response.success) {
          ElMessage.success('邀请成功')
          inviteDialogVisible.value = false
          inviteForm.studentId = ''
          fetchStudents() // 刷新列表
        } else {
          ElMessage.error(response.message || '邀请失败')
        }
      } catch (error) {
        ElMessage.error('操作异常')
      } finally {
        inviteSubmitting.value = false
      }
    }
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

onMounted(() => {
  fetchStudents()
})
</script>

<style scoped>
.course-students {
  padding: 20px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.right-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  width: 240px;
}

.stat-info {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.stat-info .count {
  font-size: 20px;
  color: #409eff;
  font-weight: bold;
  margin: 0 4px;
}

.students-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}

/* Card Styles */
.student-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.student-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #dcdfe6;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.student-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 18px;
  background-color: #409eff;
  color: white;
}

.student-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-meta {
  font-size: 13px;
  color: #909399;
}

.enroll-time {
  font-size: 12px;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 12px;
}

.enroll-time .el-icon {
  font-size: 14px;
}

.student-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.remove-btn {
  width: 100%;
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .right-actions {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>
