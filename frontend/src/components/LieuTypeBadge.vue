<script setup>
import { getLieuType } from '../constants/lieuTypes.js';

const props = defineProps({
  type: { type: String, required: true },
});
const info = getLieuType(props.type);
</script>

<template>
  <span :class="['type-badge', info.badgeClass]">{{ info.label }}</span>
</template>
