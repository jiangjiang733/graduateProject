<template>
  <div :class="['comment-item-container', { 'is-reply': isReply }]">
    <el-avatar :size="isReply ? 24 : 40" :src="getUserAvatar(comment.userAvatar)" class="comment-avatar" />
    
    <div class="comment-body">
      <!-- 1. Name & Content Section -->
      <div class="comment-main-block">
        <!-- Root Comment: Name then Content separate -->
        <template v-if="!isReply">
          <div class="comment-user-row">
            <span class="comment-author">{{ comment.userName }}</span>
            <el-tag v-if="comment.userType === 'TEACHER'" size="small" type="danger" effect="dark" class="tag-teacher">
              教师
            </el-tag>
          </div>
          <p class="comment-content-text">
            {{ comment.content }}
          </p>
        </template>

        <!-- Reply: Name + Content Inline -->
        <template v-else>
          <div class="reply-inline-block">
            <span class="comment-author">{{ comment.userName }}</span>
            <el-tag v-if="comment.userType === 'TEACHER'" size="small" type="danger" effect="dark" class="tag-teacher mini">
              师
            </el-tag>
            
            <template v-if="comment.targetUserName && comment.userId !== comment.targetUserId">
              <span class="reply-text">回复</span>
              <span class="reply-target-name">@{{ comment.targetUserName }}</span>
            </template>
            <span class="colon" v-if="isReply">:</span>
            
            <span class="comment-content-text inline">
              {{ comment.content }}
            </span>
          </div>
        </template>
      </div>

      <div class="comment-footer">
        <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
        
        <div class="comment-actions">
           <span class="action-item" @click="toggleReplyForm">
             {{ showReply ? '取消回复' : '回复' }}
           </span>
           <span v-if="comment.userId === currentUserId || canDeleteComment(comment.courseId)" class="action-item delete" @click="confirmDelete(comment.commentId)">
             删除
           </span>
        </div>
      </div>

      <!-- 3. Reply Form -->
      <el-collapse-transition>
        <div v-if="showReply" class="reply-form-wrapper">
          <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              :placeholder="'回复 ' + comment.userName"
              resize="none"
          />
          <div class="reply-actions-row">
            <el-button size="small" type="primary" :loading="isReplying" :disabled="!replyContent.trim()" @click="submitReply">
              发布
            </el-button>
          </div>
        </div>
      </el-collapse-transition>

      <div v-if="comment.replies && comment.replies.length > 0" :class="['replies-list', { 'replies-box': !isReply }]">
        <CommentItem
            v-for="reply in comment.replies"
            :key="reply.commentId"
            :comment="reply"
            :courseId="courseId"
            :isReply="true"
            @commentPosted="$emit('commentPosted')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { ElCollapseTransition } from 'element-plus';
import { ChatLineSquare, Delete } from '@element-plus/icons-vue';
import { formatTime } from '@/utils/date.js';
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
  }
});

const emit = defineEmits(['commentPosted']);

const {
  showReply,
  replyContent,
  isReplying,
  currentUserId,
  canDeleteComment,
  toggleReplyForm,
  submitReply,
  confirmDelete
} = useCommentItem(props, emit);
</script>

<style scoped>
@import '@/assets/css/teacher/comment-item.css';

.comment-main-block {
    margin-bottom: 4px;
}

.comment-user-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
}

.comment-author {
    font-weight: 600;
    color: #61666d; 
    font-size: 13px;
    margin-right: 8px;
    cursor: pointer;
    line-height: 1.2;
}
.comment-author:hover {
    color: #409eff; 
}

/* Tag Styles */
.tag-teacher {
    margin-right: 8px;
    padding: 0 4px;
    height: 18px;
    line-height: 16px;
}
.tag-teacher.mini {
    transform: scale(0.9);
    margin-right: 4px;
}

/* Content Text */
.comment-content-text {
    font-size: 15px;
    color: #18191c;
    line-height: 1.6;
    word-break: break-word;
    margin: 0;
}
.comment-content-text.inline {
    display: inline;
}

/* Reply Inline Block (The Key Bilibili feature) */
.reply-inline-block {
    font-size: 14px;
    line-height: 1.6;
}

.reply-text {
    color: #18191c;
    margin: 0 4px;
}

.reply-target-name {
    color: #409eff; /* or #FB7299 */
    cursor: pointer;
    margin-right: 2px;
}
.reply-target-name:hover {
    color: #1e6fd9;
}

.colon {
    margin-right: 4px;
}

/* Footer (Time & Actions) */
.comment-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 4px;
    color: #9499a0;
    font-size: 12px;
}

.comment-time {
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

/* Reply Form */
.reply-form-wrapper {
    margin: 10px 0;
    padding: 10px;
    background-color: #f1f2f5;
    border-radius: 4px;
}
.reply-actions-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

/* Container Adjustments */
.comment-item-container {
    display: flex;
    padding: 16px 0;
    /* border-bottom handled by parent or none for nested */
}

.comment-avatar {
    flex-shrink: 0;
    margin-right: 16px;
    cursor: pointer;
}
.comment-item-container.is-reply .comment-avatar {
    margin-right: 10px;
    margin-top: 2px; /* Align with text top */
}

/* Replies Box (Gray Floor) */
.replies-box {
    margin-top: 10px;
    background-color: #f9fafb;
    border-radius: 4px;
    padding: 10px 16px;
}

/* Recursive list container */

/* Reply Item itself */
.comment-item-container.is-reply {
    padding: 6px 0;
    align-items: flex-start;
}
</style>