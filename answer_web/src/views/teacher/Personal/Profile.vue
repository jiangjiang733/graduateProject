<template>
  <div class="profile-container modern-page">
    <div class="profile-layout-wrapper">

      <div class="profile-hero-banner premium-card p-0 overflow-hidden">
        <div class="banner-top-bg"></div>
        <div class="hero-content">
          <div class="hero-avatar-wrapper">
            <el-avatar :size="120" shape="square" class="hero-avatar" :src="avatarUrl">
              <el-icon :size="40"><User /></el-icon>
            </el-avatar>
            <el-upload
              class="avatar-overlay-uploader"
              action=""
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="uploadAvatar"
              accept="image/*"
            >
              <div class="avatar-camera-btn" v-loading="avatarUploading">
                <el-icon><Camera /></el-icon>
              </div>
            </el-upload>
          </div>
          <div class="hero-user-info">
            <div class="hero-name-row">
              <h2 class="hero-name">{{ profileData.teacherUsername || form.name }}</h2>
              <span class="hero-level">{{ profileData.teacherLevel || form.level || '' }}</span>
            </div>
            <div class="hero-meta">
              <el-icon><Location /></el-icon>
              {{ profileData.teacherDepartment || form.department || '院系未填写' }}
            </div>
          </div>
          <div class="hero-actions">
             <!-- <el-button type="primary" class="hero-btn-primary" @click="handleEdit">编辑个人资料</el-button> -->
             <el-button class="hero-btn-default" @click="handleChangePassword">修改账号密码</el-button>
          </div>
        </div>
      </div>

      <!-- 下方功能区：非对称布局 -->
      <div class="profile-main-grid">
        
        <!-- 左侧核心区 -->
        <div class="main-content-col">
          <div class="premium-card profile-schedule-card">
            <div class="card-header border-b-0">
              <div class="header-title">
                <el-icon class="feature-icon text-blue-500"><Calendar /></el-icon>
                <span>课程表</span>
              </div>
              
            </div>
            
            <div class="card-body px-6 pb-6 pt-2">
              <div class="schedule-list-group" v-loading="loading">
                <template v-if="paginatedCourseData && paginatedCourseData.length > 0">
                  <div 
                    v-for="(course, index) in paginatedCourseData" 
                    :key="index"
                    class="schedule-list-item"
                  >
                    <div class="item-indicator bg-blue-500"></div>
                    <div class="item-content">
                      <div class="item-title-row">
                        <span class="item-title">{{ course.courseName }}</span>
                      </div>
                      <div class="item-meta-row text-sm mt-1">
                        <span class="meta-icon-text text-gray-400 mr-4">
                          <el-icon><Clock /></el-icon> {{ course.courseTime }}
                        </span>
                        <span class="meta-icon-text text-orange-400">
                          <el-icon><Location /></el-icon> {{ course.courseLocation }}
                        </span>
                      </div>
                    </div>
                    <div class="item-action">
                      <el-icon class="text-gray-300"><ArrowRight /></el-icon>
                    </div>
                  </div>
                </template>
                <el-empty v-else description="暂无排课记录" :image-size="80" />
              </div>
              
              <div class="pagination-container pagination-outside mt-6" v-if="totalCourses > 0">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[5, 10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="totalCourses"
                  class="premium-pagination"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧设置区 -->
        <div class="main-side-col">
          <div class="premium-card">
            <div class="card-header">
              <div class="header-title">安全与支持</div>
            </div>
            <div class="card-body p-0">
               <div class="settings-list-group">
                 <div class="list-group-item">
                   <div class="item-icon-wrapper bg-blue-50">
                     <el-icon color="#3b82f6"><Message /></el-icon>
                   </div>
                   <div class="item-content">
                     <div class="item-title">账号邮箱</div>
                     <div class="item-desc">{{ profileData.teacherEmail || form.email || '未绑定' }}</div>
                   </div>
                 </div>
                 
                 <div class="list-group-item cursor-pointer" @click="handleChangePassword">
                   <div class="item-icon-wrapper bg-orange-50">
                     <el-icon color="#f97316"><Lock /></el-icon>
                   </div>
                   <div class="item-content">
                     <div class="item-title">修改密码</div>
                     <div class="item-desc">定期修改密码保护安全</div>
                   </div>
                   <el-icon class="item-arrow"><ArrowRight /></el-icon>
                 </div>
                 
                 <div class="list-group-item cursor-pointer" @click="handleEdit">
                   <div class="item-icon-wrapper bg-green-50">
                     <el-icon color="#10b981"><UserFilled /></el-icon>
                   </div>
                   <div class="item-content">
                     <div class="item-title">修改信息</div>
                     <div class="item-desc">院系：{{ profileData.teacherDepartment || '未填写' }}</div>
                   </div>
                   <el-icon class="item-arrow"><ArrowRight /></el-icon>
                 </div>
               </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog 
      v-model="dialogFormVisible" 
      title="个人信息修改" 
      width="500px"
      :close-on-click-modal="false"
      class="glass-dialog"
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
      class="glass-dialog"
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
</template>

<script setup>
import { Edit, Lock, User, Calendar, Message, OfficeBuilding, Star, Back, Camera, Location, Clock, ArrowRight, UserFilled, StarFilled } from '@element-plus/icons-vue'
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
  handleChangePassword,
  currentPage,
  pageSize,
  totalCourses,
  paginatedCourseData
} = useProfile()
</script>

<style scoped>
@import '@/assets/css/teacher/profile.css';
</style>
