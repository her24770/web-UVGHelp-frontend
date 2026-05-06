const DATE_FMT = new Intl.DateTimeFormat('es-GT', {
  day:   '2-digit',
  month: '2-digit',
  year:  'numeric',
});

const DATETIME_FMT = new Intl.DateTimeFormat('es-GT', {
  day:    '2-digit',
  month:  '2-digit',
  year:   'numeric',
  hour:   '2-digit',
  minute: '2-digit',
});

export function formatDate(isoString) {
  if (!isoString) return '—';
  return DATE_FMT.format(new Date(isoString));
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  return DATETIME_FMT.format(new Date(isoString));
}

export function formatMoney(amount, currency = 'GTQ') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('es-GT', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

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

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
