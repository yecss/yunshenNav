import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import ToJson from '../views/ToJson.vue'

Vue.use(VueRouter)

const routes = [
  {
    name:'Home',
    path:'/home',
    component:Home
  },
  {
    name:'ToJson',
    path:'/tojson',
    component:ToJson
  },
  //重定向
  {
    path:'/',
    redirect: '/home'
  }
]

const router = new VueRouter({
  mode:'history',
  routes
})

export default router
