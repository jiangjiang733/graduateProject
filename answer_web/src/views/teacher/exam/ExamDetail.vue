<template>
  <div class="exam-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>{{ exam.examTitle }}</h2>
      <div class="header-actions">
        <el-button v-if="exam.status === 0" type="primary" @click="publishExam">发布考试</el-button>
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
            <p class="question-text">{{ question.questionContent }}</p>
            
            <div v-if="question.questionOptions" class="question-options">
              <div 
                v-for="(option, optIndex) in parseOptions(question.questionOptions)" 
                :key="optIndex"
                class="option-item"
              >
                {{ option }}
              </div>
            </div>
            
            <div class="question-answer">
              <strong>正确答案：</strong>
              <span class="correct-answer">{{ question.correctAnswer }}</span>
            </div>
            
            <div v-if="question.analysis" class="question-analysis">
              <strong>解析：</strong>{{ question.analysis }}
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 学生答题情况 -->
    <el-card class="students-card">
      <template #header>
        <span>学生答题情况</span>
        <el-button type="primary" size="small" style="float: right" @click="refreshStudents">
          刷新
        </el-button>
      </template>
      
      <el-table :data="studentExams" stripe>
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getExamStatusType(row.status)">
              {{ getExamStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="obtainedScore" label="得分" width="100">
          <template #default="{ row }">
            {{ row.obtainedScore !== null ? row.obtainedScore : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ row.submitTime ? formatDate(row.submitTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              v-if="row.status >= 2" 
              type="primary" 
              size="small"
              @click="viewStudentAnswer(row)"
            >
              查看答卷
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
  goBack,
  editExam,
  publishExam,
  deleteExam,
  refreshStudents,
  viewStudentAnswer,
  parseOptions,
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
