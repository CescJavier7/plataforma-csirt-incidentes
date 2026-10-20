import { api } from './api.js';

/** GET /incidentes (opcionalmente filtrado por estado/prioridad) */
export async function listarIncidentes(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.prioridad) params.set('prioridad', filtros.prioridad);
  const query = params.toString() ? `?${params}` : '';
  const respuesta = await api.get(`/incidentes${query}`);
  return respuesta.data;
}

/** POST /incidentes  (ANALISTA, ADMIN) */
export async function crearIncidente({ titulo, descripcion, prioridad }) {
  const respuesta = await api.post('/incidentes', { titulo, descripcion, prioridad });
  return respuesta.data;
}

/** PUT /incidentes/:id  (SUPERVISOR, ADMIN) */
export async function actualizarIncidente(id, cambios) {
  const respuesta = await api.put(`/incidentes/${encodeURIComponent(id)}`, cambios);
  return respuesta.data;
}

/** DELETE /incidentes/:id  (ADMIN) */
export async function eliminarIncidente(id) {
  const respuesta = await api.delete(`/incidentes/${encodeURIComponent(id)}`);
  return respuesta.data;
}

