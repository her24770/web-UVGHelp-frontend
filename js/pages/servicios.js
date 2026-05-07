import { api } from '../api.js';
import { requireAuth, initHeader } from '../router.js';
import { renderTable, renderTableHead } from '../components/table.js';
import { renderPagination } from '../components/pagination.js';
import { openModal, closeModal, initModals } from '../components/modal.js';
import { confirm } from '../components/confirm.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, formatDate, debounce } from '../utils.js';
import { downloadCsv, downloadXlsx } from '../components/export.js';

requireAuth();
initHeader();
initModals();

// referencias al DOM
const tbody          = document.querySelector('#servicios-table tbody');
const thead          = document.querySelector('#servicios-table thead');
const pagination     = document.getElementById('pagination');
const searchInput    = document.getElementById('search');
const modalTitle     = document.getElementById('modal-title');
const form           = document.getElementById('servicio-form');
const selectContacto = document.getElementById('f-contacto');

// estado de la lista
let state     = { page: 1, limit: 20, q: '', sort: 'nombre', order: 'asc' };
let editingId = null;
let contactos = [];

// definición de columnas de la tabla
const COLUMNS = [
  { key: 'nombre',    label: 'Nombre',    render: r => `<span class="cell-strong">${escapeHtml(r.nombre)}</span>` },
  { key: 'categoria', label: 'Categoría', render: r => escapeHtml(r.categoria ?? '—') },
  { key: 'horario',   label: 'Horario',   render: r => escapeHtml(r.horario ?? '—') },
  { key: 'contacto_id', label: 'Contacto', render: r => {
    const c = contactos.find(c => c.id === r.contacto_id);
    return escapeHtml(c?.nombre ?? '—');
  }},
  { key: 'created_at', label: 'Creado', render: r => formatDate(r.created_at) },
  { key: '_actions',   label: '',       render: r => `
    <div class="row-actions">
      <button class="row-action" data-edit="${r.id}" title="Editar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="row-action danger" data-delete="${r.id}" data-name="${escapeHtml(r.nombre)}" title="Eliminar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>` },
];

// carga los contactos para el select del formulario
async function loadContactos() {
  const data = await api.get('/contactos', { limit: 100 });
  contactos = data.items;
  selectContacto.innerHTML = '<option value="">Sin contacto asignado</option>' +
    contactos.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
}

// obtiene la lista paginada y re-renderiza la tabla
async function load() {
  try {
    const data = await api.get('/servicios', { page: state.page, limit: state.limit, q: state.q, sort: state.sort, order: state.order });
    renderTableHead(thead, COLUMNS);
    renderTable(tbody, COLUMNS, data.items);
    renderPagination(pagination, { total: data.total, page: data.page, pageSize: data.limit, onChange: p => { state.page = p; load(); } });
    bindRowActions();
  } catch {
    showToast('error', 'Error', 'No se pudo cargar la lista de servicios');
  }
}

// conecta los botones de editar y eliminar de cada fila
function bindRowActions() {
  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = await api.get(`/servicios/${btn.dataset.edit}`);
      openEdit(data);
    });
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm(`¿Eliminar el servicio "${btn.dataset.name}"?`);
      if (!ok) return;
      try {
        await api.delete(`/servicios/${btn.dataset.delete}`);
        showToast('success', 'Eliminado', 'Servicio eliminado correctamente');
        load();
      } catch {
        showToast('error', 'Error', 'No se pudo eliminar el servicio');
      }
    });
  });
}

// abre el modal en modo creación
function openCreate() {
  editingId = null;
  modalTitle.textContent = 'Nuevo Servicio';
  form.reset();
  openModal('servicio-modal');
}

// abre el modal en modo edición con los datos precargados
function openEdit(item) {
  editingId = item.id;
  modalTitle.textContent  = 'Editar Servicio';
  form.nombre.value       = item.nombre ?? '';
  form.descripcion.value  = item.descripcion ?? '';
  form.categoria.value    = item.categoria ?? '';
  form.horario.value      = item.horario ?? '';
  selectContacto.value    = item.contacto_id ?? '';
  openModal('servicio-modal');
}

// crea o actualiza según si hay editingId
async function handleSave(e) {
  e.preventDefault();
  const body = {
    nombre:      form.nombre.value.trim(),
    descripcion: form.descripcion.value.trim() || null,
    categoria:   form.categoria.value.trim() || null,
    horario:     form.horario.value.trim() || null,
    contacto_id: selectContacto.value || null,
  };
  try {
    if (editingId) {
      await api.put(`/servicios/${editingId}`, body);
      showToast('success', 'Actualizado', 'Servicio actualizado correctamente');
    } else {
      await api.post('/servicios', body);
      showToast('success', 'Creado', 'Servicio creado correctamente');
    }
    closeModal('servicio-modal');
    load();
  } catch (err) {
    showToast('error', 'Error', err?.message ?? 'No se pudo guardar');
  }
}

const EXPORT_COLS = [
  { key: 'nombre',      label: 'Nombre' },
  { key: 'categoria',   label: 'Categoría' },
  { key: 'horario',     label: 'Horario' },
  { key: 'contacto_id', label: 'Contacto', value: r => contactos.find(c => c.id === r.contacto_id)?.nombre ?? '' },
];

async function exportData(format) {
  try {
    const data = await api.get('/servicios', { limit: 1000, sort: state.sort, order: state.order, q: state.q });
    const fn = format === 'csv' ? downloadCsv : downloadXlsx;
    fn(`servicios.${format === 'csv' ? 'csv' : 'xls'}`, data.items, EXPORT_COLS);
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

// carga contactos y lista en paralelo
Promise.all([loadContactos(), load()]);
