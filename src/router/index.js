import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

/**
 * 路由表
 * 书签页是主入口，登录页与留言板都在同一套布局内切换。
 */
const routes = [
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/app',
    children: [
      {
        path: 'app',
        name: 'bookmarks',
        component: () => import('@/views/bookmarks/BookmarkView.vue'),
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
      },
      {
        path: 'messageboard',
        name: 'messageBoard',
        component: () => import('@/views/message/MessageBoardView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    redirect: '/app',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
