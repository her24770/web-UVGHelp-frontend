import { api } from '../api.js';
import { requireAuth, initHeader } from '../router.js';
import { renderPagination } from '../components/pagination.js';
import { openModal, closeModal, initModals } from '../components/modal.js';
import { confirm } from '../components/confirm.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, formatDateTime, debounce } from '../utils.js';

requireAuth();
initHeader();
initModals();

// referencias al DOM
const cardsGrid  = document.getElementById('eventos-cards');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search');
const modalTitle  = document.getElementById('modal-title');
const form        = document.getElementById('evento-form');
const selectLugar = document.getElementById('f-lugar');
const fileInput   = document.getElementById('f-imagen');
const imgPreview  = document.getElementById('img-preview');

// estado de la lista
let state           = { page: 1, limit: 12, q: '', sort: 'titulo', order: 'asc' };
let editingId       = null;
let lugares         = [];
let currentImageUrl = null;

// carga los lugares para el select del formulario
async function loadLugares() {
  const data = await api.get('/lugares', { limit: 100 });
  lugares = data.items;
  selectLugar.innerHTML = '<option value="">Sin lugar asignado</option>' +
    lugares.map(l => `<option value="${l.id}">${escapeHtml(l.nombre)}</option>`).join('');
}

// genera el HTML de una card de evento
function cardHtml(r) {
  const lugarNombre = lugares.find(l => l.id === r.lugar_id)?.nombre ?? null;
  const media = r.imagen_url
    ? `<img src="${escapeHtml(r.imagen_url)}" alt="${escapeHtml(r.titulo)}" />`
    : `<div class="card-media-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>`;
  const badge = r.tipo ? `<span class="card-badge-floating">${escapeHtml(r.tipo)}</span>` : '';
  const meta  = r.fecha_inicio ? formatDateTime(r.fecha_inicio) : '—';
  const lugar = lugarNombre ? `· ${escapeHtml(lugarNombre)}` : '';

  return `
    <div class="card">
      <div class="card-media">
        ${media}
        ${badge}
      </div>
      <div class="card-body">
        <div class="card-meta">${meta}</div>
        <h3 class="card-title">${escapeHtml(r.titulo)}</h3>
        ${r.descripcion ? `<p class="card-desc">${escapeHtml(r.descripcion)}</p>` : ''}
        <div class="card-footer">
          <span class="card-footer-meta">${lugar}</span>
          <div class="card-actions">
            <button class="row-action" data-edit="${r.id}" title="Editar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="row-action danger" data-delete="${r.id}" data-name="${escapeHtml(r.titulo)}" title="Eliminar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

// obtiene la lista paginada y re-renderiza las cards
async function load() {
  try {
    const data = await api.get('/eventos', { page: state.page, limit: state.limit, q: state.q, sort: state.sort, order: state.order });
    if (data.items.length === 0) {
      cardsGrid.innerHTML = '<p style="padding:48px;text-align:center;color:var(--text-muted);grid-column:1/-1">No hay eventos registrados.</p>';
    } else {
      cardsGrid.innerHTML = data.items.map(cardHtml).join('');
    }
    renderPagination(pagination, { total: data.total, page: data.page, pageSize: data.limit, onChange: p => { state.page = p; load(); } });
    bindCardActions();
  } catch {
    showToast('error', 'Error', 'No se pudo cargar la lista de eventos');
  }
}

// conecta los botones de editar y eliminar de cada card
function bindCardActions() {
  cardsGrid.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = await api.get(`/eventos/${btn.dataset.edit}`);
      openEdit(data);
    });
  });
  cardsGrid.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm(`¿Eliminar el evento "${btn.dataset.name}"?`);
      if (!ok) return;
      try {
        await api.delete(`/eventos/${btn.dataset.delete}`);
        showToast('success', 'Eliminado', 'Evento eliminado correctamente');
        load();
      } catch {
        showToast('error', 'Error', 'No se pudo eliminar el evento');
      }
    });
  });
}

// muestra el nombre del archivo de imagen actual o lo oculta
function updatePreview(url) {
  if (url) {
    imgPreview.textContent = url.split('/').pop();
    imgPreview.style.display = 'block';
  } else {
    imgPreview.textContent = '';
    imgPreview.style.display = 'none';
  }
}

// convierte ISO string a formato datetime-local para el input
function toDatetimeLocal(iso) {
  if (!iso) return '';
  return iso.slice(0, 16);
}

// abre el modal en modo creación
function openCreate() {
  editingId = null;
  currentImageUrl = null;
  modalTitle.textContent = 'Nuevo Evento';
  form.reset();
  updatePreview(null);
  openModal('evento-modal');
}

// abre el modal en modo edición con los datos precargados
function openEdit(item) {
  editingId = item.id;
  currentImageUrl = item.imagen_url ?? null;
  modalTitle.textContent  = 'Editar Evento';
  form.titulo.value       = item.titulo ?? '';
  form.descripcion.value  = item.descripcion ?? '';
  form.tipo.value         = item.tipo ?? '';
  form.fecha_inicio.value = toDatetimeLocal(item.fecha_inicio);
  form.fecha_fin.value    = toDatetimeLocal(item.fecha_fin);
  selectLugar.value       = item.lugar_id ?? '';
  updatePreview(item.imagen_url ?? null);
  openModal('evento-modal');
}

// sube la imagen seleccionada si hay un archivo nuevo; si no, conserva la URL actual
async function uploadImageIfSelected() {
  if (!fileInput.files[0]) return currentImageUrl;
  const fd = new FormData();
  fd.append('file', fileInput.files[0]);
  const res = await api.postForm('/upload/imagen', fd);
  return res.url;
}

// crea o actualiza según si hay editingId
async function handleSave(e) {
  e.preventDefault();
  try {
    const imagen_url = await uploadImageIfSelected();
    const body = {
      titulo:       form.titulo.value.trim(),
      descripcion:  form.descripcion.value.trim() || null,
      tipo:         form.tipo.value.trim() || null,
      fecha_inicio: form.fecha_inicio.value || null,
      fecha_fin:    form.fecha_fin.value || null,
      lugar_id:     selectLugar.value || null,
      imagen_url,
    };
    if (editingId) {
      await api.put(`/eventos/${editingId}`, body);
      showToast('success', 'Actualizado', 'Evento actualizado correctamente');
    } else {
      await api.post('/eventos', body);
      showToast('success', 'Creado', 'Evento creado correctamente');
    }
    closeModal('evento-modal');
    load();
  } catch (err) {
    showToast('error', 'Error', err?.message ?? 'No se pudo guardar');
  }
}

// muestra el nombre del archivo seleccionado
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) { imgPreview.textContent = file.name; imgPreview.style.display = 'block'; }
});

// eventos de la página
document.getElementById('btn-nuevo').addEventListener('click', openCreate);
form.addEventListener('submit', handleSave);
searchInput.addEventListener('input', debounce(v => { state.q = v.target.value; state.page = 1; load(); }, 300));

// carga lugares y lista en paralelo
Promise.all([loadLugares(), load()]);
