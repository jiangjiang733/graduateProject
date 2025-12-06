<script setup lang="ts">
import '../assets/css/index/index.css'
import { useRouter } from 'vue-router'
const router = useRouter()
const handleTeacherLogin = () => {
  // 通过路由状态传递角色信息，URL中不显示参数
  router.push({
    name: 'login',
    state: { role: 'teacher' }
  })
}

const handleStudentLogin = () => {
  // 路由隐藏
  router.push({
    name: 'login',
    state: { role: 'student' }
  })
}

const handleRegister = () => {
  router.push('/register')
}
function status(){
  const status=localStorage.getItem('status')
  console.log(status.valueOf())
  return status;
}

</script>

<template>
  <div class="index-container">
    <!-- 顶部导航栏 -->
    <el-header class="index-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo">
            <span class="logo-highlight">TEACHING</span> Service Platform
          </div>
        </div>
        <div class="header-right" >
          <el-button  class="register-btn" v-if="status()==='false'"
                     style="background:black;color: white" @click="handleRegister">
<!--            判断是否为登录状态-->
            快速注册
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-main class="index-main">
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title"><b style="color: #2653FF">智慧教学</b>服务平台</h1>
            <p class="hero-subtitle">线上线下一体化教学解决方案</p>
            <div class="hero-features">
              <div class="feature-item">
                <span>在线授课</span>
              </div>
              <div class="feature-item">
                <span>课程管理</span>
              </div>
              <div class="feature-item">
                <span>学习分析</span>
              </div>
            </div>
          </div>
          <div class="login-section" >
            <el-button class="dashboard-btn" @click="router.push('/tIndex')" v-if="status()==='true'">
              <el-icon><i class="el-icon-monitor"></i></el-icon>
              进入工作台
            </el-button>
            <div class="login-card"  v-else>
              <h3>选择登录方式</h3>
              <div class="login-buttons">
                <el-button class="teacher-login-btn"
                 style="color:white;background: #2a2e3a;border-radius:30px" @click="handleTeacherLogin">
                  教师登录
                </el-button>
                <el-button class="student-login-btn"
                 style="background:transparent;border-radius:30px" @click="handleStudentLogin">
                  学生登录
                </el-button>
              </div>
              <p class="login-tip">首次使用？点击上方"免费注册"创建账户</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 特色功能展示 -->
      <div class="features-section">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <img src="../assets/img/head01.png" alt="教师图片" srcset="">
            </div>
            <h4>教师</h4>
            <p>实时跟进学生动态</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
                <img src="../assets/img/head3.png" alt="资源管理图片">
            </div>
            <h4>资源管理</h4>
            <p>统一管理教学资料、课件和作业，随时随地访问</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <img src="../assets/img/header2.png" alt="数据分析图片" srcset="">
            </div>
            <h4>数据分析</h4>
            <p>智能分析学习数据，提供个性化学习建议</p>
          </div>
        </div>
      </div>

      <!-- 快速开始引导区域 -->
      <div class="quick-start-section">
        <div class="quick-start-content">
          <div class="quick-start-text">
            <h2>立即开始您的学习之旅</h2>
            <p>无论您是教师还是学生，我们的平台都能为您提供最佳的在线教学体验</p>
            <div class="quick-start-features">
              <div class="quick-feature">
                <span>视频授课</span>
              </div>
              <div class="quick-feature">
                <span>实时互动</span>
              </div>
              <div class="quick-feature">
                <span>智能学习</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </el-main>
  </div>
</template>