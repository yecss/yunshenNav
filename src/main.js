import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'tailwindcss/tailwind.css'
/* 代码高亮 start*/
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
Vue.directive('highlight', function (el) {
  let blocks = el.querySelectorAll('pre code')
  blocks.forEach((block) => {
    hljs.highlightElement(block)
  })
})
/* 代码高亮 end */

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
new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')
