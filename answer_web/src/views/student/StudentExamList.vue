<template>
  <div class="student-exam-list-container">

    <div class="filter-header animate-fade-in">
      <div class="header-content">
        <h2 class="page-title">我的考试安排</h2>
        <div class="filter-controls">
          <el-form :inline="true" class="modern-inline-form">
            <el-form-item>
              <el-select v-model="filterStatus" placeholder="考试状态" class="refined-select" @change="handleFilterChange">
                <el-option label="全部状态" value="" />
                <el-option label="进行中" value="ONGOING" />
                <el-option label="待开始" value="PUBLISHED" />
                <el-option label="已结束" value="ENDED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input
                  v-model="searchKeyword"
                  placeholder="搜索考试名称、课程或教师..."
                  class="refined-input"
                  clearable
                  @input="handleFilterChange"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- Exam Grid Area -->
    <div v-loading="loading" class="exam-content-area">
      <div v-if="filteredExams.length === 0 && !loading" class="empty-state animate-scale-up">
        <el-empty description="暂无相关考试计划" :image-size="160" />
      </div>

      <div v-else class="exam-grid-container">
        <div class="exam-grid">
          <div
              v-for="(exam, index) in paginatedExams"
              :key="exam.examId"
              class="exam-card-wrapper animate-slide-up"
              :style="{ 'animation-delay': `${index * 0.08}s` }"
          >
            <div class="exam-card" :class="getStatusClass(exam)">
              <!-- Subtle Status Accent Line -->
              <div class="card-accent-line"></div>

              <div class="card-main">
                <div class="card-top">
                  <div class="subject-info">
                    <span class="course-label">{{ exam.courseName || '通识课程' }}</span>
                    <h3 class="exam-name">{{ exam.examTitle }}</h3>
                  </div>
                  <el-tag :type="getStatusType(exam)" effect="plain" class="modern-status-tag">
                    {{ getStatusText(exam) }}
                  </el-tag>
                </div>

                <div class="spec-matrix">
                  <div class="spec-node">
                    <div class="node-icon"><el-icon><Calendar /></el-icon></div>
                    <div class="node-data">
                      <span class="node-label">开始时间</span>
                      <span class="node-value">{{ formatTimeShort(exam.startTime) }}</span>
                    </div>
                  </div>
                  <div class="spec-node">
                    <div class="node-icon"><el-icon><Timer /></el-icon></div>
                    <div class="node-data">
                      <span class="node-label">限时</span>
                      <span class="node-value">{{ exam.duration }}min</span>
                    </div>
                  </div>
                  <div class="spec-node">
                    <div class="node-icon"><el-icon><Trophy /></el-icon></div>
                    <div class="node-data">
                      <span class="node-label">满分</span>
                      <span class="node-value text-primary">{{ exam.totalScore }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-bottom">
                <div class="valid-period">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatRange(exam.startTime, exam.endTime) }}</span>
                </div>
                <el-button
                    :type="getButtonType(exam)"
                    class="entry-button"
                    :disabled="!canStart(exam)"
                    @click="handleStartExam(exam)"
                    size="large"
                >
                  {{ getActionButtonText(exam) }}
                  <el-icon class="el-icon--right" v-if="getActionButtonText(exam) === '立即进入'"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Section -->
        <div class="pagination-footer animate-fade-in" v-if="filteredExams.length > 0">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[6, 12, 18, 24]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredExams.length"
              background
              @size-change="handlePageChange"
              @current-change="handlePageChange"
              class="custom-pagination"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search, Calendar, Timer, Trophy, ArrowRight, Clock } from '@element-plus/icons-vue'
import { useStudentExamList } from '@/assets/js/student/student-exam-list'

const {
  loading,
  filterStatus,
  searchKeyword,
  currentPage,
  pageSize,
  handleFilterChange,
  handlePageChange,
  filteredExams,
  paginatedExams,
  getStatusClass,
  getStatusType,
  getButtonType,
  getStatusText,
  canStart,
  getActionButtonText,
  formatTimeShort,
  formatRange,
  handleStartExam
} = useStudentExamList()
</script>

<style scoped>
@import '@/assets/css/student/student-exam-list.css';
</style>