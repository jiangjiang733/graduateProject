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
      
      <div 
        v-for="comment in comments" 
        :key="comment.commentId" 
        :class="['comment-item', { 'highlight-target': String(comment.commentId) === String(route.query.commentId) }]"
        :id="'comment-' + comment.commentId"
      >
        <div class="comment-avatar">
          <el-avatar :size="40" :src="formatAvatarUrl(comment.userAvatar)">
            {{ comment.userName?.charAt(0) || 'U' }}
          </el-avatar>
        </div>
        <div class="comment-content">
          <div class="comment-header-info">
            <span class="user-name">{{ comment.userName }}</span>
            <el-tag v-if="comment.userType === 'TEACHER'" type="danger" effect="dark" size="small" class="tag-teacher">教师</el-tag>
            <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
          </div>
          <div class="comment-text">{{ comment.content }}</div>
          <div class="comment-actions">
            <span class="action-item" @click="showReplyInput(comment)">
              <el-icon><ChatDotRound /></el-icon>
              回复
            </span>
            <span
              v-if="canDelete(comment)"
              class="action-item delete"
              @click="deleteCommentItem(comment)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </span>
          </div>

          <!-- 回复输入框 -->
          <div v-if="replyingTo === comment.commentId" class="reply-input">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              :placeholder="'回复 @' + comment.userName + '...'"
              maxlength="500"
            />
            <div class="reply-actions-btn">
              <el-button size="small" @click="cancelReply">取消</el-button>
              <el-button size="small" type="primary" :loading="replying" @click="postReply(comment)">
                发布
              </el-button>
            </div>
          </div>

          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
            <!-- 未展开时显示"查看X条回复" -->
            <div v-if="!expandedReplies[comment.commentId]" class="view-more-row">
              <span class="view-more-btn" @click="toggleReplies(comment.commentId)">
                查看 {{ comment.replies.length }} 条回复 <el-icon><ArrowDown /></el-icon>
              </span>
            </div>
            
            <!-- 回复列表内容 -->
            <div v-if="expandedReplies[comment.commentId]" class="replies-list">
              <div 
                v-for="reply in comment.replies" 
                :key="reply.commentId" 
                :class="['reply-item', { 'highlight-target': String(reply.commentId) === String(route.query.commentId) }]"
                :id="'comment-' + reply.commentId"
              >
                <div class="reply-avatar">
                  <el-avatar :size="32" :src="formatAvatarUrl(reply.userAvatar)">
                    {{ reply.userName?.charAt(0) || 'U' }}
                  </el-avatar>
                </div>
                <div class="reply-content">
                  <div class="reply-header">
                    <span class="user-name">{{ reply.userName }}</span>
                    <el-tag v-if="reply.userType === 'TEACHER'" type="danger" effect="dark" size="small" class="tag-teacher">教师</el-tag>
                    <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                    <el-icon v-if="canDelete(reply)" class="delete-mini" @click="deleteCommentItem(reply)" title="删除"><Delete /></el-icon>
                  </div>
                  <div class="reply-text">
                    <span v-if="reply.targetUserName && !isSelfReply(reply, comment)" class="reply-target-text">
                      回复 <span class="target-name">@{{ reply.targetUserName }}</span> : 
                    </span>
                    {{ reply.content }}
                  </div>
                  <div class="reply-actions">
                    <span class="action-item" @click="showReplyInput(comment, reply)">
                      <el-icon><ChatDotRound /></el-icon>
                      回复
                    </span>
                  </div>
                  <!-- 回复的回复输入框 -->
                  <div v-if="replyingTo === reply.commentId" class="reply-input">
                    <el-input
                      v-model="replyContent"
                      type="textarea"
                      :rows="2"
                      :placeholder="'回复 @' + reply.userName + '...'"
                      maxlength="500"
                    />
                    <div class="reply-actions-btn">
                      <el-button size="small" @click="cancelReply">取消</el-button>
                      <el-button size="small" type="primary" :loading="replying" @click="postReply(comment, reply)">
                        发布
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 收起回复按钮 -->
              <div class="view-more-row">
                <span class="view-more-btn" @click="toggleReplies(comment.commentId)">
                  收起回复 <el-icon><ArrowUp /></el-icon>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  Delete,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'
import { getChapterComments, getCourseComments, addComment, deleteComment } from '@/api/comment'
import { getUserAvatar } from '@/utils/resource'

const route = useRoute()

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
const replyTargetComment = ref(null)  // 顶级评论引用
const replyTargetUser = ref(null)     // 被回复用户
const replyContent = ref('')
const expandedReplies = ref({})       // 记录每个评论的回复展开状态

// 切换回复的展开/收起
const toggleReplies = (commentId) => {
  expandedReplies.value[commentId] = !expandedReplies.value[commentId]
}

// 头像处理辅助函数 - 使用统一的资源处理函数
const formatAvatarUrl = (url) => {
  return getUserAvatar(url)
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

// 处理评论列表为扁平树形结构（打平所有回复）
const buildTree = (list) => {
  const map = {}
  const tree = []
  
  // 1. 先把所有评论存入 map，只有顶级评论有replies数组
  list.forEach(item => {
    const isTopLevel = !item.parentId || item.parentId === 0
    map[item.commentId] = { 
      ...item, 
      replies: isTopLevel ? [] : undefined 
    }
  })
  
  // 2. 将所有回复（无论几层）都打平到其根评论的replies数组中
  list.forEach(item => {
    if (item.parentId && item.parentId !== 0 && map[item.parentId]) {
      const currentItem = map[item.commentId]
      const directParent = map[item.parentId]
      let rootParent = directParent
      
      // 向上查找根评论
      while (rootParent.parentId && rootParent.parentId !== 0) {
        if (map[rootParent.parentId]) {
          rootParent = map[rootParent.parentId]
        } else {
          break
        }
      }
      
      // 设置targetUserName - 使用直接父级的用户名（被@的用户）
      if (!currentItem.targetUserName && directParent) {
        currentItem.targetUserName = directParent.userName
        currentItem.targetUserId = directParent.userId
      }
      
      // 将当前回复添加到根评论的replies中
      if (rootParent.replies) {
        rootParent.replies.push(currentItem)
      }
    } else if (!item.parentId || item.parentId === 0) {
      // 顶级评论
      tree.push(map[item.commentId])
    }
  })
  
  // 3. 排序
  tree.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  
  tree.forEach(item => {
    if (item.replies && item.replies.length > 0) {
      item.replies.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
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
      // 课程全局接口返回的是扁平列表，需要前端构建树
      response = await getCourseComments(props.courseId)
      const allComments = response.data || []
      
      console.log('后端返回的原始评论数据:', allComments.length, '条')
      
      // 直接使用 buildTree 构建树形结构
      // buildTree 会自动识别顶级评论（parentId 为空）和回复（有 parentId）
      comments.value = buildTree(allComments)
      
      console.log('最终评论列表:', comments.value.length, '条顶级评论')
    }

    // 检查是否有 commentId 需要定位
    const targetCommentId = route.query.commentId
    if (targetCommentId) {
      nextTick(() => {
        setTimeout(() => {
          const element = document.getElementById(`comment-${targetCommentId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
      })
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
// comment: 顶级评论, reply: 可选的二级回复（如果是回复二级回复的话）
const showReplyInput = (comment, reply = null) => {
  if (reply) {
    // 回复一个二级回复
    replyingTo.value = reply.commentId
    replyTargetComment.value = comment  // 保存顶级评论引用
    replyTargetUser.value = reply       // 保存被回复用户
  } else {
    // 回复顶级评论
    replyingTo.value = comment.commentId
    replyTargetComment.value = comment
    replyTargetUser.value = comment
  }
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyTargetComment.value = null
  replyTargetUser.value = null
  replyContent.value = ''
}

// 发布回复
// comment: 顶级评论, targetReply: 可选的被回复的二级回复
const postReply = async (comment, targetReply = null) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  replying.value = true
  try {
    const userInfo = getUserInfo()
    
    // 确定回复的目标用户
    const targetUser = targetReply || comment
    
    // 修复：parentId 应该是被回复评论的ID，而不是顶级评论的ID
    // 这样才能正确建立回复链
    const replyData = {
      courseId: props.courseId,
      chapterId: props.chapterId || null,
      userId: userInfo.userId,
      userName: userInfo.userName,
      userAvatar: userInfo.userAvatar,
      userType: props.userType,
      content: replyContent.value.trim(),
      // 父评论ID设置为被@的那条评论的ID
      parentId: targetUser.commentId,
      // 被回复用户信息（用于显示"回复 @用户名"）
      targetUserId: targetUser.userId,
      targetUserType: targetUser.userType,
      targetUserName: targetUser.userName
    }

    await addComment(replyData)
    ElMessage.success('回复成功')
    cancelReply()
    
    // 展开回复列表以显示新回复
    expandedReplies.value[comment.commentId] = true
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

// 判断是否是自己回复自己（避免显示"@自己"）
const isSelfReply = (reply, parentComment) => {
  const authorId = String(reply.userId)
  const targetId = reply.targetUserId ? String(reply.targetUserId) : String(parentComment.userId)
  return authorId === targetId
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

// 实时刷新定时器
let refreshTimer = null

onMounted(() => {
  loadComments()
  
  // 每 10 秒静默刷新一次评论列表
  refreshTimer = setInterval(() => {
    loadComments()
  }, 10000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

// 暴露刷新方法
defineExpose({
  loadComments
})
</script>

<style scoped>
@import '@/assets/css/components/comment-section.css';
</style>

