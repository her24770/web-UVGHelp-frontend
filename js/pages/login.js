import { api } from '../api.js';
import { setToken, setUser } from '../auth.js';
import { redirectIfAuthenticated } from '../router.js';

redirectIfAuthenticated();

const form        = document.getElementById('login-form');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const errorBanner = document.getElementById('login-error');
const loginBtn    = document.getElementById('login-btn');

// muestra u oculta el error visual de un campo
function setFieldError(fieldId, errorId, show) {
  document.getElementById(fieldId)?.classList.toggle('is-error', show);
  const el = document.getElementById(errorId);
  if (el) el.style.display = show ? 'flex' : 'none';
}

function resetErrors() {
  setFieldError('field-email', 'email-error', false);
  setFieldError('field-password', 'password-error', false);
  errorBanner.classList.remove('visible');
}

function setLoading(loading) {
  loginBtn.disabled = loading;
  loginBtn.classList.toggle('loading', loading);
  loginBtn.textContent = loading ? '' : 'Ingresar al panel';
}

// toggle de visibilidad de contraseña
document.querySelectorAll('[data-password-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.passwordToggle);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// limpia errores al escribir
[emailInput, passInput].forEach(inp => {
  inp.addEventListener('input', () => errorBanner.classList.remove('visible'));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resetErrors();

  const email    = emailInput.value.trim();
  const password = passInput.value;
  let valid = true;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    setFieldError('field-email', 'email-error', true);
    valid = false;
  }
  if (!password) {
    setFieldError('field-password', 'password-error', true);
    valid = false;
  }
  if (!valid) return;

  setLoading(true);

  try {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.access_token);

    // obtiene el perfil del usuario y lo guarda para mostrarlo en el header
    const me = await api.get('/auth/me');
    setUser(me);

    window.location.replace('/pages/dashboard.html');
  } catch (err) {
    setLoading(false);
    errorBanner.querySelector('#login-error-msg').textContent =
      err?.message ?? 'Correo o contraseña incorrectos.';
    errorBanner.classList.add('visible');
    emailInput.focus();
  }
});
