<template>
  <div class="homework-page-container">
    <!-- 顶部 Header：保持与课程列表、主页一致 -->
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
        </div>
      </section>

      <!-- 作业列表 -->
      <div v-loading="loading" class="homework-list-section">
        <div v-if="filteredHomeworks.length === 0" class="empty-placeholder">
          <el-empty description="暂时没有找到相关作业" :image-size="160" />
        </div>

        <div v-else class="homework-grid">
          <div
              v-for="homework in filteredHomeworks"
              :key="homework.reportId"
              class="homework-card"
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
              <div v-if="homework.score" class="info-item highlight-score">
                <el-icon><Trophy /></el-icon>
                <span>最终得分: <strong>{{ homework.score }}</strong></span>
              </div>
            </div>

            <div class="card-bottom">
              <div class="description-preview">
                {{ homework.reportDescription || '点击查看作业详情及具体要求...' }}
              </div>

              <!-- 教师评语缩略提示 -->
              <div v-if="homework.teacherComment" class="comment-tip">
                <el-icon><ChatDotRound /></el-icon> 教师已批阅并留下评语
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
                    v-else-if="homework.status === 1"
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
    </main>
  </div>
</template>

<script setup>
import {
  Search, Calendar, Trophy, Collection, ArrowRight, Warning, ChatDotRound, Clock
} from '@element-plus/icons-vue'
import { useStudentHomework } from '@/assets/js/student/student-homework.js'

const {
  loading,
  homeworks,
  filterStatus,
  searchKeyword,
  filteredHomeworks,
  getCountByStatus,
  getStatusType,
  getStatusText,
  formatDate,
  isOverdue,
  goToSubmit,
  viewDetail,
  filterHomeworks
} = useStudentHomework()
</script>

<style scoped>
@import '@/assets/css/student/student-homework.css';
</style>
