<template>
  <div class="course-analytics">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">课程数据分析</h1>
      <p class="page-subtitle">深入了解您的课程表现和学生参与度</p>
    </div>

    <!-- 课程选择器 -->
    <el-card class="course-selector-card" shadow="never">
      <div class="selector-content">
        <div class="selector-left">
          <el-select 
            v-model="selectedCourseId" 
            placeholder="选择要分析的课程"
            style="width: 300px;"
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
            style="width: 240px; margin-left: 16px;"
            @change="handleDateChange"
          />
        </div>
        <div class="selector-right">
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button @click="exportReport">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据概览 -->
    <div v-if="selectedCourseId" class="analytics-content">
      <!-- 关键指标卡片 -->
      <div class="metrics-grid">
        <el-card class="metric-card students" shadow="hover">
          <div class="metric-content">
            <div class="metric-info">
              <div class="metric-number">{{ analytics.totalStudents }}</div>
              <div class="metric-label">注册学生</div>
              <div class="metric-change positive">
                <el-icon><TrendCharts /></el-icon>
                <span>+{{ analytics.newStudentsThisWeek }} 本周新增</span>
              </div>
            </div>
            <div class="metric-icon">
              <el-icon color="#409eff" size="48"><User /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card class="metric-card completion" shadow="hover">
          <div class="metric-content">
            <div class="metric-info">
              <div class="metric-number">{{ analytics.completionRate }}%</div>
              <div class="metric-label">完成率</div>
              <div class="metric-change positive">
                <el-icon><Check /></el-icon>
                <span>{{ analytics.completedStudents }}/{{ analytics.totalStudents }} 已完成</span>
              </div>
            </div>
            <div class="metric-icon">
              <el-icon color="#67c23a" size="48"><CircleCheck /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card class="metric-card engagement" shadow="hover">
          <div class="metric-content">
            <div class="metric-info">
              <div class="metric-number">{{ analytics.avgEngagement }}%</div>
              <div class="metric-label">参与度</div>
              <div class="metric-change">
                <el-icon><DataAnalysis /></el-icon>
                <span>平均学习时长 {{ analytics.avgStudyTime }}h</span>
              </div>
            </div>
            <div class="metric-icon">
              <el-icon color="#e6a23c" size="48"><DataAnalysis /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card class="metric-card satisfaction" shadow="hover">
          <div class="metric-content">
            <div class="metric-info">
              <div class="metric-number">{{ analytics.satisfaction }}</div>
              <div class="metric-label">满意度</div>
              <div class="metric-change">
                <el-icon><Star /></el-icon>
                <span>基于 {{ analytics.reviewCount }} 条评价</span>
              </div>
            </div>
            <div class="metric-icon">
              <el-icon color="#f56c6c" size="48"><Star /></el-icon>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <!-- 学习进度图表 -->
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <h3>学习进度分布</h3>
              <el-button-group size="small">
                <el-button :type="progressViewType === 'chapter' ? 'primary' : ''" @click="progressViewType = 'chapter'">
                  按章节
                </el-button>
                <el-button :type="progressViewType === 'student' ? 'primary' : ''" @click="progressViewType = 'student'">
                  按学生
                </el-button>
              </el-button-group>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon size="64" color="#c0c4cc"><DataAnalysis /></el-icon>
              <p>学习进度图表</p>
              <p class="chart-desc">显示学生在各章节的学习进度分布</p>
            </div>
          </div>
        </el-card>

        <!-- 活跃度趋势图表 -->
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <h3>学习活跃度趋势</h3>
              <el-button-group size="small">
                <el-button :type="activityViewType === 'daily' ? 'primary' : ''" @click="activityViewType = 'daily'">
                  日
                </el-button>
                <el-button :type="activityViewType === 'weekly' ? 'primary' : ''" @click="activityViewType = 'weekly'">
                  周
                </el-button>
                <el-button :type="activityViewType === 'monthly' ? 'primary' : ''" @click="activityViewType = 'monthly'">
                  月
                </el-button>
              </el-button-group>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon size="64" color="#c0c4cc"><TrendCharts /></el-icon>
              <p>活跃度趋势图表</p>
              <p class="chart-desc">显示学生学习活跃度的时间趋势</p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 详细数据表格 -->
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-header">
            <h3>学生学习详情</h3>
            <div class="table-actions">
              <el-input
                v-model="studentSearchKeyword"
                placeholder="搜索学生"
                prefix-icon="Search"
                style="width: 200px;"
              />
              <el-button @click="exportStudentData">导出数据</el-button>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredStudentData" 
          style="width: 100%"
          :loading="loadingStudentData"
        >
          <el-table-column prop="studentName" label="学生姓名" width="120" />
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column label="学习进度" width="150">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.progress" 
                :color="getProgressColor(scope.row.progress)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="completedChapters" label="已完成章节" width="120" align="center" />
          <el-table-column prop="totalStudyTime" label="学习时长" width="120" align="center">
            <template #default="scope">
              {{ scope.row.totalStudyTime }}h
            </template>
          </el-table-column>
          <el-table-column prop="lastActiveTime" label="最后活跃" width="150">
            <template #default="scope">
              {{ formatRelativeTime(scope.row.lastActiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag 
                :type="getStatusType(scope.row.status)"
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary" 
                link
                @click="viewStudentDetail(scope.row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="table-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalStudents"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="请选择一个课程开始分析" :image-size="200">
        <el-button type="primary" @click="$router.push('/teacher/courses')">
          去管理课程
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Refresh, Download, User, CircleCheck, DataAnalysis, Star,
  TrendCharts, Check, Search
} from '@element-plus/icons-vue'
import { getCourseList, getCourseAnalytics, getTeacherStudents, getCourseActivity } from '@/api/course.js'
import { formatRelativeTime } from '@/utils/date.js'

const router = useRouter()

// 状态
const courses = ref([])
const selectedCourseId = ref('')
const dateRange = ref([])
const progressViewType = ref('chapter')
const activityViewType = ref('daily')
const studentSearchKeyword = ref('')
const loadingStudentData = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 分析数据
const analytics = ref({
  totalStudents: 0,
  newStudentsThisWeek: 0,
  completionRate: 0,
  completedStudents: 0,
  avgEngagement: 0,
  avgStudyTime: 0,
  satisfaction: 0,
  reviewCount: 0
})

// 学生数据
const studentData = ref([])
const totalStudents = ref(0)

// 计算属性
const filteredStudentData = computed(() => {
  if (!studentSearchKeyword.value) return studentData.value
  
  return studentData.value.filter(student =>
    student.studentName.toLowerCase().includes(studentSearchKeyword.value.toLowerCase()) ||
    student.studentId.toLowerCase().includes(studentSearchKeyword.value.toLowerCase())
  )
})

// 方法
const loadCourses = async () => {
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    const response = await getCourseList({
      pageNumber: 1,
      pageSize: 100,
      teacherId: teacherId
    })
    
    if (response.success && response.data) {
      courses.value = response.data.list || []
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

const handleCourseChange = (courseId) => {
  if (courseId) {
    loadAnalyticsData(courseId)
    loadStudentData(courseId)
  }
}

const handleDateChange = () => {
  if (selectedCourseId.value) {
    loadAnalyticsData(selectedCourseId.value)
    loadStudentData(selectedCourseId.value)
  }
}

const loadAnalyticsData = async (courseId) => {
  try {
    const response = await getCourseAnalytics(courseId)
    if (response.success && response.data) {
      const { studentStats } = response.data
      
      const totalStudents = studentStats.totalStudents || 0
      const completedStudents = studentStats.completedStudents || 0
      const avgProgress = studentStats.avgProgress || 0
      const avgStudyTime = (studentStats.avgStudyTime || 0) / 60 // 转换为小时
      
      analytics.value = {
        totalStudents: totalStudents,
        newStudentsThisWeek: studentStats.newStudentsThisWeek || 0,
        completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
        completedStudents: completedStudents,
        avgEngagement: Math.round(avgProgress),
        avgStudyTime: Math.round(avgStudyTime * 10) / 10,
        satisfaction: 4.6, // 暂时使用固定值，后续可以从评论系统获取
        reviewCount: 89 // 暂时使用固定值
      }
    }
  } catch (error) {
    console.error('获取分析数据失败:', error)
    ElMessage.error('获取分析数据失败')
  }
}

const loadStudentData = async (courseId) => {
  try {
    loadingStudentData.value = true
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    
    const response = await getTeacherStudents(teacherId, {
      courseId: courseId,
      pageNumber: currentPage.value,
      pageSize: pageSize.value
    })
    
    if (response.success && response.data) {
      // 转换数据格式以匹配前端显示
      const students = response.data.map(student => ({
        id: student.id,
        studentName: student.studentName || `学生${student.studentId}`,
        studentId: student.studentId,
        progress: student.progress || 0,
        completedChapters: Math.floor((student.progress || 0) / 10), // 假设每10%进度对应1个章节
        totalStudyTime: Math.round((student.totalStudyTime || 0) / 60), // 转换为小时
        lastActiveTime: student.lastActiveTime,
        status: getStudentStatus(student.status)
      }))
      
      studentData.value = students
      totalStudents.value = students.length
    }
    
  } catch (error) {
    console.error('获取学生数据失败:', error)
    ElMessage.error('获取学生数据失败')
  } finally {
    loadingStudentData.value = false
  }
}

// 转换学生状态
const getStudentStatus = (status) => {
  const statusMap = {
    0: 'inactive',
    1: 'active', 
    2: 'completed',
    3: 'inactive'
  }
  return statusMap[status] || 'inactive'
}

const refreshData = () => {
  if (selectedCourseId.value) {
    loadAnalyticsData(selectedCourseId.value)
    loadStudentData(selectedCourseId.value)
    ElMessage.success('数据已刷新')
  }
}

const exportReport = () => {
  ElMessage.info('导出功能开发中...')
}

const exportStudentData = () => {
  ElMessage.info('导出学生数据功能开发中...')
}

const getProgressColor = (progress) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  if (progress >= 40) return '#f56c6c'
  return '#909399'
}

const getStatusType = (status) => {
  const types = {
    active: 'success',
    inactive: 'warning',
    completed: 'primary'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '活跃',
    inactive: '不活跃',
    completed: '已完成'
  }
  return texts[status] || '未知'
}

const viewStudentDetail = (student) => {
  ElMessage.info(`查看学生 ${student.studentName} 的详细信息`)
}

// 生命周期
onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.course-analytics {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 课程选择器 */
.course-selector-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
}

.selector-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.selector-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.selector-right {
  display: flex;
  gap: 12px;
}

/* 关键指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  border-radius: 16px;
  border: none;
  overflow: hidden;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.metric-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
}

.metric-info {
  flex: 1;
}

.metric-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 12px;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.metric-change.positive {
  color: #67c23a;
}

.metric-icon {
  opacity: 0.8;
}

/* 图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  border: none;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin: 12px 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.chart-desc {
  font-size: 14px !important;
  color: #c0c4cc !important;
}

/* 数据表格 */
.table-card {
  border-radius: 12px;
  border: none;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .course-analytics {
    padding: 16px;
  }
  
  .selector-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .selector-left,
  .selector-right {
    width: 100%;
    justify-content: center;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .table-actions {
    justify-content: space-between;
  }
}
</style>