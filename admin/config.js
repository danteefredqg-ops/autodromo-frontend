// admin/config.js — Configuración global del frontend
// Cambia esta URL a la de tu Railway backend en producción
const API_URL = 'https://autodromo.up.railway.app/api';
// Para desarrollo local usa: const API_URL = 'http://localhost:3001/api';

// Helpers globales de sesión
function obtenerToken() {
  return localStorage.getItem('autodromo_token');
}

function obtenerUsuario() {
  return JSON.parse(localStorage.getItem('autodromo_usuario') || 'null');
}

function cerrarSesion() {
  localStorage.removeItem('autodromo_token');
  localStorage.removeItem('autodromo_usuario');
  window.location.href = '../Login/index.html';
}

function requerirSesion(rolesPermitidos) {
  const token   = obtenerToken();
  const usuario = obtenerUsuario();
  if (!token || !usuario) {
    window.location.href = '../Login/index.html';
    return false;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    window.location.href = '../dashboard/index.html';
    return false;
  }
  return true;
}

// Fetch con autenticación
async function apiFetch(ruta, opciones = {}) {
  const token = obtenerToken();
  const headers = { 'Content-Type': 'application/json', ...opciones.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });

  if (res.status === 401) {
    cerrarSesion();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

// Toast de notificaciones
function mostrarToast(mensaje, tipo = 'exito') {
  const colores = {
    exito:    { bg: 'rgba(34,197,94,0.15)',  borde: 'rgba(34,197,94,0.4)',  texto: '#4ade80' },
    error:    { bg: 'rgba(230,57,70,0.15)',  borde: 'rgba(230,57,70,0.4)',  texto: '#f87171' },
    info:     { bg: 'rgba(59,130,246,0.15)', borde: 'rgba(59,130,246,0.4)', texto: '#60a5fa' },
    advertencia: { bg: 'rgba(245,158,11,0.15)', borde: 'rgba(245,158,11,0.4)', texto: '#fbbf24' },
  };
  const c = colores[tipo] || colores.info;
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    background: ${c.bg}; border: 1px solid ${c.borde}; color: ${c.texto};
    padding: 12px 18px; border-radius: 10px;
    font-family: 'Barlow', sans-serif; font-size: 0.9rem; font-weight: 500;
    max-width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = mensaje;
  document.head.insertAdjacentHTML('beforeend', '<style>@keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}</style>');
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Formatear fecha
function formatFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Colores de estatus
function badgeEstatus(estatus) {
  const map = {
    'Pagado':        { bg: 'rgba(34,197,94,0.15)',  borde: 'rgba(34,197,94,0.3)',  color: '#4ade80' },
    'Pendiente':     { bg: 'rgba(245,158,11,0.15)', borde: 'rgba(245,158,11,0.3)', color: '#fbbf24' },
    'Descalificado': { bg: 'rgba(230,57,70,0.15)',  borde: 'rgba(230,57,70,0.3)',  color: '#f87171' },
    'Vigente':       { bg: 'rgba(34,197,94,0.15)',  borde: 'rgba(34,197,94,0.3)',  color: '#4ade80' },
    'Vencida':       { bg: 'rgba(230,57,70,0.15)',  borde: 'rgba(230,57,70,0.3)',  color: '#f87171' },
    'Suspendida':    { bg: 'rgba(230,57,70,0.15)',  borde: 'rgba(230,57,70,0.3)',  color: '#f87171' },
  };
  const c = map[estatus] || { bg: 'rgba(255,255,255,0.1)', borde: 'rgba(255,255,255,0.2)', color: '#999' };
  return `<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:${c.bg};border:1px solid ${c.borde};color:${c.color}">${estatus}</span>`;
}
