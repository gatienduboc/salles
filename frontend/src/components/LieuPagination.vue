<script setup>
const props = defineProps({
  meta: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['page']);

const from = () => {
  if (!props.meta.total) return 0;
  return (props.meta.page - 1) * props.meta.limit + 1;
};

const to = () => Math.min(props.meta.page * props.meta.limit, props.meta.total);
</script>

<template>
  <nav v-if="meta.total > 0" class="pagination" aria-label="Pagination">
    <p class="pagination-info">
      {{ from() }}–{{ to() }} sur {{ meta.total }}
      <span v-if="meta.totalPages > 1"> (page {{ meta.page }} / {{ meta.totalPages }})</span>
    </p>
    <div class="pagination-actions">
      <button
        type="button"
        class="btn secondary"
        :disabled="!meta.hasPrev"
        @click="emit('page', meta.page - 1)"
      >
        Précédent
      </button>
      <button
        type="button"
        class="btn secondary"
        :disabled="!meta.hasNext"
        @click="emit('page', meta.page + 1)"
      >
        Suivant
      </button>
    </div>
  </nav>
</template>
