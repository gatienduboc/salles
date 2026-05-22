<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const pseudo = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await auth.register({
      email: email.value,
      password: password.value,
      pseudo: pseudo.value,
    });
    router.push('/');
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <h1>Inscription</h1>
  <form class="card" @submit.prevent="submit">
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>
    <label>Pseudo</label>
    <input v-model="pseudo" required />
    <label>Email</label>
    <input v-model="email" type="email" required />
    <label>Mot de passe (8+ caractères)</label>
    <input v-model="password" type="password" minlength="8" required />
    <button class="btn" type="submit">Créer un compte</button>
  </form>
</template>
