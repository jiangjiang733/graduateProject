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
import {
  Check, Close, ArrowLeft, HomeFilled, DocumentChecked,
  Memo, Printer
} from '@element-plus/icons-vue'
import { useStudentExamResult } from '@/assets/js/student/student-exam-result'

const {
  loading,
  examInfo,
  studentExam,
  questions,
  currentPage,
  pageSize,
  studentName,
  studentId,
  paginatedQuestions,
  translateType,
  isChoiceType,
  getPartScore,
  getOptions,
  getStudentAnswer,
  getQuestionScore,
  isCorrectOption,
  isWrongOption,
  getOptClass,
  getAnswerStatus,
  jumpToQuestion,
  handlePrint
} = useStudentExamResult()
</script>

<style scoped>
@import '@/assets/css/student/student-exam-result.css';
</style>