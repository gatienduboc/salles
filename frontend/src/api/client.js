const base =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : '');

export function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = data.error || res.statusText;
    if (!message || (res.status >= 500 && /sql|unknown column|ER_/i.test(message))) {
      message = 'Une erreur est survenue. Réessayez plus tard.';
    }
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
