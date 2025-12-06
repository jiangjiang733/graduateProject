/**
 * 通知状态管理
 * 管理未读消息数量和消息实时更新
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const unreadCount = ref(0) // 未读消息数量
  const messages = ref([]) // 消息列表
  const systemNotifications = ref([]) // 系统通知列表
  const lastFetchTime = ref(null) // 最后获取时间
  const pollingInterval = ref(null) // 轮询定时器
  
  // 计算属性
  const hasUnreadMessages = computed(() => unreadCount.value > 0)
  
  const unreadMessages = computed(() => messages.value.filter(m => !m.isRead))
  
  const readMessages = computed(() => messages.value.filter(m => m.isRead))
  
  // 方法
  /**
   * 设置未读消息数量
   */
  const setUnreadCount = (count) => {
    unreadCount.value = count
  }
  
  /**
   * 增加未读消息数量
   */
  const incrementUnreadCount = (increment = 1) => {
    unreadCount.value += increment
  }
  
  /**
   * 减少未读消息数量
   */
  const decrementUnreadCount = (decrement = 1) => {
    unreadCount.value = Math.max(0, unreadCount.value - decrement)
  }
  
  /**
   * 设置消息列表
   */
  const setMessages = (messageList) => {
    messages.value = messageList
    lastFetchTime.value = new Date().toISOString()
    // 更新未读数量
    unreadCount.value = messageList.filter(m => !m.isRead).length
  }
  
  /**
   * 添加新消息
   */
  const addMessage = (message) => {
    // 检查消息是否已存在
    const exists = messages.value.some(m => m.messageId === message.messageId)
    if (!exists) {
      messages.value.unshift(message)
      if (!message.isRead) {
        incrementUnreadCount()
      }
    }
  }
  
  /**
   * 标记消息为已读
   */
  const markMessageAsRead = (messageId) => {
    const message = messages.value.find(m => m.messageId === messageId)
    if (message && !message.isRead) {
      message.isRead = true
      decrementUnreadCount()
    }
  }
  
  /**
   * 标记所有消息为已读
   */
  const markAllAsRead = () => {
    messages.value.forEach(m => {
      m.isRead = true
    })
    unreadCount.value = 0
  }
  
  /**
   * 删除消息
   */
  const removeMessage = (messageId) => {
    const index = messages.value.findIndex(m => m.messageId === messageId)
    if (index !== -1) {
      const message = messages.value[index]
      if (!message.isRead) {
        decrementUnreadCount()
      }
      messages.value.splice(index, 1)
    }
  }
  
  /**
   * 设置系统通知列表
   */
  const setSystemNotifications = (notifications) => {
    systemNotifications.value = notifications
  }
  
  /**
   * 添加系统通知
   */
  const addSystemNotification = (notification) => {
    const exists = systemNotifications.value.some(n => n.notificationId === notification.notificationId)
    if (!exists) {
      systemNotifications.value.unshift(notification)
    }
  }
  
  /**
   * 启动消息轮询
   * @param {Function} fetchFunction - 获取消息的函数
   * @param {Number} interval - 轮询间隔（毫秒），默认30秒
   */
  const startPolling = (fetchFunction, interval = 30000) => {
    // 清除已存在的轮询
    stopPolling()
    
    // 立即执行一次
    fetchFunction()
    
    // 设置定时轮询
    pollingInterval.value = setInterval(() => {
      fetchFunction()
    }, interval)
  }
  
  /**
   * 停止消息轮询
   */
  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }
  
  /**
   * 清除所有通知数据
   */
  const clearAll = () => {
    unreadCount.value = 0
    messages.value = []
    systemNotifications.value = []
    lastFetchTime.value = null
    stopPolling()
  }
  
  return {
    // 状态
    unreadCount,
    messages,
    systemNotifications,
    lastFetchTime,
    // 计算属性
    hasUnreadMessages,
    unreadMessages,
    readMessages,
    // 方法
    setUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    setMessages,
    addMessage,
    markMessageAsRead,
    markAllAsRead,
    removeMessage,
    setSystemNotifications,
    addSystemNotification,
    startPolling,
    stopPolling,
    clearAll
  }
})
