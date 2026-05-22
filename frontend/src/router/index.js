import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LieuDetailView from '../views/LieuDetailView.vue';
import LieuFormView from '../views/LieuFormView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminUsersView from '../views/admin/AdminUsersView.vue';
import AdminLieuxView from '../views/admin/AdminLieuxView.vue';
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
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { auth: true, admin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { auth: true, admin: true },
    },
    {
      path: '/admin/lieux',
      name: 'admin-lieux',
      component: AdminLieuxView,
      meta: { auth: true, admin: true },
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.auth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.admin && !auth.isAdmin) {
    return { name: 'home' };
  }
});

export default router;
