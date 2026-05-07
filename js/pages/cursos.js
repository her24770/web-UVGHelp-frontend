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
const tbody          = document.querySelector('#cursos-table tbody');
const thead          = document.querySelector('#cursos-table thead');
const pagination     = document.getElementById('pagination');
const searchInput    = document.getElementById('search');
const modalTitle     = document.getElementById('modal-title');
const form           = document.getElementById('curso-form');
const selectCarrera  = document.getElementById('f-carrera');
const selectProfesor = document.getElementById('f-profesor');

// estado de la lista
const _qp = getQueryParams();
let state      = { page: Number(_qp.page) || 1, limit: 20, q: _qp.q || '', sort: _qp.sort || 'nombre', order: _qp.order || 'asc' };
if (state.q) searchInput.value = state.q;
let editingId  = null;
let carreras   = [];
let profesores = [];

// definición de columnas de la tabla
const COLUMNS = [
  { key: 'nombre',      label: 'Nombre',   render: r => `<span class="cell-strong">${escapeHtml(r.nombre)}</span>` },
  { key: 'codigo',      label: 'Código',   render: r => escapeHtml(r.codigo ?? '—') },
  { key: 'creditos',    label: 'Créditos', render: r => r.creditos ?? '—' },
  { key: 'semestre',    label: 'Semestre', render: r => escapeHtml(r.semestre ?? '—') },
  { key: 'carrera_id',  label: 'Carrera',  render: r => {
    const c = carreras.find(c => c.id === r.carrera_id);
    return escapeHtml(c?.nombre ?? '—');
  }},
  { key: 'profesor_id', label: 'Profesor', render: r => {
    const p = profesores.find(p => p.id === r.profesor_id);
    return p ? escapeHtml(`${p.nombre} ${p.apellido}`) : '—';
  }},
  { key: 'created_at',  label: 'Creado',   render: r => formatDate(r.created_at) },
  { key: '_actions',    label: '',         render: r => `
    <div class="row-actions">
      <button class="row-action" data-edit="${r.id}" title="Editar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="row-action danger" data-delete="${r.id}" data-name="${escapeHtml(r.nombre)}" title="Eliminar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>` },
];

// carga carreras y profesores para los selects del formulario
async function loadRelaciones() {
  const [dataCarreras, dataProfesores] = await Promise.all([
    api.get('/carreras',   { limit: 100 }),
    api.get('/profesores', { limit: 100 }),
  ]);
  carreras   = dataCarreras.items;
  profesores = dataProfesores.items;

  selectCarrera.innerHTML  = '<option value="">Sin carrera</option>' +
    carreras.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
  selectProfesor.innerHTML = '<option value="">Sin profesor</option>' +
    profesores.map(p => `<option value="${p.id}">${escapeHtml(p.nombre + ' ' + p.apellido)}</option>`).join('');
}

// obtiene la lista paginada y re-renderiza la tabla
async function load() {
  setQueryParams({ page: state.page, q: state.q || null, sort: state.sort, order: state.order });
  try {
    const data = await api.get('/cursos', { page: state.page, limit: state.limit, q: state.q, sort: state.sort, order: state.order });
    renderTableHead(thead, COLUMNS);
    renderTable(tbody, COLUMNS, data.items);
    renderPagination(pagination, { total: data.total, page: data.page, pageSize: data.limit, onChange: p => { state.page = p; load(); } });
    bindRowActions();
  } catch {
    showToast('error', 'Error', 'No se pudo cargar la lista de cursos');
  }
}

// conecta los botones de editar y eliminar de cada fila
function bindRowActions() {
  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const data = await api.get(`/cursos/${btn.dataset.edit}`);
      openEdit(data);
    });
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm(`¿Eliminar el curso "${btn.dataset.name}"?`);
      if (!ok) return;
      try {
        await api.delete(`/cursos/${btn.dataset.delete}`);
        showToast('success', 'Eliminado', 'Curso eliminado correctamente');
        load();
      } catch {
        showToast('error', 'Error', 'No se pudo eliminar el curso');
      }
    });
  });
}

// abre el modal en modo creación
function openCreate() {
  editingId = null;
  modalTitle.textContent = 'Nuevo Curso';
  form.reset();
  openModal('curso-modal');
}

// abre el modal en modo edición con los datos precargados
function openEdit(item) {
  editingId = item.id;
  modalTitle.textContent   = 'Editar Curso';
  form.nombre.value        = item.nombre ?? '';
  form.codigo.value        = item.codigo ?? '';
  form.creditos.value      = item.creditos ?? '';
  form.semestre.value      = item.semestre ?? '';
  selectCarrera.value      = item.carrera_id ?? '';
  selectProfesor.value     = item.profesor_id ?? '';
  openModal('curso-modal');
}

// crea o actualiza según si hay editingId
async function handleSave(e) {
  e.preventDefault();
  const body = {
    nombre:      form.nombre.value.trim(),
    codigo:      form.codigo.value.trim() || null,
    creditos:    form.creditos.value ? Number(form.creditos.value) : null,
    semestre:    form.semestre.value.trim() || null,
    carrera_id:  selectCarrera.value || null,
    profesor_id: selectProfesor.value || null,
  };
  try {
    if (editingId) {
      await api.put(`/cursos/${editingId}`, body);
      showToast('success', 'Actualizado', 'Curso actualizado correctamente');
    } else {
      await api.post('/cursos', body);
      showToast('success', 'Creado', 'Curso creado correctamente');
    }
    closeModal('curso-modal');
    load();
  } catch (err) {
    showToast('error', 'Error', err?.message ?? 'No se pudo guardar');
  }
}

const EXPORT_COLS = [
  { key: 'nombre',      label: 'Nombre' },
  { key: 'codigo',      label: 'Código' },
  { key: 'creditos',    label: 'Créditos' },
  { key: 'semestre',    label: 'Semestre' },
  { key: 'carrera_id',  label: 'Carrera',  value: r => carreras.find(c => c.id === r.carrera_id)?.nombre ?? '' },
  { key: 'profesor_id', label: 'Profesor', value: r => { const p = profesores.find(p => p.id === r.profesor_id); return p ? `${p.nombre} ${p.apellido}` : ''; } },
];

async function exportData(format) {
  try {
    const items = await fetchAll(api.get, '/cursos', { sort: state.sort, order: state.order, q: state.q });
    const fn = format === 'csv' ? downloadCsv : downloadXlsx;
    fn(`cursos.${format === 'csv' ? 'csv' : 'xls'}`, items, EXPORT_COLS);
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

// carga relaciones y lista en paralelo
Promise.all([loadRelaciones(), load()]);
