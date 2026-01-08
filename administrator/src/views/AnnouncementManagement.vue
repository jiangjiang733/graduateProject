<template>
  <div class="announcement-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>公告管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            发布公告
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索公告标题"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="searchForm.targetType"
          placeholder="目标"
          style="width: 150px; margin-left: 10px"
          clearable
        >
          <el-option label="全部" value="" />
          <el-option label="所有人" value="ALL" />
          <el-option label="学生" value="STUDENT" />
          <el-option label="教师" value="TEACHER" />
        </el-select>
        
        <el-button type="primary" @click="loadAnnouncements" style="margin-left: 10px">
          搜索
        </el-button>
      </div>
      
      <!-- 表格 -->
      <el-table :data="announcements" v-loading="loading" style="margin-top: 20px">
        <el-table-column prop="title" label="标题" />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" width="100">
          <template #default="{ row }">
            {{ getTargetText(row.targetType) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <!-- Withdraw if not expired? Backend withdraw sets expireTime.
                 If expireTime exists and < now, it is withdrawn.
                 For simplicity, always show Withdraw button if active (expireTime null or > now).
                 Show Publish if withdrawn?
            -->
            <el-button
              v-if="!isExpired(row)"
              size="small"
              type="warning"
              @click="handleWithdraw(row)"
            >
              撤回
            </el-button>
            <el-button
              v-else
              size="small"
              type="success"
              @click="handlePublish(row)"
            >
              重新发布
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.pageNumber"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="loadAnnouncements"
        @current-change="loadAnnouncements"
      />
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告' : '发布公告'"
      width="700px"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" style="width: 100%">
            <el-option label="通知" :value="1" />
            <el-option label="系统公告" :value="2" />
            <el-option label="紧急" :value="3" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标" prop="targetType">
          <el-select v-model="form.targetType" style="width: 100%">
            <el-option label="所有人" value="ALL" />
            <el-option label="学生" value="STUDENT" />
            <el-option label="教师" value="TEACHER" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '发布' }}
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="公告详情" width="700px">
      <div class="announcement-detail">
        <h3>{{ viewData.title }}</h3>
        <div class="meta">
          <el-tag :type="getPriorityTag(viewData.priority || 1)">{{ getPriorityText(viewData.priority || 1) }}</el-tag>
          <span style="margin-left: 10px">目标: {{ getTargetText(viewData.targetType || 'ALL') }}</span>
          <span style="margin-left: 10px">发布时间: {{ viewData.createTime }}</span>
        </div>
        <div class="content">
          {{ viewData.content }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  getAnnouncementList,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  withdrawAnnouncement,
  type Announcement
} from '@/api/announcement'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const announcements = ref<Announcement[]>([])
const viewData = ref<Partial<Announcement>>({})

const searchForm = reactive({
  keyword: '',
  targetType: ''
})

const pagination = reactive({
  pageNumber: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  notificationId: 0,
  title: '',
  content: '',
  priority: 1,
  targetType: 'ALL'
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  targetType: [{ required: true, message: '请选择目标', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const getPriorityTag = (priority: number) => {
  const map: Record<number, string> = {
    2: 'primary',
    1: 'success',
    3: 'danger'
  }
  return map[priority] || 'info'
}

const getPriorityText = (priority: number) => {
  const map: Record<number, string> = {
    2: '系统公告',
    1: '通知',
    3: '紧急'
  }
  return map[priority] || '普通'
}

const getTargetText = (target: string) => {
  const map: Record<string, string> = {
    ALL: '所有人',
    STUDENT: '学生',
    TEACHER: '教师'
  }
  return map[target] || target
}

const isExpired = (row: Announcement) => {
  if (!row.expireTime) return false
  return new Date(row.expireTime).getTime() <= Date.now()
}

const loadAnnouncements = async () => {
  loading.value = true
  try {
    const response = await getAnnouncementList({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      type: searchForm.targetType // this is targetType
    })
    
    if (response.code === 200 && response.data) {
      announcements.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('加载公告列表失败:', error)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleView = (row: Announcement) => {
  viewData.value = row
  viewDialogVisible.value = true
}

const handleEdit = (row: Announcement) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateAnnouncement(form.notificationId, form)
        ElMessage.success('更新成功')
      } else {
        await createAnnouncement(form)
        ElMessage.success('发布成功')
      }
      
      dialogVisible.value = false
      loadAnnouncements()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const handlePublish = async (row: Announcement) => {
  try {
    await publishAnnouncement(row.notificationId)
    ElMessage.success('发布成功')
    loadAnnouncements()
  } catch (error) {
    console.error('发布失败:', error)
  }
}

const handleWithdraw = async (row: Announcement) => {
  try {
    await ElMessageBox.confirm('确定要撤回该公告吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await withdrawAnnouncement(row.notificationId)
    ElMessage.success('撤回成功')
    loadAnnouncements()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤回失败:', error)
    }
  }
}

const handleDelete = async (row: Announcement) => {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteAnnouncement(row.notificationId)
    ElMessage.success('删除成功')
    loadAnnouncements()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const resetForm = () => {
  Object.assign(form, {
    notificationId: 0,
    title: '',
    content: '',
    priority: 1,
    targetType: 'ALL'
  })
  formRef.value?.clearValidate()
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
.announcement-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  align-items: center;
}

.announcement-detail h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: #303133;
}

.announcement-detail .meta {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  color: #909399;
  font-size: 14px;
}

.announcement-detail .content {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}
</style>
