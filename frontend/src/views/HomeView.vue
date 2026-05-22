<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import LieuMap from '../components/LieuMap.vue';
import LieuFilters from '../components/LieuFilters.vue';

const lieux = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0 });
const loading = ref(false);
const filters = ref({ ville: '', search: '', type: '' });

async function load() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.value.ville) params.set('ville', filters.value.ville);
    if (filters.value.search) params.set('search', filters.value.search);
    if (filters.value.type) params.set('type', filters.value.type);
    params.set('page', '1');
    params.set('limit', '100');
    const qs = params.toString() ? `?${params}` : '';
    const data = await api(`/lieux${qs}`);
    lieux.value = data.data;
    meta.value = data.meta;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <h1>Lieux de réception</h1>
  <p style="color: var(--muted)">{{ meta.total }} fiche(s) — lecture publique, édition pour les membres connectés.</p>

  <LieuFilters v-model="filters" @apply="load" />

  <div class="card">
    <h2>Carte</h2>
    <LieuMap :lieux="lieux" />
  </div>

  <p v-if="loading">Chargement…</p>

  <article v-for="l in lieux" :key="l.id" class="card">
    <h3>
      <RouterLink :to="`/lieux/${l.id}`">{{ l.nom }}</RouterLink>
    </h3>
    <p>{{ l.adresse }}</p>
    <p v-if="l.ville" style="color: var(--muted)">{{ l.ville }}</p>
    <p v-if="l.geocode_error" style="color: var(--accent-soft)">Géocodage : {{ l.geocode_error }}</p>
  </article>
</template>
