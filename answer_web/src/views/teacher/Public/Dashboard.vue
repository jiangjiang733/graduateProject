<template>
  <div class="dashboard-container">
    <div class="top-header">
      <div class="greeting-box">
        <h2 class="welcome-title">
          {{ timeState }}好，{{ teacherName }} 老师
        </h2>
        <p class="date-text">
          今天是 {{ currentDate }} {{ currentWeek }}，准备好开始今天的教学工作了吗？
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" size="large" icon="Plus" @click="$router.push('/teacher/course/create')">
          快速建课
        </el-button>
      </div>
    </div>

    <div class="data-row">
      <div class="data-card" v-for="(item, index) in statItems" :key="index">
        <div class="data-icon" :style="{ background: item.bgColor, color: item.color }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="data-info">
          <div class="data-num">
            <count-to :startVal="0" :endVal="item.value" :duration="2000"></count-to>
          </div>
          <div class="data-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="main-area">
      <div class="left-section">
        <div class="panel-head">
          <div class="head-title">我的课程 ({{ recentCourses.length }})</div>
          <el-link type="primary" :underline="false" @click="$router.push('/teacher/courses')">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-link>
        </div>

        <el-skeleton :loading="loading" animated :rows="3">
          <div v-if="recentCourses.length > 0" class="course-list">
            <div v-for="course in recentCourses" :key="course.id" class="standard-card">
              <div class="card-img">
                <img :src="getCourseImage(course.image)" />
                <div class="status-label">进行中</div>
              </div>
              <div class="card-content">
                <h3 class="c-name" :title="course.courseName || course.name">
                  {{ course.courseName || course.name }}
                </h3>
                <div class="c-info">
                  <span><el-icon><User /></el-icon> {{ course.studentCount || 0 }}人</span>
                  <el-divider direction="vertical" />
                  <span><el-icon><Document /></el-icon> {{ course.chapterCount || 0 }}章</span>
                </div>
                <div class="c-action">
                  <el-button type="primary" plain class="action-btn" @click="viewCourse(course)">
                    进入班级管理
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-area">
            <el-empty description="暂无课程" :image-size="100"></el-empty>
          </div>
        </el-skeleton>
      </div>

      <div class="right-section">
        <div class="side-panel">
          <div class="panel-title">常用功能</div>
          <div class="tool-grid">
            <div class="tool-item" @click="$router.push('/teacher/homework')">
              <div class="tool-icon blue"><el-icon><EditPen /></el-icon></div>
              <span>批改作业</span>
            </div>
            <div class="tool-item" @click="$router.push('/teacher/exams')">
              <div class="tool-icon orange"><el-icon><Trophy /></el-icon></div>
              <span>考试管理</span>
            </div>
            <div class="tool-item" @click="$router.push('/teacher/classes')">
              <div class="tool-icon green"><el-icon><Connection /></el-icon></div>
              <span>班级成员</span>
            </div>
            <div class="tool-item" @click="$router.push('/teacher/profile')">
              <div class="tool-icon gray"><el-icon><Setting /></el-icon></div>
              <span>个人设置</span>
            </div>
          </div>
        </div>

        <div class="side-panel">
          <div class="panel-title">
            <span>最新消息</span>
            <el-link type="info" :underline="false" style="font-size:12px">更多</el-link>
          </div>
          <div class="msg-box" v-if="recentMessages.length > 0">
            <div v-for="(msg, i) in recentMessages" :key="i" class="simple-msg">
              <div class="dot"></div>
              <div class="msg-body">
                <div class="msg-top">
                  <span class="who">{{ msg.studentName }}</span>
                  <span class="when">刚刚</span>
                </div>
                <div class="what">{{ msg.content }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-msg">暂无新消息</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Reading, User, Document, ChatDotRound, ArrowRight,
  Plus, EditPen, Trophy, Connection, Setting
} from '@element-plus/icons-vue'
import { getDashboardData } from '@/api/dashboard.js'
import { CountTo } from 'vue3-count-to'

const router = useRouter()
const teacherName = ref(localStorage.getItem('teacherName') || '教师')
const loading = ref(true)

// 时间
const currentDate = ref('')
const currentWeek = ref('')
const timeState = ref('')

const initTime = () => {
  const now = new Date()
  currentDate.value = `${now.getMonth() + 1}月${now.getDate()}日`
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  currentWeek.value = weeks[now.getDay()]
  const h = now.getHours()
  timeState.value = h < 9 ? '早上' : h < 12 ? '上午' : h < 14 ? '中午' : h < 18 ? '下午' : '晚上'
}

// 数据
const statistics = ref({ courseCount: 0, studentCount: 0, pendingHomeworkCount: 0, unreadMessageCount: 0 })
const recentCourses = ref([])
const recentMessages = ref([])

// 颜色配置：纯正的蓝色系和暖色系，没有紫色
const statItems = computed(() => [
  { label: '课程总数', value: statistics.value.courseCount, icon: 'Reading', bgColor: '#ecf5ff', color: '#409EFF' },
  { label: '学生总数', value: statistics.value.studentCount, icon: 'User', bgColor: '#f0f9eb', color: '#67C23A' },
  { label: '待批作业', value: statistics.value.pendingHomeworkCount, icon: 'EditPen', bgColor: '#fdf6ec', color: '#E6A23C' },
  { label: '未读消息', value: statistics.value.unreadMessageCount, icon: 'ChatDotRound', bgColor: '#f4f4f5', color: '#909399' },
])

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    if(!teacherId) { loading.value = false; return; }

    const response = await getDashboardData(teacherId)
    // ...数据处理逻辑不变...
    if (response.code === 200 && response.data) {
      if (response.data.statistics) {
        statistics.value = response.data.statistics
      }
      recentCourses.value = response.data.recentCourses || []
      recentMessages.value = response.data.recentMessages || []
    }
  } catch (error) {
    console.error(error)
  } finally {
    setTimeout(() => { loading.value = false }, 300)
  }
}

const getCourseImage = (image) => {
  if (!image) return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' // 商务办公风格图片
  if (image.startsWith('http')) return image
  return `http://localhost:8088${image}`
}

const viewCourse = (course) => {
  router.push({ path: '/teacher/course/' + course.id })
}

onMounted(() => {
  initTime()
  fetchDashboardData()
})
</script>

<style scoped>
/* 配色策略：
  背景：#F5F7FA (标准后台灰)
  卡片：#FFFFFF (纯白)
  主色：#409EFF (Element Blue)
  文字：#303133 (主要), #606266 (常规), #909399 (次要)
*/

.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* === 顶部区域 === */
.top-header {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ebeef5;
  margin-bottom: 20px;
}
.welcome-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}
.date-text {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* === 数据统计行 === */
.data-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.data-card {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.3s;
}
.data-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.data-icon {
  width: 50px;
  height: 50px;
  border-radius: 4px; /* 方形圆角，更稳重 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.data-info {
  display: flex;
  flex-direction: column;
}
.data-num {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}
.data-label {
  font-size: 14px;
  color: #909399;
}

/* === 主体布局 === */
.main-area {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.left-section {
  flex: 1;
  min-width: 0;
}
.right-section {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 标题栏通用 */
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.head-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

/* === 课程列表 (标准卡片) === */
.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.standard-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}
.standard-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #b3d8ff;
  transform: translateY(-2px);
}
.card-img {
  width: 100%;
  height: 150px;
  position: relative;
  border-bottom: 1px solid #f2f6fc;
}
.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.status-label {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 2px;
}
.card-content {
  padding: 16px;
}
.c-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-info {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}
.c-info .el-icon {
  margin-right: 4px;
  position: relative;
  top: 1px;
}
.c-action {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
  text-align: center;
}
.action-btn {
  width: 100%;
}
.empty-area {
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  text-align: center;
}

/* === 右侧侧边栏 === */
.side-panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}
.panel-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 工具网格 */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  background: #fcfcfc;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.tool-item:hover {
  background: #ecf5ff;
  border-color: #c6e2ff;
}
.tool-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 8px;
  color: #fff;
}
.blue { background: #409EFF; }
.orange { background: #E6A23C; }
.green { background: #67C23A; }
.gray { background: #909399; }

.tool-item span {
  font-size: 13px;
  color: #606266;
}

/* 消息列表 */
.msg-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.simple-msg {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
}
.simple-msg:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.dot {
  width: 8px;
  height: 8px;
  background: #F56C6C; /* 红色提醒点 */
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.msg-body {
  flex: 1;
  min-width: 0;
}
.msg-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}
.who { color: #303133; font-weight: bold; }
.when { color: #c0c4cc; }
.what {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.no-msg {
  color: #909399;
  text-align: center;
  font-size: 12px;
  padding: 10px 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-area { flex-direction: column; }
  .right-section { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .right-section { display: flex; flex-direction: column; }
  .data-row { flex-wrap: wrap; }
  .data-card { min-width: 45%; }
}
</style>