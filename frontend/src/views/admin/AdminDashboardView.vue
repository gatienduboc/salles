<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../../api/client.js';
import AdminLayout from '../../components/AdminLayout.vue';

const stats = ref(null);
const error = ref('');

onMounted(async () => {
  try {
    stats.value = await api('/admin/stats');
  } catch (e) {
    error.value = e.message;
  }
});
</script>

<template>
  <AdminLayout>
    <h1>Tableau de bord</h1>
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>
    <template v-if="stats">
      <div class="admin-stats">
        <div class="card admin-stat">
          <span class="admin-stat-label">Utilisateurs</span>
          <strong>{{ stats.users.total }}</strong>
          <small>{{ stats.users.admins }} admin(s)</small>
        </div>
        <div class="card admin-stat">
          <span class="admin-stat-label">Salles</span>
          <strong>{{ stats.lieux.total }}</strong>
          <small>{{ stats.lieux.favori }} recomm. / {{ stats.lieux.blacklist }} à éviter</small>
        </div>
        <div class="card admin-stat">
          <span class="admin-stat-label">Non géolocalisées</span>
          <strong>{{ stats.lieux.sans_coords }}</strong>
          <small v-if="stats.lieux.geocode_error">
            dont {{ stats.lieux.geocode_error }} échec(s) de géocodage
          </small>
          <RouterLink v-if="stats.lieux.sans_coords" to="/admin/lieux?sans_coords=1">Gérer →</RouterLink>
        </div>
        <div class="card admin-stat">
          <span class="admin-stat-label">Photos</span>
          <strong>{{ stats.photos.total }}</strong>
        </div>
      </div>

      <div class="card">
        <h3>Top auteurs</h3>
        <ul class="admin-list">
          <li v-for="a in stats.lieux_par_auteur" :key="a.id">
            {{ a.pseudo }} — {{ a.count }} fiche(s)
          </li>
        </ul>
      </div>

      <div class="card">
        <h3>Dernières mises à jour</h3>
        <ul class="admin-list">
          <li v-for="l in stats.lieux_recents" :key="l.id">
            <RouterLink :to="`/lieux/${l.id}`">{{ l.nom }}</RouterLink>
            — {{ l.auteur || '?' }} ({{ l.type }})
          </li>
        </ul>
      </div>
    </template>
  </AdminLayout>
</template>
