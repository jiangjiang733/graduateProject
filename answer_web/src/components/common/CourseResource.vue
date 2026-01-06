<template>
  <div class="course-resource-section">
    <div class="resource-header">
      <div class="header-left">
        <h3>共享资料库 <span class="resource-count">({{ filteredResources.length }})</span></h3>
        <p class="header-tip">本课程的所有共享资料，加入课程后即可下载</p>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资料名称..."
          class="search-input"
          clearable
          :prefix-icon="Search"
          style="width: 240px; margin-right: 15px;"
        />
        <el-button v-if="isAdmin" type="primary" :icon="Upload" @click="showUploadDialog = true">
          上传资料
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="resource-card-container">
      <el-table 
        v-loading="loading" 
        :data="filteredResources" 
        style="width: 100%"
        class="resource-table"
        :header-cell-style="{ background: '#f8fafc', color: '#64748b' }"
      >
        <el-table-column label="名称" min-width="250">
          <template #default="{ row }">
            <div class="file-name-info">
              <el-icon class="file-icon" :size="24">
                <component :is="getFileIcon(row.fileType)" />
              </el-icon>
              <div class="file-detail">
                <span class="file-title" :title="row.title">{{ row.title }}</span>
                <span class="file-sub">{{ row.fileName }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="uploaderName" label="上传者" width="120" />
        
        <el-table-column label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>

        <el-table-column label="下载次数" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.downloadCount }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handlePreview(row)">
              <el-icon><View /></el-icon> 预览
            </el-button>
            <el-tooltip
              :content="canDownload ? '开始并记录下载' : '只有加入课程的学生才能下载资料'"
              placement="top"
              :disabled="canDownload"
            >
              <span>
                <el-button link type="primary" :disabled="!canDownload" @click="handleDownload(row)">
                  <el-icon><Download /></el-icon> 下载
                </el-button>
              </span>
            </el-tooltip>
            <el-button v-if="isAdmin" link type="danger" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredResources.length === 0" :description="searchQuery ? '未找到相关资料' : '暂无共享资料'" />
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="'预览 - ' + previewFile.title"
      width="80%"
      destroy-on-close
      append-to-body
      class="preview-dialog"
    >
      <div v-if="previewType === 'image'" class="preview-content">
        <el-image :src="previewUrl" fit="contain" style="max-height: 70vh; width: 100%" />
      </div>
      <div v-else-if="previewType === 'pdf'" class="preview-content">
        <iframe :src="previewUrl" style="width: 100%; height: 75vh; border: none;"></iframe>
      </div>
      <div v-else-if="previewType === 'video'" class="preview-content">
        <video :src="previewUrl" controls class="preview-video"></video>
      </div>
      <div v-else class="preview-content empty">
        <el-result icon="warning" title="该文件格式不支持预览" sub-title="请下载到本地查看">
          <template #extra>
            <el-button type="primary" @click="handleDownload(previewFile)">点击下载</el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>

    <!-- 上传弹窗 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传课程资料"
      width="500px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="uploadForm" label-position="top">
        <el-form-item label="资料标题" required>
          <el-input v-model="uploadForm.title" placeholder="请输入资料标题" />
        </el-form-item>
        <el-form-item label="选择文件" required>
          <el-upload
            class="resource-uploader"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持任意格式文件，单文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">
          开始上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, computed } from 'vue'
import { 
  Upload, Download, Delete, Document, VideoPlay, 
  Picture, Files, UploadFilled, Search, View 
} from '@element-plus/icons-vue'
import { getCourseResources, uploadResource, deleteResource, recordDownload } from '@/api/course-resource'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  courseId: {
    type: String,
    required: true
  },
  isAdmin: { // 是否为教师/管理员
    type: Boolean,
    default: false
  },
  canDownload: { // 是否允许下载
    type: Boolean,
    default: true
  }
})

const resources = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showUploadDialog = ref(false)
const uploading = ref(false)

// 预览相关状态
const showPreviewDialog = ref(false)
const previewFile = ref({})
const previewUrl = ref('')
const previewType = ref('')

const uploadForm = ref({
  title: '',
  file: null
})

const filteredResources = computed(() => {
  if (!searchQuery.value.trim()) return resources.value
  const query = searchQuery.value.toLowerCase()
  return resources.value.filter(res => 
    res.title.toLowerCase().includes(query) || 
    res.fileName.toLowerCase().includes(query)
  )
})

const fetchResources = async () => {
  loading.value = true
  try {
    const res = await getCourseResources(props.courseId)
    if (res.code === 200) {
      resources.value = res.data || []
    }
  } catch (error) {
    console.error('获取资源失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePreview = (row) => {
  previewFile.value = row
  const baseUrl = 'http://localhost:8088'
  previewUrl.value = row.fileUrl.startsWith('http') ? row.fileUrl : `${baseUrl}${row.fileUrl}`
  
  const ext = row.fileType?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    previewType.value = 'image'
  } else if (ext === 'pdf') {
    previewType.value = 'pdf'
  } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
    previewType.value = 'video'
  } else {
    previewType.value = 'other'
  }
  
  showPreviewDialog.value = true
}

const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  if (!uploadForm.value.title) {
    uploadForm.value.title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
  }
}

const submitUpload = async () => {
  if (!uploadForm.value.file) {
    return ElMessage.warning('请选择文件')
  }
  if (!uploadForm.value.title.trim()) {
    return ElMessage.warning('请输入资料标题')
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('courseId', props.courseId)
    formData.append('title', uploadForm.value.title)
    formData.append('file', uploadForm.value.file)
    
    // 获取当前登录人信息
    const uploaderId = localStorage.getItem('teacherId') || localStorage.getItem('t_id') || localStorage.getItem('s_id')
    const uploaderName = localStorage.getItem('userName') || '匿名用户'
    
    formData.append('uploaderId', uploaderId)
    formData.append('uploaderName', uploaderName)

    const res = await uploadResource(formData)
    if (res.code === 200) {
      ElMessage.success('上传成功')
      showUploadDialog.value = false
      uploadForm.value = { title: '', file: null }
      fetchResources()
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error('上传过程中发生错误')
    console.error(error)
  } finally {
    uploading.value = false
  }
}

const handleDownload = async (row) => {
  try {
    // 1. 记录下载
    await recordDownload(row.resourceId)
    row.downloadCount++

    // 2. 触发下载
    const baseUrl = 'http://localhost:8088'
    const downloadUrl = row.fileUrl.startsWith('http') ? row.fileUrl : `${baseUrl}${row.fileUrl}`
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = row.fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除这份资料吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteResource(row.resourceId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchResources()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const getFileIcon = (type) => {
  const t = type?.toLowerCase() || ''
  if (['mp4', 'mov', 'avi'].includes(t)) return VideoPlay
  if (['jpg', 'png', 'gif', 'jpeg'].includes(t)) return Picture
  if (['pdf'].includes(t)) return Document
  if (['zip', 'rar', '7z'].includes(t)) return Files
  return Document
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

onMounted(() => {
  fetchResources()
})
</script>

<style scoped>
.course-resource-section {
  padding: 10px 0;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.resource-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-count {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: normal;
}

.header-tip {
  margin: 5px 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.resource-card-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.file-name-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  color: #3b82f6;
  background: #eff6ff;
  padding: 8px;
  border-radius: 8px;
}

.file-detail {
  display: flex;
  flex-direction: column;
}

.file-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
}

.resource-table :deep(.el-table__row) {
  transition: background 0.2s;
}

.resource-table :deep(.el-table__row:hover) {
  background-color: #f8fafc !important;
}

.resource-uploader :deep(.el-upload-dragger) {
  border-radius: 12px;
  padding: 40px 20px;
}

/* 预览样式 */
.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  background-color: #f1f5f9;
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 20px;
}

.preview-content.empty {
  min-height: 300px;
  background: white;
}

.preview-video {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 !important;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>
