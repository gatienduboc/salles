<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/client.js';
import TriStateBool from '../components/TriStateBool.vue';
import { LIEU_TYPES } from '../constants/lieuTypes.js';

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
      fumee_interdite: lieu.fumee_interdite ?? null,
      confetti_interdit: lieu.confetti_interdit ?? null,
      db_limite: lieu.db_limite ?? null,
      acces_difficile: lieu.acces_difficile ?? null,
      proprio_relou: lieu.proprio_relou ?? null,
      heure_fermeture: lieu.heure_fermeture || '',
      sono_imposee: lieu.sono_imposee ?? null,
      date_dernier_evenement: lieu.date_dernier_evenement
        ? String(lieu.date_dernier_evenement).slice(0, 10)
        : '',
    });
  }
});

function buildBody() {
  const body = { ...form.value };
  if (body.db_limite === '' || body.db_limite === null) {
    body.db_limite = null;
  } else {
    body.db_limite = Number(body.db_limite);
  }
  Object.keys(body).forEach((k) => {
    if (body[k] === '') delete body[k];
  });
  return body;
}

async function submit() {
  error.value = '';
  try {
    const body = buildBody();
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
    <h2 class="form-section">Obligatoire</h2>
    <label>Nom *</label>
    <input v-model="form.nom" required />

    <label>Adresse *</label>
    <input v-model="form.adresse" required />

    <h2 class="form-section">Type de fiche</h2>
    <div class="type-radios">
      <label class="type-radio favori">
        <input v-model="form.type" type="radio" value="favori" />
        {{ LIEU_TYPES.favori.label }}
      </label>
      <label class="type-radio blacklist">
        <input v-model="form.type" type="radio" value="blacklist" />
        {{ LIEU_TYPES.blacklist.label }}
      </label>
    </div>

    <h2 class="form-section">Contact</h2>
    <label>Nom du gérant</label>
    <input v-model="form.nom_gerant" />

    <label>Téléphone</label>
    <input v-model="form.telephone" type="tel" />

    <h2 class="form-section">Contraintes & infos</h2>
    <TriStateBool v-model="form.fumee_interdite" label="Fumée interdite" />
    <TriStateBool v-model="form.confetti_interdit" label="Confettis interdits" />
    <TriStateBool v-model="form.acces_difficile" label="Accès difficile" />
    <TriStateBool v-model="form.proprio_relou" label="Proprio difficile" />
    <TriStateBool v-model="form.sono_imposee" label="Sono imposée" />

    <label>Limite sonore (dB max)</label>
    <input
      v-model.number="form.db_limite"
      type="number"
      min="0"
      placeholder="ex. 95 — laisser vide si inconnu"
    />

    <label>Heure de fermeture</label>
    <input v-model="form.heure_fermeture" placeholder="ex. 02:00" />

    <label>Date du dernier événement</label>
    <input v-model="form.date_dernier_evenement" type="date" />

    <label>Commentaire</label>
    <textarea v-model="form.commentaire" rows="4" />

    <button class="btn" type="submit">Enregistrer</button>
  </form>
</template>
