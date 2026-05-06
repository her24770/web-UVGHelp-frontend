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
export function renderTableHead(thead, columns) {
  thead.innerHTML = `
    <tr>
      ${columns.map(col => `<th>${col.label}</th>`).join('')}
    </tr>`;
}
