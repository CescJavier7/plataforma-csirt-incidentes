/* Modelo: datos, Fetch y reglas de negocio. Sin acceso al DOM. */
'use strict';
window.SOC = window.SOC || {};
SOC.IncidentModel = class {
  constructor(url) { this.url = url; this.incidents = []; this.ready = false; }
  async load() {
    const response = await fetch(this.url, { signal: AbortSignal.timeout(10000) });
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
    return data;
  }
  validate(field) {
    const value = typeof field.value === 'string' ? field.value.trim() : '';
    if (field.required && (field.type === 'checkbox' ? !field.checked : !value)) return 'Este campo es obligatorio.';
    if (field.id === 'codigo-incidente' && value) {
      if (!/^INC-\d{4}$/.test(value)) return 'Use INC- seguido de cuatro dígitos, por ejemplo INC-2042.';
      if (this.incidents.some(item => item.codigo === value)) return 'Este código ya está registrado. Ingrese otro código.';
    }
    if (field.id === 'fecha-deteccion' && value) {
      const date = Date.parse(value);
      if (!Number.isFinite(date)) return 'Ingrese una fecha y hora válidas.';
      if (date > Date.now()) return 'La detección no puede estar en el futuro.';
    }
    if (value && field.minLength > 0 && value.length < field.minLength) return `Escriba al menos ${field.minLength} caracteres (sin contar espacios al inicio y al final).`;
    if (value && field.maxLength > 0 && value.length > field.maxLength) return `No supere ${field.maxLength} caracteres.`;
    if (field.type === 'file' && field.files[0]) {
      const file = field.files[0];
      if (!/\.(log|pcap|json|txt|csv|hl7|dcm)$/i.test(file.name)) return 'Seleccione un archivo .log, .pcap, .json, .txt, .csv, .hl7 o .dcm.';
      if (file.size > 15 * 1024 * 1024) return 'El archivo no debe superar 15 MB.';
    }
    if (field.validity && !field.validity.valid) return 'Revise el valor de este campo.';
    return '';
  }
  add(incident) {
    if (!this.ready) throw new Error('Primero deben cargarse los datos.');
    if (this.incidents.some(item => item.codigo === incident.codigo)) throw new Error('El código ya está registrado.');
    this.incidents.unshift(incident);
  }
};
