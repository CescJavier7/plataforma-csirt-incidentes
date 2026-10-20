/* ==========================================================================
   MODELO (js/modelo.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Unidad 4: Node.js, Express, CRUD, Middleware e Integración REST con Fetch API
   Responsabilidad: Consumo de la API REST (/api/incidentes), persistencia
   en memoria del cliente, filtros reactivos y reglas de negocio.
   Desacoplado 100% del DOM.
   ========================================================================== */
'use strict';

// Espacio de nombres global para evitar colisiones
window.SOC = window.SOC || {};

SOC.Modelo = class {
  /**
   * Inicializa el modelo con la URL de la API REST y el almacenamiento en memoria.
   * @param {string} url - Endpoint de la API de incidentes.
   */
  constructor(url = '/api/incidentes') {
    this.url = url;
    this.incidentes = [];
    this.cargado = false;
    this.filtrosActivos = {
      severidad: 'todas',
      busqueda: ''
    };
  }

  /**
   * Consume asíncronamente la API REST mediante Fetch API con filtros opcionales.
   * @param {Object} filtros - { severidad, busqueda, estado }
   * @returns {Promise<Array>} Lista de incidentes validados.
   */
  async cargar(filtros = {}) {
    this.filtrosActivos = { ...this.filtrosActivos, ...filtros };

    // Construcción de parámetros de consulta para la API REST
    const params = new URLSearchParams();
    if (this.filtrosActivos.severidad && this.filtrosActivos.severidad !== 'todas') {
      params.set('severidad', this.filtrosActivos.severidad);
    }
    if (this.filtrosActivos.busqueda) {
      params.set('busqueda', this.filtrosActivos.busqueda);
    }
    if (this.filtrosActivos.estado) {
      params.set('estado', this.filtrosActivos.estado);
    }

    const queryStr = params.toString();
    const endpoint = queryStr ? `${this.url}?${queryStr}` : this.url;

    let response;
    try {
      response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
    } catch (errorRed) {
      // Fallback a ruta estática si se ejecuta sin backend activo
      if (this.url !== 'data/incidentes.json') {
        try {
          response = await fetch('data/incidentes.json', {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
        } catch {
          throw new Error('Fallo de conexión o tiempo límite al solicitar los incidentes a la API.');
        }
      } else {
        throw new Error('Fallo de conexión o tiempo límite al solicitar los incidentes a la API.');
      }
    }

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: no se pudo obtener los incidentes de la API.`);
    }

    const data = await response.json();

    // Verificación de estructura de la colección
    if (!Array.isArray(data)) {
      throw new Error('La respuesta de la API de incidentes no es un arreglo válido.');
    }

    // Aplanar y sanitizar para evitar inserciones anómalas
    this.incidentes = data.filter(item => item && typeof item === 'object' && !Array.isArray(item));
    this.cargado = true;
    return this.obtenerTodos();
  }

  /**
   * Crea un nuevo incidente en el servidor mediante petición HTTP POST con Fetch API.
   * Manejo robusto: Si el servidor retorna { datos: {...} } o el objeto directamente,
   * lo extrae y almacena como un único incidente.
   * @param {Object} datos - Datos del incidente a registrar.
   * @returns {Promise<Object>} Incidente creado.
   */
  async crear(datos) {
    // Si la URL actual es el archivo JSON estático, redirigir a la API REST de Express
    const urlPost = (this.url && this.url.includes('data/incidentes.json')) ? '/api/incidentes' : this.url;

    let nuevo = null;
    try {
      const response = await fetch(urlPost, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(datos),
        signal: AbortSignal.timeout(10000)
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || `Error HTTP ${response.status} al registrar el incidente.`);
      }

      // El backend Express retorna { exito: true, datos: {...} }
      if (resultado && typeof resultado === 'object') {
        if (resultado.datos && typeof resultado.datos === 'object' && !Array.isArray(resultado.datos)) {
          nuevo = resultado.datos;
        } else if (!Array.isArray(resultado)) {
          nuevo = resultado;
        }
      }
    } catch (errorRed) {
      console.warn('[MODELO] Advertencia: Conexión con servidor no completada, conservando en memoria local:', errorRed.message);
    }

    // Fallback defensivo: Garantiza que nuevo sea SIEMPRE un objeto único y no un array
    if (!nuevo || typeof nuevo !== 'object' || Array.isArray(nuevo) || !nuevo.codigo) {
      nuevo = {
        codigo: datos.codigo,
        fecha: datos.fecha || new Date().toISOString(),
        amenaza: datos.amenaza || 'Amenaza reportada',
        servicio: datos.servicio || 'Servicio asistencial',
        severidad: datos.severidad || 'media',
        estado: datos.estado || 'Pendiente de triaje',
        activo: datos.activo || '',
        analista: datos.analista || '',
        descripcion: datos.descripcion || '',
        acciones: datos.acciones || '',
        creadoEn: new Date().toISOString()
      };
    }

    // Actualizar la colección en memoria local sin duplicar ni corromper con arrays
    this.incidentes = this.incidentes.filter(item => item && typeof item === 'object' && !Array.isArray(item));
    if (!this.incidentes.some(item => item.codigo === nuevo.codigo)) {
      this.incidentes.unshift(nuevo);
    }

    return nuevo;
  }

  /**
   * Actualiza el estado de un incidente mediante petición HTTP PATCH con Fetch API.
   * @param {string} codigo - Código único (INC-XXXX).
   * @param {string} nuevoEstado - Nuevo estado asistencial/SOC.
   * @returns {Promise<Object>} Incidente actualizado.
   */
  async actualizarEstado(codigo, nuevoEstado) {
    const urlBase = (this.url && this.url.includes('data/incidentes.json')) ? '/api/incidentes' : this.url;
    const urlRecurso = `${urlBase}/${encodeURIComponent(codigo)}`;
    
    let actualizado = null;
    try {
      const response = await fetch(urlRecurso, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado }),
        signal: AbortSignal.timeout(10000)
      });

      const resultado = await response.json();
      if (!response.ok) {
        throw new Error(resultado.error || `Error HTTP ${response.status} al actualizar el estado.`);
      }
      actualizado = resultado.datos || resultado;
    } catch (err) {
      console.warn('[MODELO] Actualización local en memoria:', err.message);
    }

    const indice = this.incidentes.findIndex(item => item && item.codigo === codigo);
    if (indice !== -1) {
      this.incidentes[indice] = {
        ...this.incidentes[indice],
        ...(actualizado || {}),
        estado: nuevoEstado
      };
      return this.incidentes[indice];
    }

    return actualizado || { codigo, estado: nuevoEstado };
  }

  /**
   * Elimina un incidente del sistema mediante petición HTTP DELETE con Fetch API.
   * @param {string} codigo - Código único a eliminar.
   * @returns {Promise<boolean>}
   */
  async eliminar(codigo) {
    const urlBase = (this.url && this.url.includes('data/incidentes.json')) ? '/api/incidentes' : this.url;
    const urlRecurso = `${urlBase}/${encodeURIComponent(codigo)}`;

    try {
      const response = await fetch(urlRecurso, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      const resultado = await response.json();
      if (!response.ok) {
        throw new Error(resultado.error || `Error HTTP ${response.status} al eliminar el incidente.`);
      }
    } catch (err) {
      console.warn('[MODELO] Eliminación local en memoria:', err.message);
    }

    this.incidentes = this.incidentes.filter(item => item && item.codigo !== codigo);
    return true;
  }

  /**
   * Devuelve una copia superficial sanitizada de la colección en memoria.
   * @returns {Array}
   */
  obtenerTodos() {
    return this.incidentes
      .filter(item => item && typeof item === 'object' && !Array.isArray(item))
      .map(item => ({ ...item }));
  }

  /**
   * Retorna métricas de agregación para el resumen accesible.
   * @returns {{ total: number, criticos: number, altos: number }}
   */
  obtenerEstadisticas() {
    const validos = this.obtenerTodos();
    return {
      total: validos.length,
      criticos: validos.filter(item => item.severidad === 'critica').length,
      altos: validos.filter(item => item.severidad === 'alta').length
    };
  }

  /**
   * Reglas de validación preventiva en el cliente (WCAG 2.2 y UX).
   * @param {Object} campo
   * @returns {string} Mensaje de error o cadena vacía si es válido.
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

    // 2. Formato de código hospitalario y verificación de unicidad local
    if (id === 'codigo-incidente' && valorLimpio) {
      if (!/^INC-\d{4}$/.test(valorLimpio)) {
        return 'Use el formato oficial: "INC-" seguido de cuatro dígitos (ejemplo: INC-2042).';
      }
      if (this.incidentes.some(item => item && item.codigo === valorLimpio)) {
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

    // 4. Longitud mínima estricta (mínimo 30 caracteres para descripción técnica)
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

    // 6. Validación de archivo forense
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

  // Métodos de retrocompatibilidad
  get incidents() { return this.incidentes; }
  set incidents(val) { this.incidentes = val; }
  get ready() { return this.cargado; }
  set ready(val) { this.cargado = val; }
  async load() { return this.cargar(); }
  add(inc) { this.incidentes.unshift(inc); }
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
