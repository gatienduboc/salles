<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue';
import L from 'leaflet';
import { getLieuType } from '../constants/lieuTypes.js';
import { buildMapPreviewHtml } from '../utils/lieuMapPreview.js';

const props = defineProps({
  lieux: { type: Array, default: () => [] },
  tall: { type: Boolean, default: false },
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
  if (layer) {
    map.removeLayer(layer);
    layer = null;
  }
  const points = mappable(props.lieux);
  const markers = points.map((l) => {
    const { color } = getLieuType(l.type);
    const marker = L.circleMarker([Number(l.latitude), Number(l.longitude)], {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 2,
      fillOpacity: 0.85,
    });
    const html = buildMapPreviewHtml(l);
    marker.bindTooltip(html, {
      className: 'lieu-map-tooltip',
      direction: 'top',
      offset: [0, -14],
      opacity: 1,
      sticky: true,
      interactive: true,
    });
    marker.bindPopup(html, {
      className: 'lieu-map-popup',
      maxWidth: 320,
      minWidth: 260,
      closeButton: true,
      autoPan: true,
    });
    marker.on('mouseover', () => {
      marker.setStyle({ radius: 13, weight: 3 });
      marker.openTooltip();
    });
    marker.on('mouseout', () => {
      marker.setStyle({ radius: 10, weight: 2 });
      marker.closeTooltip();
    });
    return marker;
  });
  layer = L.layerGroup(markers).addTo(map);
  if (points.length) {
    const bounds = L.latLngBounds(points.map((l) => [Number(l.latitude), Number(l.longitude)]));
    map.fitBounds(bounds.pad(0.2));
  } else {
    map.setView([46.6, 2.4], 6);
  }
}

onMounted(async () => {
  await nextTick();
  if (!mapEl.value) return;
  map = L.map(mapEl.value, { scrollWheelZoom: true }).setView([46.6, 2.4], 6);
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
  <div class="lieu-map-root" :class="tall && 'lieu-map-root-tall'">
    <div ref="mapEl" class="map-wrap" data-testid="lieu-map" />
    <div class="map-legend">
      <span class="legend-dot legend-favori" /> Recommandé
      <span class="legend-dot legend-blacklist" /> À éviter
      <span class="map-legend-hint">Survolez un point pour l’aperçu</span>
    </div>
  </div>
</template>
