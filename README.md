# autodromo-frontend

Frontend del Sistema de Registro de Pilotos — Autódromo Monterrey.

## Stack
- HTML5 + CSS3 + JavaScript Vanilla (sin frameworks)
- Google Fonts (Bebas Neue + Barlow)
- Deploy: GitHub Pages

## Estructura
```
frontend/
├── index.html              ← Redirige según sesión activa
├── admin/
│   └── config.js           ← API_URL + helpers globales (apiFetch, toast, badges)
├── Login/
│   └── index.html          ← Inicio de sesión (staff y piloto)
├── Registro/
│   └── index.html          ← Auto-registro público para pilotos
├── piloto/
│   └── index.html          ← Portal de auto-servicio del piloto
├── assets/
│   ├── logo.png
│   └── femadac-original.pdf ← Hoja oficial FEMADAC usada de base para el PDF
└── dashboard/
    ├── dashboard.css        ← Estilos compartidos de todo el dashboard
    ├── index.html           ← Dashboard principal
    ├── pilotos.html         ← Gestión de pilotos
    ├── campeonatos.html     ← Campeonatos, etapas y categorías
    ├── inscripciones.html   ← Inscripciones + cobros
    ├── resultados.html      ← Captura de resultados por etapa/categoría
    ├── formularios.html     ← Generación de PDFs oficiales (FEMADAC, etc.)
    ├── reportes.html        ← Reportes por categoría y corte general
    └── usuarios.html        ← Gestión de usuarios (solo admin)
```

## Configuración

Edita **`admin/config.js`** y cambia la URL del backend:

```js
// Producción (Railway)
const API_URL = 'https://autodromo-backend-production.up.railway.app/api';

// Desarrollo local
// const API_URL = 'http://localhost:3001/api';
```

## Deploy en GitHub Pages

1. Sube este repositorio a GitHub como `autodromo-frontend`
2. Settings → Pages → Source: Deploy from branch → `main` → `/ (root)`
3. GitHub Pages servirá `index.html` como raíz
4. URL pública: `https://tu-usuario.github.io/autodromo-frontend/`

> Actualiza `FRONTEND_URL` en Railway con esta URL para que CORS funcione.

## URL pública para pilotos

```
https://tu-usuario.github.io/autodromo-frontend/Registro/index.html
```

Esta página es pública — no requiere inicio de sesión.
