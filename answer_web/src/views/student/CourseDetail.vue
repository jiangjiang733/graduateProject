<template>
  <div class="course-detail-page" v-loading="loading">
    <!-- 顶部 Banner 区域 -->
    <div class="course-banner" :style="{ '--banner-bg': `url('${course.image}')` }">
      <div class="banner-content">
        <div class="banner-left">
          <div class="banner-cover">
            <img :src="course.image" :alt="course.courseName" @error="handleImageError" class="rect-img">
          </div>
        </div>
        <div class="banner-info">
          <h1 class="course-title">{{ course.courseName }}</h1>
          <p class="course-subtitle">{{ course.courseDescription || '这门课程暂无详细简介，请关注后续更新。' }}</p>

          <div class="course-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ course.teacherName || '未知教师' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Reading /></el-icon>
              <span>{{ chapters.length }} 个章节</span>
            </div>
            <div class="meta-item" v-if="course.studentCount !== undefined">
              <el-icon><Monitor /></el-icon>
              <span>{{ course.studentCount }}人在学</span>
            </div>
          </div>

          <div class="banner-actions">
            <!-- 根据详细报名状态显示不同按钮 -->
            <template v-if="enrollmentStatus === 'none'">
              <el-button type="primary" size="large" @click="handleEnroll" round class="action-btn">
                <el-icon><Plus /></el-icon>&nbsp;立即报名
              </el-button>
            </template>
            
            <template v-else-if="enrollmentStatus === 'pending'">
              <el-button type="warning" size="large" disabled round class="action-btn">
                <el-icon><Clock /></el-icon>&nbsp;审核中
              </el-button>
            </template>

            <template v-else-if="enrollmentStatus === 'rejected'">
              <el-button type="danger" size="large" @click="handleEnroll" round class="action-btn">
                <el-icon><Refresh /></el-icon>&nbsp;重新报名
              </el-button>
            </template>

            <template v-else-if="enrollmentStatus === 'approved'">
              <el-button type="success" size="large" @click="startLearning" round class="action-btn">
                <el-icon><VideoPlay /></el-icon>&nbsp;继续学习
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容布局 -->
    <div class="main-container">
      <div class="content-wrapper">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="课程介绍" name="intro">
            <div class="course-intro-card">
              <div class="intro-section">
                <h3><span class="dot"></span>课程概述</h3>
                <div class="rich-text-content" v-html="course.courseDetail || course.courseDescription || '暂无详细介绍'"></div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="课程目录" name="chapters">
            <div class="chapter-list">
              <div v-for="(chapter, index) in chapters" :key="chapter.chapterId" class="chapter-group">
                <div class="chapter-header">
                  <div class="header-left">
                    <span class="chapter-index">{{ (index + 1).toString().padStart(2, '0') }}</span>
                    <el-icon v-if="chapter.chapterType?.toUpperCase() === 'FOLDER' || chapter.children?.length > 0" class="folder-icon">
                      <Folder />
                    </el-icon>
                    <span class="chapter-name">{{ chapter.chapterTitle || '未命名章节' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-if="!chapters.length" description="暂无章节内容" />
          </el-tab-pane>

          <el-tab-pane label="课程评论" name="reviews">
            <CommentSection 
              v-if="course.id"
              :course-id="course.id"
              :user-type="currentUserType"
            />
            <el-empty v-else description="加载中..." :image-size="80" />
          </el-tab-pane>

          <el-tab-pane label="资料库" name="resources">
            <template v-if="isEnrolled">
              <CourseResource 
                :course-id="course.id" 
                :isAdmin="false" 
                :canDownload="isEnrolled" 
              />
            </template>
            <div v-else class="member-lock-tip">
              <el-empty :image-size="200" description="资料库仅对班级成员开放">
                <template #extra>
                  <el-button type="primary" @click="handleEnroll">立即加入课程</el-button>
                </template>
              </el-empty>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  User,
  Reading,
  VideoPlay,
  Document,
  ArrowRight,
  Monitor,
  Plus,
  Refresh,
  Folder,
  Loading
} from '@element-plus/icons-vue'
import { useCourseDetail } from '@/assets/js/student/course-detail.js'
import { useRouter } from 'vue-router'
import '@/assets/css/student/course-detail.css'
import CourseResource from '@/components/common/CourseResource.vue'
import CommentSection from '@/components/CommentSection.vue'

const router = useRouter()
const {
  course,
  chapters,
  activeTab,
  loading,
  isEnrolled,      // 是否已通过审核并确认报名
  enrollmentStatus, // 详细状态：none, pending, approved, rejected
  handleEnroll,    // 报名申请方法
  startLearning    // 学习方法
} = useCourseDetail()

// 获取当前用户角色，用于评论区身份识别
const currentUserType = localStorage.getItem('userRole')?.toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT'

const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/400x225?text=Course+Image'
}
</script>