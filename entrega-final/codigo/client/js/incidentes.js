import { api } from './api.js';

export async function listarIncidentes(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.prioridad) params.set('prioridad', filtros.prioridad);
  const query = params.toString() ? `?${params.toString()}` : '';
  const respuesta = await api.get(`/incidentes${query}`);
  return respuesta.data;
}

export async function crearIncidente({ titulo, descripcion, prioridad, estado, resolucion }) {
  const payload = { titulo, descripcion, prioridad };
  if (estado) payload.estado = estado;
  if (resolucion) payload.resolucion = resolucion;
  const respuesta = await api.post('/incidentes', payload);
  return respuesta.data;
}

export async function actualizarIncidente(id, cambios) {
  const respuesta = await api.put(`/incidentes/${encodeURIComponent(id)}`, cambios);
  return respuesta.data;
}

export async function eliminarIncidente(id) {
  const respuesta = await api.delete(`/incidentes/${encodeURIComponent(id)}`);
  return respuesta.data;
}

