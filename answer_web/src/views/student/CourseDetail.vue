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
                <div class="sub-chapter-list" v-if="chapter.children?.length > 0">
                  <div
                      v-for="sub in chapter.children"
                      :key="sub.chapterId"
                      class="sub-chapter-item"
                      @click="isEnrolled ? startLearning() : handleEnroll()"
                  >
                    <div class="sub-chapter-title">
                      <el-icon class="type-icon">
                        <VideoPlay v-if="sub.chapterType?.toUpperCase() === 'VIDEO'" />
                        <Document v-else-if="sub.chapterType?.toUpperCase() === 'PDF'" />
                        <Loading v-else-if="sub.chapterType?.toUpperCase() === 'LOADING'" />
                        <Reading v-else />
                      </el-icon>
                      <span class="title-text">{{ sub.chapterTitle || '未命名内容' }}</span>
                    </div>
                    <div class="sub-chapter-action">
                      <el-tag v-if="!isEnrolled" size="small" type="info" effect="plain">需报名</el-tag>
                      <span v-else class="status-text">立即学习</span>
                      <el-icon><ArrowRight /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-if="!chapters.length" description="暂无章节内容" />
          </el-tab-pane>

          <el-tab-pane label="课程评论" name="reviews">
            <CommentSection 
              :course-id="course.id"
              :user-type="currentUserType"
            />
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

      <!-- 右侧侧边栏 -->
      <div class="sidebar">
        <!-- 学习状态卡片 (仅报名后显示) -->
        <el-card v-if="isEnrolled" class="sidebar-card status-card" shadow="never">
          <div class="progress-info">
            <div class="label">我的学习进度</div>
            <el-progress :percentage="course.progress || 0" :stroke-width="10" />
            <div class="status-tip">加油！离完成课程更近一步</div>
          </div>
        </el-card>

        <!-- 授课教师卡片 -->
        <el-card class="sidebar-card teacher-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="header-title">授课教师</span>
            </div>
          </template>
          <div class="teacher-profile">
            <el-avatar :size="64" :src="course.teacherAvatar" class="avatar-shadow" />
            <div class="teacher-meta">
              <div class="name">{{ course.teacherName || '资深讲师' }}</div>
              <div class="title">{{ course.teacherTitle || '高级讲师' }}</div>
            </div>
          </div>
          <div class="teacher-bio">
            {{ course.teacherBio || '深耕该领域多年，拥有丰富的行业实战经验与教学背景，致力于将复杂知识简单化。' }}
          </div>
        </el-card>

        <!-- 课程信息卡片 -->
        <el-card class="sidebar-card info-card" shadow="never">
          <ul class="info-list">
            <li>
              <span class="label">课程难度</span>
              <span class="value">{{ course.level || '中级' }}</span>
            </li>
            <li>
              <span class="label">课程时长</span>
              <span class="value">{{ course.duration || '约 12 小时' }}</span>
            </li>
            <li>
              <span class="label">更新状态</span>
              <span class="value">{{ course.updateStatus || '已完结' }}</span>
            </li>
          </ul>
        </el-card>
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

// 兜底图片处理
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/400x225?text=Course+Image'
}
</script>