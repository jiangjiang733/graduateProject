<template>
  <div class="course-learn-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 未报名或未通过审核 -->
    <div v-else-if="!canLearn" class="access-denied">
      <el-result
        icon="warning"
        title="无法访问课程"
        :sub-title="accessMessage"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/student/courses')">
            返回课程列表
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 课程学习主界面 -->
    <div v-else class="learn-container">
      <!-- 极简课程标题栏 -->
      <div class="minimal-header">
        <div class="header-left">
           <el-button @click="$router.back()" circle :icon="ArrowLeft" />
           <div class="title-group">
             <h1 class="main-title">{{ courseInfo.courseName }}</h1>
             <div class="subtitle-meta">
               <el-tag size="small" effect="plain">{{ courseInfo.major }}</el-tag>
             </div>
           </div>
        </div>
        <div class="header-right">
           <el-button type="primary" plain round @click="$router.push(isTeacher ? '/teacher/courses' : '/student/courses')">
             {{ isTeacher ? '课程管理' : '我的课程' }}
           </el-button>
        </div>
      </div>

      <div class="main-layout">
        <!-- 核心调整：目录在左 -->
        <div class="side-nav">
          <div class="nav-title">章节目录 <span>({{ totalChapters }})</span></div>
          <div class="nav-search">
            <el-input v-model="searchText" placeholder="搜索章节..." :prefix-icon="Search" clearable />
          </div>
          <div class="nav-tree-scroller">
            <el-tree
              :data="chapters"
              node-key="chapterId"
              :props="treeProps"
              :highlight-current="true"
              :current-node-key="currentChapter?.chapterId"
              @node-click="handleChapterClick"
              default-expand-all
            >
              <template #default="{ data }">
                <div :class="['nav-node', { 'active': currentChapter?.chapterId === data.chapterId }]">
                  <el-icon :class="data.chapterType.toLowerCase()">
                    <VideoPlay v-if="data.chapterType === 'VIDEO'" />
                    <Document v-else-if="data.chapterType === 'PDF'" />
                    <Edit v-else />
                  </el-icon>
                  <span class="nav-text" :title="data.chapterTitle">{{ data.chapterTitle }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
        <div class="main-view">
          <div v-if="!currentChapter" class="empty-state-view">
            <el-empty description="请从左侧选择章节预览内容" :image-size="200" />
          </div>
          <div v-else class="active-content">
            <!-- 2. 内容呈现区 -->
            <div class="content-display-box" v-loading="chapterLoading">
              
              <!-- 解析出的文本内容（直接显示） -->
              <div v-if="currentChapter.textContent" class="parsed-content-container">
                <div class="content-label">
                  <el-icon><Edit /></el-icon>
                  <span>文档解析正文</span>
                </div>
                <div class="rich-text-content" v-html="formatTextContent(currentChapter.textContent)"></div>
              </div>

              <!-- 资源附件列表 -->
              <div v-if="currentChapter.pdfUrl" class="resource-materials-card">
                <div class="card-header">
                  <el-icon><Files /></el-icon>
                  <span>资源附件</span>
                </div>
                <el-table :data="[{ title: currentChapter.chapterTitle, url: currentChapter.pdfUrl }]" class="teacher-file-table">
                  <el-table-column label="附件名称" min-width="200">
                    <template #default="scope">
                       <span class="file-link">
                         <el-icon color="#409EFF"><Document /></el-icon>
                         {{ scope.row.title }}
                       </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="160" align="right">
                    <template #default="scope">
                      <el-button link type="primary" @click="togglePreview">在线预览</el-button>
                      <el-button link type="success" @click="downloadFile(scope.row.url, scope.row.title)">直接下载</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 预览浮层 -->
              <div v-if="showPreviewBox" class="preview-overlay-box slide-down">
                <div class="preview-header">
                  <span>正在预览: {{ currentChapter.chapterTitle }}</span>
                  <el-icon class="close-icon" @click="showPreviewBox = false"><ArrowUp /></el-icon>
                </div>
                <div class="media-container document-preview">
                  <iframe 
                    v-if="isPdf(currentChapter.pdfUrl)"
                    :src="getMediaUrl(currentChapter.pdfUrl)" 
                    class="full-frame"
                  ></iframe>
                  <iframe 
                    v-else-if="currentChapter.pdfUrl"
                    :src="'https://view.officeapps.live.com/op/view.aspx?src=' + encodeURIComponent(getMediaUrl(currentChapter.pdfUrl))" 
                    class="full-frame"
                  ></iframe>
                </div>
              </div>

              <!-- 视频内容 -->
              <div v-if="currentChapter.videoUrl" class="media-container video-mode">
                <video :src="getMediaUrl(currentChapter.videoUrl)" controls class="premium-video"></video>
              </div>

              <!-- 无内容显示 -->
              <el-empty 
                v-if="!currentChapter.videoUrl && !currentChapter.pdfUrl && !currentChapter.textContent"
                description="暂无教学内容可预览"
              />
            </div>

            <!-- 3. 互动讨论区 -->
            <div class="discussion-container glass-card">
              <div class="discussion-header">
                <h3>讨论交互 <span>({{ totalCommentCount }})</span></h3>
              </div>
              <!-- 只有发表逻辑，UI精简化 -->
              <div class="comment-input-block teacher-reply-style">
                <el-input
                  v-model="newComment"
                  type="textarea"
                  :rows="2"
                  placeholder="在此输入您的指导意见或课程补充..."
                  resize="none"
                />
                <div class="submit-row">
                  <el-button type="primary" round @click="submitComment">发布评论</el-button>
                </div>
              </div>

              <div class="comments-list-wrapper" v-loading="commentsLoading">
                <CommentItem
                  v-for="comment in comments"
                  :key="comment.commentId || comment.id"
                  :comment="comment"
                  :courseId="courseId"
                  :showChapter="false"
                  @commentPosted="currentChapter && loadChapterComments(currentChapter.chapterId)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, User, Search, Folder, VideoPlay, Document, 
  Edit, Check, Download, ChatDotRound, ChatLineRound,
  ArrowDown, ArrowUp, Delete, Files
} from '@element-plus/icons-vue'
import CommentItem from '@/views/teacher/course/CommentItem.vue'
import { useCourseLearn } from '@/assets/js/student/course-learn.js'

const route = useRoute()
const courseId = computed(() => route.params.id)

const {
  loading,
  canLearn,
  accessMessage,
  courseInfo,
  chapters,
  totalChapters,
  searchText,
  currentChapter,
  chapterLoading,
  treeProps,
  comments,
  totalCommentCount,
  commentsLoading,
  newComment,
  commentSubmitting,
  replyingTo,
  replyContent,
  replySubmitting,
  expandedComments,
  currentUserAvatar,
  currentUserId,
  isTeacher,
  handleChapterClick,
  loadChapterComments,
  getCourseImage,
  handleImageError,
  getMediaUrl,
  downloadPdf,
  formatTextContent,
  getChapterTypeTag,
  getTypeLabel,
  formatTime,
  submitComment,
  showReplyInput,
  cancelReply,
  submitReply,
  formatCommentTime,
  getUserAvatar,
  toggleExpand,
  canDelete,
  handleDeleteComment,
  getChapterTypeColor
} = useCourseLearn()

const isPdf = (url) => url?.toLowerCase().endsWith('.pdf')
const showPreviewBox = ref(false)
const togglePreview = () => {
  showPreviewBox.value = !showPreviewBox.value
}

import axios from 'axios'
const isDownloading = ref(false)
const downloadFile = async (url, title) => {
  if (!url || isDownloading.value) return
  isDownloading.value = true
  try {
    const fullUrl = getMediaUrl(url)
    const response = await axios({
      url: fullUrl,
      method: 'GET',
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = title || url.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(link.href)
    ElMessage.success('开始下载')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/student/course-learn.css';

.comment-input-area {
  display: flex !important;
  gap: 16px;
  margin-bottom: 30px;
}

.user-avatar-preview {
  flex-shrink: 0;
}

.input-wrapper-rich {
  flex: 1;
}

.delete-btn:hover {
  color: #ff4d4f !important;
}

.reply-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.reply-delete-btn {
  margin-left: auto !important;
  font-size: 12px !important;
  color: #94a3b8 !important;
  padding: 0 !important;
  height: auto !important;
}

.reply-delete-btn:hover {
  color: #ef4444 !important;
}
</style>
