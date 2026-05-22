<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/client.js';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id && route.name === 'lieu-edit');

const form = ref({
  nom: '',
  adresse: '',
  type: 'blacklist',
  commentaire: '',
  nom_gerant: '',
  telephone: '',
  fumee_interdite: null,
  confetti_interdit: null,
  db_limite: null,
  acces_difficile: null,
  proprio_relou: null,
  heure_fermeture: '',
  sono_imposee: null,
  date_dernier_evenement: '',
});

const error = ref('');

onMounted(async () => {
  if (isEdit.value) {
    const lieu = await api(`/lieux/${route.params.id}`);
    Object.assign(form.value, {
      nom: lieu.nom,
      adresse: lieu.adresse,
      type: lieu.type,
      commentaire: lieu.commentaire || '',
      nom_gerant: lieu.nom_gerant || '',
      telephone: lieu.telephone || '',
      fumee_interdite: lieu.fumee_interdite,
      confetti_interdit: lieu.confetti_interdit,
      db_limite: lieu.db_limite,
      acces_difficile: lieu.acces_difficile,
      proprio_relou: lieu.proprio_relou,
      heure_fermeture: lieu.heure_fermeture || '',
      sono_imposee: lieu.sono_imposee,
      date_dernier_evenement: lieu.date_dernier_evenement || '',
    });
  }
});

async function submit() {
  error.value = '';
  try {
    const body = { ...form.value };
    Object.keys(body).forEach((k) => {
      if (body[k] === '' || body[k] === null) delete body[k];
    });
    if (isEdit.value) {
      await api(`/lieux/${route.params.id}`, { method: 'PUT', body: JSON.stringify(body) });
      router.push(`/lieux/${route.params.id}`);
    } else {
      const created = await api('/lieux', { method: 'POST', body: JSON.stringify(body) });
      router.push(`/lieux/${created.id}`);
    }
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <h1>{{ isEdit ? 'Modifier' : 'Nouveau' }} lieu</h1>
  <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>

  <form class="card" @submit.prevent="submit">
    <label>Nom *</label>
    <input v-model="form.nom" required />

    <label>Adresse *</label>
    <input v-model="form.adresse" required />

    <label>Type</label>
    <select v-model="form.type">
      <option value="blacklist">Blacklist</option>
      <option value="favori">Favori</option>
    </select>

    <label>Commentaire</label>
    <textarea v-model="form.commentaire" rows="4" />

    <label>Nom gérant</label>
    <input v-model="form.nom_gerant" />

    <label>Téléphone</label>
    <input v-model="form.telephone" />

    <button class="btn" type="submit">Enregistrer</button>
  </form>
</template>
