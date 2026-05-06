// renderiza controles de paginación dentro de `container`
export function renderPagination(container, { total, page, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  container.innerHTML = `
    <span>Mostrando ${from}–${to} de ${total} registros</span>
    <div class="pagination-controls">
      <button class="pg-btn" data-action="prev" ${page === 1 ? 'disabled' : ''} aria-label="Anterior">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button class="pg-btn" data-action="next" ${page === totalPages ? 'disabled' : ''} aria-label="Siguiente">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;

  container.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
    if (page > 1) onChange(page - 1);
  });
  container.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    if (page < totalPages) onChange(page + 1);
  });
}
