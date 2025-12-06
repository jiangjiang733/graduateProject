/**
 * 课程状态管理
 * 管理当前选中的课程和课程列表缓存
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCourseStore = defineStore('course', () => {
  // 状态
  const currentCourse = ref(null) // 当前选中的课程
  const courseList = ref([]) // 课程列表缓存
  const courseListLastUpdate = ref(null) // 课程列表最后更新时间
  const selectedCourseId = ref(localStorage.getItem('selectedCourseId') || '')
  
  // 计算属性
  const hasCourses = computed(() => courseList.value.length > 0)
  
  const currentCourseId = computed(() => currentCourse.value?.id || selectedCourseId.value)
  
  const currentCourseName = computed(() => currentCourse.value?.name || '')
  
  /**
   * 检查课程列表缓存是否过期（5分钟）
   */
  const isCacheExpired = computed(() => {
    if (!courseListLastUpdate.value) return true
    const now = new Date().getTime()
    const lastUpdate = new Date(courseListLastUpdate.value).getTime()
    const fiveMinutes = 5 * 60 * 1000
    return (now - lastUpdate) > fiveMinutes
  })
  
  // 方法
  /**
   * 设置当前选中的课程
   */
  const setCurrentCourse = (course) => {
    currentCourse.value = course
    if (course && course.id) {
      selectedCourseId.value = course.id
      localStorage.setItem('selectedCourseId', course.id)
    }
  }
  
  /**
   * 清除当前选中的课程
   */
  const clearCurrentCourse = () => {
    currentCourse.value = null
    selectedCourseId.value = ''
    localStorage.removeItem('selectedCourseId')
  }
  
  /**
   * 设置课程列表缓存
   */
  const setCourseList = (courses) => {
    courseList.value = courses
    courseListLastUpdate.value = new Date().toISOString()
  }
  
  /**
   * 添加课程到列表
   */
  const addCourse = (course) => {
    const index = courseList.value.findIndex(c => c.id === course.id)
    if (index === -1) {
      courseList.value.unshift(course)
    } else {
      courseList.value[index] = course
    }
  }
  
  /**
   * 更新课程列表中的课程
   */
  const updateCourse = (courseId, updatedData) => {
    const index = courseList.value.findIndex(c => c.id === courseId)
    if (index !== -1) {
      courseList.value[index] = { ...courseList.value[index], ...updatedData }
    }
    // 如果是当前课程，也更新当前课程
    if (currentCourse.value && currentCourse.value.id === courseId) {
      currentCourse.value = { ...currentCourse.value, ...updatedData }
    }
  }
  
  /**
   * 从列表中删除课程
   */
  const removeCourse = (courseId) => {
    courseList.value = courseList.value.filter(c => c.id !== courseId)
    // 如果删除的是当前课程，清除当前课程
    if (currentCourse.value && currentCourse.value.id === courseId) {
      clearCurrentCourse()
    }
  }
  
  /**
   * 根据ID从缓存中获取课程
   */
  const getCourseById = (courseId) => {
    return courseList.value.find(c => c.id === courseId)
  }
  
  /**
   * 清除课程列表缓存
   */
  const clearCourseList = () => {
    courseList.value = []
    courseListLastUpdate.value = null
  }
  
  /**
   * 清除所有课程状态
   */
  const clearAll = () => {
    clearCurrentCourse()
    clearCourseList()
  }
  
  return {
    // 状态
    currentCourse,
    courseList,
    courseListLastUpdate,
    selectedCourseId,
    // 计算属性
    hasCourses,
    currentCourseId,
    currentCourseName,
    isCacheExpired,
    // 方法
    setCurrentCourse,
    clearCurrentCourse,
    setCourseList,
    addCourse,
    updateCourse,
    removeCourse,
    getCourseById,
    clearCourseList,
    clearAll
  }
})
