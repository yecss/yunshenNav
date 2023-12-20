import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import 'tailwindcss/tailwind.css'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/dist/index.css'


/* 全局注册 */
import { ElMessageBox,ElMessage } from 'element-plus';


const app = createApp(App);

app.use(ElMessageBox);
app.use(ElMessage);

app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$prompt = ElMessageBox.prompt;
app.config.globalProperties.$alert = ElMessageBox.alert;

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}


app.use(store).use(router).mount("#app");
