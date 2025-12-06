import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 虚拟滚动组合式函数
 * 用于优化长列表性能
 * 
 * @param {Object} options - 配置选项
 * @param {Array} options.items - 完整数据列表
 * @param {Number} options.itemHeight - 每项的高度（像素）
 * @param {Number} options.visibleCount - 可见项数量（默认10）
 * @param {Number} options.bufferCount - 缓冲项数量（默认5）
 * @returns {Object} 虚拟滚动相关的响应式数据和方法
 */
export function useVirtualScroll(options) {
  const {
    items = ref([]),
    itemHeight = 80,
    visibleCount = 10,
    bufferCount = 5
  } = options

  // 滚动容器引用
  const scrollContainer = ref(null)
  
  // 当前滚动位置
  const scrollTop = ref(0)
  
  // 计算属性
  const totalHeight = computed(() => items.value.length * itemHeight)
  
  const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / itemHeight) - bufferCount
    return Math.max(0, index)
  })
  
  const endIndex = computed(() => {
    const index = startIndex.value + visibleCount + bufferCount * 2
    return Math.min(items.value.length, index)
  })
  
  const visibleItems = computed(() => {
    return items.value.slice(startIndex.value, endIndex.value).map((item, index) => ({
      ...item,
      _index: startIndex.value + index,
      _top: (startIndex.value + index) * itemHeight
    }))
  })
  
  const offsetY = computed(() => startIndex.value * itemHeight)
  
  // 滚动事件处理
  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
  }
  
  // 滚动到指定索引
  const scrollToIndex = (index) => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = index * itemHeight
    }
  }
  
  // 滚动到顶部
  const scrollToTop = () => {
    scrollToIndex(0)
  }
  
  // 滚动到底部
  const scrollToBottom = () => {
    scrollToIndex(items.value.length - 1)
  }
  
  return {
    scrollContainer,
    scrollTop,
    totalHeight,
    startIndex,
    endIndex,
    visibleItems,
    offsetY,
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom
  }
}

/**
 * 简化版虚拟滚动（适用于Element Plus Table）
 * 
 * @param {Array} data - 完整数据
 * @param {Number} pageSize - 每页显示数量
 * @returns {Object} 分页相关数据和方法
 */
export function useSimpleVirtualScroll(data, pageSize = 50) {
  const currentPage = ref(1)
  
  const visibleData = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return data.value.slice(start, end)
  })
  
  const totalPages = computed(() => Math.ceil(data.value.length / pageSize))
  
  const hasMore = computed(() => currentPage.value < totalPages.value)
  
  const loadMore = () => {
    if (hasMore.value) {
      currentPage.value++
    }
  }
  
  const reset = () => {
    currentPage.value = 1
  }
  
  return {
    currentPage,
    visibleData,
    totalPages,
    hasMore,
    loadMore,
    reset
  }
}
