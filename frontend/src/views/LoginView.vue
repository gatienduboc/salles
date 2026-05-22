<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await auth.login({ email: email.value, password: password.value });
    router.push(route.query.redirect || '/');
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <h1>Connexion</h1>
  <form class="card" @submit.prevent="submit">
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>
    <label>Email</label>
    <input v-model="email" type="email" required />
    <label>Mot de passe</label>
    <input v-model="password" type="password" required />
    <button class="btn" type="submit">Se connecter</button>
  </form>
</template>
