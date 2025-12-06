<template>
  <div class="tProfile-fullscreen">
    <!-- 顶部导航栏 -->
    <div class="tProfile-nav">
      <RouterLink to="/teacher/dashboard" class="return-btn">
        <el-icon><Back /></el-icon>
        返回首页
      </RouterLink>
      <h2 class="profile-title">个人中心</h2>
    </div>

    <!-- 主要内容区域 -->
    <div class="tProfile-content">
      <!-- 个人资料卡片 -->
      <div class="tProfile-card">
        <div class="avatar-section">
          <el-avatar :size="80" class="user-avatar" :src="avatarUrl">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-info">
            <h3 class="user-name">{{ profileData.teacherUsername || form.name }}</h3>
            <el-upload
              class="avatar-uploader"
              action=""
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="uploadAvatar"
              accept="image/*"
            >
              <el-button type="primary" size="small" :loading="avatarUploading">
                <el-icon><Camera /></el-icon>
                更换头像
              </el-button>
            </el-upload>
          </div>
        </div>

        <!-- 个人信息 -->
        <div class="info-section">
          <div class="info-item">
            <el-icon class="info-icon"><Message /></el-icon>
            <span class="info-label">邮箱：</span>
            <span class="info-value">{{ profileData.teacherEmail || form.email }}</span>
          </div>
          <div class="info-item">
            <el-icon class="info-icon"><OfficeBuilding /></el-icon>
            <span class="info-label">院系：</span>
            <span class="info-value">{{ profileData.teacherDepartment || form.department || '未填写' }}</span>
          </div>
          <div class="info-item">
            <el-icon class="info-icon"><Star /></el-icon>
            <span class="info-label">级别：</span>
            <span class="info-value">{{ profileData.teacherLevel || form.level || '未填写' }}</span>
          </div>
        </div>

        <!-- 课程表 -->
        <div class="tProfile-course-section">
          <h3 class="section-title">我的课程</h3>
          <div class="course-table">
            <el-table :data="courseData" style="width: 100%" stripe border v-loading="loading">
              <el-table-column prop="courseName" label="课程名称" min-width="180" />
              <el-table-column prop="courseTime" label="上课时间" min-width="180" />
              <el-table-column prop="courseLocation" label="上课地点" min-width="200" />
              <el-table-column prop="courseStudent" label="选课人数" width="100" align="center" />
            </el-table>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="edit-btn">
          <el-button type="primary" @click="handleEdit">
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
          <el-button @click="handleChangePassword">
            <el-icon><Lock /></el-icon>
            修改密码
          </el-button>
        </div>
        
        <!-- 编辑资料对话框 -->
        <el-dialog 
          v-model="dialogFormVisible" 
          title="个人信息修改" 
          width="500px"
          :close-on-click-modal="false"
        >
          <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="用户名" prop="name">
              <el-input v-model="form.name" disabled />
            </el-form-item>
            <el-form-item label="院系" prop="department">
              <el-select v-model="form.department" placeholder="请选择你的院系" style="width: 100%">
                <el-option label="信息科学与技术学院" value="信息科学与技术学院" />
                <el-option label="国际商务学院" value="国际商务学院" />
                <el-option label="法学院" value="法学院" />
                <el-option label="机械制造学院" value="机械制造学院" />
              </el-select>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入你的邮箱" style="width: 60%" />
              <el-button 
                type="primary" 
                :disabled="isCounting" 
                @click="getVerificationCode"
                style="margin-left: 10px; width: 110px"
              >
                {{ isCounting ? `重新获取(${countdown}s)` : '获取验证码' }}
              </el-button>
            </el-form-item>
            <el-form-item label="验证码" prop="verificationCode">
              <el-input 
                v-model="form.verificationCode" 
                placeholder="请输入6位验证码"
                maxlength="6"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="级别" prop="level">
              <el-select v-model="form.level" placeholder="请选择你的级别" style="width: 100%">
                <el-option label="教授" value="教授" />
                <el-option label="副教授" value="副教授" />
                <el-option label="讲师" value="讲师" />
                <el-option label="普通教师" value="普通教师" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogFormVisible = false">取消</el-button>
              <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 修改密码对话框 -->
        <el-dialog 
          v-model="passwordDialogVisible" 
          title="修改密码" 
          width="500px"
          :close-on-click-modal="false"
        >
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input 
                v-model="passwordForm.oldPassword" 
                type="password" 
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input 
                v-model="passwordForm.newPassword" 
                type="password" 
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="passwordDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="submitPasswordChange" :loading="passwordLoading">确定</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Edit, Lock, User, Calendar, Message, OfficeBuilding, Star, Back, Camera } from '@element-plus/icons-vue'
import { useProfile } from '@/assets/js/teacher/profile.js'

const {
  profileData,
  dialogFormVisible,
  form,
  formRef,
  countdown,
  isCounting,
  loading,
  submitLoading,
  courseData,
  getVerificationCode,
  submitForm,
  rules,
  avatarUploading,
  avatarUrl,
  beforeAvatarUpload,
  uploadAvatar,
  passwordDialogVisible,
  passwordLoading,
  passwordForm,
  passwordFormRef,
  passwordRules,
  submitPasswordChange,
  handleEdit,
  handleChangePassword
} = useProfile()
</script>

<style scoped>
@import '@/assets/css/teacher/profile.css';
</style>
