import { api } from '../api.js';
import { requireAuth, initHeader } from '../router.js';
import { renderPagination } from '../components/pagination.js';
import { openModal, closeModal, initModals } from '../components/modal.js';
import { confirm } from '../components/confirm.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, formatDate, debounce } from '../utils.js';

requireAuth();
initHeader();
initModals();

// referencias al DOM
const cardsGrid   = document.getElementById('lugares-cards');
const pagination  = document.getElementById('pagination');
const searchInput = document.getElementById('search');
const modalTitle  = document.getElementById('modal-title');
const form        = document.getElementById('lugar-form');
const fileInput   = document.getElementById('f-imagen');
const imgPreview  = document.getElementById('img-preview');

// estado de la lista
let state           = { page: 1, limit: 12, q: '', sort: 'nombre', order: 'asc' };
let editingId       = null;
let currentImageUrl = null;

// genera el HTML de una card de lugar
function cardHtml(r) {
  const media = r.imagen_url
    ? `<img src="${escapeHtml(r.imagen_url)}" alt="${escapeHtml(r.nombre)}" />`
    : `<div class="card-media-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`;
  const badge    = r.categoria ? `<span class="card-badge-floating">${escapeHtml(r.categoria)}</span>` : '';
  const horario  = (r.horario_apertura && r.horario_cierre) ? `${r.horario_apertura} – ${r.horario_cierre}` : null;
  const ubicacion = [r.edificio, r.piso ? `Piso ${r.piso}` : null].filter(Boolean).join(', ');

  return `
    <div class="card">
      <div class="card-media">
        ${media}
        ${badge}
      </div>
      <div class="card-body">
        ${ubicacion ? `<div class="card-meta">${escapeHtml(ubicacion)}</div>` : ''}
        <h3 class="card-title">${escapeHtml(r.nombre)}</h3>
        ${r.descripcion ? `<p class="card-desc">${escapeHtml(r.descripcion)}</p>` : ''}
        <div class="card-footer">
          <span class="card-footer-meta">${horario ? escapeHtml(horario) : formatDate(r.created_at)}</span>
          <div class="card-actions">
            <button class="row-action" data-edit="${r.id}" title="Editar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="row-action danger" data-delete="${r.id}" data-name="${escapeHtml(r.nombre)}" title="Eliminar">
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
    const data = await api.get('/lugares', { page: state.page, limit: state.limit, q: state.q, sort: state.sort, order: state.order });
    if (data.items.length === 0) {
      cardsGrid.innerHTML = '<p style="padding:48px;text-align:center;color:var(--text-muted);grid-column:1/-1">No hay lugares registrados.</p>';
    } else {
      cardsGrid.innerHTML = data.items.map(cardHtml).join('');
    }
    renderPagination(pagination, { total: data.total, page: data.page, pageSize: data.limit, onChange: p => { state.page = p; load(); } });
    bindCardActions();
  } catch {
    showToast('error', 'Error', 'No se pudo cargar la lista de lugares');
  }
}

// conecta los botones de editar y eliminar de cada card
function bindCardActions() {
  cardsGrid.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = await api.get(`/lugares/${btn.dataset.edit}`);
      openEdit(data);
    });
  });
  cardsGrid.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm(`¿Eliminar el lugar "${btn.dataset.name}"?`);
      if (!ok) return;
      try {
        await api.delete(`/lugares/${btn.dataset.delete}`);
        showToast('success', 'Eliminado', 'Lugar eliminado correctamente');
        load();
      } catch {
        showToast('error', 'Error', 'No se pudo eliminar el lugar');
      }
    });
  });
}

// muestra u oculta la vista previa de la imagen
function updatePreview(url) {
  if (url) {
    imgPreview.src = url;
    imgPreview.style.display = 'block';
  } else {
    imgPreview.src = '';
    imgPreview.style.display = 'none';
  }
}

// abre el modal en modo creación
function openCreate() {
  editingId = null;
  currentImageUrl = null;
  modalTitle.textContent = 'Nuevo Lugar';
  form.reset();
  updatePreview(null);
  openModal('lugar-modal');
}

// abre el modal en modo edición con los datos precargados
function openEdit(item) {
  editingId = item.id;
  currentImageUrl = item.imagen_url ?? null;
  modalTitle.textContent      = 'Editar Lugar';
  form.nombre.value           = item.nombre ?? '';
  form.descripcion.value      = item.descripcion ?? '';
  form.edificio.value         = item.edificio ?? '';
  form.piso.value             = item.piso ?? '';
  form.categoria.value        = item.categoria ?? '';
  form.horario_apertura.value = item.horario_apertura ?? '';
  form.horario_cierre.value   = item.horario_cierre ?? '';
  updatePreview(item.imagen_url ?? null);
  openModal('lugar-modal');
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
      nombre:           form.nombre.value.trim(),
      descripcion:      form.descripcion.value.trim() || null,
      edificio:         form.edificio.value.trim() || null,
      piso:             form.piso.value.trim() || null,
      categoria:        form.categoria.value.trim() || null,
      horario_apertura: form.horario_apertura.value.trim() || null,
      horario_cierre:   form.horario_cierre.value.trim() || null,
      imagen_url,
    };
    if (editingId) {
      await api.put(`/lugares/${editingId}`, body);
      showToast('success', 'Actualizado', 'Lugar actualizado correctamente');
    } else {
      await api.post('/lugares', body);
      showToast('success', 'Creado', 'Lugar creado correctamente');
    }
    closeModal('lugar-modal');
    load();
  } catch (err) {
    showToast('error', 'Error', err?.message ?? 'No se pudo guardar');
  }
}

// actualiza la vista previa cuando el usuario selecciona un archivo
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) updatePreview(URL.createObjectURL(file));
});

// eventos de la página
document.getElementById('btn-nuevo').addEventListener('click', openCreate);
form.addEventListener('submit', handleSave);
searchInput.addEventListener('input', debounce(v => { state.q = v.target.value; state.page = 1; load(); }, 300));

load();
