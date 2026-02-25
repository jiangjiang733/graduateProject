<template>
  <div class="student-profile" :class="{ 'is-dark': isDark }">
    <!-- 顶部导航 -->
    <div class="profile-nav">
      <el-button text @click="$router.back()">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h2 class="profile-title">个人中心</h2>
    </div>

    <!-- 主要内容 -->
    <div class="profile-content">
      <el-row :gutter="24">
        <!-- 左侧个人信息卡片 -->
        <el-col :xs="24" :md="8">
          <div class="profile-card glass-card">
            <div class="avatar-section">
              <div class="avatar-ring">
                <el-avatar :size="96" :src="avatarUrl" :key="avatarTimestamp">
                  {{ (studentInfo.studentsUsername || studentInfo.studentName || 'S').charAt(0) }}
                </el-avatar>
              </div>
              <el-upload
                class="avatar-uploader"
                action=""
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
                accept="image/*"
              >
                <el-button type="primary" size="small" round :loading="avatarUploading">
                  <el-icon><Camera /></el-icon>
                  更换头像
                </el-button>
              </el-upload>
            </div>

            <div class="user-info-block">
              <h3 class="user-name">{{ studentInfo.studentsUsername || studentInfo.studentName }}</h3>
              <div class="user-id-tag">
                <el-icon><User /></el-icon>
                学号 {{ studentInfo.studentsId || studentInfo.studentId }}
              </div>
            </div>

            <div class="info-list">
              <div class="info-item">
                <div class="info-icon"><el-icon><Message /></el-icon></div>
                <div class="info-detail">
                  <span class="info-label">邮箱</span>
                  <span class="info-value">{{ studentInfo.studentsEmail || studentInfo.studentEmail || '未设置' }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><el-icon><School /></el-icon></div>
                <div class="info-detail">
                  <span class="info-label">专业</span>
                  <span class="info-value">{{ studentInfo.studentsMajor || studentInfo.studentMajor || '未设置' }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><el-icon><Calendar /></el-icon></div>
                <div class="info-detail">
                  <span class="info-label">年级</span>
                  <span class="info-value">{{ studentInfo.studentsGrade || studentInfo.studentGrade || '未设置' }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><el-icon><User /></el-icon></div>
                <div class="info-detail">
                  <span class="info-label">性别</span>
                  <span class="info-value">{{ studentInfo.studentSex || '保密' }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><el-icon><Calendar /></el-icon></div>
                <div class="info-detail">
                  <span class="info-label">生日</span>
                  <span class="info-value">{{ studentInfo.studentsBirthday || '未设置' }}</span>
                </div>
              </div>
            </div>

            <div class="action-buttons">
              <el-button type="primary" @click="showEditDialog" class="action-btn">
                <el-icon><Edit /></el-icon>
                编辑资料
              </el-button>
              <el-button @click="showPasswordDialog" class="action-btn action-btn-outline">
                <el-icon><Lock /></el-icon>
                修改密码
              </el-button>
            </div>
          </div>
        </el-col>

        <!-- 右侧内容区域 -->
        <el-col :xs="24" :md="16">
          <!-- 课程表模块 -->
          <div class="schedule-card glass-card">
            <div class="card-header-row">
              <div class="card-title-group">
                <el-icon class="card-icon" :size="20"><Tickets /></el-icon>
                <span class="card-title">我的课程表</span>
              </div>
              <div class="week-nav">
                <el-button :icon="ArrowLeft" circle size="small" @click="changeWeek(-1)" :disabled="currentWeek <= 1" />
                <span class="week-label">第 {{ currentWeek }} 周</span>
                <el-button :icon="ArrowRight" circle size="small" @click="changeWeek(1)" />
              </div>
            </div>

            <div v-loading="scheduleLoading" class="schedule-body">
              <template v-if="scheduleList.length > 0">
                <div class="schedule-grid">
                  <div class="schedule-header">
                    <div class="schedule-cell schedule-time-header">时间</div>
                    <div class="schedule-cell" v-for="day in 7" :key="day"
                         :class="{ 'today-header': isToday(day) }">
                      {{ getDayLabel(day) }}
                    </div>
                  </div>
                  <!-- 按节次/时段遍历 -->
                  <div class="schedule-row" v-for="slot in timeSlots" :key="slot.label">
                    <div class="schedule-cell schedule-time-cell">
                      <span class="slot-label">{{ slot.label }}</span>
                      <span class="slot-time">{{ slot.time }}</span>
                    </div>
                    <div class="schedule-cell" v-for="day in 7" :key="day"
                         :class="{ 'today-col': isToday(day) }">
                      <div v-if="getScheduleItem(day, slot.sectionStart, slot.sectionEnd)"
                           class="course-chip"
                           :style="{ background: getCourseColor(getScheduleItem(day, slot.sectionStart, slot.sectionEnd).courseName) }">
                        <span class="chip-name">{{ getScheduleItem(day, slot.sectionStart, slot.sectionEnd).courseName }}</span>
                        <span class="chip-location" v-if="getScheduleItem(day, slot.sectionStart, slot.sectionEnd).location">
                          📍 {{ getScheduleItem(day, slot.sectionStart, slot.sectionEnd).location }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="empty-schedule">
                <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
                <p class="empty-text">本周暂无课程安排</p>
              </div>
            </div>
          </div>

          <!-- 我的课程 -->
          <div class="enrollment-card glass-card">
            <div class="card-header-row">
              <div class="card-title-group">
                <el-icon class="card-icon" :size="20"><Reading /></el-icon>
                <span class="card-title">我的课程</span>
              </div>
              <el-button text type="primary" @click="$router.push('/student/courses')">
                查看更多 →
              </el-button>
            </div>

            <div v-if="enrollmentLoading" class="loading-skeleton">
              <el-skeleton :rows="3" animated />
            </div>

            <div v-else-if="myEnrollments.length === 0" class="empty-state-mini">
              <el-empty description="暂无报名记录" :image-size="80" />
            </div>

            <div v-else class="enrollment-list">
              <div 
                v-for="enrollment in displayedEnrollments" 
                :key="enrollment.id"
                class="enrollment-item"
                :class="{ 'clickable': enrollment.status === 'approved' }"
                @click="enrollment.status === 'approved' && goToLearn(enrollment.courseId)"
              >
                <div class="enrollment-info">
                  <div class="course-name-text">{{ enrollment.courseName }}</div>
                  <div class="apply-time-text">申请时间：{{ formatDate(enrollment.applyTime) }}</div>
                </div>
                <div class="enrollment-actions">
                  <el-tag 
                    :type="getStatusType(enrollment.status)"
                    size="default"
                    round
                  >
                    {{ getStatusText(enrollment.status) }}
                  </el-tag>
                  <el-button 
                    v-if="enrollment.status === 'approved'"
                    type="primary"
                    size="small"
                    round
                    @click.stop="goToLearn(enrollment.courseId)"
                  >
                    进入学习
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑个人资料"
      width="500px"
      :close-on-click-modal="false"
      class="profile-dialog"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="姓名" prop="studentsUsername">
          <el-input v-model="editForm.studentsUsername" placeholder="请输入姓名" disabled />
        </el-form-item>
        <el-form-item label="邮箱" prop="studentsEmail">
          <el-input v-model="editForm.studentsEmail" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="专业" prop="studentsMajor">
          <el-select v-model="editForm.studentsMajor" placeholder="请选择专业" style="width: 100%">
            <el-option label="计算机科学与技术" value="计算机科学与技术" />
            <el-option label="软件工程" value="软件工程" />
            <el-option label="信息安全" value="信息安全" />
            <el-option label="数据科学与大数据技术" value="数据科学与大数据技术" />
            <el-option label="人工智能" value="人工智能" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="studentsGrade">
          <el-input v-model="editForm.studentsGrade" placeholder="请输入年级" style="width: 100%" />
        </el-form-item>
        <el-form-item label="性别" prop="studentSex">
          <el-radio-group v-model="editForm.studentSex">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
            <el-radio label="保密">保密</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日" prop="studentsBirthday">
          <el-date-picker
            v-model="editForm.studentsBirthday"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting" round>保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
      :close-on-click-modal="false"
      class="profile-dialog"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="submitPassword" :loading="submitting" round>确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { 
  Back, Camera, Message, School, Calendar, Edit, Lock, User,
  Tickets, ArrowLeft, ArrowRight, Reading, Document
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useStudentProfile } from '@/assets/js/student/profile.js'
import { useSettingsStore } from '@/stores/settings.js'

const settingsStore = useSettingsStore()

// 响应式暗黑模式检测
const isDark = computed(() => settingsStore.theme === 'dark')

const {
  studentInfo,
  avatarUrl,
  avatarTimestamp,
  avatarUploading,
  enrollmentLoading,
  submitting,
  editDialogVisible,
  passwordDialogVisible,
  myEnrollments,
  scheduleList,
  scheduleLoading,
  currentWeek,
  editForm,
  editRules,
  editFormRef,
  passwordForm,
  passwordRules,
  passwordFormRef,
  beforeAvatarUpload,
  uploadAvatar,
  showEditDialog,
  showPasswordDialog,
  submitEdit,
  submitPassword,
  getStatusType,
  getStatusText,
  formatDate,
  goToLearn,
  changeWeek,
  getDayLabel
} = useStudentProfile()

// 课程表时间段定义
// startSection / endSection 对应数据库中的 start_section / end_section
const timeSlots = [
  { label: '第1-2节',  sectionStart: 1, sectionEnd: 2 },
  { label: '第3-4节',  sectionStart: 3, sectionEnd: 4 },
  { label: '第5-6节',  sectionStart: 5, sectionEnd: 6 },
  { label: '第7-8节', sectionStart: 7, sectionEnd: 8 },
  { label: '第9-10节', sectionStart: 9, sectionEnd: 10 },
]

/**
 * 获取对应位置的课程
 * 匹配逻辑：课程的 dayOfWeek 等于 day，且课程节次范围与 slot 节次范围有交集
 */
const getScheduleItem = (day, slotStart, slotEnd) => {
  return scheduleList.value.find(s => {
    const sDay = s.dayOfWeek || s.day
    const sStart = s.startSection || s.start_section || 1
    const sEnd = s.endSection || s.end_section || sStart
    // 判断节次是否有交集
    return sDay === day && sStart <= slotEnd && sEnd >= slotStart
  }) || null
}

// 判断今天是周几
const isToday = (day) => {
  const today = new Date().getDay()
  const mapped = today === 0 ? 7 : today
  return mapped === day
}

// 课程颜色映射 - 蓝白色系
const courseColorMap = {}
const courseColors = [
  'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
]
let colorIndex = 0

const getCourseColor = (courseName) => {
  if (!courseName) return courseColors[0]
  if (!courseColorMap[courseName]) {
    courseColorMap[courseName] = courseColors[colorIndex % courseColors.length]
    colorIndex++
  }
  return courseColorMap[courseName]
}

// 控制最多显示4条课程
const displayedEnrollments = computed(() => {
  return myEnrollments.value.slice(0, 4)
})
</script>

<style scoped>
/* ============================================
   SaaS 风格学生个人中心 - 蓝白配色 + 暗黑模式
   ============================================ */

.student-profile {
  padding: 24px 28px;
  min-height: 100vh;
  background: #f0f4f8;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  transition: background .3s ease, color .3s ease;
  color: #1e293b;
}

/* ---- 顶部导航 ---- */
.profile-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 14px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  border: 1px solid rgba(0,0,0,.05);
  transition: all .3s ease;
}

.profile-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  transition: color .3s ease;
}

/* ---- 毛玻璃卡片 ---- */
.glass-card {
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 4px 24px rgba(0,0,0,.05);
  padding: 24px;
  margin-bottom: 20px;
  transition: all .3s ease;
}
.glass-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,.09);
}

/* ---- 头像区域 ---- */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  transition: border-color .3s ease;
}
.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-ring .el-avatar {
  border: 3px solid #fff;
}
.avatar-uploader {
  margin-top: 14px;
}

/* ---- 用户信息 ---- */
.user-info-block {
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid #e2e8f0;
  transition: border-color .3s ease;
}
.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
  transition: color .3s ease;
}
.user-id-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  transition: all .3s ease;
}

/* ---- 信息列表 ---- */
.info-list {
  padding: 16px 0;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}
.info-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #3b82f6;
  font-size: 16px;
  transition: all .3s ease;
}
.info-detail {
  display: flex;
  flex-direction: column;
}
.info-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 2px;
  transition: color .3s ease;
}
.info-value {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  transition: color .3s ease;
}

/* ---- 操作按钮 ---- */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  transition: border-color .3s ease;
}
.action-btn {
  width: 100%;
  border-radius: 12px;
  height: 40px;
  font-weight: 600;
}
.action-btn-outline {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #334155;
  transition: all .3s ease;
}
.action-btn-outline:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

/* ---- 卡片公共标题行 ---- */
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.card-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-icon {
  color: #3b82f6;
}
.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  transition: color .3s ease;
}

/* ---- 课程表 ---- */
.week-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}
.week-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  min-width: 70px;
  text-align: center;
  transition: color .3s ease;
}

.schedule-grid {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: border-color .3s ease;
}
.schedule-header {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
}
.schedule-header .schedule-cell {
  background: #f8fafc;
  font-weight: 600;
  font-size: 13px;
  color: #334155;
  text-align: center;
  padding: 10px 4px;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  transition: all .3s ease;
}
.schedule-header .schedule-cell:last-child { border-right: none; }
.schedule-header .today-header {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
}

.schedule-row {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
}
.schedule-time-header {
  font-size: 12px !important;
}
.schedule-time-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 4px;
  transition: all .3s ease;
}
.slot-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  transition: color .3s ease;
}
.slot-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
  transition: color .3s ease;
}

.schedule-cell {
  min-height: 70px;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 4px;
  position: relative;
  transition: all .3s ease;
}
.schedule-cell:last-child { border-right: none; }
.today-col {
  background: rgba(59, 130, 246, .04);
}

.course-chip {
  border-radius: 8px;
  padding: 6px 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-height: 62px;
  color: #fff;
  cursor: default;
  transition: transform .15s ease;
}
.course-chip:hover {
  transform: scale(1.03);
}
.chip-name {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.chip-location {
  font-size: 10px;
  opacity: .85;
}

.empty-schedule {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 12px;
}
.empty-text {
  font-size: 14px;
  color: #94a3b8;
}

/* ---- 课程列表 ---- */
.enrollment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.enrollment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all .25s ease;
  border: 1px solid transparent;
}
.enrollment-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}
.enrollment-item.clickable {
  cursor: pointer;
}
.enrollment-item.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,.06);
  border-color: #93c5fd;
}

.enrollment-info { flex: 1; }
.course-name-text {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  transition: color .3s ease;
}
.apply-time-text {
  font-size: 12px;
  color: #94a3b8;
  transition: color .3s ease;
}
.enrollment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-skeleton {
  padding: 16px 0;
}
.empty-state-mini {
  padding: 24px 0;
}

/* ============================================
   暗黑模式 - 通过 .is-dark class 响应式切换
   ============================================ */
.student-profile.is-dark {
  background: #0f172a;
  color: #e2e8f0;
}
.is-dark .profile-nav {
  background: rgba(30, 41, 59, .9);
  border-color: rgba(255,255,255,.06);
}
.is-dark .profile-title {
  color: #f1f5f9;
}
.is-dark .glass-card {
  background: rgba(30, 41, 59, .85);
  border-color: rgba(255,255,255,.08);
  box-shadow: 0 4px 24px rgba(0,0,0,.3);
}
.is-dark .glass-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}
.is-dark .avatar-section,
.is-dark .user-info-block,
.is-dark .action-buttons {
  border-color: rgba(255,255,255,.08);
}
.is-dark .avatar-ring .el-avatar {
  border-color: #1e293b;
}
.is-dark .user-name {
  color: #f1f5f9;
}
.is-dark .user-id-tag {
  background: rgba(255,255,255,.06);
  color: #94a3b8;
}
.is-dark .info-icon {
  background: linear-gradient(135deg, rgba(59,130,246,.2), rgba(59,130,246,.1));
  color: #60a5fa;
}
.is-dark .info-label {
  color: #64748b;
}
.is-dark .info-value {
  color: #cbd5e1;
}
.is-dark .card-title {
  color: #f1f5f9;
}
.is-dark .week-label {
  color: #cbd5e1;
}
.is-dark .action-btn-outline {
  border-color: rgba(255,255,255,.15);
  color: #cbd5e1;
}
.is-dark .action-btn-outline:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}

/* 课程表暗黑 */
.is-dark .schedule-grid {
  border-color: rgba(255,255,255,.08);
}
.is-dark .schedule-header .schedule-cell {
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.08);
  color: #cbd5e1;
}
.is-dark .schedule-header .today-header {
  background: rgba(59,130,246,.15);
  color: #60a5fa;
}
.is-dark .schedule-time-cell {
  background: rgba(255,255,255,.03);
  border-color: rgba(255,255,255,.08);
}
.is-dark .slot-label {
  color: #cbd5e1;
}
.is-dark .slot-time {
  color: #64748b;
}
.is-dark .schedule-cell {
  border-color: rgba(255,255,255,.08);
}
.is-dark .today-col {
  background: rgba(59,130,246,.06);
}

/* 课程列表暗黑 */
.is-dark .enrollment-item {
  background: rgba(255,255,255,.04);
}
.is-dark .enrollment-item:hover {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.12);
}
.is-dark .enrollment-item.clickable:hover {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(0,0,0,.3);
}
.is-dark .course-name-text {
  color: #f1f5f9;
}
.is-dark .apply-time-text {
  color: #64748b;
}
.is-dark .empty-text {
  color: #64748b;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .student-profile { padding: 12px; }
  .profile-nav { padding: 10px 16px; }
  .profile-title { font-size: 17px; }
  .schedule-grid { font-size: 11px; }
  .schedule-row { grid-template-columns: 70px repeat(7, 1fr); }
  .schedule-header { grid-template-columns: 70px repeat(7, 1fr); }
  .schedule-cell { min-height: 54px; padding: 2px; }
  .course-chip { padding: 4px; min-height: 50px; }
  .chip-name { font-size: 10px; }
  .chip-location { font-size: 9px; }
  .enrollment-item { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
