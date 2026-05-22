<script setup>
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import LieuMap from '../components/LieuMap.vue';
import LieuFilters from '../components/LieuFilters.vue';
import LieuTypeBadge from '../components/LieuTypeBadge.vue';
import { getLieuType } from '../constants/lieuTypes.js';

const lieux = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, counts: { blacklist: 0, favori: 0 } });
const loading = ref(false);
const filters = ref({ ville: '', search: '', type: '' });

const pageTitle = computed(() => {
  if (filters.value.type === 'favori') return 'Lieux recommandés';
  if (filters.value.type === 'blacklist') return 'Lieux à éviter';
  return 'Lieux de réception';
});

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
  <h1>{{ pageTitle }}</h1>
  <p style="color: var(--muted)">
    {{ meta.total }} fiche(s) affichée(s) — lecture publique, édition pour les membres connectés.
  </p>

  <LieuFilters v-model="filters" :counts="meta.counts" @apply="load" />

  <div class="card">
    <h2>Carte</h2>
    <LieuMap :lieux="lieux" />
  </div>

  <p v-if="loading">Chargement…</p>

  <article v-for="l in lieux" :key="l.id" class="card lieu-card">
    <div class="lieu-card-header">
      <h3>
        <RouterLink :to="`/lieux/${l.id}`">{{ l.nom }}</RouterLink>
      </h3>
      <LieuTypeBadge :type="l.type" />
    </div>
    <p>{{ l.adresse }}</p>
    <p v-if="l.ville" style="color: var(--muted)">{{ l.ville }}</p>
    <p v-if="l.auteur?.pseudo" class="lieu-meta">Fiche par {{ l.auteur.pseudo }}</p>
    <p v-if="l.geocode_error" style="color: var(--accent-soft)">Géocodage : {{ l.geocode_error }}</p>
  </article>
</template>
