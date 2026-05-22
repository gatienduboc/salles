<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import LieuMap from '../components/LieuMap.vue';
import LieuFilters from '../components/LieuFilters.vue';
import LieuPagination from '../components/LieuPagination.vue';
import LieuTypeBadge from '../components/LieuTypeBadge.vue';
import LieuVote from '../components/LieuVote.vue';
import {
  queryFromRoute,
  queryToRouteParams,
  buildApiParams,
  DEFAULT_LIST_QUERY,
} from '../utils/lieuQuery.js';

const route = useRoute();
const router = useRouter();

const filters = ref({ ...DEFAULT_LIST_QUERY });
const lieux = ref([]);
const mapLieux = ref([]);
const mapMeta = ref({ capped: false, total: 0, returned: 0 });
const meta = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false,
  counts: { blacklist: 0, favori: 0 },
});
const loading = ref(false);
const auteurs = ref([]);

const pageTitle = computed(() => {
  if (filters.value.type === 'favori') return 'Lieux recommandés';
  if (filters.value.type === 'blacklist') return 'Lieux à éviter';
  return 'Lieux de réception';
});

function syncFiltersFromRoute() {
  filters.value = queryFromRoute(route.query);
}

async function load() {
  loading.value = true;
  try {
    const listQs = buildApiParams(filters.value);
    const mapQs = buildApiParams(filters.value, { forMap: true });
    const auteursQs = buildApiParams(filters.value, { forMap: true, omitAuteur: true });
    const [listData, mapData, auteursData] = await Promise.all([
      api(`/lieux${listQs}`),
      api(`/lieux/map${mapQs}`),
      api(`/lieux/auteurs${auteursQs}`),
    ]);
    auteurs.value = auteursData.data;
    lieux.value = listData.data;
    meta.value = listData.meta;
    mapLieux.value = mapData.data;
    mapMeta.value = mapData.meta;
    if (meta.value.page !== filters.value.page) {
      filters.value.page = meta.value.page;
      router.replace({ query: queryToRouteParams(filters.value) });
    }
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  filters.value.page = 1;
  router.push({ query: queryToRouteParams(filters.value) });
}

function goPage(page) {
  filters.value.page = page;
  router.push({ query: queryToRouteParams(filters.value) });
}

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute();
    load();
  },
  { immediate: true }
);
</script>

<template>
  <h1>{{ pageTitle }}</h1>
  <p style="color: var(--muted)">
    {{ meta.total }} fiche(s) au total — lecture publique, édition pour les membres connectés.
  </p>

  <LieuFilters
    v-model="filters"
    :counts="meta.counts"
    :auteurs="auteurs"
    @apply="applyFilters"
  />

  <div class="card map-card">
    <div class="map-card-head">
      <h2>Carte</h2>
      <span class="map-card-meta">{{ mapMeta.returned }} lieu(x) affiché(s)</span>
    </div>
    <p v-if="mapMeta.capped" class="map-cap-note">
      Carte limitée aux {{ mapMeta.returned }} premiers lieux géocodés ({{ mapMeta.total }} au total).
    </p>
    <LieuMap :lieux="mapLieux" tall />
  </div>

  <p v-if="loading">Chargement…</p>

  <LieuPagination v-else :meta="meta" @page="goPage" />

  <article v-for="l in lieux" :key="l.id" class="card lieu-card">
    <div class="lieu-card-header">
      <h3>
        <RouterLink :to="`/lieux/${l.id}`">{{ l.nom }}</RouterLink>
      </h3>
      <LieuTypeBadge :type="l.type" />
    </div>
    <p>{{ l.adresse }}</p>
    <LieuVote
      :lieu-id="l.id"
      :rating="l.rating"
      compact
      @updated="(r) => (l.rating = r)"
    />
    <p v-if="l.ville" style="color: var(--muted)">{{ l.ville }}</p>
    <p v-if="l.auteur?.pseudo" class="lieu-meta">Fiche par {{ l.auteur.pseudo }}</p>
    <p v-if="l.geocode_error" style="color: var(--accent-soft)">Géocodage : {{ l.geocode_error }}</p>
  </article>

  <LieuPagination v-if="!loading && lieux.length" :meta="meta" @page="goPage" />
</template>
