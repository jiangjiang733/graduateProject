import { defineStore } from 'pinia'

/**
 * 获取当前用户的唯一标识符
 * @returns {string} 用户唯一标识
 */
function getCurrentUserId() {
    // 尝试获取教师ID或学生ID
    const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('t_id')
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('s_id')
    return teacherId || studentId || 'guest'
}

/**
 * 获取当前用户的主题存储键
 * @returns {string} 存储键
 */
function getThemeStorageKey() {
    const userId = getCurrentUserId()
    return `user_${userId}_theme`
}

/**
 * 获取当前用户的语言存储键
 * @returns {string} 存储键
 */
function getLanguageStorageKey() {
    const userId = getCurrentUserId()
    return `user_${userId}_lang`
}

/**
 * 获取当前用户的字体大小存储键
 * @returns {string} 存储键
 */
function getFontSizeStorageKey() {
    const userId = getCurrentUserId()
    return `user_${userId}_font_size`
}

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        theme: 'light',
        language: 'zh-CN',
        fontSize: 15,
        _isInitialized: false,
        _currentUserId: ''
    }),

    actions: {
        /**
         * 从 localStorage 加载当前用户的设置
         */
        loadUserSettings() {
            const userId = getCurrentUserId()

            // 如果用户ID变化了，重新加载设置
            if (this._currentUserId !== userId) {
                this._currentUserId = userId

                // 加载当前用户的主题设置，如果没有则使用默认值
                const themeKey = getThemeStorageKey()
                const savedTheme = localStorage.getItem(themeKey)
                this.theme = savedTheme || 'light'

                // 加载语言设置
                const langKey = getLanguageStorageKey()
                const savedLang = localStorage.getItem(langKey)
                this.language = savedLang || 'zh-CN'

                // 加载字体大小设置
                const fontKey = getFontSizeStorageKey()
                const savedFontSize = localStorage.getItem(fontKey)
                this.fontSize = savedFontSize ? parseInt(savedFontSize) : 15

                console.log(`[Settings] 加载用户 ${userId} 的设置: theme=${this.theme}`)
            }
        },

        applyTheme() {
            const body = document.body
            const doc = document.documentElement

            if (this.theme === 'dark' || (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                body.classList.add('dark-theme')
                doc.classList.add('dark')
            } else {
                body.classList.remove('dark-theme')
                doc.classList.remove('dark')
            }
        },

        applyFontSize() {
            const scale = this.fontSize / 15
            document.documentElement.style.setProperty('--global-scale', scale.toString())
            document.documentElement.style.fontSize = `${this.fontSize}px`
        },

        initSettings() {
            // 防止重复初始化
            if (this._isInitialized) {
                console.log('[Settings] 已初始化，跳过重复调用')
                return
            }

            // 首先加载当前用户的设置
            this.loadUserSettings()

            this.applyTheme()
            this.applyFontSize()

            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.theme === 'system') this.applyTheme()
            })

            // 开启实时监听应用状态变化并自动应用
            // 使用标志位避免在 saveUserSettings 中再次触发
            let isSaving = false
            this.$subscribe(() => {
                if (isSaving) return
                this.applyTheme()
                this.applyFontSize()
                isSaving = true
                this.saveUserSettings()
                isSaving = false
            })

            this._isInitialized = true
            console.log('[Settings] 初始化完成')
        },

        /**
         * 保存当前用户的设置到 localStorage
         */
        saveUserSettings() {
            const themeKey = getThemeStorageKey()
            const langKey = getLanguageStorageKey()
            const fontKey = getFontSizeStorageKey()

            localStorage.setItem(themeKey, this.theme)
            localStorage.setItem(langKey, this.language)
            localStorage.setItem(fontKey, this.fontSize.toString())
        },

        saveAll() {
            this.saveUserSettings()
            this.applyTheme()
            this.applyFontSize()
            console.log('[Settings] 设置已保存')
        },

        /**
         * 当用户登录或切换时刷新设置
         */
        refreshForCurrentUser() {
            this._currentUserId = '' // 重置以强制重新加载
            this.loadUserSettings()
            this.applyTheme()
            this.applyFontSize()
        },

        /**
         * 退出登录时重置为默认设置（亮色主题）
         * 这确保了公共页面始终显示亮色主题
         */
        resetToDefault() {
            this.theme = 'light'
            this.language = 'zh-CN'
            this.fontSize = 15
            this._currentUserId = ''

            // 移除暗黑主题样式
            document.body.classList.remove('dark-theme')
            document.documentElement.classList.remove('dark')

            console.log('[Settings] 已重置为默认设置')
        }
    }
})

