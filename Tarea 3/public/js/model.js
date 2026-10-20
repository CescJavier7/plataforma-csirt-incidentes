/* ==========================================================================
   MODEL (js/model.js - English alias / Backwards Compatibility)
   SOC Hospitalario - Hospital Clínico San Rafael
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.IncidentModel = class {
  constructor(url = 'data/incidentes.json') {
    this.url = url;
    this.incidents = [];
    this.ready = false;
  }

  async load() {
    let response;
    try {
      response = await fetch(this.url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
    } catch (netErr) {
      if (this.url !== '/api/incidentes') {
        try {
          response = await fetch('/api/incidentes', {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
        } catch {
          throw new Error('Fallo de conexión o tiempo límite al solicitar los incidentes.');
        }
      } else {
        throw new Error('Fallo de conexión o tiempo límite al solicitar los incidentes.');
      }
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const codes = new Set();
    if (!Array.isArray(data) || !data.every(item => {
      if (!item || !['codigo', 'fecha', 'amenaza', 'servicio', 'severidad', 'estado'].every(key => typeof item[key] === 'string' && item[key].trim())) return false;
      if (!/^INC-\d{4}$/.test(item.codigo) || codes.has(item.codigo) || !Number.isFinite(Date.parse(item.fecha)) || !['baja', 'media', 'alta', 'critica'].includes(item.severidad)) return false;
      codes.add(item.codigo);
      return true;
    })) throw new Error('Formato JSON inválido');

    this.incidents = data;
    this.ready = true;
    return this.incidents;
  }

  get incidentes() { return this.incidents; }
  set incidentes(val) { this.incidents = val; }
  get cargado() { return this.ready; }
  set cargado(val) { this.ready = val; }

  obtenerTodos() { return [...this.incidents]; }
  filtrarPorSeveridad(sev) {
    if (!sev || sev === 'todas') return this.obtenerTodos();
    return this.incidents.filter(i => i.severidad === sev);
  }
  obtenerEstadisticas() {
    return {
      total: this.incidents.length,
      criticos: this.incidents.filter(i => i.severidad === 'critica').length,
      altos: this.incidents.filter(i => i.severidad === 'alta').length
    };
  }

  validarCampo({ id, value = '', type = 'text', checked = false, required = false, minLength = 0, maxLength = 0, file = null }) {
    const val = typeof value === 'string' ? value.trim() : '';
    if (required) {
      if (type === 'checkbox' && !checked) return 'Debe certificar la custodia y resguardo sanitario para continuar.';
      if (type !== 'checkbox' && !val) return 'Este campo es obligatorio.';
    }
    if (id === 'codigo-incidente' && val) {
      if (!/^INC-\d{4}$/.test(val)) return 'Use INC- seguido de cuatro dígitos, por ejemplo INC-2042.';
      if (this.incidents.some(item => item.codigo === val)) return 'Este código ya está registrado. Ingrese otro código.';
    }
    if (id === 'fecha-deteccion' && val) {
      const date = Date.parse(val);
      if (!Number.isFinite(date)) return 'Ingrese una fecha y hora válidas.';
      if (date > Date.now()) return 'La detección no puede estar en el futuro.';
    }
    if (id === 'descripcion-incidente' && val) {
      if (val.length < 30) return `La descripción técnica debe tener al menos 30 caracteres (actual: ${val.length}).`;
    } else if (val && minLength > 0 && val.length < minLength) {
      return `Escriba al menos ${minLength} caracteres (sin contar espacios al inicio y al final).`;
    }
    if (val && maxLength > 0 && val.length > maxLength) return `No supere ${maxLength} caracteres.`;
    if (type === 'file' && file) {
      if (!/\.(log|pcap|json|txt|csv|hl7|dcm)$/i.test(file.name)) return 'Seleccione un archivo .log, .pcap, .json, .txt, .csv, .hl7 o .dcm.';
      if (file.size > 15 * 1024 * 1024) return 'El archivo no debe superar 15 MB.';
    }
    return '';
  }

  validate(field) {
    return this.validarCampo({
      id: field.id,
      value: field.value,
      type: field.type,
      checked: field.checked,
      required: field.required,
      minLength: field.minLength,
      maxLength: field.maxLength,
      file: field.files ? field.files[0] : null
    });
  }

  add(incident) {
    if (!this.ready) throw new Error('Primero deben cargarse los datos.');
    if (this.incidents.some(item => item.codigo === incident.codigo)) throw new Error('El código ya está registrado.');
    this.incidents.unshift(incident);
  }
  agregar(inc) { this.add(inc); }
  cargar() { return this.load(); }
};

SOC.Modelo = SOC.IncidentModel;
