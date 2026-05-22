<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/auth.js';
import LieuMap from '../components/LieuMap.vue';

const route = useRoute();
const auth = useAuthStore();
const lieu = ref(null);
const error = ref('');
const uploadFiles = ref(null);

async function load() {
  lieu.value = await api(`/lieux/${route.params.id}`);
}

async function uploadPhotos() {
  if (!uploadFiles.value?.length) return;
  const fd = new FormData();
  for (const f of uploadFiles.value) fd.append('photos', f);
  await api(`/lieux/${route.params.id}/photos`, { method: 'POST', body: fd });
  uploadFiles.value = null;
  await load();
}

async function deleteLieu() {
  if (!confirm('Supprimer cette fiche ?')) return;
  await api(`/lieux/${route.params.id}`, { method: 'DELETE' });
  window.location.href = '/';
}

onMounted(load);
</script>

<template>
  <p v-if="error">{{ error }}</p>
  <template v-if="lieu">
    <h1>{{ lieu.nom }}</h1>
    <p>{{ lieu.adresse }}</p>
    <p v-if="lieu.ville">Ville : {{ lieu.ville }} <span v-if="lieu.code_postal">({{ lieu.code_postal }})</span></p>
    <p v-if="lieu.commentaire">{{ lieu.commentaire }}</p>
    <p v-if="lieu.geocode_error" style="color: var(--accent-soft)">{{ lieu.geocode_error }}</p>

    <div class="card map-wrap" style="height: 300px">
      <LieuMap :lieux="[lieu]" />
    </div>

    <div v-if="lieu.photos?.length" class="card">
      <h3>Photos</h3>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
        <a v-for="p in lieu.photos" :key="p.id" :href="p.url" target="_blank">
          <img :src="p.url" :alt="p.filename" style="max-height: 120px; border-radius: 6px" />
        </a>
      </div>
    </div>

    <div v-if="auth.isLoggedIn" class="card">
      <h3>Ajouter des photos</h3>
      <input type="file" multiple accept="image/*" @change="(e) => (uploadFiles = e.target.files)" />
      <button class="btn" @click="uploadPhotos">Envoyer</button>
      <RouterLink class="btn secondary" :to="`/lieux/${lieu.id}/editer`">Modifier</RouterLink>
      <button class="btn secondary" style="margin-left: 0.5rem" @click="deleteLieu">Supprimer</button>
    </div>
  </template>
</template>
