import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/demo1' },
  { path: '/demo1', component: () => import('../components/Demo1.vue') },
  { path: '/demo2', component: () => import('../components/Demo2.vue') },
  { path: '/demo3', component: () => import('../components/Demo3.vue') },
  { path: '/demo4', component: () => import('../components/Demo4.vue') },
  { path: '/demo5', component: () => import('../components/Demo5.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router