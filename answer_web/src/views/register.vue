<script setup>
import { ref } from 'vue'
import { useRegisterStore } from '../stores/register.js'
import "../assets/css/index/register.css"
import ImageCaptcha from '../components/ImageCaptcha.vue'
import { ElMessage } from 'element-plus'

// 使用注册store
const {
  activeTab,
  forms,
  countdown,
  isSending,
  loading,
  registerFormRef,
  resetForm,
  getVerificationCode,
  register: storeRegister,
  setActiveTab
} = useRegisterStore()

const captchaRef = ref(null)

// 包装注册函数以验证图形验证码
const register = () => {
  if (!forms.imageCaptcha) {
    ElMessage.warning('请输入图形验证码')
    return
  }
  
  if (!captchaRef.value.validate(forms.imageCaptcha)) {
    ElMessage.error('图形验证码错误')
    captchaRef.value.refreshCaptcha()
    forms.imageCaptcha = ''
    return
  }
  
  storeRegister()
}
</script>

<template>
  <div class="register-component">
    <div class="register-form-section">
      <div class="tab-buttons">
        <el-button 
          :class="{ active: activeTab === 'teacher' }" 
          @click="setActiveTab('teacher')"
        >我是教师</el-button>
        <el-button 
          :class="{ active: activeTab === 'student' }" 
          @click="setActiveTab('student')"
        >我是学生</el-button>
      </div>
      <el-form 
        ref="registerFormRef"
        :model="forms" 
        label-position="top" 
        class="centered-form"
        status-icon
      >
        <el-form-item label="" prop="username">
          <el-input 
            placeholder="请输入工号/学号" 
            v-model="forms.username"
            class="centered-input"
          ></el-input>
        </el-form-item>
          <el-form-item label="" prop="password">
          <el-input 
            placeholder="请输入密码" 
            v-model="forms.password" 
            type="password"
            class="centered-input"
          ></el-input>
        </el-form-item>
        <el-form-item label="" prop="email">
          <el-input 
            placeholder="请输入邮箱地址" 
            v-model="forms.email"
            class="centered-input"
          >
            <template #append>
              <el-button 
                :disabled="isSending || countdown > 0" 
                @click="getVerificationCode"
                class="code-btn"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="" prop="confirm_code">
          <el-input 
            placeholder="请输入邮箱验证码" 
            v-model="forms.confirm_code" 
            maxlength="6"
            class="centered-input"
          ></el-input>
        </el-form-item>
        
        <!-- 图形验证码 -->
        <el-form-item label="" prop="imageCaptcha">
          <div class="captcha-row">
            <el-input 
              placeholder="请输入图形验证码" 
              v-model="forms.imageCaptcha" 
              maxlength="4"
              class="captcha-input"
            ></el-input>
            <ImageCaptcha ref="captchaRef" :width="110" :height="40" />
          </div>
        </el-form-item>
        
        <!-- 教师特有字段 -->
        <el-form-item v-if="activeTab === 'teacher'" label="" prop="department">
          <el-input 
            placeholder="请输入院系" 
            v-model="forms.department"
            class="centered-input"
          ></el-input>
        </el-form-item>
        <el-form-item v-if="activeTab === 'teacher'" label="" prop="level">
          <el-select 
            v-model="forms.level" 
            placeholder="请选择职级"
            class="centered-input"
            style="width: 100%"
          >
            <el-option label="助教" value="助教" />
            <el-option label="讲师" value="讲师" />
            <el-option label="副教授" value="副教授" />
            <el-option label="教授" value="教授" />
          </el-select>
        </el-form-item>
        <el-form-item class="button-group">
          <el-button 
            type="success" 
            class="register-btn" 
            @click="register"
            :loading="loading"
            :disabled="loading"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
          <el-button 
            class="reset-btn" 
            @click="resetForm"
            :disabled="loading"
          >重置</el-button>
        </el-form-item>
        <el-form-item class="forgot-password">
          <RouterLink to="/forgotPassword" class="forgot">忘记密码?</RouterLink>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>




