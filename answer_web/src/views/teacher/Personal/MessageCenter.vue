<template>
  <div class="message-container">
    <div class="chat-wrapper-box">
      <!-- Sidebar -->
      <aside class="chat-sidebar">
        <div class="sidebar-tabs">
          <div
              class="tab-item"
              :class="{ active: activeTab === 'chat' }"
              @click="activeTab = 'chat'"
          >
            <div class="tab-icon-wrap">
              <el-icon><ChatLineRound /></el-icon>
              <span v-if="chatUnreadTotal > 0" class="tab-badge">{{ chatUnreadTotal }}</span>
            </div>
            <span class="tab-label">私信</span>
          </div>
          <div
              class="tab-item"
              :class="{ active: activeTab === 'interaction' }"
              @click="activeTab = 'interaction'"
          >
            <div class="tab-icon-wrap">
              <el-icon><Comment /></el-icon>
              <span v-if="interactionUnread > 0" class="tab-badge">{{ interactionUnread }}</span>
            </div>
            <span class="tab-label">互动通知</span>
          </div>
          <div
              class="tab-item"
              :class="{ active: activeTab === 'enrollment' }"
              @click="activeTab = 'enrollment'"
          >
            <div class="tab-icon-wrap">
              <el-icon><Checked /></el-icon>
              <span v-if="statistics.pending > 0" class="tab-badge">{{ statistics.pending }}</span>
            </div>
            <span class="tab-label">报名审核</span>
          </div>
        </div>

        <div v-show="activeTab === 'chat'" class="sidebar-content">
          <div class="search-wrap">
            <el-input
                v-model="searchKeyword"
                placeholder="搜索联系人..."
                prefix-icon="Search"
                clearable
                class="glass-input-small"
            />
          </div>

          <div v-loading="loadingContacts" class="user-list custom-scrollbar">
            <div
                v-for="user in filteredUserList"
                :key="user.contactId"
                class="user-item"
                :class="{ active: currentChatUser?.contactId === user.contactId }"
                @click="selectChatUser(user)"
            >
              <div class="user-avatar-wrap">
                <el-avatar :size="44" :src="getAvatarUrl(user.contactAvatar)" shape="circle">
                  {{ user.contactName?.charAt(0) }}
                </el-avatar>
                <span v-if="user.unreadCount > 0" class="unread-dot">{{ user.unreadCount }}</span>
              </div>
              <div class="user-info">
                <div class="info-top">
                  <span class="name">{{ user.contactName }}</span>
                  <span class="time">{{ formatTime(user.lastTime) }}</span>
                </div>
                <div class="info-bottom">
                  <p class="last-msg">{{ user.lastMessage || '暂无消息' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'interaction'" class="sidebar-content interaction-menu">
          <div
              class="menu-item"
              :class="{ active: activeInteractionType === 'comment' }"
              @click="activeInteractionType = 'comment'"
          >
            <el-icon class="icon-box bg-blue"><Comment /></el-icon>
            <span class="menu-label">收到的评论</span>
            <span v-if="commentUnreadTotal > 0" class="sub-unread-dot"></span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>

          <div
              class="menu-item"
              :class="{ active: activeInteractionType === 'system' }"
              @click="activeInteractionType = 'system'"
          >
            <el-icon class="icon-box bg-green"><Bell /></el-icon>
            <span class="menu-label">通知</span>
            <span v-if="systemUnreadTotal > 0" class="sub-unread-dot"></span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
        </div>

        <div v-show="activeTab === 'enrollment'" class="sidebar-content interaction-menu">
           <div class="menu-item" :class="{ active: currentStatus === 'all' }" @click="currentStatus = 'all'">
              <el-icon class="icon-box bg-blue"><List /></el-icon>
              <span class="menu-label">全部申请</span>
           </div>
           <div class="menu-item" :class="{ active: currentStatus === 'pending' }" @click="currentStatus = 'pending'">
              <el-icon class="icon-box bg-amber-500"><Clock /></el-icon>
              <span class="menu-label">待审核</span>
              <span v-if="statistics.pending > 0" style="background: #ef4444; color: white; padding: 0 6px; border-radius: 10px; font-size: 12px; font-weight: 700; height: 18px; display: inline-flex; align-items: center; justify-content: center; margin-left: auto;">{{ statistics.pending }}</span>
           </div>
           <div class="menu-item" :class="{ active: currentStatus === 'approved' }" @click="currentStatus = 'approved'">
              <el-icon class="icon-box bg-emerald-500"><Check /></el-icon>
              <span class="menu-label">已通过</span>
           </div>
        </div>
      </aside>

      <!-- Main Area -->
      <main class="chat-main">
        <!-- View 1: Chat Window -->
        <template v-if="activeTab === 'chat'">
          <template v-if="currentChatUser">
            <header class="window-header">
              <div class="user-title">
                <el-avatar :size="40" :src="getAvatarUrl(currentChatUser.contactAvatar)">{{ currentChatUser.contactName?.charAt(0) }}</el-avatar>
                <div class="user-status">
                  <span class="name">{{ currentChatUser.contactName }}</span>
                  <span class="status-text">在线答疑</span>
                </div>
              </div>
              <div class="window-actions">
                <el-button link><el-icon><MoreFilled /></el-icon></el-button>
              </div>
            </header>

            <div class="message-area custom-scrollbar" ref="messageBox">
              <div v-for="(msg, index) in currentMessages" :key="index" class="message-row" :class="{ 'me': isMyMessage(msg) }">
                <div class="msg-avatar">
                  <el-avatar :size="36" v-if="!isMyMessage(msg)" :src="getAvatarUrl(currentChatUser.contactAvatar)">{{ currentChatUser.contactName?.charAt(0) }}</el-avatar>
                  <el-avatar :size="36" v-else :src="getAvatarUrl(userStore.avatarUrl)" class="my-avatar">我</el-avatar>
                </div>
                <div class="msg-body">
                  <div class="msg-header">
                    <span class="msg-name">{{ isMyMessage(msg) ? (userStore.userName || '教师') : currentChatUser.contactName }}</span>
                    <span class="msg-time-label">{{ formatDetailedTime(msg.createTime) }}</span>
                  </div>
                  <div class="msg-content-wrapper">
                    <div class="bubble">
                      {{ msg.content }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="input-area">
              <div class="input-wrapper">
                 <textarea
                     v-model="inputMessage"
                     class="chat-input"
                     placeholder="按 Enter 发送消息..."
                     @keydown.enter.prevent="handleSendMessage"
                 ></textarea>
                <div class="send-btn-wrap">
                  <el-button type="primary" :disabled="!inputMessage.trim()" @click="handleSendMessage">
                    发送
                  </el-button>
                </div>
              </div>
            </footer>
          </template>

          <div v-else class="empty-state">
            <el-icon size="64" color="#d1d5db"><ChatDotRound /></el-icon>
            <h3>开始聊天</h3>
            <p>从左侧列表选择联系人进行沟通</p>
          </div>
        </template>

        <template v-if="activeTab === 'interaction'">
          <header class="window-header interaction-header">
            <div v-if="activeInteractionType === 'comment'" class="header-tabs">
              <div
                  class="header-tab-item"
                  :class="{ active: commentSubTab === 'discussion' }"
                  @click="commentSubTab = 'discussion'"
              >
                新课程讨论
                <div class="active-bar"></div>
              </div>
              <div
                  class="header-tab-item"
                  :class="{ active: commentSubTab === 'reply' }"
                  @click="commentSubTab = 'reply'"
              >
                收到的回复
                <div class="active-bar"></div>
              </div>
            </div>
            <h3 v-else>{{ interactionTitle }}</h3>

            <el-button link type="primary" @click="markAllRead">全部标记已读</el-button>
          </header>

          <div v-loading="interactionLoading" class="interaction-list custom-scrollbar">
            <div 
              v-for="(item, index) in filteredInteractionList" 
              :key="index" 
              class="interaction-item animate-slide-up"
              :class="{ 'system-message-item': item.type === 'SYSTEM' }"
            >
              <div class="item-avatar-wrap">
                <template v-if="item.type === 'SYSTEM'">
                  <div class="system-notify-avatar">
                    <el-icon class="system-bell-icon"><BellFilled /></el-icon>
                  </div>
                </template>
                <template v-else>
                  <el-avatar 
                    :size="44" 
                    :src="getAvatarUrl(item.userAvatar)" 
                    shape="circle"
                  >
                    <span>{{ item.userName?.charAt(0) }}</span>
                  </el-avatar>
                </template>
                <div v-if="!item.isRead" class="unread-dot-lg"></div>
              </div>

              <div class="item-main">
                <div class="item-header">
                  <span class="user-name">
                    {{ item.userName }}
                    <span v-if="item.type === 'COMMENT'" class="category-tag tag-comment">课程互动</span>
                    <span v-if="item.type === 'SYSTEM'" class="category-tag tag-system">系统通知</span>
                  </span>
                  <span class="time">{{ formatDetailedTime(item.time) }}</span>
                </div>
                <div class="item-action-row">
                  <div class="module-context" v-if="item.actionText">
                    <span class="context-pill">[{{ item.actionText }}]</span>
                  </div>
                </div>
                <div class="reply-content" v-if="item.content">
                  <span v-if="item.content === '[已删除]' || item.content.includes('已删除')" style="color: #94a3b8; font-style: italic;">该评论已被删除</span>
                  <span v-else>{{ item.content }}</span>
                </div>

                <div class="item-actions">
                  <template v-if="item.type === 'SYSTEM' && item.source === 'MESSAGE'">
                    <el-button v-if="isActionableMessage(item)" link type="primary" size="small" @click="handleInteractionDetail(item)">
                      前往查看
                    </el-button>
                    <template v-else>
                      <el-button v-if="!item.isRead" link type="primary" size="small" @click="handleInteractionDetail(item)">标为已读</el-button>
                      <span v-else class="read-status-text">已读</span>
                    </template>
                  </template>
                  
                  <template v-else-if="item.type === 'SYSTEM' && item.source === 'NOTIFICATION'">
                    <el-button v-if="!item.isRead" link type="primary" size="small" @click="handleInteractionDetail(item)">标为已读</el-button>
                    <span v-else class="read-status-text">已读</span>
                  </template>
                  <el-button v-if="item.type === 'COMMENT' && !item.content.includes('已删除')" link type="primary" size="small" @click="toggleQuickReply(item)">
                    {{ item.showReply ? '取消回复' : '快捷回复' }}
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDeleteMessage(item)">删除</el-button>
                </div>

                <el-collapse-transition>
                  <div v-if="item.showReply" class="quick-reply-box">
                    <el-input
                        v-model="item.replyContent"
                        placeholder="输入回复内容..."
                        size="small"
                        @keydown.enter.prevent="handleQuickReply(item)"
                    >
                      <template #append>
                        <el-button @click="handleQuickReply(item)">发送</el-button>
                      </template>
                    </el-input>
                  </div>
                </el-collapse-transition>
              </div>
            </div>

            <div v-if="filteredInteractionList.length === 0" class="empty-state">
              <el-empty :description="emptyStateText" />
            </div>
          </div>
        </template>

        <!-- View 3: Enrollment Management -->
        <template v-if="activeTab === 'enrollment'">
           <div class="enrollment-management-view animate-slide-up">
              <!-- 筛选控制栏 -->
              <div class="enroll-filter-section">
                <div class="glass-panel filter-wrapper">
                  <div class="filter-left">
                    <div class="filter-group">
                      <div class="filter-item">
                        <label>关联课程</label>
                        <el-select 
                          v-model="selectedCourseId" 
                          placeholder="全部课程" 
                          class="premium-select" 
                          @change="loadEnrollments"
                          clearable
                          filterable
                        >
                          <template #prefix>
                            <el-icon><Reading /></el-icon>
                          </template>
                          <el-option label="所有正在申请的课程" :value="''" />
                          <el-option 
                            v-for="c in courses" 
                            :key="c.id" 
                            :label="`${c.courseName}`" 
                            :value="c.id" 
                          />
                        </el-select>
                      </div>
                
                    </div>
                  </div>
                  <div class="filter-right">
                    <div class="search-group">
                      <el-input
                        v-model="enrollmentSearchKeyword"
                        placeholder="搜索学生姓名..."
                        class="premium-search"
                        clearable
                        @keyup.enter="loadEnrollments"
                      >
                        <template #prefix>
                          <el-icon><Search /></el-icon>
                        </template>
                      </el-input>
                      <el-button type="primary" class="premium-add-btn" @click="inviteDialogVisible = true" style="margin-left: 12px; border-radius: 12px; height: 42px; font-weight: 600;">
                        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 邀请学生入班
                      </el-button>
                      <el-button circle @click="loadEnrollments" class="refresh-btn" style="margin-left: 8px; height: 42px; width: 42px; border-radius: 12px;">
                        <el-icon><Refresh /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 申请列表 (独立卡片) -->
              <div v-loading="enrollmentLoading" class="enroll-list-card animate-slide-up" style="animation-delay: 0.1s">
                <div class="enroll-list-wrapper">
                  <!-- 自定义表头 -->
                  <div class="enroll-grid-header">
                    <div class="col-student">申请学生</div>
                    <div class="col-course">目标课程</div>
                    <div class="col-time">申请时间</div>
                    <div class="col-status">状态</div>
                    <div class="col-action">管理操作</div>
                  </div>

                  <!-- 列表为空 -->
                  <div v-if="paginatedEnrollments.length === 0" class="empty-list">
                    <el-empty description="暂无符合条件的申请记录" :image-size="120" />
                  </div>

                  <!-- 列表内容 (Grid Row) -->
                  <div 
                    v-for="row in paginatedEnrollments" 
                    :key="row.id"
                    class="enroll-grid-row"
                  >
                    <div class="col-student saas-user-cell">
                      <el-avatar :size="36" :src="getStudentAvatar(row)" class="user-avatar shadow-sm">
                        {{ row.studentName?.charAt(0) }}
                      </el-avatar>
                      <div class="user-detail">
                        <div class="user-name">{{ row.studentName }}</div>
                        <div class="user-id">ID: {{ row.studentId }}</div>
                      </div>
                    </div>

                    <div class="col-course row-course">
                      <el-icon class="course-icon" style="margin-right: 6px;"><Reading /></el-icon>
                      {{ row.courseName }}
                    </div>

                    <div class="col-time time-cell">
                      {{ formatTimeAgo(row.applyTime) }}
                    </div>

                    <div class="col-status">
                      <span :class="['status-badge', getSaasStatusClass(row.status)]">
                        {{ getStatusText(row) }}
                      </span>
                    </div>

                    <div class="col-action row-actions">
                       <template v-if="row.status === 'pending'">
                          <template v-if="row.enrollmentType === 'INVITE'">
                             <span class="detail-text-btn danger" @click="handleRemoveStudent(row)">撤回邀请</span>
                          </template>
                          <template v-else>
                             <span class="detail-text-btn" @click="handleApprove(row)">通过</span>
                             <span class="detail-text-btn danger" @click="handleReject(row)">拒绝</span>
                          </template>
                       </template>
                       <template v-else-if="row.status === 'approved'">
                          <span class="detail-text-btn danger" @click="handleRemoveStudent(row)">移除学生</span>
                       </template>
                       <span v-else class="status-done">已处理</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分页块 (内外适应) -->
              <div class="pagination-container pagination-outside" v-if="filteredEnrollments.length > 0">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[5, 10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredEnrollments.length"
                  @size-change="handleSizeChange"
                  @current-change="handlePageChange"
                  class="premium-pagination"
                />
              </div>
           </div>
        </template>
      </main>
    </div>

    <!-- 邀请学生对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请学生加入课程" width="500px">
      <el-form :model="inviteForm" :rules="inviteRules" ref="inviteFormRef" label-width="100px">
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="inviteForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生账户" prop="studentId">
          <el-input v-model="inviteForm.studentId" placeholder="请输入学生的用户名或 ID 账户" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInvite" :loading="inviteSubmitting">
          确定邀请
        </el-button>
      </template>
    </el-dialog>

    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝报名申请"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="学生姓名">
          <el-input v-model="currentEnrollment.studentName" disabled />
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject" :loading="submitting">
          确定拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import {
  ChatLineRound, Search, MoreFilled, Picture, Folder, Comment, Bell, ArrowRight, 
  VideoPlay, Star, BellFilled, ChatDotRound, Checked, Refresh, Clock, Check, List, Plus
} from '@element-plus/icons-vue'
import { useMessageCenter } from '@/assets/js/teacher/message-center-logic.js'

const {
  // State
  userStore,
  activeTab,
  activeInteractionType,
  commentSubTab,
  loadingContacts,
  interactionLoading,
  searchKeyword,
  currentChatUser,
  inputMessage,
  messageBox,
  userList,
  currentMessages,
  interactionList,
  chatUnreadTotal,
  interactionUnread,
  commentUnreadTotal,
  systemUnreadTotal,

  // Computed
  filteredUserList,
  interactionTitle,
  filteredInteractionList,
  emptyStateText,

  // Methods
  selectChatUser,
  handleSendMessage,
  isMyMessage,
  isActionableMessage,
  handleInteractionDetail,
  toggleQuickReply,
  handleQuickReply,
  handleDeleteMessage,
  markAllRead,
  formatTime,
  formatDetailedTime,
  getSaasStatusClass,
  getAvatarUrl,
  initMessageCenter,
  cleanupMessageCenter,

  // Enrollment integration
  statistics,
  courses,
  selectedCourseId,
  currentStatus,
  loadEnrollments,
  loading: enrollmentLoading, 
  paginatedEnrollments,
  handleApprove,
  handleReject,
  getStatusType,
  getStatusText,
  formatTimeAgo,
  getStudentAvatar,
  inviteDialogVisible,
  handleRemoveStudent,

  // Additional needed for dialogs
  inviteForm,
  inviteRules,
  inviteFormRef,
  inviteSubmitting,
  submitInvite,
  rejectDialogVisible,
  rejectForm,
  rejectRules,
  rejectFormRef,
  submitting,
  submitReject,
  currentEnrollment,
  currentPage,
  pageSize,
  filteredEnrollments,
  handlePageChange,
  handleSizeChange,
  enrollmentSearchKeyword
} = useMessageCenter()

onMounted(() => {
  initMessageCenter()
})

onUnmounted(() => {
  cleanupMessageCenter()
})
</script>

<style scoped>
@import '@/assets/css/teacher/message-center.css';

/* System notification avatar - light gray circle + blue bell icon */
.system-notify-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e6f0fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #d0e3ff;
}
.system-bell-icon {
  font-size: 20px;
  color: #1677ff;
}

.read-status-text {
  font-size: 13px;
  color: #9ca3af;
  margin: 0 8px;
}
</style>