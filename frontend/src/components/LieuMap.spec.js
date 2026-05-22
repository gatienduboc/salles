import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LieuMap from './LieuMap.vue';

vi.mock('leaflet', () => {
  const layerGroup = () => ({
    clearLayers: vi.fn(),
    addTo: vi.fn(),
  });
  return {
    default: {
      map: vi.fn(() => ({
        setView: vi.fn(),
        fitBounds: vi.fn(),
        remove: vi.fn(),
      })),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      marker: vi.fn(() => ({ bindPopup: vi.fn() })),
      layerGroup: vi.fn(layerGroup),
      latLngBounds: vi.fn(() => ({ pad: vi.fn() })),
    },
  };
});

describe('LieuMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monte la carte', () => {
    const wrapper = mount(LieuMap, {
      props: {
        lieux: [
          { id: 1, nom: 'A', latitude: 48.8, longitude: 2.3, ville: 'Paris' },
          { id: 2, nom: 'B', latitude: null, longitude: null },
        ],
      },
    });
    expect(wrapper.find('[data-testid="lieu-map"]').exists()).toBe(true);
  });
});
