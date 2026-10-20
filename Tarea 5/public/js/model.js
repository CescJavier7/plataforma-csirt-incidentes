/* ==========================================================================
   MODEL (js/model.js - English alias / Backwards Compatibility)
   SOC Hospitalario - Hospital Clínico San Rafael
   Unidad 4: Node.js, Express, CRUD, Middleware e Integración REST con Fetch API
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.IncidentModel = class {
  constructor(url = '/api/incidentes') {
    this.url = url;
    this.incidents = [];
    this.ready = false;
  }

  async load(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.severidad && filtros.severidad !== 'todas') params.set('severidad', filtros.severidad);
    if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
    const query = params.toString();
    const endpoint = query ? `${this.url}?${query}` : this.url;

    let response;
    try {
      response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      if (this.url !== 'data/incidentes.json') {
        try {
          response = await fetch('data/incidentes.json', { headers: { Accept: 'application/json' } });
        } catch {
          throw new Error('Fallo de conexión o tiempo límite al solicitar los incidentes.');
        }
      } else {
        throw new Error('Fallo de conexión o tiempo límite al solicitar los incidentes.');
      }
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Respuesta inválida.');

    this.incidents = data;
    this.ready = true;
    return this.incidents;
  }

  async create(data) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || `HTTP ${response.status}`);
    const nuevo = res.datos || res;
    this.incidents.unshift(nuevo);
    return nuevo;
  }

  async delete(codigo) {
    const response = await fetch(`${this.url}/${encodeURIComponent(codigo)}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || `HTTP ${response.status}`);
    this.incidents = this.incidents.filter(i => i.codigo !== codigo);
    return true;
  }
};

SOC.Modelo = SOC.IncidentModel;
