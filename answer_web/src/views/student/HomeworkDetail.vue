<template>
  <div class="homework-detail">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">作业详情</span>
      </template>
    </el-page-header>

    <el-card v-loading="loading" class="detail-card" shadow="never">
      <!-- 作业基本信息 -->
      <div class="homework-header">
        <h2>{{ homework.reportTitle }}</h2>
        <el-tag :type="getStatusType(submission.status)" size="large" effect="light" round>
          {{ getStatusText(submission.status) }}
        </el-tag>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">截止时间</span>
          <span class="value">{{ formatDate(homework.deadline) }}</span>
        </div>
        <div class="info-item">
          <span class="label">总分</span>
          <span class="value">{{ homework.totalScore }}</span>
        </div>
        <div class="info-item">
          <span class="label">提交时间</span>
          <span class="value">{{ formatDate(submission.submitTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">得分</span>
          <span class="value score-val">{{ liveScore }}</span>
          <el-tag v-if="submission.status !== 2" type="info" size="small" style="margin-left:8px">预评分</el-tag>
        </div>
      </div>

      <el-divider />

      <!-- 作业要求 -->
      <div class="section">
        <h3 class="section-h">
          <span class="bar"></span>作业要求
        </h3>
        <p class="desc-text">{{ homework.reportDescription }}</p>
        <div v-if="homework.attachmentUrl" class="attach-link">
          <el-link :href="buildFileUrl(homework.attachmentUrl)" target="_blank" type="primary" download>
            <el-icon><Download /></el-icon> 下载作业附件
          </el-link>
        </div>
      </div>

      <!-- 我的提交（为空则不显示） -->
      <template v-if="submission.content || submission.attachmentUrl">
        <el-divider />
        <div class="section">
          <h3 class="section-h"><span class="bar"></span>我的提交</h3>
          <div v-if="submission.content" class="sub-box">{{ submission.content }}</div>
          <div v-if="submission.attachmentUrl" class="attach-link">
            <el-link :href="buildFileUrl(submission.attachmentUrl)" target="_blank" type="primary" download>
              <el-icon><Download /></el-icon> 下载我的附件
            </el-link>
          </div>
        </div>
      </template>

      <!-- 在线题目明细：按题型分组，试卷风格 -->
      <template v-if="groupedQuestions.length > 0">
        <el-divider />
        <div class="section exam-section">
          <div class="exam-title-row">
            <h3 class="section-h" style="margin-bottom:0"><span class="bar"></span>在线题目明细</h3>
            <span class="exam-total">共 {{ questionList.length }} 题</span>
          </div>

          <!-- 按题型分组渲染 -->
          <div v-for="group in groupedQuestions" :key="group.type" class="type-group">
            <!-- 题型标题栏 -->
            <div class="type-header">
              <span class="type-num">{{ group.label }}</span>
              <span class="type-count">（共 {{ group.items.length }} 题）</span>
            </div>

            <!-- 题目列表 -->
            <div v-for="({ q, idx }, localIdx) in group.items" :key="idx" class="exam-q">
              <!-- 题目行 -->
              <div class="q-title-row">
                <span class="q-seq">{{ localIdx + 1 }}.</span>
                <span class="q-text">{{ q.questionContent }}</span>
                <!-- 客观题对错状态（简洁小标） -->
                <span
                  v-if="['SINGLE','MULTIPLE','JUDGE'].includes(q.questionType)"
                  class="q-result-dot"
                  :class="isStudentCorrect(idx, q) ? 'dot-ok' : 'dot-err'"
                  :title="isStudentCorrect(idx, q) ? '回答正确' : '回答错误'"
                ></span>
              </div>

              <!-- 单选 / 多选 选项 -->
              <div v-if="['SINGLE','MULTIPLE'].includes(q.questionType)" class="opts">
                <div
                  v-for="(opt, oIdx) in (q.options || [])"
                  :key="oIdx"
                  class="opt-line"
                  :class="{
                    'ol-student': isOptionSelectedByStudent(idx, q, oIdx),
                    'ol-correct': isOptionCorrect(q, oIdx)
                  }"
                >
                  <span class="opt-bubble"
                    :class="{
                      'bubble-student-ok':  isOptionSelectedByStudent(idx, q, oIdx) && isOptionCorrect(q, oIdx),
                      'bubble-student-err': isOptionSelectedByStudent(idx, q, oIdx) && !isOptionCorrect(q, oIdx),
                      'bubble-correct':     !isOptionSelectedByStudent(idx, q, oIdx) && isOptionCorrect(q, oIdx)
                    }"
                  >{{ String.fromCharCode(65 + oIdx) }}</span>
                  <span class="opt-body">{{ opt.text || opt }}</span>
                  <span v-if="isOptionSelectedByStudent(idx, q, oIdx)" class="ol-tag my-tag">我的选择</span>
                  <span v-if="isOptionCorrect(q, oIdx)" class="ol-tag ans-tag">正确答案</span>
                </div>
              </div>

              <!-- 判断题 -->
              <div v-if="q.questionType === 'JUDGE'" class="opts judge-opts">
                <div v-for="(judgeOpt, jIdx) in [{val:'A',label:'○ 正确'},{val:'B',label:'✗ 错误'}]"
                  :key="jIdx"
                  class="opt-line"
                  :class="{
                    'ol-student': getRawStudentAnswer(idx) === judgeOpt.val,
                    'ol-correct': q.correctAnswer === judgeOpt.val
                  }"
                >
                  <span class="opt-bubble"
                    :class="{
                      'bubble-student-ok':  getRawStudentAnswer(idx) === judgeOpt.val && q.correctAnswer === judgeOpt.val,
                      'bubble-student-err': getRawStudentAnswer(idx) === judgeOpt.val && q.correctAnswer !== judgeOpt.val,
                      'bubble-correct':     getRawStudentAnswer(idx) !== judgeOpt.val && q.correctAnswer === judgeOpt.val
                    }"
                  >{{ judgeOpt.val }}</span>
                  <span class="opt-body">{{ judgeOpt.label }}</span>
                  <span v-if="getRawStudentAnswer(idx) === judgeOpt.val" class="ol-tag my-tag">我的选择</span>
                  <span v-if="q.correctAnswer === judgeOpt.val" class="ol-tag ans-tag">正确答案</span>
                </div>
              </div>

              <!-- 简答题 -->
              <div v-if="q.questionType === 'ESSAY'" class="essay-box">
                <div class="essay-head">我的回答</div>
                <div class="essay-body">{{ formatStudentAnswer(idx, q) || '（未作答）' }}</div>
              </div>

              <!-- 解析 -->
              <div v-if="q.analysis" class="q-analysis">
                <el-icon><InfoFilled /></el-icon>
                <span class="analysis-label">解析：</span>
                <span class="analysis-text">{{ q.analysis }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 教师批改（已批改且有内容才显示） -->
      <template v-if="submission.status === 2 && (submission.score !== null || submission.teacherComment)">
        <el-divider />
        <div class="section">
          <div class="feedback-card">
            <div class="feedback-head">
              <div class="fb-left">
                <el-icon class="fb-icon"><ChatDotRound /></el-icon>
                <div>
                  <div class="fb-title">教师批改</div>
                  <div class="fb-time">{{ formatDate(submission.gradedTime) }}</div>
                </div>
              </div>
              <div class="score-pill">
                <span class="sn">{{ submission.score }}</span>
                <span class="sd">/ {{ homework.totalScore }}</span>
              </div>
            </div>
            <!-- 评语（为空不显示） -->
            <div v-if="submission.teacherComment" class="feedback-comment">
              <div class="fc-label">评语</div>
              <div class="fc-text">{{ submission.teacherComment }}</div>
            </div>
          </div>
        </div>
      </template>

      <div class="actions">
        <el-button @click="goBack">返回列表</el-button>
        <el-button v-if="submission.status === 1" type="primary" @click="editSubmission">
          修改提交
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Download, ChatDotRound, InfoFilled } from '@element-plus/icons-vue'
import { useHomeworkDetail } from '@/assets/js/student/homework-detail.js'
import { buildFileUrl } from '@/utils/fileUtils.js'

const {
  loading,
  homework,
  submission,
  questionList,
  groupedQuestions,
  liveScore,
  formatDate,
  getStatusType,
  getStatusText,
  editSubmission,
  goBack,
  formatStudentAnswer,
  isStudentCorrect,
  getRawStudentAnswer,
  isOptionSelectedByStudent,
  isOptionCorrect
} = useHomeworkDetail()
</script>

<style scoped>
@import '@/assets/css/student/homework-detail.css';
</style>
