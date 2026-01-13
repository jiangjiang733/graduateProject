<template>
  <div class="dashboard-container modern-page" v-loading="loading">
    <div class="welcome-section">
      <h2 class="welcome-title">欢迎进入管理中枢</h2>
      <p class="welcome-desc">在这里监控系统运行状态，维护核心数据安全</p>
    </div>

    <!-- 顶层统计概览 -->
    <div class="stat-cards-grid">
      <div v-for="(stat, index) in stats" :key="index" class="stat-card-modern" :class="stat.class">
        <div class="stat-card-content">
          <div class="stat-card-header">
            <span class="stat-card-label">{{ stat.label }}</span>
            <el-icon class="stat-card-icon"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-card-footer">
            <span class="stat-card-number">{{ stat.value }}</span>
            <span class="stat-card-trend">{{ stat.trend }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图表展示区 -->
    <el-row :gutter="24" class="chart-row">
      <el-col :span="16">
        <div class="chart-card-modern">
          <div class="chart-card-header">
            <div class="chart-card-title">
              <el-icon color="#3b82f6"><TrendCharts /></el-icon>
              <span>访问趋势分析</span>
            </div>
            <el-radio-group v-model="chartPeriod" size="small">
              <el-radio-button label="week">近一周</el-radio-button>
              <el-radio-button label="month">近一月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container-inner" ref="trendChartRef"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card-modern">
          <div class="chart-card-header">
            <div class="chart-card-title">
              <el-icon color="#8b5cf6"><PieChart /></el-icon>
              <span>用户分布构成</span>
            </div>
          </div>
          <div class="chart-container-inner" ref="pieChartRef"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 快速操作入口 -->
    <div class="quick-actions-section">
      <div class="section-header">
        <h3 class="section-title-modern">
          <el-icon><Menu /></el-icon>
          常用功能入口
        </h3>
      </div>
      <div class="actions-grid-modern">
        <div 
          class="action-item-modern" 
          v-for="(action, index) in quickActions" 
          :key="index"
          @click="$router.push(action.path)"
        >
          <div class="action-item-icon" :style="{ background: action.color, color: action.iconColor }">
            <el-icon><component :is="action.icon" /></el-icon>
          </div>
          <div class="action-item-info">
            <span class="action-item-name">{{ action.name }}</span>
            <span class="action-item-desc">{{ action.desc }}</span>
          </div>
          <el-icon class="action-item-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { 
  User, UserFilled, Bell, Warning, 
  TrendCharts, PieChart, ArrowRight,
  Menu
} from '@element-plus/icons-vue'
import { useDashboard } from '@/assets/js/dashboard'

const {
  loading,
  stats,
  quickActions,
  chartPeriod,
  trendChartRef,
  pieChartRef,
  fetchStats,
  initCharts
} = useDashboard()

onMounted(async () => {
  await fetchStats()
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
@import '@/assets/css/variables.css';
@import '@/assets/css/dashboard.css';
</style>
