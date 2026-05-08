// renderiza una tabla dentro de `tbody` dado un array de columnas y filas
// columns: [{ key, label, render? }]  render es opcional para formatear el valor
export function renderTable(tbody, columns, rows) {
  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${columns.length}" style="text-align:center;padding:40px;color:var(--text-muted)">
          Sin resultados
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = rows.map(row => `
    <tr data-id="${row.id}">
      ${columns.map(col => {
        const value = col.render ? col.render(row) : (row[col.key] ?? '—');
        return `<td>${value}</td>`;
      }).join('')}
    </tr>
  `).join('');
}

// construye el thead de la tabla dado un array de columnas
// sortState: { sort, order } — columna activa y dirección
// onSort(colKey): callback invocado al hacer click en un header sortable
export function renderTableHead(thead, columns, sortState, onSort) {
  thead.innerHTML = `
    <tr>
      ${columns.map(col => {
        const sortable = !!onSort && col.sortable !== false && !col.key.startsWith('_');
        const isActive = sortable && sortState && sortState.sort === col.key;
        const arrow    = isActive ? (sortState.order === 'asc' ? ' ↑' : ' ↓') : '';
        const attrs    = sortable ? `data-sort="${col.key}"` : '';
        return `<th ${attrs} class="${sortable ? 'th-sortable' : ''}${isActive ? ' th-active' : ''}">${col.label}${arrow}</th>`;
      }).join('')}
    </tr>`;

  if (onSort) {
    thead.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => onSort(th.dataset.sort));
    });
  }
}
