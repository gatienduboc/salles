<script setup>
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
</script>

<template>
  <div class="account-wrap">
    <aside class="card account-nav">
      <h2>Mon compte</h2>
      <p class="account-nav-email">{{ auth.user?.email }}</p>
      <nav>
        <RouterLink to="/compte/profil">Profil</RouterLink>
        <RouterLink to="/compte/mot-de-passe">Mot de passe</RouterLink>
        <RouterLink :to="{ path: '/', query: { auteur_id: auth.user?.id } }">Mes fiches</RouterLink>
      </nav>
      <RouterLink class="account-back" to="/">← Retour aux lieux</RouterLink>
    </aside>
    <div class="account-content">
      <RouterView />
    </div>
  </div>
</template>
