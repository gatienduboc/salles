<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { api } from '../../api/client.js';
import AdminLayout from '../../components/AdminLayout.vue';
import LieuTypeBadge from '../../components/LieuTypeBadge.vue';

const route = useRoute();
const router = useRouter();

const lieux = ref([]);
const auteurs = ref([]);
const meta = ref({ page: 1, totalPages: 1, total: 0 });
const selected = ref(new Set());
const error = ref('');
const message = ref('');

const filters = ref({
  type: '',
  search: '',
  auteur_id: '',
  sans_coords: false,
});

const bulkType = ref('blacklist');
const bulkAuteurId = ref('');

const allSelected = computed({
  get: () => lieux.value.length > 0 && lieux.value.every((l) => selected.value.has(l.id)),
  set: (v) => {
    if (v) lieux.value.forEach((l) => selected.value.add(l.id));
    else selected.value.clear();
  },
});

function syncFiltersFromRoute() {
  const q = route.query;
  filters.value = {
    type: typeof q.type === 'string' ? q.type : '',
    search: typeof q.search === 'string' ? q.search : '',
    auteur_id: q.auteur_id ? parseInt(q.auteur_id, 10) || '' : '',
    sans_coords: q.sans_coords === '1' || q.geocode_error === '1',
  };
}

function buildQuery(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (filters.value.type) params.set('type', filters.value.type);
  if (filters.value.search) params.set('search', filters.value.search);
  if (filters.value.auteur_id) params.set('auteur_id', String(filters.value.auteur_id));
  if (filters.value.sans_coords) params.set('sans_coords', '1');
  return params.toString();
}

function applyRoute(page = 1) {
  const q = {};
  if (filters.value.type) q.type = filters.value.type;
  if (filters.value.search) q.search = filters.value.search;
  if (filters.value.auteur_id) q.auteur_id = String(filters.value.auteur_id);
  if (filters.value.sans_coords) q.sans_coords = '1';
  if (page > 1) q.page = String(page);
  router.push({ query: q });
}

async function loadAuteurs() {
  const params = new URLSearchParams();
  if (filters.value.type) params.set('type', filters.value.type);
  if (filters.value.search) params.set('search', filters.value.search);
  const qs = params.toString() ? `?${params}` : '';
  const data = await api(`/lieux/auteurs${qs}`);
  auteurs.value = data.data;
}

async function load(page = parseInt(route.query.page, 10) || 1) {
  error.value = '';
  try {
    const [listData] = await Promise.all([
      api(`/admin/lieux?${buildQuery(page)}`),
      loadAuteurs(),
    ]);
    lieux.value = listData.data;
    meta.value = listData.meta;
    selected.value.clear();
  } catch (e) {
    error.value = e.message;
  }
}

function selectedIds() {
  return [...selected.value];
}

async function bulkPatch(patch) {
  const ids = selectedIds();
  if (!ids.length) {
    error.value = 'Sélectionnez au moins une fiche.';
    return;
  }
  try {
    const res = await api('/admin/lieux/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ids, patch }),
    });
    message.value = `${res.updated} fiche(s) mise(s) à jour.`;
    await load(meta.value.page);
  } catch (e) {
    error.value = e.message;
  }
}

async function bulkGeocode(useSelection = true) {
  const ids = useSelection ? selectedIds() : [];
  try {
    const res = await api('/admin/geocode/bulk', {
      method: 'POST',
      body: JSON.stringify(ids.length ? { ids } : {}),
    });
    message.value = `Géocodage : ${res.ok} OK, ${res.failed} échec(s).`;
    await load(meta.value.page);
  } catch (e) {
    error.value = e.message;
  }
}

async function bulkDelete() {
  const ids = selectedIds();
  if (!ids.length || !confirm(`Supprimer ${ids.length} fiche(s) ?`)) return;
  try {
    const res = await api('/admin/lieux/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    message.value = `${res.deleted} fiche(s) supprimée(s).`;
    await load(1);
  } catch (e) {
    error.value = e.message;
  }
}

function toggleSelect(id) {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
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
  <AdminLayout>
    <h1>Salles</h1>
    <p v-if="message" style="color: var(--muted)">{{ message }}</p>
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>

    <div class="card admin-toolbar">
      <select v-model="filters.type" @change="applyRoute(1)">
        <option value="">Tous types</option>
        <option value="favori">Recommandé</option>
        <option value="blacklist">À éviter</option>
      </select>
      <select v-model="filters.auteur_id" @change="applyRoute(1)">
        <option value="">Tous auteurs</option>
        <option v-for="a in auteurs" :key="a.id" :value="a.id">{{ a.pseudo }} ({{ a.count }})</option>
      </select>
      <input v-model="filters.search" placeholder="Recherche" @keyup.enter="applyRoute(1)" />
      <label class="admin-check-label">
        <input v-model="filters.sans_coords" type="checkbox" @change="applyRoute(1)" />
        Non géolocalisées
      </label>
      <button class="btn secondary" type="button" @click="applyRoute(1)">Filtrer</button>
    </div>

    <div v-if="selected.size" class="card admin-bulk-bar">
      <strong>{{ selected.size }} sélectionnée(s)</strong>
      <select v-model="bulkType">
        <option value="blacklist">À éviter</option>
        <option value="favori">Recommandé</option>
      </select>
      <button class="btn secondary" type="button" @click="bulkPatch({ type: bulkType })">
        Changer type
      </button>
      <select v-model="bulkAuteurId">
        <option value="">— Auteur —</option>
        <option v-for="a in auteurs" :key="a.id" :value="a.id">{{ a.pseudo }}</option>
      </select>
      <button
        class="btn secondary"
        type="button"
        :disabled="!bulkAuteurId"
        @click="bulkPatch({ auteur_id: Number(bulkAuteurId) })"
      >
        Réattribuer auteur
      </button>
      <button class="btn secondary" type="button" @click="bulkGeocode(true)">Géocoder sélection</button>
      <button class="btn secondary" type="button" @click="bulkGeocode(false)">
        Géocoder sans coords (50 max)
      </button>
      <button class="btn" type="button" @click="bulkDelete">Supprimer</button>
    </div>

    <p style="color: var(--muted)">{{ meta.total }} fiche(s)</p>

    <div class="card admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th><input v-model="allSelected" type="checkbox" /></th>
            <th>Nom</th>
            <th>Type</th>
            <th>Auteur</th>
            <th>Ville</th>
            <th>Géo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in lieux" :key="l.id">
            <td>
              <input
                type="checkbox"
                :checked="selected.has(l.id)"
                @change="toggleSelect(l.id)"
              />
            </td>
            <td>{{ l.nom }}</td>
            <td><LieuTypeBadge :type="l.type" /></td>
            <td>{{ l.auteur?.pseudo || '—' }}</td>
            <td>{{ l.ville || '—' }}</td>
            <td>
              <span
                v-if="l.geocode_error"
                class="admin-warn"
                :title="l.geocode_error"
              >✗</span>
              <span v-else-if="l.latitude != null && l.longitude != null" title="Géolocalisé">✓</span>
              <span v-else title="Pas encore géolocalisé">—</span>
            </td>
            <td class="admin-actions">
              <RouterLink :to="`/lieux/${l.id}`">Voir</RouterLink>
              <RouterLink :to="`/lieux/${l.id}/editer`">Modifier</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="meta.totalPages > 1" class="admin-toolbar">
      <button
        class="btn secondary"
        :disabled="meta.page <= 1"
        @click="applyRoute(meta.page - 1)"
      >
        Précédent
      </button>
      <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <button
        class="btn secondary"
        :disabled="meta.page >= meta.totalPages"
        @click="applyRoute(meta.page + 1)"
      >
        Suivant
      </button>
    </div>
  </AdminLayout>
</template>
