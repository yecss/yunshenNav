import Vue from 'vue'
import App from './App.vue'
import router from './router'
import "tailwindcss/tailwind.css"

Vue.config.productionTip = false


/* ElementUI按需引入 */
import { Button, Select,Input,Drawer,Option,Popover,Dialog,Message,MessageBox } from 'element-ui';
Vue.use(Button)
Vue.use(Select)
Vue.use(Input)
Vue.use(Drawer)
Vue.use(Option)
Vue.use(Popover)
Vue.use(Dialog)
Vue.prototype.$message = Message
Vue.prototype.$prompt = MessageBox.prompt
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
