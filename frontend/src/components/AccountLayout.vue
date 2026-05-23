<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();

const completion = computed(() => auth.user?.profile_completion ?? 100);

onMounted(() => {
  if (auth.isLoggedIn) auth.refreshUser().catch(() => {});
});
</script>

<template>
  <div class="account-wrap">
    <aside class="card account-nav">
      <h2>Mon espace pro</h2>
      <p v-if="completion < 100" class="account-completion">
        Profil {{ completion }} % — <RouterLink to="/compte/profil">compléter</RouterLink>
      </p>
      <p class="account-nav-email">{{ auth.user?.email }}</p>
      <p v-if="auth.user?.activity_label" class="account-nav-meta">
        {{ auth.user.activity_label }} · {{ auth.user.city }}
      </p>
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
