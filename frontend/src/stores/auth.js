import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../api/client.js';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'));
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function refreshUser() {
    if (!token.value) return;
    const me = await api('/auth/me');
    user.value = me;
    persist();
    return me;
  }

  function setSession(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    persist();
  }

  function persist() {
    if (token.value) {
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async function register(payload) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    token.value = data.token;
    user.value = data.user;
    persist();
    return data;
  }

  async function login(payload) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    token.value = data.token;
    user.value = data.user;
    persist();
    return data;
  }

  function logout() {
    token.value = null;
    user.value = null;
    persist();
    api('/auth/logout', { method: 'POST' }).catch(() => {});
  }

  return { token, user, isLoggedIn, isAdmin, register, login, logout, refreshUser, setSession };
});
