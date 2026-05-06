import { isAuthenticated } from './auth.js';

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
