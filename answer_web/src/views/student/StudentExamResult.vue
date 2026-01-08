<template>
  <div class="exam-report-container" v-loading="loading">
    <!-- 1. 顶部导航 -->
    <nav class="report-navbar">
      <div class="nav-inner">
        <div class="nav-left">
          <el-button @click="$router.back()" icon="ArrowLeft" circle plain class="back-btn"></el-button>
          <span class="report-logo">成绩报告</span>
        </div>
        <div class="nav-right">
          <el-button type="primary" round @click="$router.push('/student/dashboard')" icon="HomeFilled">返回首页</el-button>
        </div>
      </div>
    </nav>

    <!-- 2. 主体报告布局 -->
    <main class="report-content">
      <div class="layout-grid">

        <!-- 左侧：模拟正式纸质试卷 (已移除装订线) -->
        <div class="questions-column">
          <div class="paper-sheet">

            <!-- A. 试卷卷头信息 -->
            <div class="paper-header">
              <h1 class="exam-main-title">{{ examInfo.examTitle || '加载中...' }}</h1>

              <!-- 考生信息填空区 -->
              <div class="student-info-form">
                <div class="form-item">姓名：<u>{{ studentName }}</u></div>
                <div class="form-item">准考证号：<u>{{ studentId }}</u></div>
                <div class="form-item">得分：<u class="score-u">{{ studentExam.obtainedScore }}</u></div>
              </div>

              <!-- B. 官方得分汇总表 -->
              <div class="score-summary-table">
                <table>
                  <thead>
                  <tr>
                    <th>题型</th>
                    <th>单选题</th>
                    <th>多选题</th>
                    <th>判断题</th>
                    <th>填空简答</th>
                    <th class="total">总分</th>
                    <th class="reviewer">核分人</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td>得分</td>
                    <td>{{ getPartScore(['SINGLE', 'SINGLE_CHOICE']) }}</td>
                    <td>{{ getPartScore(['MULTIPLE', 'MULTIPLE_CHOICE']) }}</td>
                    <td>{{ getPartScore(['JUDGE', 'TRUE_FALSE', 'JUDGEMENT']) }}</td>
                    <td>{{ getPartScore(['SHORT_ANSWER']) }}</td>
                    <td class="total-val">{{ studentExam.obtainedScore }}</td>
                    <td><span class="sign">系统自动批阅</span></td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <el-divider>
              <el-icon><DocumentChecked /></el-icon> 试题详情及批注
            </el-divider>

            <!-- C. 题目解析迭代 -->
            <div
                v-for="(q, idx) in paginatedQuestions"
                :key="q.questionId"
                :id="'question-' + q.questionId"
                class="q-paper-item"
            >
              <div class="q-item-title">
                <div class="q-label">
                  <span class="q-num">{{ (currentPage - 1) * pageSize + idx + 1 }}.</span>
                  <span class="q-type">[{{ translateType(q.questionType) }}]</span>
                  <span class="q-score">(分值：{{ q.score }}分)</span>
                </div>
                <div class="q-mark" :class="getAnswerStatus(q).type">
                  <span v-if="getAnswerStatus(q).type === 'success'" class="correct-stamp">✔ 正确</span>
                  <span v-else class="wrong-stamp">✘ 错误</span>
                  <span class="actual-val">本题得分：{{ getQuestionScore(q) }}</span>
                </div>
              </div>

              <div class="q-body">
                <div class="q-stem" v-html="q.questionContent"></div>

                <!-- 选项渲染 -->
                <div v-if="isChoiceType(q.questionType)" class="options-layout">
                  <div v-for="opt in getOptions(q)" :key="opt.key"
                       class="opt-row"
                       :class="getOptClass(q, opt.key)">
                    <span class="opt-key">{{ opt.key }}.</span>
                    <span class="opt-val">{{ opt.value }}</span>
                    <div class="opt-feedback">
                      <el-icon v-if="isCorrectOption(q, opt.key)" class="i-ok"><Check /></el-icon>
                      <el-icon v-if="isWrongOption(q, opt.key)" class="i-no"><Close /></el-icon>
                    </div>
                  </div>
                </div>

                <!-- 简答题渲染 -->
                <div v-else class="short-answer-display">
                  <div class="ans-box">
                    <div class="ans-label">【考生回答】</div>
                    <div class="ans-text">{{ getStudentAnswer(q) || '（未作答）' }}</div>
                  </div>
                  <div class="ans-box standard">
                    <div class="ans-label">【参考答案】</div>
                    <div class="ans-text">{{ q.answer }}</div>
                  </div>
                </div>

                <!-- 批注解析 -->
                <div class="commentary-box" v-if="q.analysis">
                  <div class="com-head"><el-icon><Memo /></el-icon> 【名师批注】</div>
                  <div class="com-content">{{ q.analysis }}</div>
                </div>
              </div>
            </div>

            <!-- D. 底部翻页 -->
            <div class="paper-pagination">
              <el-pagination
                  v-model:current-page="currentPage"
                  :page-size="pageSize"
                  layout="prev, pager, next"
                  :total="questions.length"
                  background
                  hide-on-single-page
              />
              <div class="footer-seal">—— 诊断报告第 {{currentPage}} 页 ——</div>
            </div>
          </div>
        </div>

        <!-- 右侧：题目导航 (支持多次点击定位) -->
        <aside class="sidebar-column">
          <div class="navigation-card">


            <div class="navigation-meta">
              <div class="m-item">正确：<span class="green">{{ questions.filter(q => getAnswerStatus(q).type==='success').length }}</span></div>
              <div class="m-item">错误：<span class="red">{{ questions.filter(q => getAnswerStatus(q).type==='danger').length }}</span></div>
            </div>

            <div class="navigation-grid">
              <div v-for="(q, i) in questions" :key="i"
                   class="nav-item-box"
                   :class="getAnswerStatus(q).type"
                   @click="jumpToQuestion(i, q.questionId)">
                {{ i + 1 }}
              </div>
            </div>

            <div class="navigation-footer">
              <div class="legend">
                <span class="l-i"><i class="b-ok"></i>正确</span>
                <span class="l-i"><i class="b-no"></i>错误</span>
              </div>
              <el-button type="success" class="export-btn" plain icon="Printer" @click="handlePrint">打印分析报告</el-button>
            </div>
          </div>
        </aside>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Check, Close, ArrowLeft, HomeFilled, DocumentChecked,
  CircleCheck, CircleClose, Memo, Menu, Printer
} from '@element-plus/icons-vue'
import request from '@/api/request'

const route = useRoute()
const loading = ref(true)
const examInfo = ref({})
const studentExam = ref({})
const questions = ref([])
const answers = ref([])

// 分页逻辑
const currentPage = ref(1)
const pageSize = ref(5)

const examId = route.params.id
const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
const studentName = ref(localStorage.getItem('studentName') || localStorage.getItem('username') || '未知考生')

// 计算当前页展示的题目
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return questions.value.slice(start, start + pageSize.value)
})

// 翻译题型
const translateType = (type) => {
  const map = {
    'SINGLE': '单选题', 'SINGLE_CHOICE': '单选题',
    'MULTIPLE': '多选题', 'MULTIPLE_CHOICE': '多选题',
    'JUDGE': '判断题', 'TRUE_FALSE': '判断题', 'JUDGEMENT': '判断题',
    'SHORT_ANSWER': '简答题'
  };
  return map[type] || '题目'
}

// 是否为选择题类型
const isChoiceType = (type) => ['SINGLE', 'SINGLE_CHOICE', 'MULTIPLE', 'MULTIPLE_CHOICE', 'JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(type)

// 获取题型分值统计
const getPartScore = (types) => {
  return questions.value
      .filter(q => types.includes(q.questionType))
      .reduce((sum, q) => sum + getQuestionScore(q), 0)
}

// 解析选项
const getOptions = (q) => {
  if (['JUDGE', 'TRUE_FALSE', 'JUDGEMENT'].includes(q.questionType)) {
    return [{ key: 'A', value: '正确' }, { key: 'B', value: '错误' }]
  }
  if (!q.questionOptions) return []
  try {
    const parsed = typeof q.questionOptions === 'string' ? JSON.parse(q.questionOptions) : q.questionOptions
    return Array.isArray(parsed) ? parsed.map((opt, index) => ({
      key: String.fromCharCode(65 + index),
      value: typeof opt === 'object' ? opt.text : opt
    })) : []
  } catch (e) { return [] }
}

// 获取考生针对某题的回答
const getStudentAnswer = (q) => {
  const ans = answers.value.find(a => Number(a.questionId) === Number(q.questionId))
  return ans?.studentAnswer || ''
}

// 获取某题的得分
const getQuestionScore = (q) => {
  const ans = answers.value.find(a => Number(a.questionId) === Number(q.questionId))
  return ans?.score || 0
}

// 判断某选项是否被选中
const isSelectedOption = (q, key) => {
  const ans = getStudentAnswer(q)
  if (!ans) return false
  return ans.split(',').includes(key) || ans.includes(key)
}

// 判断某选项是否为正确答案
const isCorrectOption = (q, key) => q.answer?.includes(key)

// 判断某选项是否选错
const isWrongOption = (q, key) => isSelectedOption(q, key) && !isCorrectOption(q, key)

// 动态绑定选项类名
const getOptClass = (q, key) => ({
  'is-correct': isCorrectOption(q, key),
  'is-wrong': isWrongOption(q, key),
  'is-selected': isSelectedOption(q, key)
})

// 题目对错状态标识
const getAnswerStatus = (q) => {
  const score = getQuestionScore(q)
  return Number(score) === Number(q.score) ? { type: 'success' } : { type: 'danger' }
}

/**
 * 快速跳转定位功能
 * @param index 题目在 questions 数组中的索引
 * @param questionId 题目 ID
 */
const jumpToQuestion = (index, questionId) => {
  const targetPage = Math.floor(index / pageSize.value) + 1

  // 1. 如果不在当前页，先切换页码
  if (currentPage.value !== targetPage) {
    currentPage.value = targetPage
  }

  // 2. 等待 DOM 更新后定位
  nextTick(() => {
    const element = document.getElementById(`question-${questionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      // 兜底方案：如果找不到元素，回顶部
      window.scrollTo({ top: 180, behavior: 'smooth' })
    }
  })
}

// 打印处理
const handlePrint = () => {
  window.print()
}

// 加载数据
const loadExamResult = async () => {
  try {
    const [eRes, rRes] = await Promise.all([
      request.get(`/exam/${examId}`),
      request.get(`/student/exam/${examId}/result`, { params: { studentId } })
    ])

    if (eRes.data) {
      examInfo.value = eRes.data.exam || eRes.data
      questions.value = eRes.data.questions || []
    }

    if (rRes.data) {
      studentExam.value = rRes.data.studentExam || rRes.data
      answers.value = rRes.data.answers || []
      if (studentExam.value.studentName) {
        studentName.value = studentExam.value.studentName
      }
    }
  } catch (e) {
    ElMessage.error('同步后端数据失败，请检查网络')
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadExamResult)
</script>

<style scoped>
.exam-report-container {
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* 导航栏 */
.report-navbar {
  background: #fff;
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #dcdfe6;
  position: sticky;
  top: 0;
  z-index: 1000;
}
.nav-inner {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.report-logo {
  font-weight: bold;
  font-size: 18px;
  color: #303133;
}
.report-logo small {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

/* 布局 */
.report-content {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}
.layout-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 25px;
}

/* 模拟纸质试卷核心样式 (已去除左侧装订区域) */
.paper-sheet {
  background: #fff;
  min-height: 1200px;
  padding: 60px 70px 80px 70px;
  position: relative;
  box-shadow: 0 0 20px rgba(0,0,0,0.06);
  border: 1px solid #dcdfe6;
}

/* 卷头 */
.paper-header {
  text-align: center;
  margin-bottom: 50px;
}
.exam-main-title {
  font-size: 28px;
  font-family: "SimSun", "STSong", serif;
  font-weight: 900;
  margin-bottom: 30px;
  color: #000;
  letter-spacing: 1px;
}
.student-info-form {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 35px;
  font-size: 15px;
}
.student-info-form u {
  padding: 0 10px;
  min-width: 90px;
  display: inline-block;
  border-bottom: 1px solid #000;
  text-decoration: none;
  font-weight: bold;
}
.score-u {
  color: #f56c6c;
}

/* 得分统计表 */
.score-summary-table table {
  margin: 0 auto;
  border-collapse: collapse;
  width: 100%;
  max-width: 680px;
  border: 2px solid #303133;
}
.score-summary-table th, .score-summary-table td {
  border: 1px solid #303133;
  padding: 10px;
  font-size: 13px;
}
.score-summary-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}
.total, .total-val {
  font-weight: bold;
  background-color: #f0f2f5;
}
.sign {
  font-style: italic;
  font-family: "KaiTi", "STKaiti", serif;
  color: #606266;
}

/* 题目样式 */
.q-paper-item {
  margin-bottom: 50px;
  padding-top: 10px;
  page-break-inside: avoid;
}
.q-item-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}
.q-num { font-weight: bold; font-size: 18px; margin-right: 8px; }
.q-type { color: #606266; font-size: 14px; margin-right: 10px; font-weight: 500; }
.q-score { color: #909399; font-size: 13px; }

.q-mark { display: flex; flex-direction: column; align-items: flex-end; }
.correct-stamp { color: #67c23a; font-weight: bold; border: 2px solid #67c23a; padding: 3px 10px; border-radius: 4px; transform: rotate(-8deg); font-size: 12px; margin-bottom: 6px; }
.wrong-stamp { color: #f56c6c; font-weight: bold; border: 2px solid #f56c6c; padding: 3px 10px; border-radius: 4px; transform: rotate(8deg); font-size: 12px; margin-bottom: 6px; }
.actual-val { font-size: 13px; color: #303133; font-weight: bold; }

.q-stem { font-size: 16px; line-height: 1.7; margin-bottom: 22px; color: #1a1a1a; font-weight: 500; }

/* 选项展示 */
.options-layout { display: grid; gap: 12px; }
.opt-row {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  border-radius: 6px;
  border: 1px solid #f2f6fc;
  background: #fafafa;
}
.opt-row.is-selected { background-color: #f0f2f5; border-color: #dcdfe6; }
.opt-row.is-correct { background-color: #f0f9eb; border-color: #e1f3d8; }
.opt-row.is-correct .opt-val { color: #67c23a; font-weight: bold; }
.opt-row.is-wrong { background-color: #fef0f0; border-color: #fde2e2; }
.opt-row.is-wrong .opt-val { color: #f56c6c; }

.opt-key { font-weight: bold; margin-right: 15px; width: 22px; }
.opt-val { flex: 1; font-size: 15px; }
.i-ok { color: #67c23a; font-size: 18px; }
.i-no { color: #f56c6c; font-size: 18px; }

/* 简答题展示 */
.short-answer-display {
  background: #fdfdfd;
  border: 1px dashed #dcdfe6;
  padding: 18px;
  border-radius: 6px;
}
.ans-box { margin-bottom: 12px; }
.ans-label { font-size: 13px; font-weight: bold; color: #909399; margin-bottom: 6px; }
.standard .ans-label { color: #67c23a; }
.standard .ans-text { color: #67c23a; font-weight: bold; }
.ans-text { font-size: 14px; line-height: 1.6; color: #303133; }

/* 批注解析 */
.commentary-box {
  margin-top: 30px;
  background-color: #fffaf0;
  border-left: 5px solid #e6a23c;
  padding: 18px;
  border-radius: 0 6px 6px 0;
}
.com-head { font-weight: bold; color: #b88230; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.com-content { font-size: 14px; color: #606266; line-height: 1.7; }

/* 翻页 */
.paper-pagination { margin-top: 60px; text-align: center; }
.footer-seal { margin-top: 15px; color: #909399; font-size: 12px; letter-spacing: 2px; }

/* 右侧题目导航 */
.navigation-card {
  background: #fff;
  padding: 24px;
  border: 1px solid #dcdfe6;
  position: sticky;
  top: 80px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.navigation-head {
  font-weight: bold;
  border-bottom: 2px solid #303133;
  padding-bottom: 14px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #303133;
  font-size: 16px;
}
.navigation-meta { display: flex; justify-content: space-around; font-size: 14px; margin-bottom: 18px; }
.green { color: #67c23a; font-weight: bold; }
.red { color: #f56c6c; font-weight: bold; }

.navigation-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.nav-item-box {
  aspect-ratio: 1;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
  color: #606266;
  cursor: pointer;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-item-box:hover { border-color: #303133; transform: translateY(-3px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.nav-item-box.success { background: #67c23a; color: #fff; border-color: #67c23a; }
.nav-item-box.danger { background: #fef0f0; color: #f56c6c; border-color: #fbc4c4; }

.navigation-footer { margin-top: 24px; }
.legend { display: flex; justify-content: center; gap: 18px; font-size: 12px; color: #909399; margin-bottom: 18px; }
.legend i { display: inline-block; width: 11px; height: 11px; margin-right: 5px; border-radius: 2px; }
.b-ok { background: #67c23a; }
.b-no { background: #fef0f0; border: 1px solid #fbc4c4; }
.export-btn { width: 100%; border-radius: 24px; font-weight: bold; padding: 10px 0; }

@media print {
  .report-navbar, .sidebar-column, .paper-pagination { display: none; }
  .exam-report-container { background: white; padding: 0; }
  .paper-sheet { border: none; box-shadow: none; padding: 0; }
  .report-content { margin: 0; padding: 0; width: 100%; max-width: none; }
  .layout-grid { grid-template-columns: 1fr; }
}

@media (max-width: 1024px) {
  .layout-grid { grid-template-columns: 1fr; }
  .sidebar-column { display: none; }
  .paper-sheet { padding: 40px 25px 60px 25px; }
}
</style>