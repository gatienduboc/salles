import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth.js';

vi.mock('../api/client.js', () => ({
  api: vi.fn(),
}));

import { api } from '../api/client.js';

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.mocked(api).mockReset();
  });

  it('login stocke token et user', async () => {
    api.mockResolvedValue({
      token: 'tok123',
      user: { id: 1, email: 'a@b.c', pseudo: 'User' },
    });
    const store = useAuthStore();
    await store.login({ email: 'a@b.c', password: 'password123' });
    expect(store.token).toBe('tok123');
    expect(localStorage.getItem('token')).toBe('tok123');
  });

  it('logout efface le token', () => {
    api.mockResolvedValue(null);
    localStorage.setItem('token', 'x');
    const store = useAuthStore();
    store.token = 'x';
    store.logout();
    expect(store.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
