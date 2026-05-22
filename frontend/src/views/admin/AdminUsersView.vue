<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../../api/client.js';
import AdminLayout from '../../components/AdminLayout.vue';

const users = ref([]);
const meta = ref({ page: 1, totalPages: 1 });
const search = ref('');
const error = ref('');
const message = ref('');

const form = ref({ email: '', pseudo: '', password: '' });
const showCreate = ref(false);

async function load(page = 1) {
  error.value = '';
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search.value) params.set('search', search.value);
  const data = await api(`/admin/users?${params}`);
  users.value = data.data;
  meta.value = data.meta;
}

async function createUser() {
  try {
    await api('/admin/users', {
      method: 'POST',
      body: JSON.stringify(form.value),
    });
    message.value = 'Compte créé.';
    showCreate.value = false;
    form.value = { email: '', pseudo: '', password: '' };
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleRole(u) {
  const role = u.role === 'admin' ? 'user' : 'admin';
  if (!confirm(`Passer ${u.pseudo} en ${role} ?`)) return;
  try {
    await api(`/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    await load(meta.value.page);
  } catch (e) {
    error.value = e.message;
  }
}

async function resetPassword(u) {
  const password = prompt(`Nouveau mot de passe pour ${u.pseudo} (min 8 car.) :`);
  if (!password || password.length < 8) return;
  try {
    await api(`/admin/users/${u.id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
    message.value = 'Mot de passe mis à jour.';
  } catch (e) {
    error.value = e.message;
  }
}

async function removeUser(u) {
  if (!confirm(`Supprimer ${u.pseudo} ?`)) return;
  try {
    await api(`/admin/users/${u.id}`, { method: 'DELETE' });
    message.value = 'Compte supprimé.';
    await load(meta.value.page);
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(() => load());
</script>

<template>
  <AdminLayout>
    <h1>Utilisateurs</h1>
    <p v-if="message" style="color: var(--muted)">{{ message }}</p>
    <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>

    <div class="admin-toolbar card">
      <input v-model="search" placeholder="Rechercher email ou pseudo" @keyup.enter="load(1)" />
      <button class="btn" type="button" @click="load(1)">Rechercher</button>
      <button class="btn secondary" type="button" @click="showCreate = !showCreate">
        {{ showCreate ? 'Annuler' : 'Nouveau compte' }}
      </button>
    </div>

    <form v-if="showCreate" class="card" @submit.prevent="createUser">
      <h3>Créer un compte (DJ)</h3>
      <label>Email</label>
      <input v-model="form.email" type="email" required />
      <label>Pseudo</label>
      <input v-model="form.pseudo" required />
      <label>Mot de passe</label>
      <input v-model="form.password" type="password" minlength="8" required />
      <button class="btn" type="submit">Créer</button>
    </form>

    <div class="card admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Pseudo</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Fiches</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.pseudo }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.role }}</td>
            <td>{{ u.lieux_count }}</td>
            <td class="admin-actions">
              <button class="btn secondary" type="button" @click="toggleRole(u)">Rôle</button>
              <button class="btn secondary" type="button" @click="resetPassword(u)">MDP</button>
              <button class="btn secondary" type="button" @click="removeUser(u)">Suppr.</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="meta.totalPages > 1" class="admin-toolbar">
      <button class="btn secondary" :disabled="meta.page <= 1" @click="load(meta.page - 1)">
        Précédent
      </button>
      <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <button
        class="btn secondary"
        :disabled="meta.page >= meta.totalPages"
        @click="load(meta.page + 1)"
      >
        Suivant
      </button>
    </div>
  </AdminLayout>
</template>
