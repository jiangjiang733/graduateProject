<template>
  <div class="student-profile">
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
      <el-row :gutter="20">
        <!-- 左侧个人信息卡片 -->
        <el-col :xs="24" :md="8">
          <el-card class="profile-card" shadow="hover">
            <div class="avatar-section">
              <el-avatar :size="100" :src="avatarUrl">
                {{ (studentInfo.studentsUsername || studentInfo.studentName || 'S').charAt(0) }}
              </el-avatar>
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

            <div class="user-info">
              <h3 class="user-name">{{ studentInfo.studentsUsername || studentInfo.studentName }}</h3>
              <div class="user-id">学号：{{ studentInfo.studentsId || studentInfo.studentId }}</div>
            </div>

            <div class="info-list">
              <div class="info-item">
                <el-icon><Message /></el-icon>
                <span>{{ studentInfo.studentsEmail || studentInfo.studentEmail || '未设置邮箱' }}</span>
              </div>
              <div class="info-item">
                <el-icon><School /></el-icon>
                <span>{{ studentInfo.studentsMajor || studentInfo.studentMajor || '未设置专业' }}</span>
              </div>
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ studentInfo.studentsGrade || studentInfo.studentGrade || '未设置年级' }}</span>
              </div>
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span>{{ studentInfo.studentSex || '保密' }}</span>
              </div>
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ studentInfo.studentsBirthday || '未设置生日' }}</span>
              </div>
            </div>

            <div class="action-buttons">
              <el-button type="primary" @click="showEditDialog" block>
                <el-icon><Edit /></el-icon>
                编辑资料
              </el-button>
              <el-button @click="showPasswordDialog" block>
                <el-icon><Lock /></el-icon>
                修改密码
              </el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧内容区域 -->
        <el-col :xs="24" :md="16">
          <!-- 学习统计 -->
          <el-card class="stats-card" shadow="hover">
            <template #header>
              <span class="card-title">学习统计</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="已报名课程" :value="statistics.enrolledCourses" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="学习中课程" :value="statistics.learningCourses" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="已完成课程" :value="statistics.completedCourses" />
              </el-col>
            </el-row>
          </el-card>

          <!-- 我的报名 -->
          <el-card class="enrollment-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">我的报名</span>
                <el-button text type="primary" @click="$router.push('/student/courses')">
                  查看更多
                </el-button>
              </div>
            </template>
            
            <div v-if="enrollmentLoading" class="loading-skeleton">
              <el-skeleton :rows="3" animated />
            </div>

            <div v-else-if="myEnrollments.length === 0" class="empty-state">
              <el-empty description="暂无报名记录" :image-size="100" />
            </div>

            <div v-else class="enrollment-list">
              <div 
                v-for="enrollment in myEnrollments" 
                :key="enrollment.id"
                class="enrollment-item"
                :class="{ 'clickable': enrollment.status === 'approved' }"
                @click="enrollment.status === 'approved' && goToLearn(enrollment.courseId)"
              >
                <div class="enrollment-info">
                  <div class="course-name">{{ enrollment.courseName }}</div>
                  <div class="apply-time">申请时间：{{ formatDate(enrollment.applyTime) }}</div>
                </div>
                <div class="enrollment-actions">
                  <el-tag 
                    :type="getStatusType(enrollment.status)"
                    size="large"
                  >
                    {{ getStatusText(enrollment.status) }}
                  </el-tag>
                  <el-button 
                    v-if="enrollment.status === 'approved'"
                    type="primary"
                    size="small"
                    @click.stop="goToLearn(enrollment.courseId)"
                  >
                    进入学习
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑个人资料"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="学号">
          <el-input v-model="editForm.studentsId" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="studentsUsername">
          <el-input v-model="editForm.studentsUsername" placeholder="请输入姓名" />
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
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="studentsGrade">
          <el-select v-model="editForm.studentsGrade" placeholder="请选择年级" style="width: 100%">
            <el-option label="2021级" value="2021级" />
            <el-option label="2022级" value="2022级" />
            <el-option label="2023级" value="2023级" />
            <el-option label="2024级" value="2024级" />
          </el-select>
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
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting">
          保存
        </el-button>
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
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { 
  Back, Camera, Message, School, Calendar, Edit, Lock, User 
} from '@element-plus/icons-vue'
import { useStudentProfile } from '@/assets/js/student/profile.js'

const {
  studentInfo,
  avatarUrl,
  avatarUploading,
  enrollmentLoading,
  submitting,
  editDialogVisible,
  passwordDialogVisible,
  myEnrollments,
  statistics,
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
  goToLearn
} = useStudentProfile()
</script>

<style scoped>
@import '@/assets/css/student/profile.css';
</style>
