import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

const { circleMarkerMock } = vi.hoisted(() => ({
  circleMarkerMock: vi.fn(() => ({ bindPopup: vi.fn() })),
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

  it('monte la carte avec légende', () => {
    const wrapper = mount(LieuMap, {
      props: {
        lieux: [
          { id: 1, nom: 'A', type: 'favori', latitude: 48.8, longitude: 2.3, ville: 'Paris' },
        ],
      },
    });
    expect(wrapper.find('[data-testid="lieu-map"]').exists()).toBe(true);
    expect(wrapper.find('.map-legend').text()).toContain('Recommandé');
  });

  it('affiche les libellés à éviter et recommandé', () => {
    const wrapper = mount(LieuMap, { props: { lieux: [] } });
    expect(wrapper.find('.legend-blacklist').exists()).toBe(true);
    expect(wrapper.find('.legend-favori').exists()).toBe(true);
  });
});
