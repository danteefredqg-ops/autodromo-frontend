// admin/config.js — Configuración global del frontend
// Cambia esta URL a la de tu Railway backend en producción
const API_URL = 'https://autodromo.up.railway.app/api';
// Para desarrollo local usa: const API_URL = 'http://localhost:3001/api';
const UPLOADS_BASE = API_URL.replace(/\/api$/, '');

// ─── Seguridad: escapar HTML para evitar XSS ──────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─── Sesión ───────────────────────────────────────────────────────────────────
function obtenerToken() {
  return localStorage.getItem('autodromo_token');
}

function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('autodromo_usuario') || 'null');
  } catch {
    // Datos corruptos: se limpian para no dejar la sesión atorada para siempre.
    localStorage.removeItem('autodromo_token');
    localStorage.removeItem('autodromo_usuario');
    return null;
  }
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
  _iniciarMonitorSesion(token);
  return true;
}

// Decodifica el JWT y programa advertencia + auto-logout antes de que expire
function _iniciarMonitorSesion(token) {
  try {
    const payload  = JSON.parse(atob(token.split('.')[1]));
    const ahora    = Math.floor(Date.now() / 1000);
    const restante = payload.exp - ahora;

    if (restante <= 0) { cerrarSesion(); return; }

    const AVISAR_EN = 15 * 60; // avisar 15 min antes
    const msHastaAviso  = Math.max(0, restante - AVISAR_EN) * 1000;
    const msHastaExpiry = restante * 1000;

    // Si ya está en la ventana de aviso, mostrar inmediatamente
    if (restante <= AVISAR_EN) {
      mostrarToast(`Tu sesión expira en ${Math.ceil(restante / 60)} min`, 'advertencia');
    } else {
      setTimeout(() => mostrarToast('Tu sesión expira en 15 minutos', 'advertencia'), msHastaAviso);
    }

    // Auto-logout al expirar
    setTimeout(() => {
      mostrarToast('Sesión expirada. Vuelve a iniciar sesión.', 'error');
      setTimeout(cerrarSesion, 2500);
    }, msHastaExpiry);
  } catch { /* token malformado — se ignora */ }
}

// ─── Fetch con autenticación y timeout ───────────────────────────────────────
// Pasa { sinSesion: true } desde páginas públicas (Registro) para que un token
// viejo/ajeno que haya quedado en localStorage no se mande, y para que un 401
// no expulse al usuario a Login (ahí no hay ninguna "sesión" que cerrar).
async function apiFetch(ruta, opciones = {}) {
  const { sinSesion, ...fetchOpciones } = opciones;
  const token = sinSesion ? null : obtenerToken();
  const headers = { 'Content-Type': 'application/json', ...fetchOpciones.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_URL}${ruta}`, { ...fetchOpciones, headers, signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 401) {
      if (sinSesion) throw new Error('No autorizado');
      cerrarSesion();
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(res.ok ? 'Respuesta inválida del servidor' : `Error del servidor (${res.status}). Intenta de nuevo en unos minutos.`);
    }
    if (!res.ok) throw new Error(data.error || 'Error en la petición');
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verifica tu conexión.');
    }
    throw err;
  }
}

// ─── Toast de notificaciones ──────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'exito') {
  const colores = {
    exito:       { bg: 'rgba(21,128,61,0.1)',  borde: 'rgba(21,128,61,0.4)',  texto: '#15803d' },
    error:       { bg: 'rgba(185,28,28,0.1)',  borde: 'rgba(185,28,28,0.4)',  texto: '#b91c1c' },
    info:        { bg: 'rgba(29,78,216,0.1)', borde: 'rgba(29,78,216,0.4)', texto: '#1d4ed8' },
    advertencia: { bg: 'rgba(146,64,14,0.1)', borde: 'rgba(146,64,14,0.4)', texto: '#92400e' },
  };
  const c = colores[tipo] || colores.info;
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    background: ${c.bg}; border: 1px solid ${c.borde}; color: ${c.texto};
    padding: 12px 18px; border-radius: 10px;
    font-family: 'Barlow', sans-serif; font-size: 0.9rem; font-weight: 500;
    max-width: 320px; box-shadow: 0 8px 32px rgba(43,38,32,0.15);
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = mensaje;
  if (!document.getElementById('toast-anim')) {
    const s = document.createElement('style');
    s.id = 'toast-anim';
    s.textContent = '@keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── Formatear fecha ──────────────────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return '—';
  // Fechas tipo "2024-06-15" se parsean como UTC; añadir hora local evita que
  // en zonas UTC-6 aparezca un día antes.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ? new Date(fecha + 'T00:00:00')
    : new Date(fecha);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Badge de estatus ─────────────────────────────────────────────────────────
function badgeEstatus(estatus) {
  const map = {
    'Pagado':        { bg: 'rgba(21,128,61,0.12)',  borde: 'rgba(21,128,61,0.3)',  color: '#15803d' },
    'Pendiente':     { bg: 'rgba(146,64,14,0.12)',  borde: 'rgba(146,64,14,0.3)',  color: '#92400e' },
    'Descalificado': { bg: 'rgba(185,28,28,0.12)',  borde: 'rgba(185,28,28,0.3)',  color: '#b91c1c' },
    'Vigente':       { bg: 'rgba(21,128,61,0.12)',  borde: 'rgba(21,128,61,0.3)',  color: '#15803d' },
    'Vencida':       { bg: 'rgba(185,28,28,0.12)',  borde: 'rgba(185,28,28,0.3)',  color: '#b91c1c' },
    'Suspendida':    { bg: 'rgba(185,28,28,0.12)',  borde: 'rgba(185,28,28,0.3)',  color: '#b91c1c' },
  };
  const c = map[estatus] || { bg: 'rgba(43,38,32,0.06)', borde: 'rgba(43,38,32,0.15)', color: '#7a7057' };
  return `<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:${c.bg};border:1px solid ${c.borde};color:${c.color}">${esc(estatus)}</span>`;
}
