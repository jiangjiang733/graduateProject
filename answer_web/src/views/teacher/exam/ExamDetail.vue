<template>
  <div class="exam-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>{{ exam.examTitle }}</h2>
      <div class="header-actions">
        <el-button v-if="exam.status === 0" type="primary" @click="publishExam">发布考试</el-button>
        <el-button v-if="exam.status === 1" type="warning" @click="unpublishExam">取消发布</el-button>
        <el-button @click="editExam">编辑考试</el-button>
        <el-button type="danger" @click="deleteExam">删除考试</el-button>
      </div>
    </div>

    <!-- 考试信息卡片 -->
    <el-card class="exam-info-card" v-loading="loading">
      <template #header>
        <span>考试信息</span>
        <el-tag :type="getStatusType(exam.status)" style="margin-left: 10px">
          {{ getStatusText(exam.status) }}
        </el-tag>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="考试标题">{{ exam.examTitle }}</el-descriptions-item>
        <el-descriptions-item label="所属课程">{{ exam.courseName }}</el-descriptions-item>
        <el-descriptions-item label="考试时长">{{ exam.duration }} 分钟</el-descriptions-item>
        <el-descriptions-item label="总分">{{ exam.totalScore }} 分</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ exam.passScore }} 分</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDate(exam.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDate(exam.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="参考人数">
          {{ exam.submittedCount || 0 }} / {{ exam.totalStudents || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="考试说明" :span="2">
          {{ exam.examDescription || '暂无说明' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 试题列表 -->
    <el-card class="questions-card">
      <template #header>
        <span>试题列表（共 {{ questions.length }} 题）</span>
      </template>
      
      <div v-if="questions.length === 0" class="empty-state">
        <el-empty description="暂无试题" />
      </div>
      
      <div v-else class="questions-list">
        <div 
          v-for="(question, index) in questions" 
          :key="question.questionId"
          class="question-item"
        >
          <div class="question-header">
            <span class="question-number">第 {{ index + 1 }} 题</span>
            <el-tag :type="getQuestionTypeColor(question.questionType)" size="small">
              {{ getQuestionTypeName(question.questionType) }}
            </el-tag>
            <span class="question-score">{{ question.score }} 分</span>
          </div>
          
          <div class="question-content">
            <p class="question-text">{{ formatQuestionContent(question) }}</p>
            
            <div v-if="question.questionOptions" class="question-options">
              <div 
                v-for="(option, optIndex) in parseOptions(question.questionOptions)" 
                :key="optIndex"
                class="option-item"
              >
                <span class="opt-prefix">{{ String.fromCharCode(65 + optIndex) }}.</span>
                {{ typeof option === 'object' ? option.text : option }}
              </div>
            </div>
            
            <div class="question-answer" :class="{ 'is-multi': ['SINGLE', 'MULTIPLE'].includes(question.questionType) }">
              <strong>正确答案：</strong>
              <span class="correct-answer">{{ formatAnswer(question) }}</span>
            </div>
            
            <div v-if="question.analysis" class="question-analysis">
              <strong>解析：</strong>{{ question.analysis }}
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 考试统计 -->
    <el-row :gutter="20" style="margin-top: 20px" v-if="statistics">
      <el-col :span="16">
        <el-card class="statistics-card">
          <template #header>
            <div class="card-header">
              <span>考试成绩分布分析</span>
              <el-tag type="info">共 {{ statistics.totalStudents }} 人参考</el-tag>
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
              <div class="value primary">{{ statistics.passRate || '0' }}%</div>
            </div>
            <div class="summary-item">
              <div class="label">待批改</div>
              <div class="value warning">{{ statistics.submittedCount - statistics.gradedCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 学生答题情况 -->
    <el-card class="students-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>全班学生成绩名单 (包含未参加学生)</span>
          <el-button type="primary" size="small" @click="refreshStudents">刷新列表</el-button>
        </div>
      </template>
      
      <el-table :data="studentExams" stripe border style="width: 100%">
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
            <span v-if="row.status >= 2" :class="{'score-fail': row.obtainedScore < exam.passScore, 'score-pass': row.obtainedScore >= exam.passScore}">
              {{ row.obtainedScore }}
            </span>
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
    </el-card>
  </div>
</template>

<script setup>
import { useExamDetail } from '@/assets/js/teacher/exam-detail.js'

const {
  loading,
  exam,
  questions,
  studentExams,
  unpublishExam,
  returnStudentExam,
  goBack,
  editExam,
  publishExam,
  deleteExam,
  refreshStudents,
  viewStudentAnswer,
  parseOptions,
  formatQuestionContent,
  formatAnswer,
  formatDate,
  getStatusType,
  getStatusText,
  getQuestionTypeName,
  getQuestionTypeColor,
  getExamStatusType,
  getExamStatusText
} = useExamDetail()
</script>

<style scoped>
@import '@/assets/css/teacher/exam-detail.css';
</style>
