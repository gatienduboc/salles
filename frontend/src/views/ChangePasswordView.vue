<script setup>
import { ref } from 'vue';
import { api } from '../api/client.js';
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref(false);

async function submit() {
  error.value = '';
  success.value = false;
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les deux nouveaux mots de passe ne correspondent pas.';
    return;
  }
  try {
    await api('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    });
    success.value = true;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <h1>Mot de passe</h1>
  <p class="account-lead">Choisissez un mot de passe d’au moins 8 caractères.</p>
  <form class="card" @submit.prevent="submit">
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>
    <p v-if="success" style="color: var(--muted)">Mot de passe mis à jour.</p>
    <label>Mot de passe actuel</label>
    <input v-model="currentPassword" type="password" required autocomplete="current-password" />
    <label>Nouveau mot de passe (8 caractères min.)</label>
    <input
      v-model="newPassword"
      type="password"
      minlength="8"
      required
      autocomplete="new-password"
    />
    <label>Confirmer le nouveau mot de passe</label>
    <input
      v-model="confirmPassword"
      type="password"
      minlength="8"
      required
      autocomplete="new-password"
    />
    <button class="btn" type="submit">Enregistrer</button>
  </form>
</template>
