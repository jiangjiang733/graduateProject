<template>
  <div class="course-invitations modern-page">
    <!-- 头部 -->
    <div class="page-header animate-fade-in">
      <h2>课程邀请</h2>
      <div class="header-actions">
        <el-button class="glass-btn" @click="loadInvitations">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-overview animate-slide-up">
      <div class="stat-card glass-panel" :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'">
        <div class="stat-icon bg-amber-100 text-amber-600">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card glass-panel" :class="{ active: currentTab === 'approved' }" @click="currentTab = 'approved'">
        <div class="stat-icon bg-emerald-100 text-emerald-600">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ approvedCount }}</div>
          <div class="stat-label">已接受</div>
        </div>
      </div>
      <div class="stat-card glass-panel" :class="{ active: currentTab === 'rejected' }" @click="currentTab = 'rejected'">
        <div class="stat-icon bg-red-100 text-red-600">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ rejectedCount }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </div>
    </div>

    <!-- 邀请列表 -->
    <div v-loading="loading" class="invitations-container glass-panel animate-slide-up">
      <el-empty v-if="filteredInvitations.length === 0 && !loading" description="暂无邀请记录" :image-size="120" />
      
      <div v-else class="invitations-grid">
        <div v-for="invitation in filteredInvitations" :key="invitation.id" class="invitation-card">
          <div class="card-header">
            <div class="course-info">
              <h3 class="course-name">{{ invitation.courseName }}</h3>
              <div class="invitation-meta">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatTimeAgo(invitation.applyTime) }}</span>
              </div>
            </div>
            <el-tag :type="getStatusType(invitation.status)" effect="light" round>
              {{ getStatusText(invitation.status) }}
            </el-tag>
          </div>

          <div class="card-body">
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>邀请教师：{{ invitation.teacherName || '未知' }}</span>
            </div>
            <div v-if="invitation.rejectReason" class="reject-reason">
              拒绝原因：{{ invitation.rejectReason }}
            </div>
          </div>

          <div class="card-actions" v-if="invitation.status === 'pending'">
            <el-button type="success" @click="handleAccept(invitation)" :loading="invitation.accepting">
              <el-icon><Check /></el-icon> 接受邀请
            </el-button>
            <el-button type="danger" plain @click="showRejectDialog(invitation)" :loading="invitation.rejecting">
              <el-icon><Close /></el-icon> 拒绝
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝课程邀请" width="500px">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="课程名称">
          <el-input v-model="currentInvitation.courseName" disabled />
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :loading="submitting">
          确定拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Clock, Check, Close, Refresh, Calendar, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStudentEnrollments, reviewEnrollment } from '@/api/enrollment.js'

const loading = ref(false)
const submitting = ref(false)
const rejectDialogVisible = ref(false)
const rejectFormRef = ref()
const currentTab = ref('pending')
const invitations = ref([])
const currentInvitation = ref({})

const rejectForm = reactive({
  reason: ''
})

const rejectRules = {
  reason: [
    { max: 200, message: '拒绝原因不超过200个字符', trigger: 'blur' }
  ]
}

// 统计数据
const pendingCount = computed(() => invitations.value.filter(i => i.status === 'pending').length)
const approvedCount = computed(() => invitations.value.filter(i => i.status === 'approved').length)
const rejectedCount = computed(() => invitations.value.filter(i => i.status === 'rejected').length)

// 过滤后的邀请
const filteredInvitations = computed(() => {
  if (currentTab.value === 'pending') {
    return invitations.value.filter(i => i.status === 'pending')
  } else if (currentTab.value === 'approved') {
    return invitations.value.filter(i => i.status === 'approved')
  } else if (currentTab.value === 'rejected') {
    return invitations.value.filter(i => i.status === 'rejected')
  }
  return invitations.value
})

// 加载邀请列表
const loadInvitations = async () => {
  loading.value = true
  try {
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
    if (!studentId) {
      ElMessage.warning('请先登录')
      return
    }

    const response = await getStudentEnrollments(studentId)
    if (response.success) {
      invitations.value = (response.data || []).map(item => ({
        ...item,
        accepting: false,
        rejecting: false
      }))
    }
  } catch (error) {
    console.error('加载邀请列表失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 接受邀请
const handleAccept = async (invitation) => {
  try {
    await ElMessageBox.confirm(
      `确定要接受课程"${invitation.courseName}"的邀请吗？`,
      '确认接受',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    invitation.accepting = true
    const response = await reviewEnrollment(invitation.id, 'approved')

    if (response.success) {
      ElMessage.success('已接受邀请')
      invitation.status = 'approved'
      invitation.reviewTime = new Date().toISOString()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('接受邀请失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    invitation.accepting = false
  }
}

// 显示拒绝对话框
const showRejectDialog = (invitation) => {
  currentInvitation.value = invitation
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

// 拒绝邀请
const handleReject = async () => {
  try {
    await rejectFormRef.value.validate()
    submitting.value = true

    const response = await reviewEnrollment(
      currentInvitation.value.id,
      'rejected',
      rejectForm.reason || '学生拒绝了邀请'
    )

    if (response.success) {
      ElMessage.success('已拒绝邀请')
      currentInvitation.value.status = 'rejected'
      currentInvitation.value.reviewTime = new Date().toISOString()
      currentInvitation.value.rejectReason = rejectForm.reason
      rejectDialogVisible.value = false
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    if (error.errors) return
    console.error('拒绝邀请失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    approved: '已接受',
    rejected: '已拒绝'
  }
  return texts[status] || '未知'
}

// 格式化时间
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return date.toLocaleDateString()
}

onMounted(() => {
  loadInvitations()
})
</script>

<style scoped>
@import '@/assets/css/teacher/modern-theme.css';

.course-invitations {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.bg-amber-100 { background: #fef3c7; }
.text-amber-600 { color: #d97706; }
.bg-emerald-100 { background: #d1fae5; }
.text-emerald-600 { color: #059669; }
.bg-red-100 { background: #fee2e2; }
.text-red-600 { color: #dc2626; }

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.invitations-container {
  padding: 24px;
}

.invitations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.invitation-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  padding: 20px;
  transition: all 0.3s;
}

.invitation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.course-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.invitation-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
}

.card-body {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.reject-reason {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
  padding: 12px;
  font-size: 13px;
  color: #606266;
  border-radius: 4px;
  margin-top: 12px;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.card-actions .el-button {
  flex: 1;
}

@media (max-width: 768px) {
  .invitations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
