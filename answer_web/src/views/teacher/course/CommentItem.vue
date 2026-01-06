<template>
  <div :class="['comment-item-container', { 'is-reply': isReply }]">
    <el-avatar :size="isReply ? 32 : 40" :src="getUserAvatar(comment.userAvatar)" class="comment-avatar" />
    
    <div class="comment-body">
      <!-- 1. Header Row -->
      <div class="comment-meta">
        <div class="meta-left">
          <span class="comment-author">{{ comment.userName }}</span>
          <el-tag v-if="comment.userType === 'TEACHER'" size="small" type="danger" effect="dark" class="tag-teacher">
            教师
          </el-tag>
          <el-tag v-if="showChapter && comment.chapterTitle" size="small" type="info" class="tag-chapter">
            # {{ comment.chapterTitle }}
          </el-tag>
          <span class="comment-time">{{ formatRelativeTime(comment.createTime) }}</span>
        </div>
        
        <div class="meta-right">
           <el-icon v-if="isReply && String(comment.userId) === String(currentUserId)" class="action-icon delete-mini" @click="confirmDelete(comment.commentId)" title="删除"><Delete /></el-icon>
        </div>
      </div>

      <!-- 2. Content Section -->
      <div class="comment-content">
        <span v-if="isReply && comment.targetUserName && String(comment.userId) !== String(comment.targetUserId)" class="reply-target-text">
          回复 <span class="target-name">@{{ comment.targetUserName }}</span> : 
        </span>
        {{ comment.content }}
      </div>

      <!-- 3. Actions Row -->
      <div class="comment-footer">
        <div class="comment-actions">
           <span class="action-item" @click="toggleReplyForm">
             <el-icon><ChatLineSquare /></el-icon>
             {{ showReply ? '取消回复' : '回复' }}
           </span>
           <span v-if="!isReply && String(comment.userId) === String(currentUserId)" class="action-item delete" @click="confirmDelete(comment.commentId)">
             <el-icon><Delete /></el-icon> 删除
           </span>
        </div>
      </div>

      <el-collapse-transition>
        <div v-if="showReply" class="reply-form-wrapper">
          <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              :placeholder="'回复 @' + comment.userName + '...'"
              resize="none"
          />
          <div class="reply-actions-row">
            <el-button size="small" type="primary" :loading="isReplying" :disabled="!replyContent.trim()" @click="submitReply">
              发布
            </el-button>
          </div>
        </div>
      </el-collapse-transition>

      <div v-if="comment.replies && comment.replies.length > 0 && !hideChildren" :class="['replies-list', { 'replies-box': !isReply }]">
        <CommentItem
            v-for="reply in displayReplies"
            :key="reply.commentId || reply.id"
            :comment="reply"
            :courseId="courseId"
            :isReply="true"
            :showChapter="showChapter"
            :hideChildren="!isExpanded && totalReplyCount > 1"
            @commentPosted="$emit('commentPosted')"
        />
        
        <div v-if="totalReplyCount > 1" class="view-more-row">
           <span class="view-more-btn" @click="isExpanded = !isExpanded">
             {{ isExpanded ? '收起回复' : `共 ${totalReplyCount} 条回复，点击展开` }}
             <el-icon><ArrowDown v-if="!isExpanded" /><ArrowUp v-else /></el-icon>
           </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommentItem'
}
</script>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { ElCollapseTransition } from 'element-plus';
import { ChatLineSquare, Delete, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { formatRelativeTime } from '@/utils/date.js';
import { getUserAvatar } from '@/utils/resource.js';
import { useCommentItem } from '@/assets/js/teacher/comment-item.js';

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  isReply: {
    type: Boolean,
    default: false
  },
  showChapter: {
    type: Boolean,
    default: false
  },
  hideChildren: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['commentPosted']);

const {
  showReply,
  replyContent,
  isReplying,
  currentUserId,
  toggleReplyForm,
  submitReply,
  confirmDelete
} = useCommentItem(props, emit);

// 楼层折叠逻辑
const isExpanded = ref(false);

// 递归计算总回复数（父加子）
const totalReplyCount = computed(() => {
  let count = 0;
  const traverse = (replies) => {
    if (!replies) return;
    count += replies.length;
    replies.forEach(r => {
      if (r.replies) traverse(r.replies);
    });
  };
  traverse(props.comment.replies);
  return count;
});

const displayReplies = computed(() => {
  // 这里改为只要总回复数（父加子）大于 1 个（即主楼+回复已达2层以上），就触发折叠逻辑
  if (isExpanded.value || totalReplyCount.value <= 1) {
    return props.comment.replies;
  }
  // 折叠状态下只显示第一条直接回复，并强制隐藏该回复下的所有子楼层
  return props.comment.replies.slice(0, 1);
});
</script>

<style scoped>
@import '@/assets/css/teacher/comment-item.css';

.comment-item-container {
    display: flex;
    padding: 16px 0;
}

.comment-avatar {
    flex-shrink: 0;
    margin-right: 16px;
    cursor: pointer;
}

.comment-body {
    flex: 1;
    min-width: 0;
}

/* Header Meta */
.comment-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.meta-left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.comment-author {
    font-weight: 600;
    color: #61666d; 
    font-size: 13px;
    cursor: pointer;
}
.comment-author:hover {
    color: #409eff; 
}

.comment-time {
    font-size: 12px;
    color: #9499a0;
}

/* Tag Styles */
.tag-teacher {
    padding: 0 4px;
    height: 18px;
    line-height: 16px;
}

.tag-chapter {
    font-size: 11px;
    height: 18px;
    line-height: 16px;
}

/* Content */
.comment-content {
    font-size: 14px;
    color: #18191c;
    line-height: 1.6;
    word-break: break-word;
    margin: 4px 0;
}

.reply-target-text {
    color: #61666d;
    margin-right: 4px;
}

.target-name {
    color: #409eff;
    cursor: pointer;
}

/* Actions */
.comment-footer {
    display: flex;
    align-items: center;
    margin-top: 4px;
    color: #9499a0;
    font-size: 12px;
}

.comment-actions {
    display: flex;
    gap: 16px; 
}

.action-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
}
.action-item:hover {
    color: #409eff;
}
.action-item.delete:hover {
    color: #f56c6c;
}

.delete-mini {
    cursor: pointer;
    color: #9499a0;
    font-size: 14px;
    transition: color 0.2s;
}
.delete-mini:hover {
    color: #f56c6c;
}

/* Reply Form */
.reply-form-wrapper {
    margin: 10px 0;
    padding: 10px;
    background-color: #f4f5f7;
    border-radius: 4px;
}
.reply-actions-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

/* Container Adjustments */
.comment-item-container.is-reply {
    padding: 8px 0;
}

/* Replies Box (Gray Floor) */
.replies-box {
    margin-top: 10px;
    background-color: #f7f8fa;
    border-radius: 4px;
    padding: 8px 12px;
}

.replies-list {
    margin-top: 4px;
}

.view-more-row {
    padding: 4px 0 8px;
    font-size: 13px;
    color: #9499a0;
}

.view-more-btn {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
}

.view-more-btn:hover {
    color: #409eff;
}
</style>