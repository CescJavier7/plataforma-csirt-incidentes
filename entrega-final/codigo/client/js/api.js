import { obtenerToken } from './auth.js';

function resolverApiBase() {
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    // Si el frontend se sirve desde un servidor de desarrollo estático (ej. Live Server en 5500)
    if (window.location.port === '5500') {
      return 'http://localhost:3000/api';
    }
    // En despliegue unificado (Express sirve cliente o detrás de proxy Nginx en /api)
    return `${window.location.origin}/api`;
  }
  return '/api';
}

const API_BASE = resolverApiBase();

let callbackNoAutorizado = () => {};

export function onNoAutorizado(fn) {
  callbackNoAutorizado = fn;
}

async function request(ruta, opciones = {}) {
  const url = `${API_BASE}${ruta}`;
  const token = obtenerToken();

  const cabeceras = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opciones.headers || {}),
  };

  const config = {
    ...opciones,
    headers: cabeceras,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, config);
  } catch (error) {
    throw new Error(`Error de red al conectar con la API (${url}): ${error.message}`);
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      callbackNoAutorizado();
    }
    const mensajeError = typeof datos?.error === 'string' ? datos.error : (datos?.message || `Error HTTP ${respuesta.status}`);
    const err = new Error(mensajeError);
    err.status = respuesta.status;
    err.code = datos?.codigo || datos?.code || (typeof datos?.error === 'string' ? datos.error : undefined);
    err.detalles = datos?.detalles;
    throw err;
  }

  return datos;
}

export const api = {
  get: (ruta, opciones) => request(ruta, { ...opciones, method: 'GET' }),
  post: (ruta, body, opciones) => request(ruta, { ...opciones, method: 'POST', body }),
  put: (ruta, body, opciones) => request(ruta, { ...opciones, method: 'PUT', body }),
  delete: (ruta, opciones) => request(ruta, { ...opciones, method: 'DELETE' }),
};

