/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 * 
 * @param {Function} func - 要执行的函数
 * @param {Number} wait - 等待时间（毫秒）
 * @param {Boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const context = this
    
    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    
    const callNow = immediate && !timeout
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(context, args)
  }
}

/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数
 * 
 * @param {Function} func - 要执行的函数
 * @param {Number} wait - 等待时间（毫秒）
 * @param {Object} options - 配置选项
 * @param {Boolean} options.leading - 是否在开始时执行（默认true）
 * @param {Boolean} options.trailing - 是否在结束时执行（默认true）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, wait = 300, options = {}) {
  let timeout, context, args, result
  let previous = 0
  
  const { leading = true, trailing = true } = options
  
  const later = () => {
    previous = leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  
  return function throttled(...params) {
    const now = Date.now()
    if (!previous && leading === false) previous = now
    
    const remaining = wait - (now - previous)
    context = this
    args = params
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    
    return result
  }
}

/**
 * 请求动画帧节流
 * 使用 requestAnimationFrame 实现的节流
 * 
 * @param {Function} func - 要执行的函数
 * @returns {Function} 节流后的函数
 */
export function rafThrottle(func) {
  let rafId = null
  
  return function throttled(...args) {
    if (rafId !== null) return
    
    rafId = requestAnimationFrame(() => {
      func.apply(this, args)
      rafId = null
    })
  }
}

/**
 * 批量请求合并
 * 将多个请求合并为一个批量请求
 * 
 * @param {Function} batchFn - 批量请求函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} 合并后的请求函数
 */
export function batchRequest(batchFn, wait = 50) {
  let queue = []
  let timer = null
  
  return function request(item) {
    return new Promise((resolve, reject) => {
      queue.push({ item, resolve, reject })
      
      if (timer) clearTimeout(timer)
      
      timer = setTimeout(async () => {
        const currentQueue = queue
        queue = []
        
        try {
          const items = currentQueue.map(q => q.item)
          const results = await batchFn(items)
          
          currentQueue.forEach((q, index) => {
            q.resolve(results[index])
          })
        } catch (error) {
          currentQueue.forEach(q => {
            q.reject(error)
          })
        }
      }, wait)
    })
  }
}

/**
 * 缓存函数结果
 * 使用 Map 缓存函数执行结果
 * 
 * @param {Function} func - 要缓存的函数
 * @param {Function} keyGenerator - 生成缓存键的函数（可选）
 * @returns {Function} 带缓存的函数
 */
export function memoize(func, keyGenerator) {
  const cache = new Map()
  
  return function memoized(...args) {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = func.apply(this, args)
    cache.set(key, result)
    
    return result
  }
}

/**
 * 异步缓存（支持Promise）
 * 
 * @param {Function} asyncFunc - 异步函数
 * @param {Number} ttl - 缓存时间（毫秒，默认5分钟）
 * @returns {Function} 带缓存的异步函数
 */
export function asyncMemoize(asyncFunc, ttl = 5 * 60 * 1000) {
  const cache = new Map()
  
  return async function memoized(...args) {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value
    }
    
    const value = await asyncFunc.apply(this, args)
    cache.set(key, { value, timestamp: Date.now() })
    
    return value
  }
}

/**
 * 延迟执行
 * 
 * @param {Number} ms - 延迟时间（毫秒）
 * @returns {Promise} 延迟Promise
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 * 
 * @param {Function} func - 要重试的函数
 * @param {Number} retries - 重试次数（默认3次）
 * @param {Number} delayMs - 重试间隔（毫秒，默认1000）
 * @returns {Promise} 执行结果
 */
export async function retry(func, retries = 3, delayMs = 1000) {
  let lastError
  
  for (let i = 0; i < retries; i++) {
    try {
      return await func()
    } catch (error) {
      lastError = error
      if (i < retries - 1) {
        await delay(delayMs * (i + 1)) // 指数退避
      }
    }
  }
  
  throw lastError
}

/**
 * 并发控制
 * 限制并发请求数量
 * 
 * @param {Array} tasks - 任务数组（返回Promise的函数）
 * @param {Number} limit - 并发限制数量
 * @returns {Promise<Array>} 所有任务结果
 */
export async function concurrentLimit(tasks, limit = 5) {
  const results = []
  const executing = []
  
  for (const [index, task] of tasks.entries()) {
    const promise = Promise.resolve().then(() => task()).then(
      result => {
        results[index] = { status: 'fulfilled', value: result }
      },
      error => {
        results[index] = { status: 'rejected', reason: error }
      }
    )
    
    results.push(promise)
    
    if (limit <= tasks.length) {
      const e = promise.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      
      if (executing.length >= limit) {
        await Promise.race(executing)
      }
    }
  }
  
  await Promise.all(results)
  return results
}

/**
 * 分块处理大数组
 * 
 * @param {Array} array - 要处理的数组
 * @param {Function} processor - 处理函数
 * @param {Number} chunkSize - 每块大小（默认100）
 * @returns {Promise<Array>} 处理结果
 */
export async function chunkProcess(array, processor, chunkSize = 100) {
  const results = []
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize)
    const chunkResults = await Promise.all(chunk.map(processor))
    results.push(...chunkResults)
    
    // 让出主线程，避免阻塞UI
    await delay(0)
  }
  
  return results
}

/**
 * 性能监控
 * 
 * @param {String} name - 监控名称
 * @param {Function} func - 要监控的函数
 * @returns {Function} 包装后的函数
 */
export function performanceMonitor(name, func) {
  return async function monitored(...args) {
    const startTime = performance.now()
    
    try {
      const result = await func.apply(this, args)
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }
}

/**
 * 空闲时执行
 * 使用 requestIdleCallback 在浏览器空闲时执行任务
 * 
 * @param {Function} callback - 要执行的回调
 * @param {Object} options - 配置选项
 * @returns {Number} 任务ID
 */
export function runWhenIdle(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options)
  } else {
    // 降级方案
    return setTimeout(callback, 1)
  }
}

/**
 * 取消空闲任务
 * 
 * @param {Number} id - 任务ID
 */
export function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * 预加载资源
 * 
 * @param {String} url - 资源URL
 * @param {String} as - 资源类型（script, style, image等）
 */
export function preloadResource(url, as = 'script') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = url
  document.head.appendChild(link)
}

/**
 * 预连接
 * 
 * @param {String} url - 要预连接的URL
 */
export function preconnect(url) {
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = url
  document.head.appendChild(link)
}
