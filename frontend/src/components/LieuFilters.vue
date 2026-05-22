<script setup>
const model = defineModel({ type: Object, required: true });

const emit = defineEmits(['apply']);

function apply() {
  emit('apply');
}
</script>

<template>
  <div class="card">
    <label>Ville</label>
    <input v-model="model.ville" placeholder="Paris, Lyon…" data-testid="filter-ville" />

    <label>Recherche</label>
    <input v-model="model.search" placeholder="Nom ou adresse" />

    <label>Type</label>
    <select v-model="model.type">
      <option value="">Tous</option>
      <option value="blacklist">Blacklist</option>
      <option value="favori">Favori</option>
    </select>

    <button class="btn" @click="apply">Filtrer</button>
  </div>
</template>
