import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as echarts from 'echarts'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './styles/global.css'
import './styles/element-plus.css'
import './styles/responsive.css'
import './styles/animations.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.config.globalProperties.$echarts = echarts
app.use(ElementPlus, {
  locale: zhCn,
})

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app')
