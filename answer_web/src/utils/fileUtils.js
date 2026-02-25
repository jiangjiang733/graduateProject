/**
 * 文件工具函数
 * 后端静态文件存储在：D:/Graduation project/uploads/
 * 后端通过 /uploads/** 提供访问，Vite 已配置代理：/uploads -> http://localhost:8088/uploads
 * 所以所有附件 URL 构建规则：/uploads/<存储路径>
 * 例：DB 中存的是 "homework/xxx.pdf" → 访问路径 /uploads/homework/xxx.pdf
 */

/**
 * 将数据库中存储的相对路径转换为可访问的 URL
 * @param {string} filePath 数据库存储路径，如 "homework/xxx.pdf"
 * @returns {string} 可访问的完整路径
 */
export function buildFileUrl(filePath) {
    if (!filePath) return ''
    // 已经是完整 URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
    // 已经以 /uploads/ 开头
    if (filePath.startsWith('/uploads/')) return filePath
    // 相对路径，加上 /uploads/ 前缀（通过 Vite proxy 转发到后端）
    return `/uploads/${filePath}`
}

/**
 * 从文件路径中提取文件名
 * @param {string} filePath
 * @returns {string}
 */
export function getFileName(filePath) {
    if (!filePath) return '附件'
    const parts = filePath.split('/')
    return parts[parts.length - 1] || '附件'
}

/**
 * 触发文件下载（不是在浏览器中预览）
 * @param {string} filePath 文件路径（数据库存储路径）
 * @param {string} [fileName] 自定义下载文件名
 */
export function downloadFile(filePath, fileName) {
    if (!filePath) {
        console.warn('文件路径为空，无法下载')
        return
    }
    const url = buildFileUrl(filePath)
    const name = fileName || getFileName(filePath)
    // 使用 fetch + Blob 方式下载，确保触发下载而非预览
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.blob()
        })
        .then(blob => {
            const a = document.createElement('a')
            const objectUrl = URL.createObjectURL(blob)
            a.href = objectUrl
            a.download = name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(objectUrl)
        })
        .catch(err => {
            // fallback：直接打开链接
            console.warn('Fetch 下载失败，使用 fallback:', err)
            const a = document.createElement('a')
            a.href = url
            a.download = name
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        })
}
