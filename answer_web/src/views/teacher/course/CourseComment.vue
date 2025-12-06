<template>
  <div class="course-comment-section">
    <el-card class="comment-post-card" shadow="hover">
      <div class="comment-header">
        <el-avatar :size="40" :src="userAvatar" />
        <span class="comment-user-name">发表评论...</span>
      </div>

      <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="留下您对课程的宝贵评论吧！"
          resize="none"
          maxlength="500"
          show-word-limit
      />

      <div class="post-actions">
        <el-button
            type="primary"
            :loading="isPosting"
            :disabled="!commentContent.trim()"
            @click="submitComment(null)">
          发布评论
        </el-button>
      </div>
    </el-card>

    <el-divider />

    <div class="comment-list-container">
      <h3>课程评论 ({{ comments.length }})</h3>

      <div v-if="loadingComments" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="comments.length === 0" class="empty-comment">
        <el-empty description="暂无评论，快来抢沙发吧！" :image-size="100" />
      </div>

      <div v-else class="comment-list">
        <CommentItem
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            :courseId="courseId"
            @commentPosted="fetchComments"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import CommentItem from './CommentItem.vue';
import { useCourseComment } from '@/assets/js/teacher/course-comment.js';

const props = defineProps({
  courseId: {
    type: String,
    required: true
  }
});

const {
  comments,
  commentContent,
  isPosting,
  loadingComments,
  userAvatar,
  fetchComments,
  submitComment
} = useCourseComment(props);
</script>

<style scoped>
@import '@/assets/css/teacher/course-comment.css';
</style>