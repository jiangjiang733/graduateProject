<template>
  <div class="comment-section">
    <div class="comment-header">
      <h3>讨论区</h3>
      <span class="comment-count">{{ comments.length }} 条评论</span>
    </div>

    <!-- 发布评论 -->
    <div class="comment-input-section">
      <el-input
        v-model="newComment"
        type="textarea"
        :rows="3"
        placeholder="发表你的看法..."
        maxlength="500"
        show-word-limit
      />
      <div class="input-actions">
        <el-button type="primary" :loading="posting" @click="postComment">
          发布评论
        </el-button>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-loading="loading" class="comment-list">
      <el-empty v-if="comments.length === 0" description="暂无评论,快来发表第一条评论吧!" :image-size="120" />
      
      <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
        <div class="comment-avatar">
          <el-avatar :size="40" :src="formatAvatarUrl(comment.userAvatar)">
            {{ comment.userName?.charAt(0) || 'U' }}
          </el-avatar>
        </div>
        <div class="comment-content">
          <div class="comment-header-info">
            <span class="user-name">{{ comment.userName }}</span>
            <el-tag v-if="comment.userType === 'TEACHER'" type="warning" size="small">教师</el-tag>
            <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
          </div>
          <div class="comment-text">{{ comment.content }}</div>
          <div class="comment-actions">
            <el-button text size="small" @click="showReplyInput(comment)">
              <el-icon><ChatDotRound /></el-icon>
              回复
            </el-button>
            <el-button
              v-if="canDelete(comment)"
              text
              size="small"
              type="danger"
              @click="deleteCommentItem(comment)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>

          <!-- 回复输入框 -->
          <div v-if="replyingTo === comment.commentId" class="reply-input">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              placeholder="输入回复内容..."
              maxlength="500"
            />
            <div class="reply-actions">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button size="small" type="primary" :loading="replying" @click="postReply(comment)">
                发布
              </el-button>
            </div>
          </div>

          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
            <div v-for="reply in comment.replies" :key="reply.commentId" class="reply-item">
              <div class="reply-avatar">
                <el-avatar :size="32" :src="formatAvatarUrl(reply.userAvatar)">
                  {{ reply.userName?.charAt(0) || 'U' }}
                </el-avatar>
              </div>
              <div class="reply-content">
                <div class="reply-header">
                  <span class="user-name">{{ reply.userName }}</span>
                  <el-tag v-if="reply.userType === 'TEACHER'" type="warning" size="small">教师</el-tag>
                  <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                </div>
                <div class="reply-text">{{ reply.content }}</div>
                <el-button
                  v-if="canDelete(reply)"
                  text
                  size="small"
                  type="danger"
                  @click="deleteCommentItem(reply)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  Delete
} from '@element-plus/icons-vue'
import { getChapterComments, getCourseComments, addComment, deleteComment } from '@/api/comment'

const props = defineProps({
  chapterId: {
    type: Number,
    required: false,
    default: null
  },
  courseId: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    default: 'STUDENT' // TEACHER or STUDENT
  }
})

const loading = ref(false)
const posting = ref(false)
const replying = ref(false)
const comments = ref([])
const newComment = ref('')
const replyingTo = ref(null)
const replyContent = ref('')

// 头像处理辅助函数
const formatAvatarUrl = (url) => {
  if (!url) return '' // 返回空让 el-avatar 显示插槽内容（文字初始）
  if (url.startsWith('http')) return url
  return `http://localhost:8088${url}`
}

// 获取用户信息
const getUserInfo = () => {
  const tId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
  const tName = localStorage.getItem('teacherName')
  const tAvatar = localStorage.getItem('teacherHead')
  
  const sId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
  const sName = localStorage.getItem('studentName')
  const sAvatar = localStorage.getItem('studentHead')

  if (props.userType === 'TEACHER' && tId) {
    return {
      userId: tId,
      userName: tName || '教师',
      userAvatar: tAvatar || ''
    }
  } else if (sId) {
    return {
      userId: sId,
      userName: sName || localStorage.getItem('userName') || '学生',
      userAvatar: sAvatar || ''
    }
  }

  return { userId: 'unknown', userName: '用户', userAvatar: '' }
}

// 处理评论列表为树形结构
const buildTree = (list) => {
  const map = {}
  const tree = []
  
  // 先把所有项存入 map，并初始化 replies
  list.forEach(item => {
    map[item.commentId] = { ...item, replies: [] }
  })
  
  list.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      // 如果有父级，且父级在列表中，则加入父级的回复列表
      map[item.parentId].replies.push(map[item.commentId])
    } else if (!item.parentId || item.parentId === 0) {
      // 如果没有父级或父级为 0，则是顶级评论
      tree.push(map[item.commentId])
    }
  })
  
  return tree
}

// 加载评论
const loadComments = async () => {
  loading.value = true
  try {
    let response
    if (props.chapterId) {
      response = await getChapterComments(props.chapterId)
      // 章节接口通常后端已经处理好树形，如果未处理则调用 buildTree
      const data = response.data || []
      comments.value = Array.isArray(data[0]?.replies) ? data : buildTree(data)
    } else {
      // 课程全局接口返回的是扁平列表，需要前端过滤并构建树
      response = await getCourseComments(props.courseId)
      const allComments = response.data || []
      
      // 1. 严格过滤：在课程详情页，只展示针对课程本身的评论（chapterId 为空或 0）
      const courseLevelComments = allComments.filter(c => !c.chapterId || c.chapterId === 0)
      
      // 2. 构建层级结构
      comments.value = buildTree(courseLevelComments)
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

// 发布评论
const postComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  posting.value = true
  try {
    const userInfo = getUserInfo()
    const commentData = {
      courseId: props.courseId,
      chapterId: props.chapterId || null, // 显式确保为空
      userId: userInfo.userId,
      userName: userInfo.userName,
      userAvatar: userInfo.userAvatar,
      userType: props.userType,
      content: newComment.value.trim()
    }

    await addComment(commentData)
    ElMessage.success('评论发布成功')
    newComment.value = ''
    await loadComments()
  } catch (error) {
    console.error('发布评论失败:', error)
    ElMessage.error('发布评论失败')
  } finally {
    posting.value = false
  }
}

// 显示回复输入框
const showReplyInput = (comment) => {
  replyingTo.value = comment.commentId
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

// 发布回复
const postReply = async (comment) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  replying.value = true
  try {
    const userInfo = getUserInfo()
    const replyData = {
      courseId: props.courseId,
      chapterId: props.chapterId || null,
      userId: userInfo.userId,
      userName: userInfo.userName,
      userAvatar: userInfo.userAvatar,
      userType: props.userType,
      content: replyContent.value.trim(),
      parentId: comment.commentId,
      targetUserId: comment.userId
    }

    await addComment(replyData)
    ElMessage.success('回复成功')
    cancelReply()
    await loadComments()
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

// 删除评论
const deleteCommentItem = async (comment) => {
  try {
    await ElMessageBox.confirm('确认删除这条评论吗?', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteComment(comment.commentId)
    ElMessage.success('删除成功')
    await loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 判断是否可以删除
const canDelete = (comment) => {
  const userInfo = getUserInfo()
  // 教师可以删除所有评论,学生只能删除自己的评论
  return props.userType === 'TEACHER' || comment.userId === userInfo.userId
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadComments()
})

// 暴露刷新方法
defineExpose({
  loadComments
})
</script>

<style scoped>
.comment-section {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comment-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.comment-count {
  color: #909399;
  font-size: 14px;
}

.comment-input-section {
  margin-bottom: 24px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.user-name {
  font-weight: 600;
  color: #303133;
}

.comment-time {
  color: #909399;
  font-size: 12px;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.reply-input {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.replies-list {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid #dcdfe6;
}

.reply-item {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 8px;
}

.reply-avatar {
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-text {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 6px;
  white-space: pre-wrap;
}
</style>
