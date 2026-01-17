import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 公共页面 - 首页保持直接导入以加快首屏加载
import Index from '../views/index.vue'

/**
 * 检查用户是否已登录
 * @param {string} role - 用户角色 ('teacher' 或 'student')
 * @returns {boolean} - 是否已登录
 */
const isAuthenticated = (role) => {
  // 检查是否登录了任何角色
  const hasTeacherId = !!(localStorage.getItem('teacherId') || localStorage.getItem('t_id'))
  const hasTeacherToken = !!(localStorage.getItem('token') || localStorage.getItem('teacherToken') || localStorage.getItem('t_token'))
  const hasStudentId = !!(localStorage.getItem('s_id'))
  const hasStudentToken = !!(localStorage.getItem('s_token'))

  if (role === 'teacher') {
    return hasTeacherId && hasTeacherToken
  } else if (role === 'student') {
    // 学生路由允许老师为了预览而进入
    return (hasStudentId && hasStudentToken) || (hasTeacherId && hasTeacherToken)
  }
  return (hasTeacherId && hasTeacherToken) || (hasStudentId && hasStudentToken)
}

// 其他页面使用懒加载优化性能
const Auth = () => import('../views/auth.vue')
const Admin = () => import('../components/Admin.vue')
const ForgotPassword = () => import('../views/ForgotPassword.vue')

// 教师模块 - 使用懒加载
const TeacherLayout = () => import('../views/teacher/Personal/Layout.vue')
const TeacherDashboard = () => import('../views/teacher/Public/Dashboard.vue')
const TeacherProfile = () => import('../views/teacher/Personal/Profile.vue')
const TeacherCourseManagement = () => import('../views/teacher/course/CourseManagement.vue')
const TeacherCourseDetail = () => import('../views/teacher/course/CourseDetail.vue')
const TeacherExamManagement = () => import('../views/teacher/exam/ExamManagement.vue')
const TeacherExamForm = () => import('../views/teacher/exam/ExamForm.vue')
const TeacherHomeworkManagement = () => import('../views/teacher/Homework/HomeworkManagement.vue')
const TeacherMessageCenter = () => import('../views/teacher/Personal/MessageCenter.vue')

// 学生模块 - 使用懒加载
const sIndex = () => import('../components/s_index.vue')
const StudentLayout = () => import('../views/student/Layout.vue')
const StudentDashboard = () => import('../views/student/Dashboard.vue')
const StudentHomework = () => import('../views/student/StudentHomework.vue')
const HomeworkSubmit = () => import('../views/student/HomeworkSubmit.vue')
const HomeworkDetail = () => import('../views/student/HomeworkDetail.vue')
const StudentMessageCenter = () => import('../views/student/MessageCenter.vue')
const StudentCourseList = () => import('../views/student/CourseList.vue')
const StudentCourseDetail = () => import('../views/student/CourseDetail.vue')
const StudentCourseLearn = () => import('../views/student/CourseLearn.vue')
const StudentProfile = () => import('../views/student/Profile.vue')
const StudentSchedule = () => import('../views/student/Schedule.vue')
const StudentExamList = () => import('../views/student/StudentExamList.vue')
const StudentExamDetail = () => import('../views/student/StudentExamDetail.vue')
const StudentExamResult = () => import('../views/student/StudentExamResult.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index,
    },
    {
      path: '/login',
      name: 'login',
      component: Auth,
      meta: { role: 'teacher' } // 默认教师角色，可通过编程方式修改
    },
    {
      path: '/register',
      name: 'register',
      component: Auth,
    },
    {
      path: '/forgotPassword',
      name: 'forgotPassword',
      component: ForgotPassword,
    },
    {
      path: '/admin',
      name: 'admin',
      component: Admin,
    },
    // 教师端路由 - 新的清晰结构
    {
      path: '/teacher',
      name: 'teacher',
      component: TeacherLayout,
      redirect: '/teacher/dashboard',
      meta: { requiresAuth: true, role: 'teacher' },
      children: [
        {
          path: 'dashboard',
          name: 'teacher_dashboard',
          component: TeacherDashboard,
          meta: { title: '教师仪表盘', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'profile',
          name: 'teacher_profile',
          component: TeacherProfile,
          meta: { title: '个人中心', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'courses',
          name: 'teacher_courses',
          component: TeacherCourseManagement,
          meta: { title: '课程管理', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'course/create',
          name: 'teacher_course_create',
          component: () => import('../views/teacher/course/CourseForm.vue'),
          meta: { title: '创建课程', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'course/edit/:id',
          name: 'teacher_course_edit',
          component: () => import('../views/teacher/course/CourseForm.vue'),
          meta: { title: '编辑课程', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'course/:id',
          name: 'teacher_course_detail',
          component: TeacherCourseDetail,
          meta: { title: '课程详情', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'course/:id/learn',
          name: 'teacher_course_learn',
          component: StudentCourseLearn,
          meta: { title: '课程预览', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'exams',
          name: 'teacher_exams',
          component: TeacherExamManagement,
          meta: { title: '考试管理', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'exam/create',
          name: 'teacher_exam_create',
          component: TeacherExamForm,
          meta: { title: '创建考试', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'exam/edit/:id',
          name: 'teacher_exam_edit',
          component: TeacherExamForm,
          meta: { title: '编辑考试', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'exam/:id',
          name: 'teacher_exam_detail',
          component: () => import('../views/teacher/exam/ExamDetail.vue'),
          meta: { title: '考试详情', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'exam/:id/questions',
          name: 'teacher_exam_questions',
          component: () => import('../views/teacher/exam/ExamQuestions.vue'),
          meta: { title: '考试试题管理', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'homework',
          name: 'teacher_homework',
          component: TeacherHomeworkManagement,
          meta: { title: '作业管理', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'homework/:id',
          name: 'teacher_homework_detail',
          component: () => import('../views/teacher/Homework/HomeworkDetail.vue'),
          meta: { title: '作业详情', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'homework/:id/grade',
          name: 'teacher_homework_grade',
          component: () => import('../views/teacher/Homework/HomeworkGrade.vue'),
          meta: { title: '作业批改', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'classes',
          name: 'teacher_classes',
          component: () => import('../views/teacher/class/ClassManagement.vue'),
          meta: { title: '班级管理', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'messages',
          name: 'teacher_messages',
          component: TeacherMessageCenter,
          meta: { title: '消息中心', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'analytics',
          name: 'teacher_analytics',
          component: () => import('../views/teacher/course/CourseAnalytics.vue'),
          meta: { title: '数据分析', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'enrollments',
          name: 'teacher_enrollments',
          component: () => import('../views/teacher/course/EnrollmentManagement.vue'),
          meta: { title: '报名管理', requiresAuth: true, role: 'teacher' }
        },
        {
          path: 'questions',
          name: 'teacher_questions',
          component: () => import('../views/teacher/question/QuestionBank.vue'),
          meta: { title: '题库管理', requiresAuth: true, role: 'teacher' }
        },
      ]
    },

    {
      path: '/tIndex',
      redirect: '/teacher/dashboard'
    },
    // 学生端路由 - 新的清晰结构
    {
      path: '/student',
      component: StudentLayout,
      redirect: '/student/dashboard',
      meta: { requiresAuth: true, role: 'student' },
      children: [
        {
          path: 'dashboard',
          name: 'student_dashboard',
          component: StudentDashboard,
          meta: { title: '学生主页', requiresAuth: true, role: 'student' }
        },
        {
          path: 'courses',
          name: 'student_courses',
          component: StudentCourseList,
          meta: { title: '课程中心', requiresAuth: true, role: 'student' }
        },
        {
          path: 'course/:id',
          name: 'student_course_detail',
          component: StudentCourseDetail,
          meta: { title: '课程详情', requiresAuth: true, role: 'student' }
        },
        {
          path: 'homework',
          name: 'student_homework',
          component: StudentHomework,
          meta: { title: '我的作业', requiresAuth: true, role: 'student' }
        },
        {
          path: 'homework/:id/submit',
          name: 'student_homework_submit',
          component: HomeworkSubmit,
          meta: { title: '提交作业', requiresAuth: true, role: 'student' }
        },
        {
          path: 'homework/:id/detail',
          name: 'student_homework_detail',
          component: HomeworkDetail,
          meta: { title: '作业详情', requiresAuth: true, role: 'student' }
        },
        {
          path: 'schedule',
          name: 'student_schedule',
          component: StudentSchedule,
          meta: { title: '我的课程表', requiresAuth: true, role: 'student' }
        },
        {
          path: 'profile',
          name: 'student_profile',
          component: StudentProfile,
          meta: { title: '个人中心', requiresAuth: true, role: 'student' }
        },
        {
          path: 'messages',
          name: 'student_messages',
          component: StudentMessageCenter,
          meta: { title: '答疑中心', requiresAuth: true, role: 'student' }
        },
        {
          path: 'exams',
          name: 'student_exams',
          component: StudentExamList,
          meta: { title: '在线考试', requiresAuth: true, role: 'student' }
        },
        {
          path: 'exam/:id/take',
          name: 'student_exam_take',
          component: StudentExamDetail,
          meta: { title: '正在考试', requiresAuth: true, role: 'student' }
        },
        {
          path: 'exam/:id/result',
          name: 'student_exam_result',
          component: StudentExamResult,
          meta: { title: '考试成绩', requiresAuth: true, role: 'student' }
        }
      ]
    },
    // 学习页面 (全屏，不使用通用布局)
    {
      path: '/student/learn/:id',
      name: 'student_course_learn',
      component: StudentCourseLearn,
      meta: { title: '课程学习', requiresAuth: true, role: 'student' }
    },
    // 保留旧路由以兼容现有代码 (可选，如果确定不再使用可以删除)
    {
      path: '/sIndex',
      redirect: '/student/dashboard'
    }
  ],
})

/**
 * 路由守卫 - 验证用户登录状态
 * 检查需要认证的路由，确保用户已登录且角色匹配
 */
router.beforeEach((to, _from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth) {
    const role = to.meta.role

    // 根据角色检查登录状态
    if (role && !isAuthenticated(role)) {
      // 未登录，重定向到登录页
      ElMessage.warning('请先登录')
      next({
        path: '/login',
        query: { redirect: to.fullPath }, // 保存目标路由，登录后可以跳转回来
        state: { role: role } // 传递角色信息，不在URL中显示
      })
    } else {
      // 已登录，允许访问
      next()
    }
  } else {
    // 不需要认证的路由，直接放行
    next()
  }
})

/**
 * 路由后置守卫 - 设置页面标题和滚动行为
 */
router.afterEach((to) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 在线学习平台`
  } else {
    document.title = '在线学习平台'
  }

  // 页面切换后滚动到顶部
  window.scrollTo(0, 0)
})

export default router
