<template>
  <div :class="['comment-item-wrapper', { 'is-reply': isReply }]">
    <div 
      :class="['comment-item-container', { 'highlight-target': String(comment.commentId) === String(route.query.commentId) }]" 
      :id="'comment-' + comment.commentId"
    >
      <el-avatar :size="isReply ? 32 : 40" :src="getUserAvatar(comment.userAvatar)" class="comment-avatar" />
      
      <div class="comment-body">
        <div class="comment-meta">
          <div class="meta-left">
            <span class="comment-author">{{ comment.userName }}</span>
            <el-tag v-if="comment.userType === 'TEACHER'" size="small" type="danger" effect="dark" class="tag-teacher">
              教师
            </el-tag>
            <span class="comment-time">{{ formatRelativeTime(comment.createTime) }}</span>
            
            <el-icon v-if="isReply && canDelete" class="delete-mini" @click="confirmDelete(comment.commentId)" title="删除"><Delete /></el-icon>
          </div>
        </div>

        <div class="comment-content">
          <span v-if="displayTargetName && !isSelfReply" class="reply-target-text">
            回复 <span class="target-name">@{{ displayTargetName }}</span> : 
          </span>
          {{ comment.content }}
        </div>

        <div class="comment-footer">
          <div class="comment-actions">
             <span class="action-item" @click="toggleReplyForm">
               <el-icon><ChatLineSquare /></el-icon>
               {{ showReply ? '取消回复' : '回复' }}
             </span>
             <span v-if="!isReply && canDelete" class="action-item delete" @click="confirmDelete(comment.commentId)">
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
              <el-button size="small" type="primary" :loading="isReplying" :disabled="!replyContent.trim()" @click="handleLocalSubmit">
                发布
              </el-button>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
    <div v-if="!isReply && comment.replies && comment.replies.length > 0" class="replies-wrapper">
      <div v-if="!isExpanded" class="view-more-row">
         <span class="view-more-btn" @click="handleManualExpand">
           查看 {{ comment.replies.length }} 条回复 <el-icon><ArrowDown /></el-icon>
         </span>
      </div>

      <div v-if="isExpanded" class="replies-list">
        <CommentItem 
          v-for="reply in comment.replies" 
          :key="reply.commentId || reply.id"
          :comment="reply"
          :isReply="true"
          :courseId="courseId"
          :parentUser="{ userId: comment.userId, userName: comment.userName }"
          @commentPosted="handleChildReplyPosted"
        />

        <div class="view-more-row">
           <span class="view-more-btn" @click="handleManualCollapse">
             收起回复 <el-icon><ArrowUp /></el-icon>
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
import { ref, computed, defineProps, defineEmits, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ElCollapseTransition } from 'element-plus';
import { ChatLineSquare, Delete, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { formatRelativeTime } from '@/utils/date.js';
import { getUserAvatar } from '@/utils/resource.js';
import { useCommentItem } from '@/assets/js/teacher/comment-item.js';

const route = useRoute();

const props = defineProps({
  comment: { type: Object, required: true },
  courseId: { type: String, required: true },
  isReply: { type: Boolean, default: false },
  showChapter: { type: Boolean, default: false },
  parentUser: { type: Object, default: () => ({ userId: null, userName: null }) }
});

const emit = defineEmits(['commentPosted']);
const isExpanded = ref(false);
const storageKey = `expanded_comment_${props.comment.commentId || props.comment.id}`;

onMounted(() => {
  if (localStorage.getItem(storageKey) === 'true') {
    isExpanded.value = true;
  }
});

const handleManualExpand = () => {
  isExpanded.value = true;
  localStorage.setItem(storageKey, 'true');
};

const handleManualCollapse = () => {
  isExpanded.value = false;
  localStorage.removeItem(storageKey);
};

const {
  showReply,
  replyContent,
  isReplying,
  currentUserId,
  toggleReplyForm,
  submitReply,
  confirmDelete
} = useCommentItem(props, emit);

const handleLocalSubmit = async () => {
  if (!replyContent.value.trim()) return;
  localStorage.setItem(storageKey, 'true');
  isExpanded.value = true;
  await submitReply();
  nextTick(() => { isExpanded.value = true; });
};

const handleChildReplyPosted = () => {
  localStorage.setItem(storageKey, 'true');
  isExpanded.value = true;
  emit('commentPosted');
};

const displayTargetName = computed(() => {
  if (props.comment.targetUserName) return props.comment.targetUserName;
  if (props.parentUser && props.parentUser.userName) return props.parentUser.userName;
  return null;
});

const isSelfReply = computed(() => {
  const authorId = String(props.comment.userId);
  const targetId = props.comment.targetUserId ? String(props.comment.targetUserId) : 
                   (props.parentUser && props.parentUser.userId ? String(props.parentUser.userId) : null);
  return authorId === targetId;
});

const canDelete = computed(() => {
  const userType = localStorage.getItem('userType') || 
                   (localStorage.getItem('teacherId') || localStorage.getItem('t_id') ? 'TEACHER' : 'STUDENT');
  if (userType === 'TEACHER') return true;
  return String(props.comment.userId) === String(currentUserId.value);
});
</script>

<style scoped>
@import '@/assets/css/teacher/comment-item.css';
</style>
