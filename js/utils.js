// formato de fechas
const DATE_FMT = new Intl.DateTimeFormat('es-GT', {
  day:   '2-digit',
  month: '2-digit',
  year:  'numeric',
});

// formato de fechas y horas
const DATETIME_FMT = new Intl.DateTimeFormat('es-GT', {
  day:    '2-digit',
  month:  '2-digit',
  year:   'numeric',
  hour:   '2-digit',
  minute: '2-digit',
});

// formatea una fecha ISO a formato local
export function formatDate(isoString) {
  if (!isoString) return '—';
  return DATE_FMT.format(new Date(isoString));
}

// formatea una fecha y hora ISO a formato local
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  return DATETIME_FMT.format(new Date(isoString));
}

// formatea un monto numérico a formato de moneda local
export function formatMoney(amount, currency = 'GTQ') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('es-GT', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// función de debounce para limitar la frecuencia de ejecución de una función
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// convierte una cadena a un slug URL-friendly
export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// obtiene los parámetros de consulta de la URL como un objeto
export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

// actualiza los parámetros de consulta en la URL sin recargar la página
export function setQueryParams(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([k, v]) => {
    if (v === '' || v === null || v === undefined) {
      url.searchParams.delete(k);
    } else {
      url.searchParams.set(k, v);
    }
  });
  history.replaceState(null, '', url.toString());
}

// escapa el HTML para evitar ataques de XSS
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
