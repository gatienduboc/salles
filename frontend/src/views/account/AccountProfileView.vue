<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const pseudo = ref('');
const error = ref('');
const message = ref('');
const profile = ref(null);

onMounted(async () => {
  try {
    profile.value = await auth.refreshUser();
    pseudo.value = profile.value.pseudo;
  } catch (e) {
    error.value = e.message;
  }
});

async function submit() {
  error.value = '';
  message.value = '';
  try {
    const data = await api('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ pseudo: pseudo.value.trim() }),
    });
    auth.setSession(data.token, data);
    profile.value = data;
    message.value = 'Profil mis à jour.';
  } catch (e) {
    error.value = e.message;
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
</script>

<template>
  <h1>Profil</h1>
  <p class="account-lead">Personnalisez votre compte. L’adresse e-mail ne peut pas être modifiée ici.</p>

  <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>
  <p v-if="message" style="color: var(--muted)">{{ message }}</p>

  <form v-if="profile" class="card" @submit.prevent="submit">
    <label>Pseudo (affiché sur vos fiches)</label>
    <input v-model="pseudo" required minlength="2" maxlength="100" />

    <label>Email</label>
    <input :value="profile.email" type="email" disabled class="input-readonly" />
    <p class="field-hint">Contactez un administrateur pour changer l’email.</p>

    <label>Rôle</label>
    <input :value="profile.role === 'admin' ? 'Administrateur' : 'Membre'" disabled class="input-readonly" />

    <button class="btn" type="submit">Enregistrer le profil</button>
  </form>

  <div v-if="profile" class="card account-stats">
    <h3>Activité</h3>
    <ul class="account-stats-list">
      <li><strong>{{ profile.lieux_count }}</strong> fiche(s) publiée(s)</li>
      <li>{{ profile.lieux_counts?.favori || 0 }} recommandée(s)</li>
      <li>{{ profile.lieux_counts?.blacklist || 0 }} à éviter</li>
      <li>Membre depuis {{ formatDate(profile.created_at) }}</li>
    </ul>
  </div>
</template>
