/* ==========================================================================
   MODELO (js/modelo.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Responsabilidad única: Gestión del estado de datos en memoria, consumo
   asíncrono con Fetch API y validación de reglas de negocio.
   Desacoplado 100% del DOM.
   ========================================================================== */
'use strict';

// Espacio de nombres global para evitar colisiones
window.SOC = window.SOC || {};

SOC.Modelo = class {
  /**
   * Inicializa el modelo con la URL de los datos y el almacenamiento en memoria.
   * @param {string} url - Ruta local o relativa del archivo de datos JSON.
   */
  constructor(url = 'data/incidentes.json') {
    this.url = url;
    this.incidentes = [];
    this.cargado = false;
  }

  /**
   * Consume asíncronamente el archivo JSON usando Fetch API y async/await.
   * Valida la respuesta HTTP (response.ok) y la estructura del JSON.
   * @returns {Promise<Array>} Lista de incidentes validados.
   */
  async cargar() {
    let response;
    try {
      response = await fetch(this.url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
    } catch (errorRed) {
      // Intento de fallback secundario si se ejecuta en servidor con ruta de API
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

    // Verificación estricta del estado HTTP
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: no se pudo obtener el archivo de incidentes.`);
    }

    const data = await response.json();

    // Verificación estricta de estructura e integridad
    const codigosVistos = new Set();
    if (!Array.isArray(data) || !data.every(item => {
      if (!item || !['codigo', 'fecha', 'amenaza', 'servicio', 'severidad', 'estado'].every(k => typeof item[k] === 'string' && item[k].trim())) {
        return false;
      }
      if (!/^INC-\d{4}$/.test(item.codigo) || codigosVistos.has(item.codigo)) {
        return false;
      }
      if (!Number.isFinite(Date.parse(item.fecha))) {
        return false;
      }
      if (!['baja', 'media', 'alta', 'critica'].includes(item.severidad)) {
        return false;
      }
      codigosVistos.add(item.codigo);
      return true;
    })) {
      throw new Error('El formato o la integridad del archivo JSON de incidentes es inválido.');
    }

    this.incidentes = data;
    this.cargado = true;
    return this.obtenerTodos();
  }

  /**
   * Devuelve una copia superficial de la colección en memoria para evitar mutaciones externas.
   * @returns {Array} Lista de incidentes.
   */
  obtenerTodos() {
    return [...this.incidentes];
  }

  /**
   * Filtra incidentes por severidad.
   * @param {string} severidad 
   * @returns {Array}
   */
  filtrarPorSeveridad(severidad) {
    if (!severidad || severidad === 'todas') {
      return this.obtenerTodos();
    }
    return this.incidentes.filter(item => item.severidad === severidad);
  }

  /**
   * Retorna métricas de agregación para el resumen accesible.
   * @returns {{ total: number, criticos: number, altos: number }}
   */
  obtenerEstadisticas() {
    return {
      total: this.incidentes.length,
      criticos: this.incidentes.filter(item => item.severidad === 'critica').length,
      altos: this.incidentes.filter(item => item.severidad === 'alta').length
    };
  }

  /**
   * Reglas de validación de negocio. Opera con valores planos, sin manipular el DOM.
   * @param {Object} campo - { id, value, type, checked, required, minLength, maxLength, file }
   * @returns {string} Mensaje explicativo de error o cadena vacía si es válido.
   */
  validarCampo({ id, value = '', type = 'text', checked = false, required = false, minLength = 0, maxLength = 0, file = null }) {
    const valorLimpio = typeof value === 'string' ? value.trim() : '';

    // 1. Obligatoriedad
    if (required) {
      if (type === 'checkbox' && !checked) {
        return 'Debe certificar la custodia y resguardo de evidencias para continuar.';
      }
      if (type !== 'checkbox' && !valorLimpio) {
        return 'Este campo es obligatorio.';
      }
    }

    // 2. Formato de código hospitalario y verificación de unicidad
    if (id === 'codigo-incidente' && valorLimpio) {
      if (!/^INC-\d{4}$/.test(valorLimpio)) {
        return 'Use el formato oficial: "INC-" seguido de cuatro dígitos (ejemplo: INC-2042).';
      }
      if (this.incidentes.some(item => item.codigo === valorLimpio)) {
        return 'Este código de incidente ya existe en el registro del hospital. Ingrese otro.';
      }
    }

    // 3. Fecha de detección no futura
    if (id === 'fecha-deteccion' && valorLimpio) {
      const ms = Date.parse(valorLimpio);
      if (!Number.isFinite(ms)) {
        return 'Ingrese una fecha y hora válidas.';
      }
      if (ms > Date.now()) {
        return 'La fecha de detección no puede situarse en el futuro.';
      }
    }

    // 4. Longitud mínima estricta (exigencia de mínimo 30 caracteres para descripción técnica)
    if (id === 'descripcion-incidente' && valorLimpio) {
      if (valorLimpio.length < 30) {
        return `La descripción técnica debe tener al menos 30 caracteres (actual: ${valorLimpio.length}).`;
      }
    } else if (valorLimpio && minLength > 0 && valorLimpio.length < minLength) {
      return `Escriba al menos ${minLength} caracteres (sin contar espacios al inicio ni al final).`;
    }

    // 5. Longitud máxima
    if (valorLimpio && maxLength > 0 && valorLimpio.length > maxLength) {
      return `No supere los ${maxLength} caracteres permitidos.`;
    }

    // 6. Validación de archivo de evidencia forense
    if (type === 'file' && file) {
      if (!/\.(log|pcap|json|txt|csv|hl7|dcm)$/i.test(file.name)) {
        return 'Formato no admitido. Adjunte .log, .pcap, .json, .txt, .csv, .hl7 o .dcm.';
      }
      if (file.size > 15 * 1024 * 1024) {
        return 'El archivo forense supera el límite permitido de 15 MB.';
      }
    }

    return '';
  }

  /**
   * Registra un nuevo incidente al inicio del arreglo en memoria local.
   * @param {Object} incidente 
   */
  agregar(incidente) {
    if (!this.cargado) {
      throw new Error('Primero deben cargarse los datos de incidentes.');
    }
    if (this.incidentes.some(item => item.codigo === incidente.codigo)) {
      throw new Error(`El código ${incidente.codigo} ya está registrado.`);
    }
    this.incidentes.unshift(incidente);
  }

  // Compatibilidad con especificaciones previas
  get incidents() { return this.incidentes; }
  set incidents(val) { this.incidentes = val; }
  get ready() { return this.cargado; }
  set ready(val) { this.cargado = val; }
  async load() { return this.cargar(); }
  add(inc) { return this.agregar(inc); }
  validate(campoDom) {
    return this.validarCampo({
      id: campoDom.id,
      value: campoDom.value,
      type: campoDom.type,
      checked: campoDom.checked,
      required: campoDom.required,
      minLength: campoDom.minLength,
      maxLength: campoDom.maxLength,
      file: campoDom.files ? campoDom.files[0] : null
    });
  }
};

// Alias de retrocompatibilidad
SOC.IncidentModel = SOC.Modelo;

