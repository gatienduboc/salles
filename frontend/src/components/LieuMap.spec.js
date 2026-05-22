import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

const { circleMarkerMock } = vi.hoisted(() => ({
  circleMarkerMock: vi.fn(() => ({
    bindPopup: vi.fn(),
    bindTooltip: vi.fn(),
    on: vi.fn(),
    setStyle: vi.fn(),
    openTooltip: vi.fn(),
    closeTooltip: vi.fn(),
  })),
}));

vi.mock('leaflet', () => {
  const layerGroup = () => ({ addTo: vi.fn() });
  return {
    default: {
      map: vi.fn(() => ({
        setView: vi.fn(),
        fitBounds: vi.fn(),
        remove: vi.fn(),
        removeLayer: vi.fn(),
      })),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      circleMarker: circleMarkerMock,
      layerGroup: vi.fn(layerGroup),
      latLngBounds: vi.fn(() => ({ pad: vi.fn() })),
    },
  };
});

import LieuMap from './LieuMap.vue';

describe('LieuMap', () => {
  beforeEach(() => {
    circleMarkerMock.mockClear();
  });

  it('monte la carte avec légende', async () => {
    const wrapper = mount(LieuMap, {
      props: {
        lieux: [
          { id: 1, nom: 'A', type: 'favori', latitude: 48.8, longitude: 2.3, ville: 'Paris' },
        ],
      },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="lieu-map"]').exists()).toBe(true);
    expect(wrapper.find('.map-legend-hint').text()).toContain('aperçu');
    expect(wrapper.find('.lieu-map-root-tall').exists()).toBe(false);
  });

  it('affiche les libellés à éviter et recommandé', () => {
    const wrapper = mount(LieuMap, { props: { lieux: [] } });
    expect(wrapper.find('.legend-blacklist').exists()).toBe(true);
    expect(wrapper.find('.legend-favori').exists()).toBe(true);
  });
});
