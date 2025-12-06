<template>
  <div class="class-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">班级管理</h2>
          <p class="page-subtitle">管理班级和学生</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="showCreateDialog" class="create-btn">
        <el-icon><Plus /></el-icon>
        创建班级
      </el-button>
    </div>

    <!-- 课程选择 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="选择课程">
          <el-select v-model="selectedCourseId" placeholder="请选择课程" style="width: 300px" @change="loadClasses">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 班级列表 -->
    <div v-loading="loading" class="class-list-container">
      <el-empty v-if="!selectedCourseId" description="请先选择课程" :image-size="200" />
      <el-empty v-else-if="classes.length === 0 && !loading" description="暂无班级，点击右上角创建班级" :image-size="200" />
      
      <div v-else class="class-list">
        <el-card
          v-for="classItem in classes"
          :key="classItem.classId"
          class="class-card"
          shadow="hover"
        >
          <div class="class-header">
            <div class="class-info">
              <h3 class="class-name">{{ classItem.className }}</h3>
              <div class="class-meta">
                <el-tag size="small" type="info">
                  {{ classItem.currentStudents || 0 }} / {{ classItem.maxStudents || '∞' }} 人
                </el-tag>
                <el-tag size="small" type="success" class="class-code-tag">
                  班级码: {{ classItem.classCode }}
                  <el-icon class="copy-icon" @click.stop="copyClassCode(classItem.classCode)">
                    <DocumentCopy />
                  </el-icon>
                </el-tag>
              </div>
            </div>
            <div class="class-actions">
              <el-button size="small" @click="viewStudents(classItem)">
                <el-icon><User /></el-icon>
                查看学生
              </el-button>
              <el-button size="small" type="primary" @click="showEditDialog(classItem)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDeleteClass(classItem)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 班级列表分页 -->
      <div v-if="pagination.total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[6, 12, 24, 48]"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 创建/编辑班级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑班级' : '创建班级'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="classForm" :rules="rules" label-width="100px">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="classForm.className" placeholder="请输入班级名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="classForm.courseId" placeholder="选择课程" style="width: 100%" :disabled="isEditMode">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName || course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="人数上限" prop="maxStudents">
          <el-input-number 
            v-model="classForm.maxStudents" 
            :min="1" 
            :max="500" 
            placeholder="请输入人数上限"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="班级描述">
          <el-input
            v-model="classForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入班级描述（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitClass" :loading="submitting">
          {{ isEditMode ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 学生列表对话框 -->
    <el-dialog
      v-model="studentsDialogVisible"
      :title="`${currentClass?.className} - 学生列表`"
      width="900px"
    >
      <div class="students-header">
        <el-alert 
          :title="`班级码: ${currentClass?.classCode}`" 
          type="info" 
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #default>
            学生可使用此班级码加入班级
            <el-button 
              size="small" 
              text 
              @click="copyClassCode(currentClass?.classCode)"
              style="margin-left: 8px"
            >
              <el-icon><DocumentCopy /></el-icon>
              复制
            </el-button>
          </template>
        </el-alert>
      </div>

      <el-table :data="students" v-loading="studentsLoading" stripe>
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="studentsUsername" label="姓名" width="120" />
        <el-table-column prop="studentsEmail" label="邮箱" min-width="180" />
        <el-table-column prop="joinTime" label="加入时间" width="180">
          <template #default="{ row }">
            {{ row.joinTime ? new Date(row.joinTime).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewStudentProgress(row)">
              <el-icon><TrendCharts /></el-icon>
              学习进度
            </el-button>
            <el-button size="small" type="danger" @click="removeStudentFromClass(row)">
              <el-icon><Delete /></el-icon>
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="students.length === 0 && !studentsLoading" description="暂无学生" />

      <!-- 学生列表分页 -->
      <div v-if="studentPagination.total > studentPagination.pageSize" class="pagination-container" style="margin-top: 16px;">
        <el-pagination
          v-model:current-page="studentPagination.currentPage"
          v-model:page-size="studentPagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="studentPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleStudentSizeChange"
          @current-change="handleStudentPageChange"
        />
      </div>
    </el-dialog>

    <!-- 学生进度对话框 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="学生学习进度"
      width="700px"
    >
      <div v-loading="progressLoading">
        <div v-if="studentProgress" class="progress-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="学生姓名">
              {{ studentProgress.studentName }}
            </el-descriptions-item>
            <el-descriptions-item label="学号">
              {{ studentProgress.studentId }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">课程进度</el-divider>
          <div class="progress-section">
            <div class="progress-item">
              <div class="progress-label">章节完成度</div>
              <el-progress 
                :percentage="parseFloat(studentProgress.progressPercentage || 0)" 
                :color="getProgressColor(studentProgress.progressPercentage)"
              />
              <div class="progress-detail">
                {{ studentProgress.completedChapters }} / {{ studentProgress.totalChapters }} 章节
              </div>
            </div>
          </div>

          <el-divider content-position="left">考试情况</el-divider>
          <div class="progress-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-statistic title="考试总数" :value="studentProgress.totalExams" />
              </el-col>
              <el-col :span="12">
                <el-statistic title="已完成" :value="studentProgress.completedExams" />
              </el-col>
            </el-row>
            <div class="progress-item" style="margin-top: 16px">
              <div class="progress-label">平均分数</div>
              <el-progress 
                :percentage="parseFloat(studentProgress.averageExamScore || 0)" 
                :color="getScoreColor(studentProgress.averageExamScore)"
              />
              <div class="progress-detail">
                {{ studentProgress.averageExamScore || 0 }} 分
              </div>
            </div>
          </div>

          <el-divider content-position="left">实验报告</el-divider>
          <div class="progress-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-statistic title="报告总数" :value="studentProgress.totalReports" />
              </el-col>
              <el-col :span="12">
                <el-statistic title="已提交" :value="studentProgress.submittedReports" />
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { Plus, User, Edit, Delete, DocumentCopy, TrendCharts } from '@element-plus/icons-vue'
import { useClassManagement } from '@/assets/js/teacher/class-management.js'

const {
  loading,
  dialogVisible,
  studentsDialogVisible,
  progressDialogVisible,
  submitting,
  studentsLoading,
  progressLoading,
  formRef,
  isEditMode,
  courses,
  classes,
  students,
  studentProgress,
  selectedCourseId,
  currentClass,
  classForm,
  rules,
  pagination,
  studentPagination,
  loadClasses,
  showCreateDialog,
  showEditDialog,
  submitClass,
  handleDeleteClass,
  copyClassCode,
  viewStudents,
  manageStudents,
  removeStudentFromClass,
  viewStudentProgress,
  handlePageChange,
  handleSizeChange,
  handleStudentPageChange,
  handleStudentSizeChange
} = useClassManagement()

// 进度颜色
const getProgressColor = (percentage) => {
  const value = parseFloat(percentage || 0)
  if (value < 30) return '#f56c6c'
  if (value < 60) return '#e6a23c'
  if (value < 80) return '#409eff'
  return '#67c23a'
}

// 分数颜色
const getScoreColor = (score) => {
  const value = parseFloat(score || 0)
  if (value < 60) return '#f56c6c'
  if (value < 75) return '#e6a23c'
  if (value < 85) return '#409eff'
  return '#67c23a'
}
</script>

<style scoped>
@import '@/assets/css/teacher/class-management.css';
</style>
