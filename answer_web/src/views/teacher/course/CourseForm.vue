<template>
  <div class="course-form-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2 class="page-title">{{ isEdit ? '编辑课程' : '创建课程' }}</h2>
    </div>

    <!-- 表单内容 -->
    <el-card class="form-card" shadow="never">
      <!-- 步骤指示器 -->
      <div class="steps-container">
        <div 
          v-for="(step, index) in steps" 
          :key="step.value" 
          class="step-item"
          :class="{ active: currentStep === index, completed: currentStep > index, clickable: isEdit }"
          @click="isEdit && goToStep(index)"
        >
          <div class="step-circle">
            <span v-if="currentStep > index"><el-icon><Check /></el-icon></span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
          <div v-if="index < steps.length - 1" class="step-line"></div>
        </div>
      </div>

      <!-- 步骤内容区域 -->
      <div class="step-content">
        <!-- 步骤 1: 基本信息 -->
        <div v-show="currentStep === 0" class="step-panel">
          <div class="panel-header">
            <el-icon color="#10b981"><Document /></el-icon>
            <h3>第一步：填写课程基本信息</h3>
          </div>
          
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="100px"
            label-position="top"
            class="premium-form"
          >
            <el-form-item label="课程名称" prop="courseName">
              <el-input
                v-model="formData.courseName"
                placeholder="例如：UI设计零基础进阶班"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="课程分类" prop="classification">
              <el-select v-model="formData.classification" placeholder="请选择分类" style="width: 100%">
                <el-option label="设计艺术" value="设计艺术" />
                <el-option label="必修课" value="必修课" />
                <el-option label="选修课" value="选修课" />
                <el-option label="公共课" value="公共课" />
                <el-option label="专业课" value="专业课" />
              </el-select>
            </el-form-item>

            <el-form-item label="课程简介" prop="courseDescription">
              <div class="textarea-tip">输入总体要求/说明（选填）</div>
              <el-input
                v-model="formData.courseDescription"
                type="textarea"
                :rows="5"
                placeholder="详细介绍本课程的教学目标、受众及特色..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="课程封面">
              <div class="uploader-container">
                <el-upload
                  class="cover-uploader"
                  :show-file-list="false"
                  :before-upload="beforeCoverUpload"
                  :on-change="handleCoverChange"
                  :auto-upload="false"
                  accept="image/*"
                >
                  <div v-if="coverPreview" class="preview-container">
                    <img :src="coverPreview" class="cover-preview-img" />
                    <div class="preview-mask">
                      <el-icon><Edit /></el-icon>
                      <span>更换封面</span>
                    </div>
                  </div>
                  <div v-else class="uploader-placeholder">
                    <el-icon class="upload-icon"><Upload /></el-icon>
                    <div class="upload-text">点击上传封面图片</div>
                    <div class="upload-hint">请选择尺寸 16:9（1280x720px）支持 JPG, PNG</div>
                  </div>
                </el-upload>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤 2: 课程详情 -->
        <div v-show="currentStep === 1" class="step-panel">
          <div class="panel-header">
            <el-icon color="#10b981"><Reading /></el-icon>
            <h3>第二步：课程详细信息</h3>
          </div>
          
          <el-form
            :model="formData"
            label-width="100px"
            label-position="top"
            class="premium-form"
          >
            <div class="form-row">
              <el-form-item label="所属专业" prop="major" class="form-item-half">
                <el-select v-model="formData.major" placeholder="请选择专业" style="width: 100%">
                  <el-option label="计算机科学与技术" value="计算机科学与技术" />
                  <el-option label="软件工程" value="软件工程" />
                  <el-option label="信息安全" value="信息安全" />
                  <el-option label="数据科学与大数据技术" value="数据科学与大数据技术" />
                  <el-option label="人工智能" value="人工智能" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>

              <el-form-item label="课程有效期" class="form-item-half">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开课日期"
                  end-placeholder="结课日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </div>
          </el-form>
        </div>
        <div v-show="currentStep === 2" class="step-panel">
          <div class="panel-header">
            <el-icon color="#10b981"><User /></el-icon>
            <h3>第三步：状态</h3>
          </div>
          
          <el-form label-position="top" class="premium-form">
            <div class="form-row">
              <el-form-item label="课程状态" class="form-item-half">
                <el-radio-group v-model="formData.state">
                  <el-radio :label="0">草稿（仅自己可见，不对学生开放）</el-radio>
                  <el-radio :label="1">已发布（学生可见和加入）</el-radio>
                </el-radio-group>
              </el-form-item>

            
            </div>

        

            <el-form-item label="备注说明（选填）">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="3"
                placeholder="可填写课程的其他说明信息，如先修要求、学习建议等"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤 4: 课程时间 -->
        <div v-show="currentStep === 3" class="step-panel">
          <div class="panel-header">
            <el-icon color="#10b981"><Clock /></el-icon>
            <h3>第四步：上课时间设置</h3>
          </div>

          <div class="schedule-management">
            <div class="section-header">
              <el-button type="primary" @click="openScheduleDialog">
                <el-icon><Plus /></el-icon>
                添加上课时间
              </el-button>
            </div>
            
            <div class="schedule-list" v-if="schedules && schedules.length > 0">
              <div v-for="(item, index) in schedules" :key="index" class="schedule-item-card">
                <div class="schedule-info">
                  <div class="schedule-time">
                    <el-tag size="small" effect="dark">{{ getDayName(item.dayOfWeek) }}</el-tag>
                    <span class="time-range">第 {{ item.startSection }}-{{ item.endSection }} 节</span>
                    <span class="week-range">({{ item.startWeek }}-{{ item.endWeek }}周)</span>
                  </div>
                  <div class="schedule-location">
                    <el-icon><Location /></el-icon>
                    {{ item.location }}
                  </div>
                </div>
                <div class="schedule-actions">
                  <el-button circle size="small" :icon="Edit" @click="editSchedule(item)" />
                  <el-button circle size="small" type="danger" :icon="Delete" @click="deleteScheduleItem(item)" />
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无上课时间，请点击上方按钮添加" :image-size="80" />
          </div>
        </div>

        <!-- 步骤 5: 课程大纲 -->
        <div v-show="currentStep === 4" class="step-panel">
          <div class="panel-header">
            <el-icon color="#10b981"><Document /></el-icon>
            <h3>第五步：课程大纲</h3>
          </div>

          <div class="chapter-management">
            <div class="section-header">
              <el-button type="primary" @click="openAddDialog(null)">
                <el-icon><Plus /></el-icon>
                添加章节
              </el-button>
            </div>

            <div class="chapter-tree-container">
              <el-tree
                :data="treeData"
                node-key="chapterId"
                :props="treeProps"
                default-expand-all
                :expand-on-click-node="false"
                empty-text="暂无章节，请点击上方按钮添加"
              >
                <template #default="{ node, data }">
                  <div class="custom-tree-node">
                    <div class="node-content">
                      <el-icon v-if="data.chapterType === 'FOLDER'" class="node-icon folder"><Folder /></el-icon>
                      <el-icon v-else-if="data.children && data.children.length > 0" class="node-icon folder"><Folder /></el-icon>
                      <el-icon v-else-if="data.chapterType === 'VIDEO'" class="node-icon video"><VideoPlay /></el-icon>
                      <el-icon v-else-if="data.chapterType === 'PDF'" class="node-icon pdf"><Document /></el-icon>
                      <el-icon v-else class="node-icon mixed"><Reading /></el-icon>
                      
                      <span class="node-title">{{ data.chapterTitle }}</span>
                      <el-tag v-if="data.chapterType" size="small" :type="getChapterTypeTag(data.chapterType)" class="node-tag">
                        {{ getTypeLabel(data.chapterType) }}
                      </el-tag>
                    </div>
                    
                    <div class="node-actions">
                      <el-button 
                        v-if="data.chapterType === 'FOLDER' || (data.children && data.children.length > 0)" 
                        link 
                        type="primary" 
                        size="small" 
                        @click.stop="openAddDialog(data)"
                      >
                        <el-icon><Plus /></el-icon>
                      </el-button>
                      <el-button link type="primary" size="small" @click.stop="editChapter(data)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button link type="primary" size="small" @click.stop="viewChapter(data)" v-if="data.chapterType !== 'FOLDER'">
                        <el-icon><View /></el-icon>
                      </el-button>
                      <el-button link type="danger" size="small" @click.stop="deleteChapter(data)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="step-footer">
        <el-button @click="goBack" class="footer-btn-cancel">
          <el-icon><Close /></el-icon>
          取消
        </el-button>
        <div class="footer-btns-right">
          <el-button 
            v-if="currentStep > 0"
            @click="prevStep" 
            class="footer-btn-prev"
          >
            上一步
          </el-button>
          <el-button 
            v-if="currentStep < steps.length - 1"
            type="primary" 
            @click="nextStep"
            class="footer-btn-next"
          >
            下一步
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button 
            v-else
            type="primary" 
            @click="submitForm"
            :loading="submitting"
            class="footer-btn-submit"
          >
            {{ isEdit ? '更新课程' : '创建课程' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 添加章节对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="isEditChapter ? '编辑章节' : (currentParent ? `添加子章节到: ${currentParent.chapterTitle}` : '添加章节')"
      width="600px"
    >
      <el-form :model="chapterForm" label-width="100px">
        <el-form-item label="章节类型">
          <el-radio-group v-model="chapterForm.type">
            <el-radio label="FOLDER">📁 文件夹</el-radio>
            <el-radio label="MIXED">📚 混合内容（视频+PDF+文本）</el-radio>
            <el-radio label="VIDEO">🎬 仅视频</el-radio>
            <el-radio label="PDF">📄 仅PDF</el-radio>
            <el-radio label="TEXT">📝 仅文本</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="章节名称" required>
          <el-input v-model="chapterForm.title" placeholder="请输入章节名称" />
        </el-form-item>

        <el-form-item label="章节顺序">
          <el-input-number v-model="chapterForm.order" :min="1" />
        </el-form-item>

        <!-- 混合内容 - 视频上传 -->
        <el-form-item v-if="chapterForm.type === 'MIXED' || chapterForm.type === 'VIDEO'" label="视频文件">
          <el-upload
              ref="videoUploadRef" :auto-upload="false"
            :limit="1"
            :on-change="handleVideoChange"
            accept="video/*"
          >
            <el-button>选择视频（可选）</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 mp4、avi、mov、wmv 格式，最大 500MB</div>
            </template>
          </el-upload>
          <div v-if="chapterForm.videoUrl && !chapterForm.video" style="margin-top: 8px; color: #67c23a; font-size: 13px; display: flex; align-items: center; gap: 4px;">
             <el-icon><CircleCheckFilled /></el-icon>
             <span>当前已包含视频文件，重新上传将覆盖</span>
          </div>
        </el-form-item>

        <!-- 混合内容 - PDF上传 -->
        <el-form-item v-if="chapterForm.type === 'MIXED' || chapterForm.type === 'PDF'" label="PDF文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handlePdfChange"
            accept=".pdf"
          >
            <el-button>选择PDF（可选）</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF 格式，最大 50MB</div>
            </template>
          </el-upload>
          <div v-if="chapterForm.pdfUrl && !chapterForm.pdf" style="margin-top: 8px; color: #67c23a; font-size: 13px; display: flex; align-items: center; gap: 4px;">
             <el-icon><CircleCheckFilled /></el-icon>
             <span>当前已包含PDF文件，重新上传将覆盖</span>
          </div>
        </el-form-item>

        <!-- 混合内容 - 文本内容 -->
        <el-form-item v-if="chapterForm.type === 'MIXED' || chapterForm.type === 'TEXT'" label="文本内容">
          <el-input
            v-model="chapterForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入文本内容（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChapter" :loading="chaptersLoading">
          {{ isEditChapter ? '保存修改' : '立即创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑课程时间对话框 -->
    <el-dialog
      v-model="scheduleDialogVisible"
      :title="isEditSchedule ? '编辑上课时间' : '添加上课时间'"
      width="600px"
    >
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="星期" required>
          <el-select v-model="scheduleForm.dayOfWeek" placeholder="请选择星期" style="width: 100%">
            <el-option label="星期一" :value="1" />
            <el-option label="星期二" :value="2" />
            <el-option label="星期三" :value="3" />
            <el-option label="星期四" :value="4" />
            <el-option label="星期五" :value="5" />
            <el-option label="星期六" :value="6" />
            <el-option label="星期日" :value="7" />
          </el-select>
        </el-form-item>

        <el-form-item label="开始节次" required>
          <el-input-number v-model="scheduleForm.startSection" :min="1" :max="12" />
        </el-form-item>

        <el-form-item label="结束节次" required>
          <el-input-number v-model="scheduleForm.endSection" :min="1" :max="12" />
        </el-form-item>

        <el-form-item label="开始周数" required>
          <el-input-number v-model="scheduleForm.startWeek" :min="1" :max="20" />
        </el-form-item>

        <el-form-item label="结束周数" required>
          <el-input-number v-model="scheduleForm.endWeek" :min="1" :max="20" />
        </el-form-item>

        <el-form-item label="上课地点" required>
          <el-input v-model="scheduleForm.location" placeholder="请输入上课地点" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSchedule" :loading="scheduleLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 章节详情全屏页面 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="currentChapter?.chapterTitle || '章节详情'" 
      width="95%"
      top="3vh"
      :close-on-click-modal="false"
      class="chapter-detail-dialog"
    >
      <div v-if="currentChapter" class="chapter-detail-container">
        <!-- 左侧章节目录 -->
        <div class="chapter-sidebar">
          <div class="sidebar-header">
            <h3>目录</h3>
          </div>
          <div class="sidebar-search">
            <el-input 
              v-model="chapterSearchText" 
              placeholder="搜索" 
              :prefix-icon="Search"
              clearable
            />
          </div>
          <div class="sidebar-tree">
            <el-tree
              :data="treeData"
              node-key="chapterId"
              :props="treeProps"
              :expand-on-click-node="false"
              :highlight-current="true"
              :current-node-key="currentChapter.chapterId"
              @node-click="handleChapterClick"
              default-expand-all
            >
              <template #default="{ node, data }">
                <div class="sidebar-tree-node">
                  <el-icon v-if="data.chapterType === 'FOLDER'" color="#409eff"><Folder /></el-icon>
                  <el-icon v-else-if="data.chapterType === 'VIDEO'" color="#67c23a"><VideoPlay /></el-icon>
                  <el-icon v-else-if="data.chapterType === 'PDF'" color="#e6a23c"><Document /></el-icon>
                  <el-icon v-else color="#909399"><Edit /></el-icon>
                  <span class="tree-node-title">{{ data.chapterTitle }}</span>
                  <el-icon v-if="data.chapterId === currentChapter.chapterId" color="#67c23a" class="check-icon">
                    <Check />
                  </el-icon>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- 右侧章节内容 -->
        <div class="chapter-content">
          <div class="content-header">
            <div class="content-title">
              <h2>{{ currentChapter.chapterTitle }}</h2>
              <el-tag :type="getChapterTypeTag(currentChapter.chapterType)">
                {{ getTypeLabel(currentChapter.chapterType) }}
              </el-tag>
            </div>
            <div class="content-meta">
              <span>创建时间：{{ formatTime(currentChapter.createTime) }}</span>
            </div>
          </div>

          <div class="content-body">
            <!-- 视频播放 -->
            <div v-if="currentChapter.videoUrl" class="media-section">
              <div class="media-wrapper">
                <video 
                  :src="getMediaUrl(currentChapter.videoUrl)" 
                  controls 
                  controlslist="nodownload"
                  class="video-player"
                >
                  您的浏览器不支持视频播放
                </video>
              </div>
            </div>

            <!-- PDF内容 -->
            <div v-if="currentChapter.pdfUrl" class="media-section">
              <div class="pdf-viewer">
                <div class="pdf-header">
                  <h3>
                    <el-icon><Document /></el-icon>
                    PDF文档
                  </h3>
                  <el-button 
                    type="primary" 
                    :icon="Download" 
                    @click="downloadPdf(currentChapter.pdfUrl)"
                  >
                    下载PDF
                  </el-button>
                </div>
                <iframe 
                  v-if="currentChapter.pdfUrl"
                  :src="getMediaUrl(currentChapter.pdfUrl)" 
                  class="pdf-frame"
                  frameborder="0"
                ></iframe>
              </div>
            </div>

            <!-- 文本内容 -->
            <div v-if="currentChapter.textContent" class="text-section">
              <div class="text-content-box">
                <div class="text-content-inner" v-html="formatTextContent(currentChapter.textContent)"></div>
              </div>
            </div>

            <!-- 空状态 -->
            <el-empty 
              v-if="!currentChapter.videoUrl && !currentChapter.pdfUrl && !currentChapter.textContent"
              description="该章节暂无内容"
            />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ArrowLeft, Plus, Folder, VideoPlay, Document, Edit, View, Delete, Search, Check, Download, Warning, CircleCheckFilled, Upload, Close, ArrowRight, Reading, User, Location } from '@element-plus/icons-vue'
import { useCourseForm } from '@/assets/js/teacher/course-form.js'
import { onMounted, ref } from 'vue'

const {
  videoUploadRef,
  formRef,
  isEdit,
  courseId,
  activeTab,
  formData,
  dateRange,
  coverPreview,
  coverFile,
  submitting,
  treeData,
  chaptersLoading,
  addDialogVisible,
  isEditChapter,
  detailDialogVisible,
  currentParent,
  currentChapter,
  chapterSearchText,
  treeProps,
  chapterForm,
  // 课程时间表
  schedules,
  scheduleLoading,
  scheduleDialogVisible,
  isEditSchedule,
  scheduleForm,
  loadSchedules,
  openScheduleDialog,
  editSchedule,
  submitSchedule,
  deleteScheduleItem,
  getDayName,
  rules,
  handleCoverChange,
  beforeCoverUpload,
  submitForm,
  goBack,
  openAddDialog,
  editChapter,
  handleVideoChange,
  handlePdfChange,
  submitChapter,
  viewChapter,
  deleteChapter,
  handleChapterClick,
  getMediaUrl,
  downloadPdf,
  formatTextContent,
  getChapterTypeTag,
  getTypeLabel,
  formatTime,
  // 步骤相关
  steps,
  currentStep,
  nextStep,
  prevStep,
  goToStep
} = useCourseForm()

// 组件挂载时打印调试信息
onMounted(() => {
  console.log('CourseForm 组件已挂载')
  console.log('isEdit:', isEdit.value)
  console.log('courseId:', courseId.value)
  console.log('formData:', formData)
})
</script>

<style scoped>
@import '@/assets/css/teacher/course-form.css';
</style>

<style>
/* 
 * 全局暗黑模式覆盖 (针对 Dialog 等脱离文档流的组件)
 */
html.dark .el-dialog {
    background-color: #111827 !important;
    border: 1px solid #1f2937 !important;
}

html.dark .el-dialog__header {
    margin-right: 0;
    border-bottom: 1px solid #1f2937;
    background-color: #111827 !important;
}

html.dark .el-dialog__title {
    color: #f3f4f6 !important;
}

html.dark .el-dialog__body {
    background-color: #111827 !important;
    color: #e5e7eb !important;
}

html.dark .el-dialog__footer {
    background-color: #111827 !important;
    border-top: 1px solid #1f2937;
}

/* 确保 Dialog 内部的表单 label 可见 */
html.dark .el-form-item__label {
    color: #e5e7eb !important;
}

/* 确保 Dialog 内部的 Input 变黑 */
html.dark .el-dialog .el-input__wrapper,
html.dark .el-dialog .el-textarea__inner {
    background-color: #1f2937 !important;
    box-shadow: 0 0 0 1px #374151 inset !important;
    color: #fff !important;
}

html.dark .el-dialog .el-input__wrapper:hover,
html.dark .el-dialog .el-textarea__inner:hover {
    box-shadow: 0 0 0 1px #4b5563 inset !important;
}

html.dark .el-dialog .el-input__wrapper.is-focus,
html.dark .el-dialog .el-textarea__inner:focus {
    box-shadow: 0 0 0 1px #409eff inset !important;
}
</style>
