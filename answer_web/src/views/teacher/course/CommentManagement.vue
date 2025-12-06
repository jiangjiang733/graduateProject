<template>
  <div class="comment-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">评论管理</h1>
      <p class="page-subtitle">管理所有课程的评论和讨论</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalComments }}</div>
          <div class="stat-label">总评论数</div>
        </div>
        <el-icon class="stat-icon" color="#409eff"><ChatDotSquare /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ todayComments }}</div>
          <div class="stat-label">今日新增</div>
        </div>
        <el-icon class="stat-icon" color="#67c23a"><Plus /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ pendingReplies }}</div>
          <div class="stat-label">待回复</div>
        </div>
        <el-icon class="stat-icon" color="#e6a23c"><Clock /></el-icon>
      </el-card>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-left">
          <el-select v-model="filterCourse" placeholder="选择课程" clearable style="width: 200px;">
            <el-option label="全部课程" value="" />
            <el-option 
              v-for="course in courses" 
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
          <el-select v-model="filterStatus" placeholder="评论状态" style="width: 150px;">
            <el-option label="全部" value="" />
            <el-option label="待回复" value="pending" />
            <el-option label="已回复" value="replied" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;"
          />
        </div>
        <div class="filter-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索评论内容"
            prefix-icon="Search"
            style="width: 250px;"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>
    </el-card>

    <!-- 评论列表 -->
    <el-card class="comment-list-card" shadow="never">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="comments.length === 0" class="empty-state">
        <el-empty description="暂无评论数据" />
      </div>
      
      <div v-else class="comment-list">
        <div 
          v-for="comment in comments" 
          :key="comment.commentId"
          class="comment-item"
        >
          <div class="comment-header">
            <div class="user-info">
              <el-avatar :size="40" :src="getUserAvatar(comment.userAvatar)" />
              <div class="user-details">
                <div class="user-name">
                  {{ comment.userName }}
                  <el-tag v-if="comment.userType === 'TEACHER'" size="small" type="danger">
                    教师
                  </el-tag>
                </div>
                <div class="comment-meta">
                  <span class="course-name">{{ getCourseNameById(comment.courseId) }}</span>
                  <span class="comment-time">{{ formatRelativeTime(comment.createTime) }}</span>
                </div>
              </div>
            </div>
            <div class="comment-actions">
              <el-button 
                v-if="!comment.hasReply" 
                size="small" 
                type="primary" 
                @click="openReplyDialog(comment)"
              >
                回复
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteComment(comment)"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <div class="comment-content">
            {{ comment.content }}
          </div>
          
          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
            <div class="replies-header">
              <span>回复 ({{ comment.replies.length }})</span>
            </div>
            <div class="replies-list">
              <div 
                v-for="reply in comment.replies" 
                :key="reply.commentId"
                class="reply-item"
              >
                <div class="reply-header">
                  <el-avatar :size="32" :src="getUserAvatar(reply.userAvatar)" />
                  <div class="reply-info">
                    <span class="reply-user">{{ reply.userName }}</span>
                    <span class="reply-time">{{ formatRelativeTime(reply.createTime) }}</span>
                  </div>
                </div>
                <div class="reply-content">{{ reply.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="comments.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评论"
      width="600px"
    >
      <div v-if="currentComment" class="reply-dialog-content">
        <div class="original-comment">
          <div class="comment-user">
            <el-avatar :size="32" :src="getUserAvatar(currentComment.userAvatar)" />
            <span class="user-name">{{ currentComment.userName }}</span>
          </div>
          <div class="comment-text">{{ currentComment.content }}</div>
        </div>
        
        <el-divider />
        
        <el-input
          v-model="replyContent"
          type="textarea"
          :rows="4"
          placeholder="输入您的回复..."
          maxlength="500"
          show-word-limit
        />
      </div>
      
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="replying"
          :disabled="!replyContent.trim()"
          @click="submitReply"
        >
          发送回复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ChatDotSquare, Plus, Clock, Search } from '@element-plus/icons-vue'
import { getUserAvatar } from '@/utils/resource.js'
import { formatRelativeTime } from '@/utils/date.js'
import { useCommentManagement } from '@/assets/js/teacher/comment-management.js'

const {
  loading,
  courses,
  comments,
  currentPage,
  pageSize,
  total,
  filterCourse,
  filterStatus,
  dateRange,
  searchKeyword,
  replyDialogVisible,
  currentComment,
  replyContent,
  replying,
  totalComments,
  todayComments,
  pendingReplies,
  getCourseNameById,
  handleSearch,
  handleSizeChange,
  handleCurrentChange,
  openReplyDialog,
  submitReply,
  deleteComment
} = useCommentManagement()
</script>

<style scoped>
@import '@/assets/css/teacher/comment-management.css';
</style>