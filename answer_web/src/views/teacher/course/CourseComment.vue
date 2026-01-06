<template>
  <div class="course-comment-section">
    <!-- 章节筛选器 -->
    <div class="comment-filter-header">
      <div class="filter-left">
        <span class="label">讨论范围：</span>
        <el-tree-select
          v-model="selectedChapterId"
          :data="chaptersData"
          placeholder="全部章节评论"
          clearable
          check-strictly
          :props="{ label: 'chapterTitle', value: 'chapterId', children: 'children' }"
          @change="fetchComments"
          class="chapter-select"
        />
      </div>
      <div class="filter-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索评论内容..."
          :prefix-icon="Search"
          clearable
          class="search-input"
          style="width: 200px;"
        />
      </div>
    </div>

    <el-card class="comment-post-card" shadow="hover">
      <div class="comment-header">
        <el-avatar :size="40" :src="userAvatar" />
        <span class="comment-user-name">发表评论... <span v-if="selectedChapterName" class="targeting-chapter">@ {{ selectedChapterName }}</span></span>
      </div>

      <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          :placeholder="selectedChapterId ? `留下您对“${selectedChapterName}”的讨论吧！` : '留下您对课程的宝贵评论吧！'"
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
      <h3>{{ selectedChapterId ? `章节讨论 - ${selectedChapterName}` : '全部课程评论' }} ({{ comments.length }})</h3>

      <div v-if="loadingComments" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="comments.length === 0" class="empty-comment">
        <el-empty :description="searchKeyword ? '没有找到相关评论' : '暂无评论，快来抢沙发吧！'" :image-size="100" />
      </div>

      <div v-else class="comment-list">
        <CommentItem
            v-for="comment in comments"
            :key="comment.commentId || comment.id"
            :comment="comment"
            :courseId="courseId"
            :showChapter="!selectedChapterId"
            @commentPosted="fetchComments"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, watch } from 'vue';
import CommentItem from './CommentItem.vue';
import { useCourseComment } from '@/assets/js/teacher/course-comment.js';
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  courseId: {
    type: String,
    required: true
  },
  chapters: {
    type: Array,
    default: () => []
  }
});

// 将 chapters 数据处理为 el-tree-select 需要的格式
const chaptersData = computed(() => {
  // 可以根据需要过滤掉 FOLDER 类型，或者保留它们以进行层级展示
  return props.chapters
})

const {
  comments,
  searchKeyword,
  commentContent,
  selectedChapterId,
  isPosting,
  loadingComments,
  userAvatar,
  fetchComments,
  submitComment
} = useCourseComment(props);

const selectedChapterName = computed(() => {
  const findInTree = (nodes, id) => {
    for (const node of nodes) {
      if (node.chapterId === id) return node.chapterTitle
      if (node.children) {
        const res = findInTree(node.children, id)
        if (res) return res
      }
    }
    return null
  }
  return findInTree(props.chapters, selectedChapterId.value) || ''
})

// 监听 selectedChapterId 变化自动刷新
watch(selectedChapterId, () => {
  fetchComments()
})
</script>

<style scoped>
@import '@/assets/css/teacher/course-comment.css';
</style>