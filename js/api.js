const API_BASE = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('uvg_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('uvg_token');
    window.location.replace('/pages/login.html');
    return;
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw data ?? { message: `Error ${res.status}` };
  }

  return data;
}

function buildUrl(path, params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const query = new URLSearchParams(filtered).toString();
  return query ? `${path}?${query}` : path;
}

export const api = {
  get(path, params = {}) {
    return request(buildUrl(path, params));
  },

  post(path, body) {
    return request(path, { method: 'POST', body: JSON.stringify(body) });
  },

  put(path, body) {
    return request(path, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete(path) {
    return request(path, { method: 'DELETE' });
  },

  /* Para subir archivos (imagen, PDF) — deja que el browser ponga el Content-Type con boundary */
  postForm(path, formData) {
    const token = localStorage.getItem('uvg_token');
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async res => {
      if (res.status === 204) return null;
      const data = await res.json().catch(() => null);
      if (!res.ok) throw data ?? { message: `Error ${res.status}` };
      return data;
    });
  },
};
