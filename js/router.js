import { isAuthenticated, getUser, logout } from './auth.js';

// redirige a login si la página requiere autenticación
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace('/pages/login.html');
  }
}

// redirige al dashboard si ya hay sesión activa (para la página de login)
export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.replace('/pages/dashboard.html');
  }
}

// inyecta nombre, iniciales y botón de logout en el header
export function initHeader() {
  const user = getUser();
  if (!user) return;

  const nameEl   = document.getElementById('header-user-name');
  const avatarEl = document.getElementById('header-avatar');
  const logoutEl = document.getElementById('header-logout');

  if (nameEl)   nameEl.textContent   = `${user.nombre} ${user.apellido}`;
  if (avatarEl) avatarEl.textContent = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
  if (logoutEl) logoutEl.addEventListener('click', logout);
}
