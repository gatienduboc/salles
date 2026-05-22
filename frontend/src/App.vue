<script setup>
import { onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth.js';

const auth = useAuthStore();

onMounted(() => {
  if (auth.isLoggedIn && !auth.user?.role) auth.refreshUser().catch(() => {});
});
</script>

<template>
  <nav class="nav">
    <RouterLink class="brand" to="/">Salles</RouterLink>
    <RouterLink to="/">Lieux</RouterLink>
    <RouterLink v-if="auth.isLoggedIn" to="/lieux/nouveau">Ajouter</RouterLink>
    <RouterLink v-if="auth.isAdmin" to="/admin">Administration</RouterLink>
    <span style="margin-left: auto" />
    <template v-if="auth.isLoggedIn">
      <span>{{ auth.user?.pseudo }}</span>
      <button class="btn secondary" @click="auth.logout()">Déconnexion</button>
    </template>
    <template v-else>
      <RouterLink to="/login">Connexion</RouterLink>
      <RouterLink to="/register">Inscription</RouterLink>
    </template>
  </nav>
  <main class="container">
    <RouterView />
  </main>
</template>
