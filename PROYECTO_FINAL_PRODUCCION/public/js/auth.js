const CLAVE_TOKEN = 'csirt_token';
const CLAVE_USUARIO = 'csirt_usuario';

export function guardarSesion(token, usuario) {
  sessionStorage.setItem(CLAVE_TOKEN, token);
  sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function obtenerToken() {
  return sessionStorage.getItem(CLAVE_TOKEN);
}

export function obtenerUsuario() {
  const guardado = sessionStorage.getItem(CLAVE_USUARIO);
  if (!guardado) return null;
  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
}

export function estaAutenticado() {
  return Boolean(obtenerToken());
}

export function logout() {
  sessionStorage.removeItem(CLAVE_TOKEN);
  sessionStorage.removeItem(CLAVE_USUARIO);
}

export function tieneRol(...rolesPermitidos) {
  const usuario = obtenerUsuario();
  if (!usuario || !usuario.rol) return false;
  return rolesPermitidos.includes(usuario.rol);
}

export async function login(email, password) {
  const { api } = await import('./api.js');
  const respuesta = await api.post('/auth/login', { email, password });
  guardarSesion(respuesta.data.token, respuesta.data.usuario);
  return respuesta.data.usuario;
}

