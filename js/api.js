import { API_BASE, TOKEN_KEY } from './config.js';

//funcion para hacer peticiones a la API, maneja el token de autenticacion y errores comunes
async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
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

// Construye una URL con query params, omitiendo los que son vacíos o nulos
function buildUrl(path, params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const query = new URLSearchParams(filtered).toString();
  return query ? `${path}?${query}` : path;
}

// API wrapper para facilitar las peticiones a la API desde el frontend
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

  // Para subir archivos (imagen), el browser ponga el Content-Type 
  postForm(path, formData) {
    const token = localStorage.getItem(TOKEN_KEY);
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
