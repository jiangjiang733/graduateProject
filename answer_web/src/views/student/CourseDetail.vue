<template>
  <div class="course-detail-page" v-loading="loading">
    <!-- 顶部 Banner 区域 -->
    <div class="course-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <div class="banner-left">
          <div class="banner-cover">
            <img :src="course.image" :alt="course.courseName" @error="handleImageError">
            <div class="course-tag">{{ course.categoryName || '精品课程' }}</div>
          </div>
        </div>
        <div class="banner-info">
          <div class="breadcrumb-nav">
            <span @click="router.back()">课程列表</span> / <span class="active">课程详情</span>
          </div>
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
              <span>{{ course.studentCount }} 人在学</span>
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
          <el-tab-pane label="课程大纲" name="chapters">
            <div class="chapter-list">
              <div v-for="(chapter, index) in chapters" :key="chapter.id" class="chapter-group">
                <div class="chapter-header">
                  <div class="header-left">
                    <span class="chapter-index">{{ (index + 1).toString().padStart(2, '0') }}</span>
                    <span class="chapter-name">{{ chapter.title }}</span>
                  </div>
                </div>
                <div class="sub-chapter-list">
                  <div
                      v-for="sub in chapter.children"
                      :key="sub.id"
                      class="sub-chapter-item"
                      @click="isEnrolled ? startLearning() : handleEnroll()"
                  >
                    <div class="sub-chapter-title">
                      <el-icon class="type-icon">
                        <VideoPlay v-if="sub.type === 'VIDEO'" />
                        <Document v-else-if="sub.type === 'PDF'" />
                        <Reading v-else />
                      </el-icon>
                      <span class="title-text">{{ sub.title }}</span>
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

          <el-tab-pane label="详情介绍" name="intro">
            <div class="course-intro-card">
              <div class="intro-section">
                <h3><span class="dot"></span>课程概述</h3>
                <div class="rich-text-content" v-html="course.courseDetail || course.courseDescription || '暂无详细介绍'"></div>
              </div>
              <div class="intro-section">
                <h3><span class="dot"></span>学习目标</h3>
                <ul class="goal-list">
                  <li>深入理解课程核心知识体系</li>
                  <li>掌握行业领先的实践工具与方法论</li>
                  <li>获得由专家教师指导的学习路径</li>
                </ul>
              </div>
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
  Refresh
} from '@element-plus/icons-vue'
import { useCourseDetail } from '@/assets/js/student/course-detail.js'
import { useRouter } from 'vue-router'

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

// 兜底图片处理
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/400x225?text=Course+Image'
}
</script>

<style scoped>
/* 页面整体背景与基础样式 */
.course-detail-page {
  background-color: #f8fafc;
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Banner 视觉优化 */
.course-banner {
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 80px 0;
  color: #fff;
  overflow: hidden;
}

.banner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%);
  opacity: 0.6;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 48px;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.banner-cover {
  position: relative;
  width: 420px;
  height: 236px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.banner-cover img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.banner-cover:hover img {
  transform: scale(1.05);
}

.course-tag {
  position: absolute;
  top: 12px; left: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.banner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.breadcrumb-nav {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 20px;
}

.breadcrumb-nav span { cursor: pointer; transition: color 0.2s; }
.breadcrumb-nav span:hover { color: #38bdf8; }
.breadcrumb-nav .active { color: #fff; cursor: default; }

.course-title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.course-subtitle {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 32px;
  line-height: 1.6;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 40px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #cbd5e1;
}

.action-btn {
  padding: 14px 40px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* 主容器布局 */
.main-container {
  max-width: 1200px;
  margin: -40px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  position: relative;
  z-index: 2;
}

.content-wrapper {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

/* Tabs 优化 */
:deep(.custom-tabs .el-tabs__item) {
  font-size: 16px;
  font-weight: 600;
  height: 60px;
}

/* 章节列表美化 */
.chapter-group {
  margin-bottom: 32px;
}

.chapter-header {
  background: #f1f5f9;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chapter-index {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 800;
  color: #3b82f6;
  opacity: 0.5;
}

.chapter-name {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

.sub-chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 12px;
}

.sub-chapter-item:hover {
  background-color: #f8fafc;
  transform: translateX(4px);
}

.sub-chapter-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.type-icon { font-size: 20px; color: #3b82f6; }
.title-text { font-size: 15px; color: #475569; font-weight: 500; }

.sub-chapter-action {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 13px;
}

.sub-chapter-item:hover .sub-chapter-action {
  color: #3b82f6;
}

/* 详情介绍 */
.intro-section { margin-bottom: 40px; }
.intro-section h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1e293b;
}
.dot { width: 10px; height: 10px; background: #3b82f6; border-radius: 3px; }
.rich-text-content { line-height: 1.8; color: #475569; }

/* 侧边栏卡片 */
.sidebar { display: flex; flex-direction: column; gap: 24px; }
.sidebar-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.08) !important;
}

.status-card {
  background: linear-gradient(to bottom right, #fff, #f0f9ff);
  padding: 20px;
}
.progress-info .label { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #1e293b; }
.status-tip { font-size: 12px; color: #64748b; margin-top: 8px; }

.teacher-profile { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.teacher-meta .name { font-weight: 700; font-size: 17px; color: #1e293b; }
.teacher-meta .title { font-size: 13px; color: #64748b; margin-top: 2px; }
.teacher-bio { font-size: 14px; line-height: 1.6; color: #475569; padding-top: 12px; border-top: 1px solid #f1f5f9; }

.info-list { list-style: none; padding: 0; margin: 0; }
.info-list li {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.info-list li:last-child { border-bottom: none; }
.info-list .label { color: #64748b; font-size: 14px; }
.info-list .value { color: #1e293b; font-weight: 600; font-size: 14px; }

@media (max-width: 992px) {
  .banner-content { flex-direction: column; padding: 0 20px; }
  .banner-cover { width: 100%; height: auto; aspect-ratio: 16/9; }
  .main-container { grid-template-columns: 1fr; margin-top: 20px; }
}
</style>