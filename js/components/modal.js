// abre un modal por su id y bloquea el scroll del body
export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

// cierra un modal y restaura el scroll
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

// inicializa los botones [data-modal-close] y el backdrop de todos los modales
export function initModals() {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });

  // clic en el backdrop cierra el modal
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        const modal = backdrop.closest('.modal');
        if (modal) closeModal(modal.id);
      }
    });
  });
}
