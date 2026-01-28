<template>
  <div class="course-learn-modern" v-loading="loading">
    <!-- 顶部导航栏 (极简模式) -->
    <header class="modern-header">
      <div class="header-left">
        <div class="back-link" @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回课程主页</span>
        </div>
      </div>
    </header>

    <!-- 主体布局 -->
    <div class="learn-layout">
      <!-- 左侧主内容区 -->
      <main class="main-content-area">
        
        <!-- 1. 混合任务导航栏 (亮色风格) -->
        <div v-if="isMixedChapter" class="mixed-task-bar">
          <div 
            v-for="(task, index) in mixedTasks" 
            :key="index"
            class="sub-task-tab"
            :class="{ active: currentTaskIndex === index }"
            @click="currentTaskIndex = index"
          >
            <el-icon v-if="task.type === 'VIDEO'"><VideoPlay /></el-icon>
            <el-icon v-else-if="task.type === 'PDF'"><Document /></el-icon>
            <el-icon v-else><Notebook /></el-icon>
            <span>任务 {{ index + 1 }}: {{ getTaskLabel(task.type) }}</span>
            <el-icon v-if="index < currentTaskIndex" class="text-green-500"><CircleCheckFilled /></el-icon>
          </div>
        </div>

        <!-- 2. 内容视窗 -->
        <div class="content-viewer-window">
          <!-- 视频模式 -->
          <div v-if="activeTask?.type === 'VIDEO'" class="renderer-video">
             <video 
               :src="getMediaUrl(activeTask.url)" 
               controls 
               controlsList="nodownload"
               class="w-full h-full object-contain"
             ></video>
          </div>

          <!-- PDF 模式 -->
          <div v-else-if="activeTask?.type === 'PDF'" class="renderer-pdf">
             <iframe 
                v-if="isPdf(activeTask.url)"
                :src="getMediaUrl(activeTask.url)" 
                class="full-frame"
             ></iframe>
             <iframe 
                v-else
                :src="'https://view.officeapps.live.com/op/view.aspx?src=' + encodeURIComponent(getMediaUrl(activeTask.url))" 
                class="full-frame"
             ></iframe>
          </div>

          <!-- 图文/默认模式 -->
          <div v-else class="renderer-text">
             <div class="max-w-4xl mx-auto py-8">
                <div class="mb-6 border-b border-gray-100 pb-4">
                   <h1 class="text-2xl font-bold text-gray-900">{{ currentChapter?.chapterTitle || '请选择章节' }}</h1>
                </div>
                <div class="prose prose-indigo max-w-none text-gray-700" v-html="formatTextContent(currentChapter?.textContent || '暂无内容')"></div>
                
                <el-empty v-if="!currentChapter?.textContent" description="暂无额外图文内容" />
             </div>
          </div>
        </div>

        <!-- 3. 底部导航条 -->
        <div class="content-navigation">
           <div 
             class="nav-chapters-btn"
             :class="{ 'opacity-50 cursor-not-allowed': !prevChapter }"
             @click="prevChapter && handleChapterClick(prevChapter)"
           >
             <el-icon><ArrowLeft /></el-icon>
             <span>上一节</span>
           </div>

           <div class="text-xs text-gray-400 hidden md:block">
              当前: {{ currentChapter?.chapterTitle || '...' }}
           </div>

           <div 
             class="nav-chapters-btn bg-indigo-600 text-white hover:bg-indigo-700"
             :class="{ 'opacity-50 cursor-not-allowed': !nextChapter }"
             @click="nextChapter && handleChapterClick(nextChapter)"
           >
             <span>下一节</span>
             <el-icon><ArrowRight /></el-icon>
           </div>
        </div>

        <!-- 4. 底部选项卡区域 (恢复大屏显示) -->
        <div class="bottom-tabs-section">
          <el-tabs v-model="activeTabName" class="modern-tabs">
            <el-tab-pane label="课程介绍" name="intro">
               <div class="p-4 bg-white rounded-lg border border-gray-100">
                  <h3 class="text-lg font-bold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">课程简介</h3>
                  <p class="text-gray-600 leading-relaxed">{{ courseInfo.courseDescription || '暂无简介' }}</p>
               </div>
            </el-tab-pane>

            <el-tab-pane label="讨论区" name="discuss">
               <template #label>
                 <span>讨论区</span>
               </template>
               
               <div class="discussion-container">
                  <div class="flex gap-4 mb-6">
                     <el-avatar :size="40" :src="userInfo?.avatarUrl" class="flex-shrink-0">{{ userInfo?.userName?.charAt(0) }}</el-avatar>
                     <div class="flex-1 relative">
                        <el-input
                          v-model="newComment"
                          type="textarea"
                          :rows="3"
                          placeholder="针对本章节提问..."
                          resize="none"
                        />
                        <!-- 增加间距 mt-4 -->
                        <!-- 强制间距和颜色 -->
                        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                           <el-button 
                             type="primary" 
                             style="background-color: #4f46e5; border-color: #4f46e5; color: white; padding: 10px 24px; border-radius: 8px;"
                             @click="submitComment" 
                             :loading="commentsLoading"
                           >
                             发布评论
                           </el-button>
                        </div>
                     </div>
                  </div>
                  
                  <div class="comments-list" v-loading="commentsLoading">
                    <CommentItem
                      v-for="comment in comments"
                      :key="comment.commentId || comment.id"
                      :comment="comment"
                      :courseId="courseId"
                      :showChapter="false"
                      @commentPosted="currentChapter && loadChapterComments(currentChapter.chapterId)"
                    />
                    <el-empty v-if="comments.length === 0" description="暂无讨论，来抢沙发吧" />
                  </div>
               </div>
            </el-tab-pane>

            <el-tab-pane label="资料下载" name="resources">
               <!-- 保留修正后的资料卡片样式 -->
               <div v-if="currentChapter?.pdfUrl" class="resource-card hover:shadow-sm transition-all duration-300">
                  <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                     <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
                        <el-icon :size="24"><Document /></el-icon>
                     </div>
                     <div class="flex-1">
                        <div class="font-medium text-gray-800 text-base mb-1">{{ currentChapter.chapterTitle }} - 课件文档</div>
                        <div class="text-xs text-gray-400 flex items-center gap-2">
                           <span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-semibold">PDF</span>
                           <span>{{ '1.2 MB' }}</span>
                        </div>
                     </div>
                     <el-button type="primary" bg class="!rounded-lg px-6" @click="downloadFile(currentChapter.pdfUrl, currentChapter.chapterTitle)">
                        <el-icon class="mr-1"><Download /></el-icon> 下载
                     </el-button>
                  </div>
               </div>
               <el-empty v-else description="本章节暂无附件资料" :image-size="100" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </main>

      <!-- 右侧侧边栏 (恢复为纯目录) -->
      <aside class="course-sidebar">
        <!-- 侧边栏头部进度条已移除，只保留目录列表 -->
        <div class="chapter-scroller custom-scrollbar">
           <!-- 手风琴目录结构 -->
           <div v-for="chapter in chapters" :key="chapter.chapterId" class="chapter-group">
              <div class="chapter-header" @click="toggleChapterExpand(chapter.chapterId)">
                <span class="truncate pr-2">{{ chapter.chapterTitle }}</span>
                <el-icon class="text-gray-400">
                  <ArrowUp v-if="expandedChapters.includes(chapter.chapterId)" />
                  <ArrowDown v-else />
                </el-icon>
              </div>
              
              <div v-show="expandedChapters.includes(chapter.chapterId)" class="lesson-list">
                 <div 
                    v-for="lesson in chapter.children" 
                    :key="lesson.chapterId" 
                    class="lesson-item"
                    :class="{ active: currentChapter?.chapterId === lesson.chapterId }"
                    @click="handleChapterClick(lesson)"
                 >
                    <!-- 状态图标 -->
                    <div class="status-icon" :class="{ completed: isCompleted(lesson), active: currentChapter?.chapterId === lesson.chapterId }">
                       <el-icon v-if="isCompleted(lesson)"><CircleCheckFilled /></el-icon>
                       <el-icon v-else-if="currentChapter?.chapterId === lesson.chapterId"><VideoPlay /></el-icon>
                       <el-icon v-else><Lock v-if="lesson.locked" /><CircleCheck v-else /></el-icon>
                    </div>
                    
                    <div class="lesson-content">
                       <div class="lesson-meta">
                          <span class="type-tag" :class="getLessonType(lesson).toLowerCase()">
                            {{ getLessonTypeTitle(lesson) }}
                          </span>
                       </div>
                       <div class="lesson-title">{{ lesson.chapterTitle }}</div>
                    </div>

                    <div class="duration-text" v-if="lesson.videoUrl">
                       <!-- 模拟时长 -->
                       {{ '10:00' }}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </aside>
    </div>

    <!-- 未报名或未通过审核 -->
    <div v-if="!loading && !canLearn" class="access-denied-overlay">
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Monitor, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Search, Bell, 
  VideoPlay, Document, Notebook, Download, CircleCheck, CircleCheckFilled, 
  Lock, FullScreen, Files
} from '@element-plus/icons-vue'
import CommentItem from '@/views/teacher/course/CommentItem.vue'
import { useCourseLearn } from '@/assets/js/student/course-learn.js'
import axios from 'axios'
import { useUserInfo } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userInfo = useUserInfo()
const courseId = computed(() => route.params.id)
const activeTabName = ref('intro')
const expandedChapters = ref([]) // 存储展开的章节ID
const currentTaskIndex = ref(0) // 混合任务当前索引

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
  comments,
  totalCommentCount,
  commentsLoading,
  newComment,
  isTeacher,
  handleChapterClick,
  loadChapterComments,
  getMediaUrl,
  formatTextContent,
  submitComment,
} = useCourseLearn()

// --- 混合任务逻辑 ---
const mixedTasks = computed(() => {
  if (!currentChapter.value) return []
  const tasks = []
  
  // 1. 视频任务
  if (currentChapter.value.videoUrl) {
    tasks.push({ type: 'VIDEO', url: currentChapter.value.videoUrl, title: currentChapter.value.chapterTitle + ' (视频)' })
  }
  
  // 2. PDF任务
  if (currentChapter.value.pdfUrl) {
    tasks.push({ type: 'PDF', url: currentChapter.value.pdfUrl, title: currentChapter.value.chapterTitle + ' (文档)' })
  }
  
  // 3. 图文任务 (如果有文本内容)
  if (currentChapter.value.textContent) {
    tasks.push({ type: 'TEXT', content: currentChapter.value.textContent, title: '图文' })
  }
  
  // 如果没有任何内容，默认给一个TEXT类型的空任务防止报错
  if (tasks.length === 0) {
    tasks.push({ type: 'TEXT', content: '', title: '暂无内容' })
  }
  
  return tasks
})

const isMixedChapter = computed(() => mixedTasks.value.length > 1)
const activeTask = computed(() => mixedTasks.value[currentTaskIndex.value] || mixedTasks.value[0])

// 监听章节切换，重置任务索引
watch(() => currentChapter.value?.chapterId, () => {
  currentTaskIndex.value = 0
})

// --- 辅助函数 ---
const getTaskLabel = (type) => {
  const map = { 'VIDEO': '视频', 'PDF': '文档', 'TEXT': '图文' }
  return map[type] || '任务'
}

const isPdf = (url) => url?.toLowerCase().endsWith('.pdf')

const toggleChapterExpand = (chapterId) => {
  const index = expandedChapters.value.indexOf(chapterId)
  if (index > -1) {
    expandedChapters.value.splice(index, 1)
  } else {
    expandedChapters.value.push(chapterId)
  }
}

// 自动展开包含当前章节的父节点
watch(chapters, (newChapters) => {
  if (newChapters && newChapters.length > 0) {
     const allIds = newChapters.map(c => c.chapterId)
     expandedChapters.value = allIds // 默认全部展开
  }
}, { immediate: true })

const getLessonType = (lesson) => {
  // 根据拥有什么资源判断类型
  if (lesson.videoUrl && lesson.pdfUrl) return 'mixed'
  if (lesson.videoUrl) return 'video'
  if (lesson.pdfUrl) return 'pdf'
  return 'quiz' // 默认为 text/quiz
}

const getLessonTypeTitle = (lesson) => {
  const type = getLessonType(lesson)
  const map = { 'mixed': '综合', 'video': '视频', 'pdf': '文档', 'quiz': '图文' }
  return map[type]
}

const isCompleted = (lesson) => {
  // 这里暂时全是false，实际需对接后端
  return false
}

const getLessonStatusClass = (lesson) => {
  if (isCompleted(lesson)) return 'completed'
  if (currentChapter.value?.chapterId === lesson.chapterId) return 'active'
  if (lesson.locked) return 'locked'
  return ''
}

// 进度计算 (模拟)
const progressPercentage = ref(0)
onMounted(() => {
  setTimeout(() => progressPercentage.value = 42, 1000)
})

// 上一节/下一节 计算
const allLessons = computed(() => {
  if (!chapters.value) return []
  return chapters.value.flatMap(c => c.children || [])
})

const currentLessonIndex = computed(() => {
  if (!allLessons.value || !currentChapter.value) return -1
  return allLessons.value.findIndex(l => l.chapterId === currentChapter.value.chapterId)
})

const prevChapter = computed(() => {
  if (currentLessonIndex.value > 0) return allLessons.value[currentLessonIndex.value - 1]
  return null
})

const nextChapter = computed(() => {
  if (currentLessonIndex.value < allLessons.value.length - 1) return allLessons.value[currentLessonIndex.value + 1]
  return null
})

// --- 下载逻辑 (复用) ---
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

// --- 页面控制逻辑 ---
const handleBack = () => {
  if (window.history.length > 2) {
    router.back()
  } else {
    router.push(isTeacher.value ? '/teacher/courses' : '/student/courses')
  }
}
</script>

<style scoped>
@import '@/assets/css/student/course-learn-modern.css';
 
.access-denied-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<style>
/* 
 * 全局暗黑模式修复 (Global Dark Mode Fixes) 
 * 必须放在无 scoped 的 style 中以穿透子组件
 */
html.dark .comments-list,
html.dark .comments-list p, 
html.dark .comments-list div,
html.dark .comments-list span,
html.dark .comments-list .el-collapse-item__header,
html.dark .comments-list .el-collapse-item__content {
    color: #e5e7eb !important;
}

html.dark .comments-list .text-gray-900, 
html.dark .comments-list .text-gray-800, 
html.dark .comments-list .text-gray-700,
html.dark .comments-list .text-gray-600 {
    color: #e5e7eb !important;
}

html.dark .comments-list .text-gray-500,
html.dark .comments-list .text-gray-400 {
    color: #9ca3af !important;
}

/* 评论操作按钮 */
html.dark .comments-list .el-button--text,
html.dark .comments-list .cursor-pointer {
    color: #818cf8 !important;
}

/* 强制输入框背景变暗 */
html.dark .el-textarea__inner {
    background-color: #374151 !important;
    color: #fff !important;
}
</style>
