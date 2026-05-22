<script setup>
import { LIEU_TYPES } from '../constants/lieuTypes.js';

const model = defineModel({ type: Object, required: true });
const props = defineProps({
  counts: { type: Object, default: () => ({ blacklist: 0, favori: 0 }) },
});

const emit = defineEmits(['apply']);

const tabs = [
  { value: '', label: 'Tous' },
  { value: 'favori', label: LIEU_TYPES.favori.label },
  { value: 'blacklist', label: LIEU_TYPES.blacklist.label },
];

function selectType(value) {
  model.value.type = value;
  emit('apply');
}

function totalCount() {
  return (props.counts.blacklist || 0) + (props.counts.favori || 0);
}

function tabCount(value) {
  if (!value) return totalCount();
  return props.counts[value] || 0;
}
</script>

<template>
  <div class="card">
    <div class="type-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :class="['type-tab', tab.value === 'favori' && 'tab-favori', tab.value === 'blacklist' && 'tab-blacklist', model.type === tab.value && 'active']"
        @click="selectType(tab.value)"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tabCount(tab.value) }}</span>
      </button>
    </div>

    <label>Ville</label>
    <input v-model="model.ville" placeholder="Paris, Lyon…" data-testid="filter-ville" @keyup.enter="emit('apply')" />

    <label>Recherche</label>
    <input v-model="model.search" placeholder="Nom ou adresse" @keyup.enter="emit('apply')" />

    <button class="btn" @click="emit('apply')">Appliquer filtres</button>
  </div>
</template>
