import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/layout/index"
import store from "@/store";
const routes = [
  {
    path: "/",
    name:"home",
    component:Layout,
    redirect:'/app',
    children:[
      {
        path:'login',
        name:'Login',
        component:()=> import("@/views/login/index.vue")
      },
      {
        path:'/app',
        name:"App",
        meta:{
          requireAuth: true
        },
        component:()=>import("@/views/app/index")
      }
      
    ]
  }

];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 全局前置路由守卫，控制登录
router.beforeEach((to, from, next) => {
  
  const token = store.getters['user/isLogin']
  if (!token && to.name !== 'Login') {
      next({
          name: 'Login',
      })
  } else {
      next()
  }
})

export default router;
