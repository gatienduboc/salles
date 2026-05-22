<script setup>
const model = defineModel({ type: [Boolean, null], default: null });
const props = defineProps({ label: { type: String, required: true } });

const options = [
  { value: null, label: '—' },
  { value: true, label: 'Oui' },
  { value: false, label: 'Non' },
];

function select(val) {
  model.value = val;
}
</script>

<template>
  <div class="tristate">
    <span class="tristate-label">{{ label }}</span>
    <div class="tristate-btns">
      <button
        v-for="opt in options"
        :key="String(opt.value)"
        type="button"
        :class="['tristate-btn', model === opt.value && 'active']"
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
