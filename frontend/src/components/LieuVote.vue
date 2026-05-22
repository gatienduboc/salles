<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/auth.js';

const BASELINE = 5;
const STAR_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const props = defineProps({
  lieuId: { type: Number, required: true },
  rating: {
    type: Object,
    default: () => ({
      average: BASELINE,
      count: 0,
      user_stars: null,
      baseline: BASELINE,
    }),
  },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['updated']);

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const saving = ref(false);
const error = ref('');

const displayAvg = computed(() => props.rating.average ?? BASELINE);

function isFilled(n) {
  if (props.rating.user_stars != null) return n <= props.rating.user_stars;
  if (props.rating.count === 0) return n === BASELINE;
  return n <= Math.round(displayAvg.value);
}

function starClass(n) {
  const filled = isFilled(n);
  const isBase = n === BASELINE;
  const isUser = props.rating.user_stars != null;
  let tone = 'star-mid';
  if (n < BASELINE) tone = 'star-low';
  if (n > BASELINE) tone = 'star-high';
  return [
    'star-btn',
    filled && tone,
    isUser && filled && 'star-user',
    isBase && 'star-base-mark',
    props.compact && 'star-btn-sm',
  ];
}

async function vote(stars) {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const data = await api(`/lieux/${props.lieuId}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ stars }),
    });
    emit('updated', data.rating);
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="lieu-vote" :class="compact && 'lieu-vote-compact'" @click.stop>
    <div class="lieu-vote-line">
      <div class="stars-row stars-row-11" role="group" :aria-label="`Note de 0 à 10, base ${BASELINE}`">
        <button
          v-for="n in STAR_LEVELS"
          :key="n"
          type="button"
          :class="starClass(n)"
          :disabled="saving"
          :title="auth.isLoggedIn ? `Noter ${n}/10` : 'Connexion requise'"
          @click="vote(n)"
        >
          <span class="star-num">{{ n }}</span>
          <span class="star-glyph">★</span>
        </button>
      </div>
      <span class="vote-summary-inline">
        <strong>{{ displayAvg.toFixed(1) }}/10</strong>
        <span v-if="rating.count > 0" class="vote-count-label">({{ rating.count }} avis)</span>
        <span v-else class="vote-count-label">(base {{ BASELINE }})</span>
      </span>
    </div>

    <p v-if="!compact && !auth.isLoggedIn" class="vote-hint">
      <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }">Connectez-vous</RouterLink>
      pour noter — 5/10 = neutre, au-dessus positif, en dessous négatif.
    </p>
    <p v-else-if="!compact && saving" class="vote-hint">Enregistrement…</p>
    <p v-if="error" class="vote-error">{{ error }}</p>
  </div>
</template>
