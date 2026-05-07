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
const tbody         = document.querySelector('#profesores-table tbody');
const thead         = document.querySelector('#profesores-table thead');
const pagination    = document.getElementById('pagination');
const searchInput   = document.getElementById('search');
const modalTitle    = document.getElementById('modal-title');
const form          = document.getElementById('profesor-form');
const selectCarrera = document.getElementById('f-carrera');

// estado de la lista
const _qp = getQueryParams();
let state = { page: Number(_qp.page) || 1, limit: 20, q: _qp.q || '', sort: _qp.sort || 'nombre', order: _qp.order || 'asc' };
if (state.q) searchInput.value = state.q;
let editingId = null;
let carreras  = [];

// definición de columnas de la tabla
const COLUMNS = [
  { key: 'nombre',       label: 'Nombre',       render: r => `<span class="cell-strong">${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</span>` },
  { key: 'email',        label: 'Email',        render: r => escapeHtml(r.email ?? '—') },
  { key: 'telefono',     label: 'Teléfono',     render: r => escapeHtml(r.telefono ?? '—') },
  { key: 'departamento', label: 'Departamento', render: r => escapeHtml(r.departamento ?? '—') },
  { key: 'carrera_id',   label: 'Carrera',      render: r => {
    const c = carreras.find(c => c.id === r.carrera_id);
    return escapeHtml(c?.nombre ?? '—');
  }},
  { key: 'created_at',   label: 'Creado',       render: r => formatDate(r.created_at) },
  { key: '_actions',     label: '',             render: r => `
    <div class="row-actions">
      <button class="row-action" data-edit="${r.id}" title="Editar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="row-action danger" data-delete="${r.id}" data-name="${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}" title="Eliminar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>` },
];

// carga las carreras para el select del formulario
async function loadCarreras() {
  const data = await api.get('/carreras', { limit: 100 });
  carreras = data.items;
  selectCarrera.innerHTML = '<option value="">Sin carrera asignada</option>' +
    carreras.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
}

// obtiene la lista paginada y re-renderiza la tabla
async function load() {
  setQueryParams({ page: state.page, q: state.q || null, sort: state.sort, order: state.order });
  try {
    const data = await api.get('/profesores', { page: state.page, limit: state.limit, q: state.q, sort: state.sort, order: state.order });
    renderTableHead(thead, COLUMNS);
    renderTable(tbody, COLUMNS, data.items);
    renderPagination(pagination, { total: data.total, page: data.page, pageSize: data.limit, onChange: p => { state.page = p; load(); } });
    bindRowActions();
  } catch {
    showToast('error', 'Error', 'No se pudo cargar la lista de profesores');
  }
}

// conecta los botones de editar y eliminar de cada fila
function bindRowActions() {
  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = await api.get(`/profesores/${btn.dataset.edit}`);
      openEdit(data);
    });
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm(`¿Eliminar al profesor "${btn.dataset.name}"?`);
      if (!ok) return;
      try {
        await api.delete(`/profesores/${btn.dataset.delete}`);
        showToast('success', 'Eliminado', 'Profesor eliminado correctamente');
        load();
      } catch {
        showToast('error', 'Error', 'No se pudo eliminar el profesor');
      }
    });
  });
}

// abre el modal en modo creación
function openCreate() {
  editingId = null;
  modalTitle.textContent = 'Nuevo Profesor';
  form.reset();
  openModal('profesor-modal');
}

// abre el modal en modo edición con los datos precargados
function openEdit(item) {
  editingId = item.id;
  modalTitle.textContent  = 'Editar Profesor';
  form.nombre.value       = item.nombre ?? '';
  form.apellido.value     = item.apellido ?? '';
  form.email.value        = item.email ?? '';
  form.telefono.value     = item.telefono ?? '';
  form.departamento.value = item.departamento ?? '';
  selectCarrera.value     = item.carrera_id ?? '';
  openModal('profesor-modal');
}

// crea o actualiza según si hay editingId
async function handleSave(e) {
  e.preventDefault();
  const body = {
    nombre:       form.nombre.value.trim(),
    apellido:     form.apellido.value.trim(),
    email:        form.email.value.trim() || null,
    telefono:     form.telefono.value.trim() || null,
    departamento: form.departamento.value.trim() || null,
    carrera_id:   selectCarrera.value || null,
  };
  try {
    if (editingId) {
      await api.put(`/profesores/${editingId}`, body);
      showToast('success', 'Actualizado', 'Profesor actualizado correctamente');
    } else {
      await api.post('/profesores', body);
      showToast('success', 'Creado', 'Profesor creado correctamente');
    }
    closeModal('profesor-modal');
    load();
  } catch (err) {
    showToast('error', 'Error', err?.message ?? 'No se pudo guardar');
  }
}

const EXPORT_COLS = [
  { key: 'nombre',       label: 'Nombre' },
  { key: 'apellido',     label: 'Apellido' },
  { key: 'email',        label: 'Email' },
  { key: 'telefono',     label: 'Teléfono' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'carrera_id',   label: 'Carrera', value: r => carreras.find(c => c.id === r.carrera_id)?.nombre ?? '' },
];

async function exportData(format) {
  try {
    const items = await fetchAll(api.get, '/profesores', { sort: state.sort, order: state.order, q: state.q });
    const fn = format === 'csv' ? downloadCsv : downloadXlsx;
    fn(`profesores.${format === 'csv' ? 'csv' : 'xls'}`, items, EXPORT_COLS);
  } catch {
    showToast('error', 'Error', 'No se pudo exportar');
  }
}

// eventos de la página
document.getElementById('btn-nuevo').addEventListener('click', openCreate);
document.getElementById('btn-csv').addEventListener('click', () => exportData('csv'));
document.getElementById('btn-xlsx').addEventListener('click', () => exportData('xlsx'));
form.addEventListener('submit', handleSave);
searchInput.addEventListener('input', debounce(v => { state.q = v.target.value; state.page = 1; load(); }, 300));

// carga carreras y lista en paralelo
Promise.all([loadCarreras(), load()]);
