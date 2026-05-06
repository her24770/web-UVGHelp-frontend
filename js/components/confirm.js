import { openModal, closeModal } from './modal.js';

const MODAL_ID = 'confirm-modal';

// muestra el dialog de confirmación y resuelve true/false según la acción del usuario
export function confirm(message) {
  return new Promise((resolve) => {
    let modal = document.getElementById(MODAL_ID);

    // crea el modal si no existe en el DOM
    if (!modal) {
      modal = document.createElement('div');
      modal.id = MODAL_ID;
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-box modal-box--sm">
            <div class="modal-body">
              <p class="confirm-message" id="confirm-message"></p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
              <button class="btn btn-danger"    id="confirm-ok">Eliminar</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }

    document.getElementById('confirm-message').textContent = message;
    openModal(MODAL_ID);

    const cleanup = (result) => {
      closeModal(MODAL_ID);
      resolve(result);
    };

    // reemplaza listeners anteriores clonando los botones
    const ok     = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');
    const newOk     = ok.cloneNode(true);
    const newCancel = cancel.cloneNode(true);
    ok.replaceWith(newOk);
    cancel.replaceWith(newCancel);

    newOk.addEventListener('click',     () => cleanup(true));
    newCancel.addEventListener('click', () => cleanup(false));
  });
}
