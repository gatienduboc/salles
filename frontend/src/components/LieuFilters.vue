<script setup>
import { LIEU_TYPES } from '../constants/lieuTypes.js';
import { SORT_OPTIONS, LIMIT_OPTIONS } from '../utils/lieuQuery.js';

const model = defineModel({ type: Object, required: true });
const props = defineProps({
  counts: { type: Object, default: () => ({ blacklist: 0, favori: 0 }) },
  auteurs: { type: Array, default: () => [] },
});

const emit = defineEmits(['apply']);

const tabs = [
  { value: '', label: 'Tous' },
  { value: 'favori', label: LIEU_TYPES.favori.label },
  { value: 'blacklist', label: LIEU_TYPES.blacklist.label },
];

function selectType(value) {
  model.value.type = value;
  model.value.page = 1;
  emit('apply');
}

function apply() {
  model.value.page = 1;
  emit('apply');
}

function totalCount() {
  return (props.counts.blacklist || 0) + (props.counts.favori || 0);
}

function tabCount(value) {
  if (!value) return totalCount();
  return props.counts[value] || 0;
}

function auteurLabel(a) {
  const parts = [a.pseudo];
  if (a.activity_label) parts.push(a.activity_label);
  if (a.city) parts.push(a.city);
  return `${parts.join(' · ')} (${a.count})`;
}
</script>

<template>
  <div class="card">
    <div class="type-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :class="[
          'type-tab',
          tab.value === 'favori' && 'tab-favori',
          tab.value === 'blacklist' && 'tab-blacklist',
          model.type === tab.value && 'active',
        ]"
        @click="selectType(tab.value)"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tabCount(tab.value) }}</span>
      </button>
    </div>

    <div class="filter-row">
      <div class="filter-field">
        <label>Auteur</label>
        <select v-model="model.auteur_id" data-testid="filter-auteur" @change="apply">
          <option value="">Tous les auteurs</option>
          <option v-for="a in auteurs" :key="a.id" :value="a.id">
            {{ auteurLabel(a) }}
          </option>
        </select>
      </div>
      <div class="filter-field">
        <label>Ville du lieu</label>
        <input
          v-model="model.ville"
          placeholder="Paris, Lyon…"
          data-testid="filter-ville"
          @keyup.enter="apply"
        />
      </div>
      <div class="filter-field">
        <label>Recherche</label>
        <input v-model="model.search" placeholder="Nom ou adresse" @keyup.enter="apply" />
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-field">
        <label>Tri</label>
        <select v-model="model.sort" @change="apply">
          <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="filter-field">
        <label>Ordre</label>
        <select v-model="model.order" @change="apply">
          <option value="desc">Décroissant</option>
          <option value="asc">Croissant</option>
        </select>
      </div>
      <div class="filter-field">
        <label>Par page</label>
        <select v-model.number="model.limit" @change="apply">
          <option v-for="n in LIMIT_OPTIONS" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>

    <button class="btn" type="button" @click="apply">Appliquer filtres</button>
  </div>
</template>
