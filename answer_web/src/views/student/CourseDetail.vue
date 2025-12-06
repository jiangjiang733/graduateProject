<template>
  <div class="course-detail-page" v-loading="loading">
    <!-- 顶部 Banner -->
    <div class="course-banner">
      <div class="banner-content">
        <div class="banner-cover">
          <img :src="course.image" :alt="course.courseName">
        </div>
        <div class="banner-info">
          <h1 class="course-title">{{ course.courseName }}</h1>
          <p class="course-subtitle">{{ course.courseDescription || '暂无简介' }}</p>
          
          <div class="course-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ course.teacherName || '未知教师' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><StarFilled /></el-icon>
            </div>
            <div class="meta-item">
              <el-icon><Reading /></el-icon>
              <span>{{ chapters.length }} 章节</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-container">
      <!-- 左侧内容 -->
      <div class="content-wrapper">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="课程介绍" name="intro">
            <div class="course-intro">
              <h3>课程详情</h3>
              <p>{{ course.courseDescription || '暂无详细介绍' }}</p>
              <!-- 这里可以渲染富文本内容 -->
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="章节目录" name="chapters">
            <div class="chapter-list">
              <div v-for="chapter in chapters" :key="chapter.id" class="chapter-item">
                <div class="chapter-header">
                  {{ chapter.title }}
                </div>
                <div class="sub-chapter-list">
                  <div 
                    v-for="sub in chapter.children" 
                    :key="sub.id" 
                    class="sub-chapter-item"
                  >
                    <div class="sub-chapter-title">
                      <el-icon v-if="sub.type === 'VIDEO'"><VideoPlay /></el-icon>
                      <el-icon v-else-if="sub.type === 'PDF'"><Document /></el-icon>
                      <el-icon v-else><Reading /></el-icon>
                      {{ sub.title }}
                    </div>
                    <el-tag size="small" type="info">未开始</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="学员评价" name="comments">
            <el-empty description="暂无评价" />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 右侧侧边栏 -->
      <div class="sidebar">
        <el-card class="enroll-card" shadow="hover">
          <div class="price-tag" :class="{ free: !course.price }">
            {{ course.price ? `¥${course.price}` : '免费' }}
          </div>
          <el-button 
            v-if="!isEnrolled"
            type="primary" 
            class="enroll-btn" 
            @click="handleEnroll"
          >
            加入课程
          </el-button>
          <el-button 
            v-else
            type="success" 
            class="enroll-btn" 
            @click="startLearning"
          >
            继续学习
          </el-button>
        </el-card>

        <el-card class="teacher-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>授课教师</span>
            </div>
          </template>
          <div class="teacher-info">
            <el-avatar :size="50" :src="course.teacherAvatar " />
            <div>
              <div style="font-weight: 600;">{{ course.teacherName }}</div>
            </div>
          </div>
          <div class="teacher-desc">
            拥有丰富的教学经验，深受学生喜爱。
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { User, StarFilled, Reading, VideoPlay, Document } from '@element-plus/icons-vue'
import { useCourseDetail } from '@/assets/js/student/course-detail.js'
const {
  course,
  chapters,
  activeTab,
  loading,
  isEnrolled,
  handleEnroll,
  startLearning
} = useCourseDetail()
</script>

<style scoped>
@import '@/assets/css/student/course-detail.css';
</style>
