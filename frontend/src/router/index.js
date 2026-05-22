import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LieuDetailView from '../views/LieuDetailView.vue';
import LieuFormView from '../views/LieuFormView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import { useAuthStore } from '../stores/auth.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/lieux/:id', name: 'lieu-detail', component: LieuDetailView },
    { path: '/lieux/nouveau', name: 'lieu-new', component: LieuFormView, meta: { auth: true } },
    { path: '/lieux/:id/editer', name: 'lieu-edit', component: LieuFormView, meta: { auth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
  ],
});

router.beforeEach((to) => {
  if (to.meta.auth && !useAuthStore().isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
});

export default router;
