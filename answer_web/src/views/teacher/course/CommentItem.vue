<template>
  <div :class="['comment-item-container', { 'is-reply': isReply }]">
    <el-avatar :size="40" :src="getUserAvatar(comment.userAvatar)" class="comment-avatar" />
    <div class="comment-body">
      <div class="comment-meta">
        <span class="comment-author">{{ comment.userName }}</span>
        <el-tag v-if="comment.userType === 'TEACHER'" size="small" type="danger" effect="dark">
          教师
        </el-tag>
        <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
      </div>

      <p class="comment-content">
        <span v-if="comment.targetUserName && isReply" class="reply-target">
          回复 @{{ comment.targetUserName }}:
        </span>
        {{ comment.content }}
      </p>

      <div class="comment-actions">
        <el-button link type="primary" :icon="ChatLineSquare" @click="toggleReplyForm">
          {{ showReply ? '取消回复' : '回复' }}
        </el-button>
        <el-button v-if="comment.userId === currentUserId || canDeleteComment(comment.courseId)" link type="danger" :icon="Delete" @click="confirmDelete(comment.id)">
          删除
        </el-button>
      </div>

      <el-collapse-transition>
        <div v-if="showReply" class="reply-form-wrapper">
          <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              :placeholder="'回复 ' + comment.userName"
              resize="none"
          />
          <div class="reply-actions">
            <el-button size="small" type="primary" :loading="isReplying" :disabled="!replyContent.trim()" @click="submitReply">
              提交回复
            </el-button>
          </div>
        </div>
      </el-collapse-transition>

      <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
        <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
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
</style>