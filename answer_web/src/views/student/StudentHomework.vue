<template>
  <div class="homework-page-container">
    <!-- 顶部 Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="main-title">作业与测评</h1>
        </div>

        <div class="header-right">
          <div class="search-box-wrapper">
            <el-input
                v-model="searchKeyword"
                placeholder="搜索作业名称..."
                clearable
                @input="filterHomeworks"
                @clear="filterHomeworks"
                class="modern-search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 现代化过滤器栏 -->
      <section class="toolbar-section">
        <div class="status-filters">
          <div
              class="filter-tab"
              :class="{ active: filterStatus === null }"
              @click="filterStatus = null; filterHomeworks()"
          >
            全部 <span>{{ homeworks.length }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 0 }"
              @click="filterStatus = 0; filterHomeworks()"
          >
            待提交 <span>{{ getCountByStatus(0) }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 1 }"
              @click="filterStatus = 1; filterHomeworks()"
          >
            待批改 <span>{{ getCountByStatus(1) }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 2 }"
              @click="filterStatus = 2; filterHomeworks()"
          >
            已完成 <span>{{ getCountByStatus(2) }}</span>
          </div>
          <div
              class="filter-tab"
              :class="{ active: filterStatus === 3 }"
              @click="filterStatus = 3; filterHomeworks()"
          >
            被退回 <span>{{ getCountByStatus(3) }}</span>
          </div>
        </div>
      </section>

      <!-- 作业列表 -->
      <div v-loading="loading" class="homework-list-section">
        <div v-if="filteredHomeworks.length === 0 && !loading" class="empty-placeholder">
          <el-empty description="暂时没有找到相关作业" :image-size="160" />
        </div>

        <div v-else class="homework-grid">
          <div
              v-for="homework in filteredHomeworks"
              :key="homework.reportId"
              class="homework-card"
              :class="{
                'card-graded': homework.status === 2,
                'card-returned': homework.status === 3
              }"
          >
            <div class="card-top">
              <div class="tag-row">
                <el-tag :type="getStatusType(homework.status)" effect="light" class="status-tag">
                  <span class="dot"></span>
                  {{ getStatusText(homework.status) }}
                </el-tag>
                <div v-if="isOverdue(homework.deadline) && !homework.studentReportId" class="overdue-label">
                  <el-icon><Warning /></el-icon> 已逾期
                </div>
              </div>
              <h3 class="homework-title" :title="homework.reportTitle">{{ homework.reportTitle }}</h3>
            </div>

            <div class="card-mid">
              <div class="info-item" :class="{ 'text-danger': isOverdue(homework.deadline) }">
                <el-icon><Calendar /></el-icon>
                <span>截止: {{ formatDate(homework.deadline) }}</span>
              </div>
              <div class="info-item">
                <el-icon><Collection /></el-icon>
                <span>满分: {{ homework.totalScore }} 分</span>
              </div>
              <div v-show="homework.status === 2 || homework.status === 3" class="info-item highlight-score">
                <el-icon><Trophy /></el-icon>
                <span>最终得分: <strong>{{ homework.score }}</strong></span>
              </div>
            </div>

            <div class="card-bottom">
              <div class="description-preview">
                {{ homework.reportDescription || '点击查看作业详情及具体要求...' }}
              </div>
              <!-- 教师评语提示（仅在已批改或退回后可见） -->
              <div v-if="homework.teacherComment && (homework.status === 2 || homework.status === 3)" class="comment-tip">
                <el-icon><ChatDotRound /></el-icon>
                <div class="comment-tip-text">
                  <span class="tip-label">教师评语</span>
                  <span class="tip-content">{{ homework.teacherComment }}</span>
                </div>
              </div>

              <div class="actions">
                <el-button
                    v-if="homework.studentReportId"
                    class="btn-detail"
                    @click="viewDetail(homework)"
                >
                  查看详情
                </el-button>
                <el-button
                    v-if="!homework.studentReportId"
                    type="primary"
                    class="btn-submit"
                    @click="goToSubmit(homework)"
                >
                  提交作业
                </el-button>
                <el-button
                    v-else-if="homework.status === 1 || homework.status === 3"
                    type="primary"
                    plain
                    class="btn-submit"
                    @click="goToSubmit(homework)"
                >
                  修改作业
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页（始终在底部） -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[6, 12, 24]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
            @size-change="() => handlePageChange(1)"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import {
  Search, Calendar, Trophy, Collection, Warning, ChatDotRound
} from '@element-plus/icons-vue'
import { useStudentHomework } from '@/assets/js/student/student-homework.js'

const {
  loading,
  homeworks,
  filterStatus,
  searchKeyword,
  filteredHomeworks,
  total,
  currentPage,
  pageSize,
  getCountByStatus,
  getStatusType,
  getStatusText,
  formatDate,
  isOverdue,
  goToSubmit,
  viewDetail,
  filterHomeworks,
  handlePageChange
} = useStudentHomework()
</script>

<style scoped>
@import '@/assets/css/student/student-homework.css';
</style>

<!-- 全局：通知弹窗内容样式 -->
<style>
.notify-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 0;
}

.notify-name {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.4;
}

.notify-score {
    font-size: 13px;
    color: #374151;
}

.notify-score strong {
    font-size: 16px;
    font-weight: 800;
    color: #10b981;
}

.notify-comment {
    font-size: 12px;
    color: #6b7280;
    background: #f9fafb;
    padding: 6px 10px;
    border-radius: 6px;
    border-left: 3px solid #10b981;
    margin-top: 2px;
}

html.dark .notify-name { color: #f3f4f6; }
html.dark .notify-score { color: #d1d5db; }
html.dark .notify-comment { background: #1f2937; color: #9ca3af; }

/* 已批改卡片高亮边框 */
.homework-card.card-graded {
    border-color: rgba(16, 185, 129, 0.4) !important;
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.15);
}

/* 被退回卡片橙色边框 */
.homework-card.card-returned {
    border-color: rgba(245, 158, 11, 0.4) !important;
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.15);
}
</style>
