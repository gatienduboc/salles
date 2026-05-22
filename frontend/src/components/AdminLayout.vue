<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="admin-wrap">
    <nav class="admin-nav card">
      <h2>Administration</h2>
      <RouterLink to="/admin">Tableau de bord</RouterLink>
      <RouterLink to="/admin/users">Utilisateurs</RouterLink>
      <RouterLink to="/admin/lieux">Salles</RouterLink>
      <RouterLink class="admin-back" to="/">← Retour au site</RouterLink>
    </nav>
    <div class="admin-content">
      <slot />
    </div>
  </div>
</template>
