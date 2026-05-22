<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/auth.js';
import LieuMap from '../components/LieuMap.vue';
import LieuTypeBadge from '../components/LieuTypeBadge.vue';

const route = useRoute();
const auth = useAuthStore();
const lieu = ref(null);
const uploadFiles = ref(null);

function fmtBool(v) {
  if (v === null || v === undefined) return null;
  return v ? 'Oui' : 'Non';
}

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
  <template v-if="lieu">
    <div class="lieu-card-header">
      <h1>{{ lieu.nom }}</h1>
      <LieuTypeBadge :type="lieu.type" />
    </div>
    <p>{{ lieu.adresse }}</p>
    <p v-if="lieu.ville">
      Ville : {{ lieu.ville }}
      <span v-if="lieu.code_postal">({{ lieu.code_postal }})</span>
    </p>

    <div class="card detail-grid">
      <dl>
        <template v-if="lieu.auteur?.pseudo">
          <dt>Auteur</dt>
          <dd>{{ lieu.auteur.pseudo }}</dd>
        </template>
        <template v-if="lieu.nom_gerant">
          <dt>Gérant</dt>
          <dd>{{ lieu.nom_gerant }}</dd>
        </template>
        <template v-if="lieu.telephone">
          <dt>Téléphone</dt>
          <dd>{{ lieu.telephone }}</dd>
        </template>
        <template v-if="lieu.heure_fermeture">
          <dt>Heure de fermeture</dt>
          <dd>{{ lieu.heure_fermeture }}</dd>
        </template>
        <template v-if="lieu.date_dernier_evenement">
          <dt>Dernier événement</dt>
          <dd>{{ lieu.date_dernier_evenement }}</dd>
        </template>
        <template v-if="lieu.db_limite != null">
          <dt>Limite sonore</dt>
          <dd>{{ lieu.db_limite }} dB</dd>
        </template>
        <template v-if="fmtBool(lieu.fumee_interdite)">
          <dt>Fumée interdite</dt>
          <dd>{{ fmtBool(lieu.fumee_interdite) }}</dd>
        </template>
        <template v-if="fmtBool(lieu.confetti_interdit)">
          <dt>Confettis interdits</dt>
          <dd>{{ fmtBool(lieu.confetti_interdit) }}</dd>
        </template>
        <template v-if="fmtBool(lieu.acces_difficile)">
          <dt>Accès difficile</dt>
          <dd>{{ fmtBool(lieu.acces_difficile) }}</dd>
        </template>
        <template v-if="fmtBool(lieu.proprio_relou)">
          <dt>Proprio difficile</dt>
          <dd>{{ fmtBool(lieu.proprio_relou) }}</dd>
        </template>
        <template v-if="fmtBool(lieu.sono_imposee)">
          <dt>Sono imposée</dt>
          <dd>{{ fmtBool(lieu.sono_imposee) }}</dd>
        </template>
      </dl>
    </div>

    <p v-if="lieu.commentaire" class="card">{{ lieu.commentaire }}</p>
    <p v-if="lieu.geocode_error" style="color: var(--accent-soft)">{{ lieu.geocode_error }}</p>

    <div class="card map-wrap" style="height: 300px">
      <LieuMap :lieux="[lieu]" />
    </div>

    <div v-if="lieu.photos?.length" class="card">
      <h3>Photos</h3>
      <div class="photo-row">
        <a v-for="p in lieu.photos" :key="p.id" :href="p.url" target="_blank">
          <img :src="p.url" :alt="p.filename" />
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
