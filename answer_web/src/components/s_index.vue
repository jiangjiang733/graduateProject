<script setup lang="ts">
import '../assets/css/student/sIndex.css'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 退出登录
const handleLogout = () => {
  // 清除所有localStorage数据
  localStorage.removeItem('userId')
  localStorage.removeItem('studentId')
  localStorage.removeItem('userName')
  localStorage.removeItem('studentName')
  localStorage.removeItem('user')
  localStorage.setItem('status', 'false')
  
  ElMessage.success('退出登录成功')
  router.push('/')
}
</script>

<template>
  <div class="sIndex-root">
    <el-container>
      <el-header class="sIndex-appbar">
        <div class="sIndex-brand">
          <i class="el-icon-graduation"></i>
          <span>智慧学习平台</span>
        </div>
        <el-menu mode="horizontal" :default-active="$route.path" class="sIndex-nav" router>
          <el-menu-item index="/student/dashboard">主页</el-menu-item>
          <el-menu-item index="/student/courses">课程中心</el-menu-item>
          <el-menu-item index="/student/schedule">我的课程表</el-menu-item>
          <el-menu-item index="/student/homework">我的作业</el-menu-item>
          <el-menu-item index="/student/profile">个人中心</el-menu-item>
        </el-menu>
        <div class="sIndex-user">
          <el-button text icon="el-icon-bell"></el-button>
          <el-avatar size="small">李</el-avatar>
          <el-button type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <div class="sIndex-hero">
        <el-card shadow="always" class="sIndex-profile">
          <div class="sIndex-profile-left">
            <el-avatar :size="64" class="sIndex-avatar">L</el-avatar>
            <div>
              <div class="sIndex-name">李同学</div>
              <div class="sIndex-meta">计算机科学系 | 学号: 20211234</div>
            </div>
          </div>
          <div class="sIndex-stats">
            <div class="sIndex-stat">
              <div class="sIndex-stat-label">当前课程</div>
              <div class="sIndex-stat-value">6</div>
            </div>
            <div class="sIndex-stat">
              <div class="sIndex-stat-label">平均成绩</div>
              <div class="sIndex-stat-value">87.5</div>
            </div>
            <div class="sIndex-stat">
              <div class="sIndex-stat-label">待提交</div>
              <div class="sIndex-stat-value">3</div>
            </div>
          </div>
        </el-card>
      </div>

      <el-main class="sIndex-main">
        <router-view></router-view>
        <!-- 以下是默认主页内容，当路由为/sIndex/index时显示 -->
        <div v-if="$route.path === '/sIndex/index'" class="sIndex-section-title">进行中的课程</div>
        <el-row :gutter="16">
          <el-col :xs="24" :md="8">
            <el-card class="sIndex-course-card" shadow="never">
              <div class="sIndex-card-header">
                <i class="el-icon-s-promotion"></i>
                <span>Web前端开发</span>
              </div>
              <div class="sIndex-item">
                <div>
                  <div class="sIndex-item-title">React综合项目</div>
                  <div class="sIndex-item-sub">截止日期: 2023-11-10</div>
                </div>
              </div>
              <div class="sIndex-item">
                <div>
                  <div class="sIndex-item-title">JavaScript进阶</div>
                  <div class="sIndex-item-sub">有视频更新</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-card class="sIndex-course-card" shadow="never">
              <div class="sIndex-card-header">
                <i class="el-icon-cpu"></i>
                <span>人工智能导论</span>
              </div>
              <div class="sIndex-item">
                <div>
                  <div class="sIndex-item-title">实验二: 图像识别</div>
                  <div class="sIndex-item-sub">截止日期: 2023-10-28</div>
                </div>
                <div class="sIndex-progress">
                  <div class="sIndex-progress-fill" style="width:45%"></div>
                </div>
              </div>
              <div class="sIndex-item">
                <div>
                  <div class="sIndex-item-title">实验一反馈已发布</div>
                  <div class="sIndex-item-sub">分数: 92</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-card class="sIndex-course-card" shadow="never">
              <div class="sIndex-card-header">
                <i class="el-icon-coin"></i>
                <span>数据库系统</span>
              </div>
              <div class="sIndex-item">
                <div>
                  <div class="sIndex-item-title">在线测试三</div>
                  <div class="sIndex-item-sub">限时: 30分钟</div>
                </div>
              </div>
              <div class="sIndex-item">
                <div>
                  <div class="sIndex-item-title">第6章: 事务管理</div>
                  <div class="sIndex-item-sub">预习材料已发布</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div class="sIndex-section-title">最新成绩</div>
        <el-row :gutter="16">
          <el-col :xs="24" :md="8">
            <el-card class="sIndex-score-card" shadow="never">
              <div class="sIndex-card-header">
                <i class="el-icon-collection"></i>
                <span>数据结构</span>
              </div>
              <div class="sIndex-score-row">
                <div>
                  <div class="sIndex-item-title">期末考试</div>
                  <div class="sIndex-item-sub">2023-07-10</div>
                </div>
                <div class="sIndex-score green">92</div>
              </div>
              <div class="sIndex-score-row">
                <div>
                  <div class="sIndex-item-title">期中考试</div>
                  <div class="sIndex-item-sub">2023-04-15</div>
                </div>
                <div class="sIndex-score orange">86</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-card class="sIndex-score-card" shadow="never">
              <div class="sIndex-card-header">
                <i class="el-icon-cloudy"></i>
                <span>计算机网络</span>
              </div>
              <div class="sIndex-score-row">
                <div>
                  <div class="sIndex-item-title">实验四: TCP协议</div>
                  <div class="sIndex-item-sub">2023-10-10</div>
                </div>
                <div class="sIndex-score green">94</div>
              </div>
              <div class="sIndex-score-row">
                <div>
                  <div class="sIndex-item-title">实验三: UDP协议</div>
                  <div class="sIndex-item-sub">2023-09-25</div>
                </div>
                <div class="sIndex-score green">91</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-card class="sIndex-score-card" shadow="never">
              <div class="sIndex-card-header">
                <i class="el-icon-lock"></i>
                <span>信息安全</span>
              </div>
              <div class="sIndex-score-row">
                <div>
                  <div class="sIndex-item-title">分组项目</div>
                  <div class="sIndex-item-sub">2023-09-30</div>
                </div>
                <div class="sIndex-score green">95</div>
              </div>
              <div class="sIndex-score-row">
                <div>
                  <div class="sIndex-item-title">加密算法作业</div>
                  <div class="sIndex-item-sub">2023-09-15</div>
                </div>
                <div class="sIndex-score red">76</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
</style>