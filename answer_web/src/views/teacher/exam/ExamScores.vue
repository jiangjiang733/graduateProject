<template>
  <div class="exam-scores-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h2>{{ exam.examTitle }} - 成绩分析</h2>
      <div class="header-actions">
        <el-button @click="viewExamDetail">查看试题</el-button>
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <!-- 考试基本信息 -->
    <el-card class="info-summary" v-loading="loading">
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="考试名称">{{ exam.examTitle }}</el-descriptions-item>
        <el-descriptions-item label="所属课程">{{ exam.courseName }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ exam.totalScore }} 分</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ exam.passScore }} 分</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 成绩统计图表 -->
    <el-row :gutter="20" style="margin-top: 20px" v-if="statistics">
      <el-col :span="16">
        <el-card class="statistics-card">
          <template #header>
            <div class="card-header">
              <span>考试成绩分布分析</span>
              <el-tag type="info">共 {{ statistics.totalStudents || 0 }} 人参考</el-tag>
            </div>
          </template>
          <div ref="chartRef" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="summary-card">
          <template #header>
            <span>成绩汇总</span>
          </template>
          <div class="summary-items">
            <div class="summary-item">
              <div class="label">平均分</div>
              <div class="value">{{ statistics.averageScore || '0' }}</div>
            </div>
            <div class="summary-item">
              <div class="label">最高分</div>
              <div class="value success">{{ statistics.maxScore || '0' }}</div>
            </div>
            <div class="summary-item">
              <div class="label">及格率</div>
              <div class="value primary">{{ actualPassRate }}%</div>
            </div>
            <div class="summary-item">
              <div class="label">待批改</div>
              <div class="value warning">{{ (statistics.submittedCount || 0) - (statistics.gradedCount || 0) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 学生成绩名单 -->
    <el-card class="students-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>全班学生成绩名单 (包含未参加学生)</span>
          <div class="search-area">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索学号/姓名"
              clearable
              style="width: 200px; margin-right: 10px"
              :prefix-icon="Search"
              @input="handleSearch"
            />
            <el-button type="primary" size="small" @click="refreshStudents">刷新列表</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="paginatedStudents" stripe border style="width: 100%" v-loading="studentsLoading">
        <el-table-column prop="studentId" label="学号" width="120" sortable />
        <el-table-column prop="studentName" label="学生姓名" width="150" />
        <el-table-column label="参与状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getExamStatusType(row.status)">
              {{ getExamStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="120" align="center" sortable sort-by="obtainedScore">
          <template #default="{ row }">
            <span v-if="row.status >= 2" :class="getScoreClass(row.obtainedScore)">
              {{ row.obtainedScore }}
            </span>
            <span v-else class="not-available">-</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status >= 2" :type="getGradeType(row.obtainedScore)" size="small">
              {{ getGradeText(row.obtainedScore) }}
            </el-tag>
            <span v-else class="not-available">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ row.submitTime ? formatDate(row.submitTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150">
          <template #default="{ row }">
            <el-button 
              v-if="row.status >= 2" 
              type="primary" 
              link
              @click="viewStudentAnswer(row)"
            >
              查看详情
            </el-button>
            <el-button 
              v-if="row.status >= 1" 
              type="danger" 
              link
              @click="returnStudentExam(row.studentExamId)"
            >
              重置/退回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredStudents.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { getExamDetail, getStudentExams, getExamStatistics, returnStudentExam as returnStudentExamApi } from '@/api/exam'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const studentsLoading = ref(false)
const exam = ref({})
const studentExams = ref([])
const statistics = ref(null)
const chartRef = ref(null)
let scoreChart = null

// 搜索和分页
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 过滤后的学生列表
const filteredStudents = computed(() => {
  if (!searchKeyword.value) return studentExams.value
  const keyword = searchKeyword.value.toLowerCase()
  return studentExams.value.filter(student => 
    (student.studentId && String(student.studentId).toLowerCase().includes(keyword)) ||
    (student.studentName && student.studentName.toLowerCase().includes(keyword))
  )
})

// 分页后的学生列表
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredStudents.value.slice(start, end)
})

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1  // 搜索时重置到第一页
}

// 分页处理
const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
}

// 计算实际及格率（基于正确的及格分数）
const actualPassRate = computed(() => {
  if (!studentExams.value.length || !exam.value.totalScore) return 0
  
  const passScore = exam.value.passScore || Math.floor(exam.value.totalScore * 0.6)
  
  // 统计已批改的学生
  const gradedStudents = studentExams.value.filter(s => s.status >= 2 && s.obtainedScore !== undefined)
  if (gradedStudents.length === 0) return 0
  
  // 统计及格人数
  const passedCount = gradedStudents.filter(s => s.obtainedScore >= passScore).length
  
  // 计算及格率
  const rate = ((passedCount / gradedStudents.length) * 100).toFixed(0)
  
  console.log(`及格率计算: 及格分=${passScore}, 已批改=${gradedStudents.length}人, 及格=${passedCount}人, 及格率=${rate}%`)
  
  return rate
})

// 成绩等级相关函数
// 使用考试设置的实际及格分，而非固定百分比
const getScoreClass = (score) => {
  const passScore = exam.value.passScore || (exam.value.totalScore * 0.6)
  if (score < passScore) return 'score-fail'
  return 'score-pass'
}

const getGradeText = (score) => {
  const totalScore = exam.value.totalScore || 100
  const passScore = exam.value.passScore || (totalScore * 0.6)
  
  if (score < passScore) return '不及格'
  
  // 及格后的等级划分：及格分~70%为及格，70%~90%为良好，90%+为优秀
  const goodThreshold = totalScore * 0.7
  const excellentThreshold = totalScore * 0.9
  
  if (score < goodThreshold) return '及格'
  if (score < excellentThreshold) return '良好'
  return '优秀'
}

const getGradeType = (score) => {
  const totalScore = exam.value.totalScore || 100
  const passScore = exam.value.passScore || (totalScore * 0.6)
  
  if (score < passScore) return 'danger'  // 不及格：红色
  
  const goodThreshold = totalScore * 0.7
  const excellentThreshold = totalScore * 0.9
  
  if (score < goodThreshold) return 'info'      // 及格(60%-70%)：蓝色
  if (score < excellentThreshold) return 'success'  // 良好(70%-90%)：绿色
  return 'success'  // 优秀(>90%)：绿色
}

// 获取考试基本信息
const fetchExamInfo = async () => {
  loading.value = true
  try {
    const examId = route.params.id
    const res = await getExamDetail(examId)
    console.log('=== 获取考试信息 ===')
    console.log('API响应:', res)
    
    if (res.code === 200 && res.data) {
      // 提取考试数据
      let examData = res.data.exam || res.data
      console.log('原始考试数据:', examData)
      console.log('原始 totalScore:', examData.totalScore)
      console.log('原始 passScore:', examData.passScore)
      
      // 确保总分存在
      if (!examData.totalScore && examData.total_score) {
        examData.totalScore = examData.total_score
      }
      
      // 强制重新计算及格分数为总分的60%（覆盖后端可能错误的值）
      const totalScore = examData.totalScore || 100
      const calculatedPassScore = Math.floor(totalScore * 0.6)
      
      console.log('计算的及格分数:', calculatedPassScore, '= ', totalScore, '× 0.6')
      
      // 强制使用计算值
      examData.passScore = calculatedPassScore
      
      exam.value = examData
      console.log('=== 最终考试数据 ===')
      console.log('总分:', exam.value.totalScore)
      console.log('及格分:', exam.value.passScore)
      console.log('====================')
    }
  } catch (error) {
    console.error('获取考试信息失败:', error)
    ElMessage.error('获取考试信息失败')
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const fetchStatistics = async () => {
  try {
    const res = await getExamStatistics(route.params.id)
    if (res.code === 200) {
      statistics.value = res.data
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 获取学生列表
const fetchStudentExams = async () => {
  studentsLoading.value = true
  try {
    const res = await getStudentExams(route.params.id)
    if (res.code === 200) {
      studentExams.value = res.data || []
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    studentsLoading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  if (!statistics.value || !chartRef.value) return

  if (scoreChart) {
    scoreChart.dispose()
  }

  scoreChart = echarts.init(chartRef.value)

  // 根据总分和及格分数计算各等级的分数范围
  const totalScore = exam.value.totalScore || 100
  const passScore = exam.value.passScore || Math.floor(totalScore * 0.6)  // 使用考试设置的及格分
  const failMax = passScore - 1        // 不及格: 0 ~ (及格分-1)
  const passMax = Math.floor(totalScore * 0.7)        // 及格: 及格分 ~ 70%
  const goodMax = Math.floor(totalScore * 0.9)        // 良好: 70% ~ 90%
  // 优秀: 90% ~ 100%
  
  console.log(`成绩等级划分 - 总分:${totalScore}, 及格分:${passScore}, 不及格:<${passScore}, 及格:${passScore}-${passMax}, 良好:${passMax}-${goodMax}, 优秀:>${goodMax}`)

  // 根据学生成绩分布计算各等级人数
  let failCount = 0    // 不及格
  let passCount = 0    // 及格
  let goodCount = 0    // 良好
  let excellentCount = 0  // 优秀

  // 从学生考试数据中统计
  studentExams.value.forEach(student => {
    if (student.status >= 2 && student.obtainedScore !== undefined) {
      const score = student.obtainedScore
      if (score < passScore) {
        failCount++
      } else if (score < totalScore * 0.7) {
        passCount++
      } else if (score < totalScore * 0.9) {
        goodCount++
      } else {
        excellentCount++
      }
    }
  })

  // 注释掉后端分布数据覆盖逻辑，因为后端数据基于固定百分比，不适用于自定义总分
  // 只使用前端根据实际总分和及格分计算的结果
  /*
  const distribution = statistics.value.scoreDistribution || {}
  if (Object.keys(distribution).length > 0) {
    // 使用后端提供的分布数据（可能需要重新映射）
    failCount = (distribution['0-59'] || 0) + (distribution['fail'] || 0)
    passCount = (distribution['60-69'] || 0) + (distribution['pass'] || 0)
    goodCount = (distribution['70-79'] || 0) + (distribution['80-89'] || 0) + (distribution['good'] || 0)
    excellentCount = (distribution['90-100'] || 0) + (distribution['excellent'] || 0)
  }
  */

  console.log(`统计结果 - 不及格:${failCount}人, 及格:${passCount}人, 良好:${goodCount}人, 优秀:${excellentCount}人`)

  const data = [
    { name: `不及格(0-${failMax}分)`, value: failCount },
    { name: `及格(${passScore}-${passMax}分)`, value: passCount },
    { name: `良好(${passMax+1}-${goodMax}分)`, value: goodCount },
    { name: `优秀(${goodMax+1}-${totalScore}分)`, value: excellentCount }
  ]

  const option = {
    title: {
      text: `分数等级分布 (总分${totalScore}分)`,
      left: 'center',
      top: '10'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '分数分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data,
        color: ['#F56C6C', '#E6A23C', '#36cbcb', '#67C23A']
      }
    ]
  }

  scoreChart.setOption(option)
}

// 刷新数据
const refreshData = async () => {
  await fetchStudentExams()
  await fetchStatistics()
  nextTick(() => {
    if (chartRef.value && exam.value.totalScore) {
      initCharts()
    }
  })
  ElMessage.success('数据已刷新')
}

// 刷新学生列表
const refreshStudents = async () => {
  await fetchStudentExams()
  nextTick(() => {
    if (chartRef.value && exam.value.totalScore) {
      initCharts()
    }
  })
  ElMessage.success('刷新成功')
}

// 查看学生答卷
const viewStudentAnswer = (student) => {
  const studentExamId = student.studentExamId || student.id
  if (studentExamId) {
    router.push(`/teacher/exam/${route.params.id}/student/${studentExamId}`)
  } else {
    ElMessage.warning('无法获取学生答卷ID')
  }
}

// 退回学生考试
const returnStudentExam = async (studentExamId) => {
  try {
    await ElMessageBox.confirm('确定要退回该学生的考试吗？退回后该学生的作答记录将被清空，可以重新参加考试。', '提示', {
      type: 'warning'
    })
    const res = await returnStudentExamApi(studentExamId)
    if (res.code === 200) {
      ElMessage.success('已退回')
      fetchStudentExams()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退回考试失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 返回
const goBack = () => router.back()

// 查看考试详情（试题）
const viewExamDetail = () => {
  router.push(`/teacher/exam/${route.params.id}/questions`)
}

// 工具函数questions
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const getExamStatusType = (status) => {
  const types = { 0: 'info', 1: 'warning', 2: 'success', 3: 'success' }
  return types[status] || 'info'
}

const getExamStatusText = (status) => {
  const texts = { 0: '未开始', 1: '进行中', 2: '已提交', 3: '已批改' }
  return texts[status] || '未知'
}

onMounted(async () => {
  // 按顺序加载数据：先获取考试信息和学生列表，最后初始化图表
  await fetchExamInfo()
  await fetchStudentExams()
  await fetchStatistics()
  
  // 确保图表在所有数据都加载完成后初始化
  nextTick(() => {
    if (chartRef.value && exam.value.totalScore) {
      initCharts()
    }
  })
})
</script>

<style scoped>
.exam-scores-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-header h2 {
  flex: 1;
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.info-summary {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  color: #909399;
  font-size: 14px;
}

.summary-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.summary-item .value.success { color: #67C23A; }
.summary-item .value.primary { color: #409EFF; }
.summary-item .value.warning { color: #E6A23C; }

.score-fail {
  color: #F56C6C;
  font-weight: bold;
}

.score-pass {
  color: #67C23A;
  font-weight: bold;
}

.not-available {
  color: #C0C4CC;
  font-style: italic;
}

.statistics-card, .summary-card, .students-card {
  border-radius: 12px;
}

.search-area {
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* ========== 暗黑模式完整适配 ========== */
.dark-theme .exam-scores-container {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.dark-theme .page-header h2 {
  color: #f1f5f9;
}

.dark-theme .card-header {
  color: #f1f5f9;
}

.dark-theme .summary-item .label {
  color: #64748b;
}

.dark-theme .summary-item .value {
  color: #f1f5f9;
}

.dark-theme .summary-item .value.success {
  color: #34d399;
}

.dark-theme .summary-item .value.primary {
  color: #60a5fa;
}

.dark-theme .summary-item .value.warning {
  color: #fbbf24;
}

.dark-theme .score-fail {
  color: #f87171;
}

.dark-theme .score-pass {
  color: #34d399;
}

.dark-theme .not-available {
  color: #64748b;
}

.dark-theme .pagination-wrapper {
  border-top-color: #334155;
}

/* Element Plus 组件暗黑模式 */
.dark-theme :deep(.el-card) {
  background: #1e293b;
  border-color: #334155;
}

.dark-theme :deep(.el-card__header) {
  background: #0f172a;
  border-bottom-color: #334155;
}

.dark-theme :deep(.el-descriptions__label) {
  color: #94a3b8;
}

.dark-theme :deep(.el-descriptions__content) {
  color: #f1f5f9;
}

.dark-theme :deep(.el-descriptions__cell) {
  border-color: #334155;
}

.dark-theme :deep(.el-table) {
  background-color: #1e293b;
  color: #f1f5f9;
}

.dark-theme :deep(.el-table th.el-table__cell) {
  background-color: #0f172a;
  color: #94a3b8;
  border-color: #334155;
}

.dark-theme :deep(.el-table td.el-table__cell) {
  background-color: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.dark-theme :deep(.el-table tr) {
  background-color: #1e293b;
}

.dark-theme :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: #0f172a;
}

.dark-theme :deep(.el-table__body tr:hover > td.el-table__cell) {
  background-color: #334155 !important;
}

.dark-theme :deep(.el-input__wrapper) {
  background-color: #0f172a;
  border-color: #334155;
}

.dark-theme :deep(.el-input__inner) {
  color: #f1f5f9;
}

.dark-theme :deep(.el-pagination) {
  color: #94a3b8;
}

.dark-theme :deep(.el-pagination button) {
  background-color: #1e293b;
  color: #94a3b8;
}

.dark-theme :deep(.el-pagination .el-pager li) {
  background-color: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
}

.dark-theme :deep(.el-pagination .el-pager li.is-active) {
  background-color: #3b82f6;
  color: #fff;
}

.dark-theme :deep(.el-pagination .el-pager li:hover) {
  color: #3b82f6;
}

.dark-theme :deep(.el-button) {
  background-color: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.dark-theme :deep(.el-button:hover) {
  background-color: #334155;
  border-color: #475569;
}

.dark-theme :deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.dark-theme :deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.dark-theme :deep(.el-tag) {
  background-color: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.dark-theme :deep(.el-tag--success) {
  background-color: rgba(52, 211, 153, 0.2);
  border-color: #34d399;
  color: #34d399;
}

.dark-theme :deep(.el-tag--info) {
  background-color: rgba(96, 165, 250, 0.2);
  border-color: #60a5fa;
  color: #60a5fa;
}

.dark-theme :deep(.el-tag--warning) {
  background-color: rgba(251, 191, 36, 0.2);
  border-color: #fbbf24;
  color: #fbbf24;
}

.dark-theme :deep(.el-tag--danger) {
  background-color: rgba(248, 113, 113, 0.2);
  border-color: #f87171;
  color: #f87171;
}

.dark-theme :deep(.el-select .el-input__wrapper) {
  background-color: #0f172a;
  border-color: #334155;
}

.dark-theme :deep(.el-loading-mask) {
  background-color: rgba(15, 23, 42, 0.8);
}

/* 图表容器暗黑模式 */
.dark-theme .statistics-card :deep(canvas),
.dark-theme .statistics-card div[_echarts_instance_] {
  background-color: transparent !important;
}

</style>
