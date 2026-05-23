<script setup>
import { computed } from 'vue';
import { buildNavigationLinks } from '../utils/navigationLinks.js';

const props = defineProps({
  lieu: { type: Object, required: true },
  compact: { type: Boolean, default: false },
});

const links = computed(() => buildNavigationLinks(props.lieu));
</script>

<template>
  <div v-if="links?.length" class="lieu-nav-links" :class="{ 'lieu-nav-links--compact': compact }">
    <span v-if="!compact" class="lieu-nav-label">Y aller</span>
    <a
      v-for="link in links"
      :key="link.id"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
      class="lieu-nav-btn"
    >
      {{ link.label }}
    </a>
  </div>
</template>
