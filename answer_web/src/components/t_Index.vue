<template>
  <el-header class="header">
    <!-- Logo -->
    <div class="logo">
      <span style="color: #20B486; font-size: 24px; font-weight: bold;">E</span>
      <span style="color: #FFA500; font-size: 24px; font-weight: bold;">GURU</span>
    </div>
    <!-- 导航菜单 -->
    <el-menu mode="horizontal" :default-active="$route.path" class="nav-menu" router >
      <el-menu-item index="/teacher/dashboard">主页</el-menu-item>
      <el-sub-menu index="courses">
        <template #title>课程管理</template>
        <el-menu-item index="/teacher/course-dashboard">课程仪表盘</el-menu-item>
        <el-menu-item index="/teacher/courses">我的课程</el-menu-item>
        <el-menu-item index="/teacher/course/create">创建课程</el-menu-item>
        <el-menu-item index="/teacher/analytics">数据分析</el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/teacher/exams">考试</el-menu-item>
      <el-menu-item index="/teacher/homework">作业</el-menu-item>
      <el-menu-item index="/teacher/classes">班级管理</el-menu-item>
      <el-menu-item index="/teacher/enrollments">报名管理</el-menu-item>
      <el-menu-item index="/teacher/comments">评论管理</el-menu-item>
      <el-menu-item index="/teacher/messages">学生留言</el-menu-item>
    </el-menu>

    <!-- 用户信息 -->
    <div class="user-info">
      <el-dropdown>
  <span class="el-dropdown-link">
    <img :src="avatarUrl" alt="avatar" class="avatar">
  </span>
        <template #dropdown>
          <el-dropdown-menu >
            <el-dropdown-item @click="$router.push('/teacher/profile')" >个人信息</el-dropdown-item>
            <el-dropdown-item @click="$router.push('/teacher/resources')">教学资源</el-dropdown-item>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
  <el-main>
    <router-view></router-view>
  </el-main>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const router = useRouter()
    const teacherName = ref('')
    const teacherHead = ref('')
    
    // 计算头像URL
    const avatarUrl = computed(() => {
      if (teacherHead.value && teacherHead.value.trim() !== '') {
        // 如果是完整URL，直接使用
        if (teacherHead.value.startsWith('http://') || teacherHead.value.startsWith('https://')) {
          return teacherHead.value
        }
        // 如果是相对路径，拼接服务器地址
        return `http://localhost:8088${teacherHead.value}`
      }
      // 默认头像
      return new URL('@/assets/image/avatar.jpeg', import.meta.url).href
    })
    
    // 从localStorage加载用户信息
    const loadUserInfo = () => {
      teacherName.value = localStorage.getItem('teacherName') || '教师'
      teacherHead.value = localStorage.getItem('teacherHead') || ''
    }
    
    // 退出登录
    const handleLogout = () => {
      // 清除所有localStorage数据
      localStorage.removeItem('t_id')
      localStorage.removeItem('teacherId')
      localStorage.removeItem('teacherName')
      localStorage.removeItem('teacherHead')
      localStorage.removeItem('user')
      localStorage.setItem('status', 'false')
      
      ElMessage.success('退出登录成功')
      router.push('/')
    }
    
    onMounted(() => {
      loadUserInfo()
    })
    
    return {
      teacherName,
      avatarUrl,
      handleLogout
    }
  }
}
</script>
<style scoped>
@import "../assets/css/teacher/tIndex.css";
</style>