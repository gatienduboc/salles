import { createApp } from '../../src/app.js';

const mockFetch = async () => ({
  ok: true,
  json: async () => [
    {
      lat: '48.8566',
      lon: '2.3522',
      address: { city: 'Paris', postcode: '75001' },
    },
  ],
});

export async function getTestApp() {
  return createApp({ geocodeOptions: { fetchFn: mockFetch } });
}
