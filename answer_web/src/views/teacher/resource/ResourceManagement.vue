<template>
  <div class="resource-management modern-page">
    <div class="page-header animate-fade-in">
      <div class="header-content">
        <h1 class="page-title">资料库</h1>
        <p class="page-subtitle">管理所有课程的教学资料、课件和参考文件</p>
      </div>
      <el-button class="glass-btn primary" @click="uploadDialogVisible = true">
         <el-icon><UploadFilled /></el-icon> 上传资料
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="filter-section glass-panel animate-slide-up">
       <div class="file-path">
          <el-breadcrumb separator="/">
             <el-breadcrumb-item>根目录</el-breadcrumb-item>
             <el-breadcrumb-item>计算机网络</el-breadcrumb-item>
             <el-breadcrumb-item>第一章</el-breadcrumb-item>
          </el-breadcrumb>
       </div>
       <div class="view-toggle">
          <el-input 
             v-model="searchKeyword" 
             placeholder="搜索文件名" 
             prefix-icon="Search" 
             class="glass-input-small"
             style="width: 200px"
          />
       </div>
    </div>

    <!-- 文件网格 -->
    <div class="file-grid animate-slide-up" style="animation-delay: 0.1s">
       <!-- 文件夹 -->
       <div v-for="folder in folders" :key="folder.id" class="file-card folder glass-panel" @dblclick="enterFolder(folder)">
          <div class="icon-wrap folder-icon">
             <el-icon :size="48"><Folder /></el-icon>
          </div>
          <div class="file-info">
             <div class="name" :title="folder.name">{{ folder.name }}</div>
             <div class="meta">{{ folder.count }} 项</div>
          </div>
          <div class="file-actions">
             <el-icon><MoreFilled /></el-icon>
          </div>
       </div>

       <!-- 文件 -->
       <div v-for="file in files" :key="file.id" class="file-card file glass-panel">
          <div class="icon-wrap file-icon" :class="getFileTypeClass(file.type)">
             <el-icon :size="48"><Document /></el-icon>
             <span class="ext">{{ file.ext }}</span>
          </div>
          <div class="file-info">
             <div class="name" :title="file.name">{{ file.name }}</div>
             <div class="meta">{{ file.size }} • {{ file.date }}</div>
          </div>
          <div class="file-actions">
             <el-dropdown trigger="click">
                <el-icon class="action-trigger"><MoreFilled /></el-icon>
                <template #dropdown>
                   <el-dropdown-menu>
                      <el-dropdown-item>下载</el-dropdown-item>
                      <el-dropdown-item>重命名</el-dropdown-item>
                      <el-dropdown-item divided style="color: #ef4444">删除</el-dropdown-item>
                   </el-dropdown-menu>
                </template>
             </el-dropdown>
          </div>
       </div>
    </div>
    
    <!-- Upload Dialog -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="500px" class="glass-dialog">
       <el-upload
         class="upload-area"
         drag
         action="#"
         multiple
       >
         <el-icon class="el-icon--upload"><upload-filled /></el-icon>
         <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
         </div>
       </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled, Search, Folder, Document, MoreFilled } from '@element-plus/icons-vue'
import '@/assets/css/teacher/modern-theme.css'

const searchKeyword = ref('')
const uploadDialogVisible = ref(false)

const folders = ref([
 { id: 1, name: '课件PPT', count: 12 },
 { id: 2, name: '实验指导书', count: 4 },
 { id: 3, name: '往年试卷', count: 8 }
])

const files = ref([
 { id: 101, name: '第一章_绪论.pdf', size: '2.4 MB', date: '2023-12-01', type: 'pdf', ext: 'PDF' },
 { id: 102, name: 'Project_Requirements.docx', size: '15 KB', date: '2023-12-05', type: 'doc', ext: 'DOCX' },
 { id: 103, name: 'Demo_Video.mp4', size: '128 MB', date: '2023-12-10', type: 'video', ext: 'MP4' },
 { id: 104, name: 'Data_Analysis.xlsx', size: '45 KB', date: '2023-12-11', type: 'xls', ext: 'XLSX' },
])

const enterFolder = (f) => {
 console.log('Enter folder', f.name)
}

const getFileTypeClass = (type) => {
 switch(type) {
   case 'pdf': return 'bg-red-100 text-red-500'
   case 'doc': return 'bg-blue-100 text-blue-500'
   case 'xls': return 'bg-green-100 text-green-500'
   case 'video': return 'bg-purple-100 text-purple-500'
   default: return 'bg-gray-100 text-gray-500'
 }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: #1f2937; margin: 0; }
.page-subtitle { color: #6b7280; font-size: 14px; margin: 4px 0 0; }
.filter-section { padding: 16px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }

.file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.file-card { padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; transition: all 0.2s; cursor: pointer; }
.file-card:hover { transform: translateY(-4px); background-color: rgba(255,255,255,0.6); }

.icon-wrap { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 16px; margin-bottom: 12px; position: relative; }
.folder-icon { background: #fef3c7; color: #f59e0b; }
.ext { position: absolute; bottom: 18px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: white; padding: 1px 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

.file-info { width: 100%; }
.name { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { font-size: 12px; color: #9ca3af; }

.file-actions { position: absolute; top: 12px; right: 12px; opacity: 0; transition: opacity 0.2s; }
.file-card:hover .file-actions { opacity: 1; }
.action-trigger { cursor: pointer; color: #6b7280; }

.bg-red-100 { background-color: #fee2e2; } .text-red-500 { color: #ef4444; }
.bg-blue-100 { background-color: #dbeafe; } .text-blue-500 { color: #3b82f6; }
.bg-green-100 { background-color: #d1fae5; } .text-green-500 { color: #10b981; }
.bg-purple-100 { background-color: #f3e8ff; } .text-purple-500 { color: #a855f7; }
.bg-gray-100 { background-color: #f3f4f6; } .text-gray-500 { color: #6b7280; }
</style>
