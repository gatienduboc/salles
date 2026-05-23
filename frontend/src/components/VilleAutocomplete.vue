<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { api } from '../api/client.js';

const props = defineProps({
  city: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  idPrefix: { type: String, default: 'ville' },
});

const emit = defineEmits(['update:city', 'update:postalCode', 'verified']);

const cityInput = ref(props.city);
const cpInput = ref(props.postalCode);
const suggestions = ref([]);
const open = ref(false);
const loading = ref(false);
const hint = ref('');
const activeIndex = ref(-1);
const verified = ref(false);

let debounceTimer;
let abortId = 0;

watch(
  () => props.city,
  (v) => {
    if (v !== cityInput.value) cityInput.value = v;
  }
);
watch(
  () => props.postalCode,
  (v) => {
    if (v !== cpInput.value) cpInput.value = v;
  }
);

function onCityInput() {
  emit('update:city', cityInput.value);
  verified.value = false;
  emit('verified', false);
  activeIndex.value = -1;

  clearTimeout(debounceTimer);
  const q = cityInput.value.trim();
  if (q.length < 2) {
    suggestions.value = [];
    open.value = false;
    hint.value = q.length ? 'Encore un caractère…' : '';
    return;
  }

  const fullQ = [cpInput.value.trim(), q].filter(Boolean).join(' ');
  debounceTimer = setTimeout(() => fetchSuggestions(fullQ), 350);
}

async function fetchSuggestions(q) {
  const id = ++abortId;
  loading.value = true;
  try {
    const data = await api(`/address/suggest?q=${encodeURIComponent(q)}`);
    if (id !== abortId) return;
    suggestions.value = (data.suggestions || []).filter((s) => s.ville);
    open.value = suggestions.value.length > 0;
    hint.value = suggestions.value.length
      ? 'Choisissez une ville pour la valider (géocodage)'
      : data.error || 'Aucune ville trouvée';
  } catch {
    if (id !== abortId) return;
    suggestions.value = [];
    open.value = false;
    hint.value = 'Suggestions indisponibles';
  } finally {
    if (id === abortId) loading.value = false;
  }
}

function selectSuggestion(item) {
  cityInput.value = item.ville;
  cpInput.value = item.code_postal || cpInput.value;
  emit('update:city', item.ville);
  emit('update:postalCode', cpInput.value);
  verified.value = true;
  emit('verified', true);
  suggestions.value = [];
  open.value = false;
  hint.value = 'Ville reconnue — enregistrez pour confirmer côté serveur';
}

function onKeydown(e) {
  if (!open.value || !suggestions.value.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value =
      activeIndex.value <= 0 ? suggestions.value.length - 1 : activeIndex.value - 1;
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault();
    selectSuggestion(suggestions.value[activeIndex.value]);
  } else if (e.key === 'Escape') {
    open.value = false;
  }
}

onUnmounted(() => clearTimeout(debounceTimer));
</script>

<template>
  <div class="ville-autocomplete">
    <div class="ville-autocomplete-row">
      <div class="ville-field">
        <label :for="`${idPrefix}-city`">Ville d'exercice *</label>
        <input
          :id="`${idPrefix}-city`"
          v-model="cityInput"
          required
          minlength="2"
          maxlength="100"
          placeholder="ex. Lyon"
          autocomplete="address-level2"
          @input="onCityInput"
          @keydown="onKeydown"
          @focus="() => suggestions.length && (open = true)"
          @blur="() => setTimeout(() => (open = false), 180)"
        />
      </div>
      <div class="ville-field ville-field-cp">
        <label :for="`${idPrefix}-cp`">Code postal</label>
        <input
          :id="`${idPrefix}-cp`"
          v-model="cpInput"
          maxlength="10"
          placeholder="69001"
          @input="emit('update:postalCode', cpInput); verified = false"
        />
      </div>
    </div>
    <p v-if="loading" class="adresse-hint">Recherche de la ville…</p>
    <p v-else-if="hint" class="adresse-hint">{{ hint }}</p>
    <p v-if="verified" class="adresse-preview">Ville sélectionnée dans l'annuaire</p>

    <ul v-if="open && suggestions.length" class="adresse-suggest-list" role="listbox">
      <li
        v-for="(s, i) in suggestions"
        :key="`${s.ville}-${s.code_postal}-${i}`"
        role="option"
        :class="['adresse-suggest-item', i === activeIndex && 'adresse-suggest-active']"
        @mousedown.prevent="selectSuggestion(s)"
      >
        <span class="adresse-suggest-label">
          {{ s.ville }}<span v-if="s.code_postal"> ({{ s.code_postal }})</span>
        </span>
      </li>
    </ul>
  </div>
</template>
