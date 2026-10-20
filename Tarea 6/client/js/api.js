/**
 * Servicio base HTTP. Centraliza:
 *  - URL base de la API
 *  - Adjuntar automáticamente "Authorization: Bearer <token>"
 *  - Parseo de JSON y normalización de errores
 *  - Cierre de sesión automático ante 401 (token ausente/expirado)
 */
// En desarrollo desacoplado (puerto 5500) apunta a http://localhost:3000/api;
// en despliegue de producción unificado utiliza la ruta relativa del mismo origen.
export const API_URL =
  (typeof window !== 'undefined' && window.API_BASE_URL) ||
  (typeof window !== 'undefined' && (window.location.port === '5500' || window.location.port === '5173')
    ? 'http://localhost:3000/api'
    : '/api');

const CLAVE_TOKEN = 'incidentes.token';

export const obtenerToken = () => sessionStorage.getItem(CLAVE_TOKEN);

/** Error con información HTTP para que la UI pueda reaccionar por código de estado. */
export class ApiError extends Error {
  constructor(status, cuerpo) {
    super(cuerpo?.message || `Error HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.errores = cuerpo?.errors || [];
    this.codigo = cuerpo?.error;
  }
}

// Callback que la app registra para reaccionar a un 401 (p. ej. volver al login)
let alNoAutorizado = () => {};
export const onNoAutorizado = (fn) => {
  alNoAutorizado = fn;
};

/**
 * Realiza una petición a la API.
 * @param {string} ruta    ej. '/incidentes'
 * @param {{ method?: string, body?: object, auth?: boolean }} opciones
 */
export async function solicitar(ruta, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // Interceptor: adjunta el token JWT si existe
  const token = obtenerToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'omit', // el token viaja en la cabecera, no en cookies
    });
  } catch {
    throw new ApiError(0, { message: 'No se pudo conectar con la API (¿servidor apagado o CORS?)' });
  }

  const esJson = respuesta.headers.get('content-type')?.includes('application/json');
  const cuerpo = esJson ? await respuesta.json() : null;

  if (!respuesta.ok) {
    if (respuesta.status === 401 && auth) alNoAutorizado(cuerpo);
    throw new ApiError(respuesta.status, cuerpo);
  }

  return cuerpo;
}

export const api = {
  get: (ruta) => solicitar(ruta),
  post: (ruta, body, opciones = {}) => solicitar(ruta, { method: 'POST', body, ...opciones }),
  put: (ruta, body) => solicitar(ruta, { method: 'PUT', body }),
  delete: (ruta) => solicitar(ruta, { method: 'DELETE' }),
};

