import { api } from '../api.js';
import { requireAuth, initHeader } from '../router.js';

requireAuth();
initHeader();

// entidades y sus endpoints para obtener el total
const STATS = [
  { key: 'lugares',    label: 'Lugares',    icon: 'blue',   path: '/lugares' },
  { key: 'eventos',    label: 'Eventos',    icon: 'green',  path: '/eventos' },
  { key: 'carreras',   label: 'Carreras',   icon: 'orange', path: '/carreras' },
  { key: 'cursos',     label: 'Cursos',     icon: 'blue',   path: '/cursos' },
  { key: 'profesores', label: 'Profesores', icon: 'green',  path: '/profesores' },
  { key: 'servicios',  label: 'Servicios',  icon: 'orange', path: '/servicios' },
  { key: 'contactos',  label: 'Contactos',  icon: 'red',    path: '/contactos' },
  { key: 'pagos',      label: 'Pagos',      icon: 'red',    path: '/pagos' },
];

// carga el total de cada entidad en paralelo y actualiza las tarjetas
async function loadStats() {
  const results = await Promise.allSettled(
    STATS.map(s => api.get(s.path, { limit: 1 }))
  );

  results.forEach((result, i) => {
    const el = document.getElementById(`stat-${STATS[i].key}`);
    if (!el) return;
    el.textContent = result.status === 'fulfilled' ? (result.value?.total ?? '—') : '—';
  });
}

loadStats();
