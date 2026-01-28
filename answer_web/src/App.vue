<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { onMounted, ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'

const route = useRoute()
const settingsStore = useSettingsStore()
const isDarkSystem = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

/**
 * 检查用户是否已登录
 */
const isUserLoggedIn = computed(() => {
  const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
  return !!(teacherId || studentId)
})

/**
 * 检查当前是否在需要应用主题的页面（教师端或学生端）
 */
const shouldApplyTheme = computed(() => {
  const path = route.path
  // 只有在 /teacher 或 /student 路径下才应用主题
  return path.startsWith('/teacher') || path.startsWith('/student')
})

/**
 * 计算是否应该显示暗黑主题
 * 只有在用户登录且在教师端/学生端时才应用暗黑主题
 */
const showDarkTheme = computed(() => {
  if (!isUserLoggedIn.value || !shouldApplyTheme.value) {
    return false
  }
  return settingsStore.theme === 'dark' || (settingsStore.theme === 'system' && isDarkSystem.value)
})

// 监听路由变化，刷新用户设置
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/teacher') || newPath.startsWith('/student')) {
    // 进入教师端或学生端时，刷新当前用户的设置
    settingsStore.refreshForCurrentUser()
  }
})

onMounted(() => {
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    isDarkSystem.value = e.matches
  })

  // 全局初始化设置
  settingsStore.initSettings()

  if (!localStorage.getItem('status')) {
    localStorage.setItem('status', 'false')
  }
})
</script>
<template>
  <div class="app-root" :class="{ 'dark-theme': showDarkTheme }">
    <RouterView />
  </div>
</template>
<style>
.app-root {
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-page);
  color: var(--text-primary);
  transition: background-color 0.3s ease;
}
</style>

