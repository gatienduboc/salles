<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue';
import L from 'leaflet';
import { getLieuType } from '../constants/lieuTypes.js';
import { buildMapPreviewHtml } from '../utils/lieuMapPreview.js';

const props = defineProps({
  lieux: { type: Array, default: () => [] },
  tall: { type: Boolean, default: false },
  radiusCenter: { type: Object, default: null },
  radiusKm: { type: Number, default: 0 },
});

const mapEl = ref(null);
let map;
let layer;
let radiusLayer;
let centerMarker;

function mappable(lieux) {
  return lieux.filter(
    (l) => l.latitude != null && l.longitude != null && !Number.isNaN(Number(l.latitude))
  );
}

function clearRadiusOverlay() {
  if (radiusLayer && map) {
    map.removeLayer(radiusLayer);
    radiusLayer = null;
  }
  if (centerMarker && map) {
    map.removeLayer(centerMarker);
    centerMarker = null;
  }
}

function drawRadiusOverlay() {
  clearRadiusOverlay();
  if (!map || !props.radiusCenter || !props.radiusKm) return;

  const lat = Number(props.radiusCenter.latitude);
  const lon = Number(props.radiusCenter.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

  radiusLayer = L.circle([lat, lon], {
    radius: props.radiusKm * 1000,
    color: '#e63946',
    fillColor: '#e63946',
    fillOpacity: 0.07,
    weight: 2,
    dashArray: '6 4',
  }).addTo(map);

  centerMarker = L.circleMarker([lat, lon], {
    radius: 6,
    fillColor: '#e63946',
    color: '#fff',
    weight: 2,
    fillOpacity: 1,
  }).addTo(map);
  centerMarker.bindTooltip(
    props.radiusCenter.city
      ? `${props.radiusCenter.city} — rayon ${props.radiusKm} km`
      : `Centre — ${props.radiusKm} km`,
    { permanent: false, direction: 'top' }
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
  drawRadiusOverlay();

  const boundsPoints = points.map((l) => [Number(l.latitude), Number(l.longitude)]);
  if (props.radiusCenter?.latitude != null) {
    boundsPoints.push([
      Number(props.radiusCenter.latitude),
      Number(props.radiusCenter.longitude),
    ]);
  }

  if (boundsPoints.length) {
    const bounds = L.latLngBounds(boundsPoints);
    map.fitBounds(bounds.pad(0.2));
  } else if (props.radiusCenter?.latitude != null) {
    map.setView([Number(props.radiusCenter.latitude), Number(props.radiusCenter.longitude)], 9);
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
watch(
  () => [props.radiusCenter, props.radiusKm],
  () => {
    drawRadiusOverlay();
    if (map && props.radiusCenter && !mappable(props.lieux).length) {
      map.setView(
        [Number(props.radiusCenter.latitude), Number(props.radiusCenter.longitude)],
        9
      );
    }
  },
  { deep: true }
);

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
      <span v-if="radiusKm" class="map-legend-radius">Cercle : {{ radiusKm }} km</span>
      <span class="map-legend-hint">Survolez un point pour l'aperçu</span>
    </div>
  </div>
</template>
