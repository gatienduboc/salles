<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { api } from '../api/client.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  required: { type: Boolean, default: false },
  id: { type: String, default: 'lieu-adresse' },
});

const emit = defineEmits(['update:modelValue', 'preview']);

const inputValue = ref(props.modelValue);
const suggestions = ref([]);
const open = ref(false);
const loading = ref(false);
const hint = ref('');
const activeIndex = ref(-1);
const preview = ref(null);

let debounceTimer;
let abortId = 0;

watch(
  () => props.modelValue,
  (v) => {
    if (v !== inputValue.value) inputValue.value = v;
  }
);

function onInput() {
  emit('update:modelValue', inputValue.value);
  preview.value = null;
  emit('preview', null);
  activeIndex.value = -1;

  clearTimeout(debounceTimer);
  const q = inputValue.value.trim();
  if (q.length < 3) {
    suggestions.value = [];
    open.value = false;
    hint.value = q.length ? 'Encore un caractère…' : 'Ex. « 12 rue de la Paix, Lyon »';
    return;
  }

  hint.value = '';
  debounceTimer = setTimeout(() => fetchSuggestions(q), 350);
}

async function fetchSuggestions(q) {
  const id = ++abortId;
  loading.value = true;
  try {
    const data = await api(`/address/suggest?q=${encodeURIComponent(q)}`);
    if (id !== abortId) return;
    suggestions.value = data.suggestions || [];
    open.value = suggestions.value.length > 0;
    if (!suggestions.value.length) {
      hint.value = data.error || 'Aucune adresse trouvée — vous pouvez saisir librement.';
    }
  } catch {
    if (id !== abortId) return;
    suggestions.value = [];
    open.value = false;
    hint.value = 'Suggestions indisponibles — saisie manuelle possible.';
  } finally {
    if (id === abortId) loading.value = false;
  }
}

function selectSuggestion(item) {
  inputValue.value = item.adresse;
  emit('update:modelValue', item.adresse);
  preview.value = item;
  emit('preview', item);
  suggestions.value = [];
  open.value = false;
  activeIndex.value = -1;
  hint.value = '';
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
    activeIndex.value = -1;
  }
}

function onBlur() {
  setTimeout(() => {
    open.value = false;
    activeIndex.value = -1;
  }, 180);
}

function onFocus() {
  if (suggestions.value.length) open.value = true;
  else if (!inputValue.value.trim()) {
    hint.value = 'Recherche OpenStreetMap (France) — min. 3 caractères';
  }
}

onUnmounted(() => clearTimeout(debounceTimer));
</script>

<template>
  <div class="adresse-autocomplete">
    <input
      :id="id"
      v-model="inputValue"
      type="text"
      class="adresse-input"
      autocomplete="street-address"
      :required="required"
      placeholder="Numéro, rue, code postal, ville…"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="`${id}-listbox`"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <p v-if="loading" class="adresse-hint">Recherche…</p>
    <p v-else-if="hint" class="adresse-hint">{{ hint }}</p>
    <p v-else-if="preview" class="adresse-preview">
      <span v-if="preview.ville || preview.code_postal">
        {{ [preview.code_postal, preview.ville].filter(Boolean).join(' ') }}
      </span>
      <span v-if="preview.latitude" class="adresse-preview-geo"> — position confirmée</span>
    </p>

    <ul
      v-if="open && suggestions.length"
      :id="`${id}-listbox`"
      class="adresse-suggest-list"
      role="listbox"
    >
      <li
        v-for="(s, i) in suggestions"
        :key="`${s.adresse}-${i}`"
        role="option"
        :aria-selected="i === activeIndex"
        :class="['adresse-suggest-item', i === activeIndex && 'adresse-suggest-active']"
        @mousedown.prevent="selectSuggestion(s)"
      >
        <span class="adresse-suggest-label">{{ s.label }}</span>
        <span v-if="s.label !== s.adresse" class="adresse-suggest-full">{{ s.adresse }}</span>
      </li>
    </ul>
  </div>
</template>
