import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 图片懒加载组合式函数
 * 使用 Intersection Observer API 实现图片懒加载
 * 
 * @param {Object} options - 配置选项
 * @param {String} options.rootMargin - 提前加载的边距（默认'50px'）
 * @param {Number} options.threshold - 触发加载的阈值（默认0.01）
 * @returns {Object} 懒加载相关的方法和引用
 */
export function useImageLazyLoad(options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.01
  } = options

  const observer = ref(null)
  const images = ref(new Set())

  // 初始化 Intersection Observer
  const initObserver = () => {
    if ('IntersectionObserver' in window) {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target
              const src = img.dataset.src
              
              if (src) {
                // 加载图片
                img.src = src
                img.removeAttribute('data-src')
                
                // 添加加载完成类
                img.onload = () => {
                  img.classList.add('loaded')
                }
                
                // 停止观察已加载的图片
                observer.value.unobserve(img)
                images.value.delete(img)
              }
            }
          })
        },
        {
          rootMargin,
          threshold
        }
      )
    }
  }

  // 观察图片元素
  const observe = (el) => {
    if (observer.value && el) {
      observer.value.observe(el)
      images.value.add(el)
    }
  }

  // 取消观察图片元素
  const unobserve = (el) => {
    if (observer.value && el) {
      observer.value.unobserve(el)
      images.value.delete(el)
    }
  }

  // 清理所有观察
  const cleanup = () => {
    if (observer.value) {
      images.value.forEach((img) => {
        observer.value.unobserve(img)
      })
      images.value.clear()
      observer.value.disconnect()
    }
  }

  onMounted(() => {
    initObserver()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    observe,
    unobserve,
    cleanup
  }
}

/**
 * 图片预加载
 * 
 * @param {String|Array} urls - 图片URL或URL数组
 * @returns {Promise} 加载完成的Promise
 */
export function preloadImages(urls) {
  const urlArray = Array.isArray(urls) ? urls : [urls]
  
  const promises = urlArray.map((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  })
  
  return Promise.all(promises)
}

/**
 * 图片压缩
 * 
 * @param {File} file - 图片文件
 * @param {Object} options - 压缩选项
 * @param {Number} options.maxWidth - 最大宽度（默认1920）
 * @param {Number} options.maxHeight - 最大高度（默认1080）
 * @param {Number} options.quality - 压缩质量（默认0.8）
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
export function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        let { width, height } = img
        
        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Image compression failed'))
            }
          },
          file.type || 'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * 获取图片尺寸
 * 
 * @param {String} url - 图片URL
 * @returns {Promise<Object>} 包含width和height的对象
 */
export function getImageSize(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      })
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}
