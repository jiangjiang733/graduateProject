<template>
  <div class="course-analytics modern-page">
    <!-- 页面头部 -->
    <div class="page-header animate-fade-in">
      <div class="header-content">
        <h1 class="page-title">课程数据分析</h1>
        <p class="page-subtitle">深入了解您的课程表现和学生参与度</p>
      </div>
      <div class="header-actions">
        <el-button class="glass-btn" @click="refreshData">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button class="glass-btn primary" @click="exportReport">
           <el-icon><Download /></el-icon> 导出报告
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-section glass-panel animate-slide-up">
       <el-select 
         v-model="selectedCourseId" 
         placeholder="选择要分析的课程"
         class="glass-select"
         size="large"
         @change="handleCourseChange"
       >
         <el-option
           v-for="course in courses"
           :key="course.id"
           :label="course.courseName"
           :value="course.id"
         />
       </el-select>
       <el-date-picker
         v-model="dateRange"
         type="daterange"
         range-separator="至"
         start-placeholder="开始日期"
         end-placeholder="结束日期"
         class="glass-date-picker"
         size="large"
         @change="handleDateChange"
       />
    </div>

    <div v-if="selectedCourseId" class="analytics-content">
      <!-- 关键指标卡片 -->
      <div class="metrics-grid">
        <div class="metric-card glass-panel" v-for="(metric, idx) in metrics" :key="idx">
          <div class="metric-icon-box" :class="metric.colorClass">
            <el-icon><component :is="metric.icon" /></el-icon>
          </div>
          <div class="metric-info">
             <div class="label">{{ metric.label }}</div>
             <div class="value">{{ metric.value }}</div>
             <div class="trend" :class="{ positive: metric.isPositive, negative: !metric.isPositive }">
               <el-icon><component :is="metric.isPositive ? 'Top' : 'Bottom'" /></el-icon>
               {{ metric.trend }}
             </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-card glass-panel span-2">
           <div class="chart-header">
             <h3>学习进度概览</h3>
             <div class="chart-actions">
               <el-radio-group v-model="progressViewType" size="small">
                 <el-radio-button label="chapter">按章节</el-radio-button>
                 <el-radio-button label="student">按学生</el-radio-button>
               </el-radio-group>
             </div>
           </div>
           <div class="chart-body" ref="progressChartRef"></div>
        </div>

        <div class="chart-card glass-panel">
           <div class="chart-header">
             <h3>学生成绩分布</h3>
           </div>
           <div class="chart-body" ref="scoreDistributionChartRef"></div>
        </div>
        
        <div class="chart-card glass-panel">
           <div class="chart-header">
             <h3>活跃度趋势</h3>
           </div>
           <div class="chart-body" ref="activityChartRef"></div>
        </div>
      </div>

      <!-- 学生详情表格 -->
      <div class="table-section glass-panel">
        <div class="table-header">
           <h3>学生详情列表</h3>
           <el-input 
             v-model="studentSearchKeyword" 
             placeholder="搜索学生姓名/学号" 
             prefix-icon="Search"
             class="glass-input-small"
             style="width: 240px"
           />
        </div>
        <el-table 
          :data="filteredStudentData" 
          style="width: 100%" 
          class="glass-table"
          v-loading="loadingStudentData"
        >
          <el-table-column prop="studentName" label="学生姓名" width="120">
            <template #default="{ row }">
              <div class="student-name-cell">
                 <el-avatar :size="30" class="student-avatar">{{ row.studentName.charAt(0) }}</el-avatar>
                 {{ row.studentName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column label="学习进度" min-width="180">
            <template #default="{ row }">
              <div class="progress-cell">
                <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" :stroke-width="8" />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="totalStudyTime" label="学习时长" width="120">
             <template #default="{ row }">{{ row.totalStudyTime }}h</template>
          </el-table-column>
          <el-table-column label="最后活跃" width="150">
             <template #default="{ row }">{{ formatRelativeTime(row.lastActiveTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
             <template #default="{ row }">
               <el-tag :type="getStatusType(row.status)" size="small" effect="dark" round>
                 {{ getStatusText(row.status) }}
               </el-tag>
             </template>
          </el-table-column>
        </el-table>
      </div>

    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-content glass-panel">
        <el-icon size="64" class="empty-icon"><DataAnalysis /></el-icon>
        <h3>请选择一个课程查看分析</h3>
        <p>选择上方的课程以获取详尽的数据报表</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  Refresh, Download, User, Check, Star, TrendCharts, 
  DataAnalysis, Top, Bottom, Search
} from '@element-plus/icons-vue'
import { formatRelativeTime } from '@/utils/date.js'
import { useCourseAnalytics } from '@/assets/js/teacher/course-analytics'

const progressChartRef = ref(null)
const scoreDistributionChartRef = ref(null)
const activityChartRef = ref(null)

const {
  courses,
  selectedCourseId,
  dateRange,
  progressViewType,
  studentSearchKeyword,
  loadingStudentData,
  metrics,
  filteredStudentData,
  handleCourseChange,
  refreshData,
  exportReport,
  handleDateChange,
  getProgressColor,
  getStatusType,
  getStatusText
} = useCourseAnalytics(progressChartRef, scoreDistributionChartRef, activityChartRef)
</script>

<style scoped>
@import '@/assets/css/teacher/course-analytics.css';
</style>