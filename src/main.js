import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api'

import 'tailwindcss/tailwind.css'
import 'element-plus/dist/index.css'
import './styles/base.css'

const app = createApp(App)

// 令牌失效时统一跳转登录页（http 层不直接依赖路由）
setUnauthorizedHandler(() => {
  if (router.currentRoute.value.name !== 'login') router.push('/login')
})

app.use(router).mount('#app')
