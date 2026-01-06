<template>
  <div class="course-detail-page">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="course" class="course-detail">
      <div class="course-header">
        <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
        <div class="header-content">
          <div class="course-cover">
            <img 
              :src="getCourseImage(course.image)" 
              :alt="course.courseName || course.name"
              @error="handleImageError"
            />
          </div>
          <div class="course-info">
            <h1 class="course-title">{{ course.courseName || course.name }}</h1>
            <div class="course-meta">
              <el-tag type="primary">{{ course.major || '未分类' }}</el-tag>
              <el-tag type="success">{{ course.classification || '未分类' }}</el-tag>
              <span class="meta-item">
                <el-icon><User /></el-icon>
                教师：{{ course.teacherName }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                创建时间：{{ formatDate(course.createTime) }}
              </span>
            </div>
            <div class="course-description">
              {{ course.courseDescription }}
            </div>

            <div v-if="permission.isOwner" class="course-actions">
              <el-button type="primary" :icon="Edit" @click="editCourse">编辑课程</el-button>
              <el-button type="danger" :icon="Delete" @click="confirmDelete">删除课程</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="course-body">
        <el-card class="course-main-card" shadow="never">
          <el-tabs v-model="activeTab" class="course-tabs-modern">
            <el-tab-pane label="课程介绍" name="intro">
              <div class="tab-content-wrapper">
                <h3>详细描述</h3>
                <p class="course-description-full">{{ course.courseDescription }}</p>
              </div>
            </el-tab-pane>

            <el-tab-pane label="课程目录" name="chapters">
              <div class="tab-content-wrapper chapters-container">
                <div class="chapters-header">
                  <h3>课程章节</h3>
                  <el-button v-if="permission.canEdit" type="primary" :icon="Edit" @click="manageChapters">管理目录</el-button>
                </div>

                <el-empty v-if="chapters.length === 0" description="暂无章节内容" />
                
                <el-tree
                    v-else
                    :data="chapters"
                    :props="chapterProps"
                    :default-expand-all="true"
                    class="course-chapter-tree"
                >
                  <template #default="{ node, data }">
                    <span class="custom-tree-node">
                      <el-icon class="chapter-icon" :size="18">
                        <component :is="getChapterIcon(data.chapterType || data.type)" />
                      </el-icon>
                      <span class="chapter-title-text">{{ data.chapterTitle || data.title }}</span>
                      <span v-if="data.chapterType !== 'FOLDER' && data.type !== 'FOLDER'" class="chapter-link">
                        <el-button link type="primary" size="small" @click="viewContent(data)">
                          {{ (data.chapterType === 'VIDEO' || data.type === 'VIDEO') ? '观看' : '查看' }}
                        </el-button>
                      </span>
                    </span>
                  </template>
                </el-tree>
              </div>
            </el-tab-pane>

            <el-tab-pane label="课程评论" name="comments">
              <div class="tab-content-wrapper comments-container">
                <CourseComment :courseId="courseId" :chapters="chapters" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="资料库" name="resources">
              <div class="tab-content-wrapper resources-container">
                <CourseResource :courseId="courseId" :isAdmin="permission.canEdit" />
              </div>
            </el-tab-pane>

             <el-tab-pane label="班级成员" name="students" v-if="permission.isOwner">
              <div class="tab-content-wrapper students-container">
                <CourseStudents :courseId="courseId" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

      </div>
    </div>

    <div v-else-if="error" class="error-container">
      <el-alert :title="error" type="error" show-icon />
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, User, Calendar, Star, Document, List, ChatDotSquare, Edit, Delete, Folder, VideoPlay, Files } from '@element-plus/icons-vue';
import CourseComment from './CourseComment.vue';
import CourseStudents from './CourseStudents.vue';
import CourseResource from '@/components/common/CourseResource.vue';
import { useCourseDetail } from '@/assets/js/teacher/course-detail.js';

const {
  course,
  chapters,
  loading,
  error,
  activeTab,
  permission,
  chapterProps,
  courseId,
  goBack,
  confirmDelete,
  editCourse,
  manageChapters,
  viewContent,
  getChapterIcon,
  formatDate,
  getCourseImage,
  handleImageError
} = useCourseDetail();
</script>

<style scoped>
@import '@/assets/css/teacher/course-detail.css';
</style>