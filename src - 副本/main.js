import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'tailwindcss/tailwind.css'

Vue.config.productionTip = false

/* ElementUI按需引入 */
import {
  Button,
  Select,
  Input,
  Drawer,
  Option,
  Popover,
  Dialog,
  Message,
  MessageBox,
  Row,
  Col,
} from 'element-ui'
Vue.use(Button)
Vue.use(Select)
Vue.use(Input)
Vue.use(Drawer)
Vue.use(Option)
Vue.use(Popover)
Vue.use(Dialog)
Vue.use(Row)
Vue.use(Col)
Vue.prototype.$message = Message
Vue.prototype.$prompt = MessageBox.prompt

const AV = require('leancloud-storage')
AV.init({
  appId: 'do1tuZel9r533o7QIOCsBAOO-9Nh9j0Va',
  appKey: 'NU6mrnbm3pXQgb7YzY21WQ3n',
  serverURL: 'https://do1tuzel.lc-cn-e1-shared.com',
})
Vue.prototype.AV = AV

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')
