<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue';
import L from 'leaflet';

const props = defineProps({
  lieux: { type: Array, default: () => [] },
});

const mapEl = ref(null);
let map;
let layer;

function mappable(lieux) {
  return lieux.filter(
    (l) => l.latitude != null && l.longitude != null && !Number.isNaN(Number(l.latitude))
  );
}

function render() {
  if (!map) return;
  if (layer) layer.clearLayers();
  const points = mappable(props.lieux);
  const markers = points.map((l) => {
    const m = L.marker([Number(l.latitude), Number(l.longitude)]);
    m.bindPopup(`<strong>${l.nom}</strong><br/>${l.ville || ''}`);
    return m;
  });
  layer = L.layerGroup(markers).addTo(map);
  if (points.length) {
    const bounds = L.latLngBounds(points.map((l) => [Number(l.latitude), Number(l.longitude)]));
    map.fitBounds(bounds.pad(0.2));
  } else {
    map.setView([46.6, 2.4], 6);
  }
}

onMounted(() => {
  map = L.map(mapEl.value).setView([46.6, 2.4], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  render();
});

watch(() => props.lieux, render, { deep: true });

onUnmounted(() => {
  map?.remove();
});
</script>

<template>
  <div ref="mapEl" class="map-wrap" data-testid="lieu-map" />
</template>
