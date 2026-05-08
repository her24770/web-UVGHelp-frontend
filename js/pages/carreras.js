import { api } from '../api.js';
import { requireAuth, initHeader } from '../router.js';
import { renderTable, renderTableHead } from '../components/table.js';
import { renderPagination } from '../components/pagination.js';
import { openModal, closeModal, initModals } from '../components/modal.js';
import { confirm } from '../components/confirm.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, formatDate, debounce, getQueryParams, setQueryParams } from '../utils.js';
import { downloadCsv, downloadXlsx, fetchAll } from '../components/export.js';

requireAuth();
initHeader();
initModals();

// referencias al DOM
const tbody       = document.querySelector('#carreras-table tbody');
const thead       = document.querySelector('#carreras-table thead');
const pagination  = document.getElementById('pagination');
const searchInput = document.getElementById('search');
const modalTitle  = document.getElementById('modal-title');
const form        = document.getElementById('carrera-form');

// estado de la lista — inicializado desde la URL si hay parámetros
const _qp = getQueryParams();
let state = { page: Number(_qp.page) || 1, limit: 20, q: _qp.q || '', sort: _qp.sort || 'nombre', order: _qp.order || 'asc' };
if (state.q) searchInput.value = state.q;
let editingId = null;

// definición de columnas de la tabla
const COLUMNS = [
  { key: 'nombre',             label: 'Nombre',   render: r => `<span class="cell-strong">${escapeHtml(r.nombre)}</span>` },
  { key: 'facultad',           label: 'Facultad', render: r => escapeHtml(r.facultad ?? '—') },
  { key: 'duracion_semestres', label: 'Duración', render: r => r.duracion_semestres ? `${r.duracion_semestres} sem.` : '—' },
  { key: 'pensum_url',         label: 'Pensum',   sortable: false, render: r => r.pensum_url ? `<a href="${escapeHtml(r.pensum_url)}" target="_blank" style="color:var(--accent)">Ver PDF</a>` : '—' },
  { key: 'created_at',         label: 'Creado',   render: r => formatDate(r.created_at) },
  { key: '_actions',           label: '',         render: r => `
    <div class="row-actions">
      <button class="row-action" data-edit="${r.id}" title="Editar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="row-action danger" data-delete="${r.id}" data-name="${escapeHtml(r.nombre)}" title="Eliminar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>` },
];

// obtiene la lista paginada y re-renderiza la tabla
async function load() {
  setQueryParams({ page: state.page, q: state.q || null, sort: state.sort, order: state.order });
  try {
    const data = await api.get('/carreras', { page: state.page, limit: state.limit, q: state.q, sort: state.sort, order: state.order });
    renderTableHead(thead, COLUMNS, state, col => {
      if (state.sort === col) state.order = state.order === 'asc' ? 'desc' : 'asc';
      else { state.sort = col; state.order = 'asc'; }
      state.page = 1; load();
    });
    renderTable(tbody, COLUMNS, data.items);
    renderPagination(pagination, { total: data.total, page: data.page, pageSize: data.limit, onChange: p => { state.page = p; load(); } });
    bindRowActions();
  } catch {
    showToast('error', 'Error', 'No se pudo cargar la lista de carreras');
  }
}

// conecta los botones de editar y eliminar de cada fila
function bindRowActions() {
  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = await api.get(`/carreras/${btn.dataset.edit}`);
      openEdit(data);
    });
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm(`¿Eliminar la carrera "${btn.dataset.name}"?`);
      if (!ok) return;
      try {
        await api.delete(`/carreras/${btn.dataset.delete}`);
        showToast('success', 'Eliminado', 'Carrera eliminada correctamente');
        load();
      } catch {
        showToast('error', 'Error', 'No se pudo eliminar la carrera');
      }
    });
  });
}

// abre el modal en modo creación
function openCreate() {
  editingId = null;
  modalTitle.textContent = 'Nueva Carrera';
  form.reset();
  openModal('carrera-modal');
}

// abre el modal en modo edición con los datos precargados
function openEdit(item) {
  editingId = item.id;
  modalTitle.textContent        = 'Editar Carrera';
  form.nombre.value             = item.nombre ?? '';
  form.facultad.value           = item.facultad ?? '';
  form.duracion_semestres.value = item.duracion_semestres ?? '';
  form.pensum_url.value         = item.pensum_url ?? '';
  openModal('carrera-modal');
}

// crea o actualiza según si hay editingId
async function handleSave(e) {
  e.preventDefault();
  const body = {
    nombre:             form.nombre.value.trim(),
    facultad:           form.facultad.value.trim() || null,
    duracion_semestres: form.duracion_semestres.value ? Number(form.duracion_semestres.value) : null,
    pensum_url:         form.pensum_url.value.trim() || null,
  };
  try {
    if (editingId) {
      await api.put(`/carreras/${editingId}`, body);
      showToast('success', 'Actualizado', 'Carrera actualizada correctamente');
    } else {
      await api.post('/carreras', body);
      showToast('success', 'Creado', 'Carrera creada correctamente');
    }
    closeModal('carrera-modal');
    load();
  } catch (err) {
    showToast('error', 'Error', err?.message ?? 'No se pudo guardar');
  }
}

const EXPORT_COLS = [
  { key: 'nombre',             label: 'Nombre' },
  { key: 'facultad',           label: 'Facultad' },
  { key: 'duracion_semestres', label: 'Duración (semestres)' },
  { key: 'pensum_url',         label: 'Pensum URL' },
];

async function exportData(format) {
  try {
    const items = await fetchAll(api.get, '/carreras', { sort: state.sort, order: state.order, q: state.q });
    const fn = format === 'csv' ? downloadCsv : downloadXlsx;
    fn(`carreras.${format === 'csv' ? 'csv' : 'xls'}`, items, EXPORT_COLS);
  } catch {
    showToast('error', 'Error', 'No se pudo exportar');
  }
}

// eventos de la página
document.getElementById('btn-nueva').addEventListener('click', openCreate);
document.getElementById('btn-csv').addEventListener('click', () => exportData('csv'));
document.getElementById('btn-xlsx').addEventListener('click', () => exportData('xlsx'));
form.addEventListener('submit', handleSave);
searchInput.addEventListener('input', debounce(v => { state.q = v.target.value; state.page = 1; load(); }, 300));

load();
