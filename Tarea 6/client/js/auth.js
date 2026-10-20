import { api } from './api.js';

const CLAVE_TOKEN = 'incidentes.token';
const CLAVE_ROL = 'incidentes.rol';
const CLAVE_USUARIO = 'incidentes.usuario';

/**
 * Inicia sesión: POST /auth/login y guarda token, rol y usuario en sessionStorage.
 * sessionStorage se borra al cerrar la pestaña (menor ventana de exposición que localStorage).
 */
export async function login(email, password) {
  const respuesta = await api.post('/auth/login', { email, password }, { auth: false });
  const { token, usuario } = respuesta.data;

  sessionStorage.setItem(CLAVE_TOKEN, token);
  sessionStorage.setItem(CLAVE_ROL, usuario.rol);
  sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));

  return usuario;
}

export function logout() {
  sessionStorage.removeItem(CLAVE_TOKEN);
  sessionStorage.removeItem(CLAVE_ROL);
  sessionStorage.removeItem(CLAVE_USUARIO);
}

export const obtenerRol = () => sessionStorage.getItem(CLAVE_ROL);

export function obtenerUsuario() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_USUARIO));
  } catch {
    return null;
  }
}

export const estaAutenticado = () => Boolean(sessionStorage.getItem(CLAVE_TOKEN));

/**
 * Solo controla qué se MUESTRA en la UI. La autorización real la impone el servidor (403).
 */
export const tieneRol = (...roles) => roles.includes(obtenerRol());

