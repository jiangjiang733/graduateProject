import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'students',
        name: 'StudentManagement',
        component: () => import('@/views/StudentManagement.vue'),
        meta: { title: '学生管理' }
      },
      {
        path: 'teachers',
        name: 'TeacherManagement',
        component: () => import('@/views/TeacherManagement.vue'),
        meta: { title: '教师管理' }
      },
      {
        path: 'announcements',
        name: 'AnnouncementManagement',
        component: () => import('@/views/AnnouncementManagement.vue'),
        meta: { title: '公告管理' }
      },
      {
        path: 'sensitive-words',
        name: 'SensitiveWordManagement',
        component: () => import('@/views/SensitiveWordManagement.vue'),
        meta: { title: '敏感词管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('adminToken')
  
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
