<template>
  <div class="course-form-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2 class="page-title">{{ isEdit ? '编辑课程' : '创建课程' }}</h2>
    </div>

    <!-- 表单内容 -->
    <el-card class="form-card" shadow="never">
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息标签 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="120px"
            label-position="right"
          >
        <!-- 课程名称 -->
        <el-form-item label="课程名称" prop="courseName">
          <el-input
            v-model="formData.courseName"
            placeholder="请输入课程名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <!-- 课程描述 -->
        <el-form-item label="课程描述" prop="courseDescription">
          <el-input
            v-model="formData.courseDescription"
            type="textarea"
            :rows="4"
            placeholder="请输入课程描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 专业 -->
        <el-form-item label="专业" prop="major">
          <el-select v-model="formData.major" placeholder="请选择专业" style="width: 100%">
            <el-option label="计算机科学与技术" value="计算机科学与技术" />
            <el-option label="软件工程" value="软件工程" />
            <el-option label="信息安全" value="信息安全" />
            <el-option label="数据科学与大数据技术" value="数据科学与大数据技术" />
            <el-option label="人工智能" value="人工智能" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <!-- 分类 -->
        <el-form-item label="课程分类" prop="classification">
          <el-select v-model="formData.classification" placeholder="请选择分类" style="width: 100%">
            <el-option label="必修课" value="必修课" />
            <el-option label="选修课" value="选修课" />
            <el-option label="公共课" value="公共课" />
            <el-option label="专业课" value="专业课" />
          </el-select>
        </el-form-item>

        <!-- 课程时间 -->
        <el-form-item label="课程时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 课程封面 -->
        <el-form-item label="课程封面">
          <el-upload
            class="cover-uploader"
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :on-change="handleCoverChange"
            :auto-upload="false"
            accept="image/*"
          >
            <img v-if="coverPreview" :src="coverPreview" class="cover-preview" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸：800x450px，支持jpg、png格式，大小不超过2MB</div>
        </el-form-item>

            <!-- 提交按钮 -->
            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="submitting">
                {{ isEdit ? '保存修改' : '创建课程' }}
              </el-button>
              <el-button @click="goBack">取消</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 课程时间表标签 -->
        <el-tab-pane label="课程时间表" name="schedule" v-if="isEdit" :disabled="!courseId">
          <div v-loading="scheduleLoading">
            <div class="schedule-header">
              <el-button type="primary" :icon="Plus" @click="openScheduleDialog">
                添加上课时间
              </el-button>
            </div>

            <el-empty v-if="schedules.length === 0" description="暂无上课时间，点击上方按钮添加" />
            
            <!-- 课程时间列表 -->
            <el-table v-else :data="schedules" border style="width: 100%; margin-top: 20px;">
              <el-table-column prop="dayOfWeek" label="星期" width="100">
                <template #default="{ row }">
                  {{ getDayName(row.dayOfWeek) }}
                </template>
              </el-table-column>
              <el-table-column label="节次" width="150">
                <template #default="{ row }">
                  第{{ row.startSection }}-{{ row.endSection }}节
                </template>
              </el-table-column>
              <el-table-column label="周数" width="150">
                <template #default="{ row }">
                  第{{ row.startWeek }}-{{ row.endWeek }}周
                </template>
              </el-table-column>
              <el-table-column prop="location" label="上课地点" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" type="primary" link @click="editSchedule(row)">
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" link @click="deleteScheduleItem(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 章节管理标签 -->
        <el-tab-pane label="章节管理" name="chapters" v-if="isEdit" :disabled="!courseId">
          <div v-loading="chaptersLoading">
            <div class="chapters-header">
              <el-button type="primary" :icon="Plus" @click="openAddDialog(null)">
                添加章节
              </el-button>
            </div>

            <el-empty v-if="treeData.length === 0" description="暂无章节，点击上方按钮添加" />
            
            <!-- 树形章节列表 -->
            <el-tree
              v-else
              :data="treeData"
              node-key="chapterId"
              :props="treeProps"
              :expand-on-click-node="false"
              default-expand-all
              class="chapter-tree"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-label">
                    <el-icon v-if="data.chapterType === 'FOLDER'" color="#409eff"><Folder /></el-icon>
                    <el-icon v-else-if="data.chapterType === 'VIDEO'" color="#67c23a"><VideoPlay /></el-icon>
                    <el-icon v-else-if="data.chapterType === 'PDF'" color="#e6a23c"><Document /></el-icon>
                    <el-icon v-else color="#909399"><Edit /></el-icon>
                    {{ data.chapterTitle }}
                  </span>
                  <span class="node-actions">
                    <el-button
                      v-if="data.chapterType === 'FOLDER'"
                      size="small"
                      type="primary"
                      link
                      @click.stop="openAddDialog(data)"
                    >
                      <el-icon><Plus /></el-icon>
                      添加子章节
                    </el-button>
                    <el-button size="small" link @click.stop="viewChapter(data)">
                      <el-icon><View /></el-icon>
                      查看
                    </el-button>
                    <el-button size="small" type="danger" link @click.stop="deleteChapter(data)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </span>
                </div>
              </template>
            </el-tree>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加章节对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="currentParent ? `添加子章节到: ${currentParent.chapterTitle}` : '添加章节'"
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
          创建
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
import { ArrowLeft, Plus, Folder, VideoPlay, Document, Edit, View, Delete, Search, Check, Download } from '@element-plus/icons-vue'
import { useCourseForm } from '@/assets/js/teacher/course-form.js'
import { onMounted } from 'vue'

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
  formatTime
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
