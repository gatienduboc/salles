<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.js';
import { PROVIDER_ACTIVITIES } from '../../constants/providerActivities.js';
import TriStateBool from '../../components/TriStateBool.vue';
import VilleAutocomplete from '../../components/VilleAutocomplete.vue';

const auth = useAuthStore();
const error = ref('');
const message = ref('');
const profile = ref(null);

const form = ref({
  pseudo: '',
  activity: 'dj',
  city: '',
  postal_code: '',
  company_name: '',
  siret: '',
  phone: '',
  website_url: '',
  bio: '',
  intervention_radius_km: '',
  has_rc_pro: null,
});

function fillForm(p) {
  form.value = {
    pseudo: p.pseudo || '',
    activity: p.activity || 'autre',
    city: p.city || '',
    postal_code: p.postal_code || '',
    company_name: p.company_name || '',
    siret: p.siret || '',
    phone: p.phone || '',
    website_url: p.website_url || '',
    bio: p.bio || '',
    intervention_radius_km: p.intervention_radius_km ?? '',
    has_rc_pro: p.has_rc_pro ?? null,
  };
}

onMounted(async () => {
  try {
    profile.value = await auth.refreshUser();
    fillForm(profile.value);
  } catch (e) {
    error.value = e.message;
  }
});

async function submit() {
  error.value = '';
  message.value = '';
  try {
    const body = {
      pseudo: form.value.pseudo.trim(),
      activity: form.value.activity,
      city: form.value.city.trim(),
      postal_code: form.value.postal_code.trim() || null,
      company_name: form.value.company_name.trim() || null,
      siret: form.value.siret.replace(/\s/g, '') || null,
      phone: form.value.phone.trim() || null,
      website_url: form.value.website_url.trim() || null,
      bio: form.value.bio.trim() || null,
      intervention_radius_km:
        form.value.intervention_radius_km === '' || form.value.intervention_radius_km === null
          ? null
          : Number(form.value.intervention_radius_km),
      has_rc_pro: form.value.has_rc_pro,
    };
    const data = await api('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    auth.setSession(data.token, data);
    profile.value = data;
    fillForm(data);
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
  <h1>Profil professionnel</h1>
  <p class="account-lead">
    Le <strong>secteur</strong> et la <strong>ville</strong> sont visibles sur vos fiches de lieux.
    SIRET et coordonnées restent privés.
  </p>

  <p v-if="error" style="color: var(--accent-soft)">{{ error }}</p>
  <p v-if="message" style="color: var(--muted)">{{ message }}</p>

  <form v-if="profile" class="card" @submit.prevent="submit">
    <h2 class="form-section">Identité</h2>
    <label>Pseudo (affiché sur vos fiches) *</label>
    <input v-model="form.pseudo" required minlength="2" maxlength="100" />

    <label>Secteur *</label>
    <select v-model="form.activity" required>
      <option v-for="a in PROVIDER_ACTIVITIES" :key="a.value" :value="a.value">
        {{ a.label }}
      </option>
    </select>

    <VilleAutocomplete
      id-prefix="profil"
      v-model:city="form.city"
      v-model:postal-code="form.postal_code"
    />
    <p v-if="profile.city_geocoded_at" class="field-hint">Ville vérifiée par géocodage.</p>

    <label>Nom d'enseigne / raison sociale</label>
    <input v-model="form.company_name" maxlength="150" />

    <label>Présentation</label>
    <textarea v-model="form.bio" rows="3" maxlength="500" placeholder="Quelques mots sur votre activité…" />

    <h2 class="form-section">Légal & confiance</h2>
    <label>SIREN ou SIRET (privé)</label>
    <input
      v-model="form.siret"
      inputmode="numeric"
      maxlength="20"
      placeholder="9 chiffres (SIREN) ou 14 (SIRET)"
    />
    <p class="field-hint">
      Ex. SIRET complet : 103 192 142 00018 (SIREN 103 192 142 + NIC 00018). Espaces acceptés.
    </p>

    <TriStateBool v-model="form.has_rc_pro" label="Assurance RC Pro" />

    <h2 class="form-section">Contact</h2>
    <label>Téléphone pro</label>
    <input v-model="form.phone" type="tel" maxlength="20" />

    <label>Site web</label>
    <input v-model="form.website_url" type="url" placeholder="https://…" />

    <h2 class="form-section">Intervention</h2>
    <label>Rayon d'intervention (km)</label>
    <input
      v-model.number="form.intervention_radius_km"
      type="number"
      min="0"
      max="500"
      placeholder="ex. 80"
    />

    <h2 class="form-section">Compte</h2>
    <label>Email</label>
    <input :value="profile.email" type="email" disabled class="input-readonly" />
    <p class="field-hint">Contactez un administrateur pour changer l'email.</p>

    <label>Rôle</label>
    <input
      :value="profile.role === 'admin' ? 'Administrateur' : 'Membre'"
      disabled
      class="input-readonly"
    />

    <button class="btn" type="submit">Enregistrer le profil</button>
  </form>

  <div v-if="profile" class="card account-stats">
    <h3>Activité sur Salles</h3>
    <ul class="account-stats-list">
      <li><strong>{{ profile.lieux_count }}</strong> fiche(s) publiée(s)</li>
      <li>{{ profile.lieux_counts?.favori || 0 }} recommandée(s)</li>
      <li>{{ profile.lieux_counts?.blacklist || 0 }} à éviter</li>
      <li>Membre depuis {{ formatDate(profile.created_at) }}</li>
    </ul>
  </div>
</template>
