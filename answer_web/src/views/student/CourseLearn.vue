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
      <!-- 课程信息头部 -->
      <div class="course-header">
        <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
        <div class="course-info">
          <img 
            :src="getCourseImage(courseInfo.image || courseInfo.coverImage)" 
            class="course-cover"
            alt="课程封面"
            @error="handleImageError"
          />
          <div class="course-details">
            <h1 class="course-title">{{ courseInfo.courseName }}</h1>
            <p class="course-desc">{{ courseInfo.courseDescription || courseInfo.description }}</p>
            <div class="course-meta">
              <el-tag v-if="courseInfo.major">{{ courseInfo.major }}</el-tag>
              <el-tag v-if="courseInfo.classification" type="success">{{ courseInfo.classification }}</el-tag>
              <span class="teacher-name">
                <el-icon><User /></el-icon>
                {{ courseInfo.teacherName || '未知教师' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 章节内容区域 -->
      <div class="content-area">
        <!-- 左侧章节目录 -->
        <div class="chapter-sidebar">
          <div class="sidebar-header">
            <h3>课程目录</h3>
            <span class="chapter-count">共 {{ totalChapters }} 个章节</span>
          </div>
          
          <div class="sidebar-search">
            <el-input 
              v-model="searchText" 
              placeholder="搜索章节" 
              :prefix-icon="Search"
              clearable
            />
          </div>

          <div class="sidebar-tree">
            <el-empty 
              v-if="chapters.length === 0" 
              description="暂无章节内容"
              :image-size="80"
            />
            <el-tree
              v-else
              :data="chapters"
              node-key="chapterId"
              :props="treeProps"
              :expand-on-click-node="false"
              :highlight-current="true"
              :current-node-key="currentChapter?.chapterId"
              @node-click="handleChapterClick"
              default-expand-all
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-icon v-if="data.chapterType === 'FOLDER'" color="#409eff">
                    <Folder />
                  </el-icon>
                  <el-icon v-else-if="data.chapterType === 'VIDEO'" color="#67c23a">
                    <VideoPlay />
                  </el-icon>
                  <el-icon v-else-if="data.chapterType === 'PDF'" color="#e6a23c">
                    <Document />
                  </el-icon>
                  <el-icon v-else color="#909399">
                    <Edit />
                  </el-icon>
                  <span class="node-title">{{ data.chapterTitle }}</span>
                  <el-icon 
                    v-if="data.chapterId === currentChapter?.chapterId" 
                    color="#67c23a" 
                    class="check-icon"
                  >
                    <Check />
                  </el-icon>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- 右侧章节内容 -->
        <div class="chapter-content">
          <div v-if="!currentChapter" class="empty-content">
            <el-empty description="请从左侧选择章节开始学习" :image-size="120" />
          </div>

          <div v-else class="content-wrapper">
            <!-- 章节标题 -->
            <div class="content-header">
              <div class="header-title">
                <h2>{{ currentChapter.chapterTitle }}</h2>
                <el-tag :type="getChapterTypeTag(currentChapter.chapterType)">
                  {{ getTypeLabel(currentChapter.chapterType) }}
                </el-tag>
              </div>
              <div class="header-meta">
                <span>创建时间：{{ formatTime(currentChapter.createTime) }}</span>
              </div>
            </div>

            <!-- 章节内容 -->
            <div class="content-body" v-loading="chapterLoading">
              <!-- 视频内容 -->
              <div v-if="currentChapter.videoUrl" class="media-section">
                <div class="section-title">
                  <el-icon><VideoPlay /></el-icon>
                  <span>视频内容</span>
                </div>
                <div class="video-wrapper">
                  <video 
                    :src="getMediaUrl(currentChapter.videoUrl)" 
                    controls 
                    controlslist="nodownload"
                    class="video-player"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </div>

              <!-- PDF内容 -->
              <div v-if="currentChapter.pdfUrl" class="media-section">
                <div class="section-title">
                  <el-icon><Document /></el-icon>
                  <span>PDF文档</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    :icon="Download" 
                    @click="downloadPdf(currentChapter.pdfUrl)"
                  >
                    下载
                  </el-button>
                </div>
                <div class="pdf-wrapper">
                  <iframe 
                    :src="getMediaUrl(currentChapter.pdfUrl)" 
                    class="pdf-frame"
                    frameborder="0"
                  ></iframe>
                </div>
              </div>

              <!-- 文本内容 -->
              <div v-if="currentChapter.textContent" class="media-section">
                <div class="section-title">
                  <el-icon><Edit /></el-icon>
                  <span>文本内容</span>
                </div>
                <div class="text-content">
                  <div v-html="formatTextContent(currentChapter.textContent)"></div>
                </div>
              </div>

              <!-- 空状态 -->
              <el-empty 
                v-if="!currentChapter.videoUrl && !currentChapter.pdfUrl && !currentChapter.textContent"
                description="该章节暂无内容"
              />

              <!-- 章节评论区 -->
              <div class="comments-section">
                <div class="comments-header">
                  <h3>
                    <el-icon><ChatDotRound /></el-icon>
                    讨论区
                  </h3>
                  <span class="comment-count">{{ comments.length }} 条评论</span>
                </div>

                <!-- 发表评论 -->
                <div class="comment-input-area">
                  <el-input
                    v-model="newComment"
                    type="textarea"
                    :rows="3"
                    placeholder="发表你的看法..."
                    maxlength="500"
                    show-word-limit
                  />
                  <div class="comment-actions">
                    <el-button 
                      type="primary" 
                      :loading="commentSubmitting"
                      @click="submitComment"
                    >
                      发表评论
                    </el-button>
                  </div>
                </div>

                <!-- 评论列表 -->
                <div class="comments-list" v-loading="commentsLoading">
                  <el-empty 
                    v-if="comments.length === 0" 
                    description="暂无讨论，快来发表你的见解吧"
                    :image-size="100"
                  />
                  
                  <div 
                    v-else
                    v-for="comment in comments" 
                    :key="comment.commentId"
                    class="comment-card glass-panel"
                  >
                    <div class="comment-main">
                      <div class="user-avatar-wrapper">
                         <el-avatar :size="48" :src="getUserAvatar(comment.userAvatar)" class="premium-avatar" />
                         <div v-if="comment.userType === 'TEACHER'" class="teacher-badge-glow"></div>
                      </div>
                      
                      <div class="comment-body-rich">
                        <div class="comment-header-row">
                          <span class="author-name" :class="{ 'is-teacher': comment.userType === 'TEACHER' }">
                            {{ comment.userName }}
                            <el-tag v-if="comment.userType === 'TEACHER'" type="danger" size="small" effect="dark" class="role-tag">教师</el-tag>
                          </span>
                          <span class="post-time">{{ formatCommentTime(comment.createTime) }}</span>
                        </div>
                        
                        <div class="comment-text-content">{{ comment.content }}</div>
                        
                        <div class="comment-footer-actions">
                          <el-button link class="action-btn" @click="showReplyInput(comment)">
                            <el-icon><ChatDotRound /></el-icon> 回复
                          </el-button>
                        </div>

                        <!-- Nested Replies (Standard Layout) -->
                        <div v-if="comment.replies && comment.replies.length > 0" class="replies-container-modern">
                          <div 
                            v-for="reply in comment.replies"
                            :key="reply.commentId"
                            class="reply-item-modern"
                          >
                            <el-avatar :size="32" :src="getUserAvatar(reply.userAvatar)" class="small-avatar" />
                            <div class="reply-detail">
                              <div class="reply-user-info">
                                <span class="reply-name" :class="{ 'is-teacher': reply.userType === 'TEACHER' }">
                                  {{ reply.userName }}
                                  <el-tag v-if="reply.userType === 'TEACHER'" type="danger" size="small" effect="plain">教师</el-tag>
                                </span>
                                <span class="reply-time-text">{{ formatCommentTime(reply.createTime) }}</span>
                              </div>
                              <div class="reply-message">{{ reply.content }}</div>
                            </div>
                          </div>
                        </div>

                        <!-- Quick Reply Input -->
                        <div v-if="replyingTo === comment.commentId" class="quick-reply-box slide-down">
                          <el-input
                            v-model="replyContent"
                            type="textarea"
                            :rows="2"
                            :placeholder="`回复 @${comment.userName}...`"
                            maxlength="200"
                          />
                          <div class="reply-submit-row">
                             <el-button size="small" rounded @click="cancelReply">取消</el-button>
                             <el-button type="primary" size="small" rounded :loading="replySubmitting" @click="submitReply(comment.commentId)">发送回复</el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  ArrowLeft, User, Search, Folder, VideoPlay, Document, 
  Edit, Check, Download, ChatDotRound, ChatLineRound
} from '@element-plus/icons-vue'
import { useCourseLearn } from '@/assets/js/student/course-learn.js'

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
  commentsLoading,
  newComment,
  commentSubmitting,
  replyingTo,
  replyContent,
  replySubmitting,
  handleChapterClick,
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
  formatCommentTime
} = useCourseLearn()
</script>

<style scoped>
@import '@/assets/css/student/course-learn.css';
</style>
