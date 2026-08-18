import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/all', name: 'all', component: () => import('../views/AllView.vue') },
  { path: '/fav', name: 'fav', component: () => import('../views/FavView.vue') },
  { path: '/cat/:id', name: 'category', component: () => import('../views/CategoryView.vue') },
  { path: '/tool/:id', name: 'tool', component: () => import('../views/ToolView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router