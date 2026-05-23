<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/auth.js';
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
  RADIUS_KM_MIN,
  RADIUS_KM_MAX,
  RADIUS_KM_DEFAULT,
} from '../utils/lieuQuery.js';
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

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
const meProfile = ref(null);

const radiusEnabled = computed({
  get: () => !!filters.value.radius_km,
  set: (on) => {
    if (!on) {
      filters.value.radius_km = '';
      return;
    }
    const def =
      meProfile.value?.intervention_radius_km ||
      auth.user?.intervention_radius_km ||
      RADIUS_KM_DEFAULT;
    filters.value.radius_km = Math.min(RADIUS_KM_MAX, Math.max(RADIUS_KM_MIN, def));
  },
});

const canUseRadius = computed(
  () =>
    auth.isLoggedIn &&
    meProfile.value?.city_geocoded_at &&
    meProfile.value?.city_latitude != null &&
    meProfile.value?.city_longitude != null
);

const mapCenterForRequest = computed(() => {
  if (meProfile.value?.city_latitude == null || meProfile.value?.city_longitude == null) {
    return null;
  }
  return {
    latitude: Number(meProfile.value.city_latitude),
    longitude: Number(meProfile.value.city_longitude),
    city: meProfile.value.city,
  };
});

const radiusMapCenter = computed(() =>
  filters.value.radius_km && mapCenterForRequest.value ? mapCenterForRequest.value : null
);

const pageTitle = computed(() => {
  if (filters.value.type === 'favori') return 'Lieux recommandés';
  if (filters.value.type === 'blacklist') return 'Lieux à éviter';
  return 'Lieux de réception';
});

function syncFiltersFromRoute() {
  filters.value = queryFromRoute(route.query);
}

async function refreshMeIfNeeded() {
  if (!auth.isLoggedIn) {
    meProfile.value = null;
    return;
  }
  try {
    meProfile.value = await auth.refreshUser();
  } catch {
    meProfile.value = null;
  }
}

function clampRadiusKm() {
  if (!filters.value.radius_km) return;
  const n = Number(filters.value.radius_km);
  if (!Number.isFinite(n)) {
    filters.value.radius_km = '';
    return;
  }
  filters.value.radius_km = Math.min(RADIUS_KM_MAX, Math.max(RADIUS_KM_MIN, Math.round(n)));
}

async function load() {
  loading.value = true;
  try {
    if (filters.value.radius_km) {
      await refreshMeIfNeeded();
    }
    const center = mapCenterForRequest.value;
    const listQs = buildApiParams(filters.value, { mapCenter: center });
    const mapQs = buildApiParams(filters.value, { forMap: true, mapCenter: center });
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

function onRadiusToggle() {
  if (radiusEnabled.value && !canUseRadius.value) {
    filters.value.radius_km = '';
    return;
  }
  if (radiusEnabled.value) clampRadiusKm();
  filters.value.page = 1;
  router.replace({ query: queryToRouteParams(filters.value) });
}

let radiusUrlTimer;
function scheduleRadiusUrlSync() {
  if (!radiusEnabled.value) return;
  if (!canUseRadius.value) return;
  clampRadiusKm();
  clearTimeout(radiusUrlTimer);
  radiusUrlTimer = setTimeout(() => {
    filters.value.page = 1;
    router.replace({ query: queryToRouteParams(filters.value) });
  }, 400);
}

function goPage(page) {
  filters.value.page = page;
  router.push({ query: queryToRouteParams(filters.value) });
}

onMounted(() => {
  refreshMeIfNeeded();
});

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute();
    load();
  },
  { immediate: true }
);

watch(
  () => auth.isLoggedIn,
  () => {
    refreshMeIfNeeded();
  }
);

watch(() => filters.value.radius_km, scheduleRadiusUrlSync);
</script>

<template>
  <h1>{{ pageTitle }}</h1>
  <p style="color: var(--muted)">
    <template v-if="filters.radius_km">
      {{ meta.total }} fiche(s) dans {{ filters.radius_km }} km autour de
      {{ meProfile?.city || 'votre ville' }}
    </template>
    <template v-else>{{ meta.total }} fiche(s) au total</template>
    — lecture publique, édition pour les membres connectés.
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
      <span class="map-card-meta">
        <template v-if="filters.radius_km">
          {{ mapMeta.returned }} lieu(x) sur la carte ({{ filters.radius_km }} km)
        </template>
        <template v-else>{{ mapMeta.returned }} lieu(x) affiché(s)</template>
      </span>
    </div>

    <div v-if="auth.isLoggedIn" class="map-radius-bar card">
      <label class="map-radius-toggle admin-check-label">
        <input v-model="radiusEnabled" type="checkbox" :disabled="!canUseRadius" @change="onRadiusToggle" />
        Limiter à mon rayon d'intervention
      </label>
      <template v-if="radiusEnabled && canUseRadius">
        <div class="map-radius-controls">
          <label>
            Pour cette recherche :
            <strong>{{ filters.radius_km }} km</strong>
          </label>
          <input
            v-model.number="filters.radius_km"
            type="range"
            :min="RADIUS_KM_MIN"
            :max="RADIUS_KM_MAX"
            step="5"
          />
          <input
            v-model.number="filters.radius_km"
            type="number"
            :min="RADIUS_KM_MIN"
            :max="RADIUS_KM_MAX"
            class="map-radius-input"
          />
        </div>
        <p class="field-hint">
          Centre : {{ meProfile?.city || '—' }}
          <span v-if="meProfile?.intervention_radius_km">
            — profil : {{ meProfile.intervention_radius_km }} km
          </span>
        </p>
      </template>
      <p v-else-if="!canUseRadius" class="field-hint">
        Renseignez votre ville d'exercice dans
        <RouterLink to="/compte/profil">Mon espace pro</RouterLink>
        pour activer le filtre rayon.
      </p>
    </div>

    <p v-if="mapMeta.capped" class="map-cap-note">
      Carte limitée aux {{ mapMeta.returned }} premiers lieux géocodés ({{ mapMeta.total }} au total).
    </p>
    <LieuMap
      :lieux="mapLieux"
      tall
      :radius-km="filters.radius_km || 0"
      :radius-center="radiusMapCenter"
    />
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
    <p v-if="l.auteur?.pseudo" class="lieu-meta">
      <span v-if="l.auteur.activity_label">{{ l.auteur.activity_label }}</span>
      <span v-if="l.auteur.city"> · {{ l.auteur.city }}</span>
      <span> — {{ l.auteur.pseudo }}</span>
    </p>
    <p v-if="l.geocode_error" style="color: var(--accent-soft)">Géocodage : {{ l.geocode_error }}</p>
  </article>

  <LieuPagination v-if="!loading && lieux.length" :meta="meta" @page="goPage" />
</template>
