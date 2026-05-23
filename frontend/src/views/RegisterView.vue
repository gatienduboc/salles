<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { PROVIDER_ACTIVITIES } from '../constants/providerActivities.js';
import VilleAutocomplete from '../components/VilleAutocomplete.vue';

const auth = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const pseudo = ref('');
const activity = ref('dj');
const city = ref('');
const postal_code = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await auth.register({
      email: email.value,
      password: password.value,
      pseudo: pseudo.value,
      activity: activity.value,
      city: city.value.trim(),
      postal_code: postal_code.value.trim() || undefined,
    });
    router.push('/compte/profil');
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <h1>Inscription pro</h1>
  <p class="account-lead">
    Répertoire partagé entre DJ, traiteurs, wedding planners, photographes et autres
    prestataires événementiel.
  </p>
  <form class="card" @submit.prevent="submit">
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>

    <h2 class="form-section">Compte</h2>
    <label>Pseudo (visible sur vos fiches) *</label>
    <input v-model="pseudo" required minlength="2" maxlength="100" />

    <label>Email *</label>
    <input v-model="email" type="email" required />

    <label>Mot de passe (8+ caractères) *</label>
    <input v-model="password" type="password" minlength="8" required />

    <h2 class="form-section">Votre activité</h2>
    <label>Secteur *</label>
    <select v-model="activity" required>
      <option v-for="a in PROVIDER_ACTIVITIES" :key="a.value" :value="a.value">
        {{ a.label }}
      </option>
    </select>

    <VilleAutocomplete
      id-prefix="register"
      v-model:city="city"
      v-model:postal-code="postal_code"
    />
    <p class="field-hint">La ville est vérifiée via OpenStreetMap à l'enregistrement.</p>

    <button class="btn" type="submit">Créer mon compte</button>
  </form>
</template>
