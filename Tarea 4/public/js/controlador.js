/* ==========================================================================
   CONTROLADOR (js/controlador.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Unidad 4: Node.js, Express, CRUD, Middleware e Integración REST con Fetch API
   Responsabilidad: Orquestar eventos del usuario, validación reactiva,
   coordinar peticiones asíncronas HTTP (GET, POST, PATCH, DELETE) y sincronizar.
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.Controlador = class {
  /**
   * Recibe las dependencias inyectadas de Modelo y Vista.
   * @param {SOC.Modelo} modelo
   * @param {SOC.Vista} vista
   */
  constructor(modelo, vista) {
    this.modelo = modelo;
    this.vista = vista;
    this.camposInteractuados = new Set();
    this.guardando = false;
    this.temporizadorBusqueda = null;
  }

  /**
   * Inicializa la suscripción de eventos e inicia la carga inicial de datos.
   */
  iniciar() {
    this.vincularEventos();
    this.cargarDatos();
  }

  /**
   * Vinculación de eventos mediante jQuery y APIs de eventos nativos.
   */
  vincularEventos() {
    const self = this;

    // Validación interactiva por campo
    this.vista.$campos.on('blur', function() {
      self.camposInteractuados.add(this);
      self.validarCampo(this, true);
    });

    this.vista.$campos.on('input', function() {
      if (self.camposInteractuados.has(this)) {
        self.validarCampo(this, false);
      }
    });

    this.vista.$campos.on('change', function() {
      self.camposInteractuados.add(this);
      self.validarCampo(this, true);
    });

    // Evento reset del formulario
    this.vista.$form.on('reset', function() {
      self.camposInteractuados.clear();
      self.vista.limpiarErrores();
      if (!self.guardando) {
        self.vista.mostrarMensaje('form-mensaje', 'Formulario restablecido.');
      }
    });

    // Evento submit: interceptar y enviar vía POST a la API REST
    this.vista.$form.on('submit', function(evento) {
      self.manejarEnvio(evento);
    });

    // Botón de reintento en caso de falla de carga
    this.vista.$btnReintentar.on('click', function() {
      self.cargarDatos();
    });

    // Filtros de la API REST: cambio en select de severidad
    if (this.vista.$filtroSeveridad.length) {
      this.vista.$filtroSeveridad.on('change', function() {
        self.aplicarFiltros();
      });
    }

    // Filtro de búsqueda con debounce para no saturar peticiones
    if (this.vista.$filtroBusqueda.length) {
      this.vista.$filtroBusqueda.on('input', function() {
        clearTimeout(self.temporizadorBusqueda);
        self.temporizadorBusqueda = setTimeout(() => {
          self.aplicarFiltros();
        }, 300);
      });
    }

    // Botón limpiar filtros
    if (this.vista.$btnLimpiarFiltros.length) {
      this.vista.$btnLimpiarFiltros.on('click', function() {
        self.limpiarFiltros();
      });
    }

    // Botón recargar / sincronizar API
    if (this.vista.$btnRecargarApi.length) {
      this.vista.$btnRecargarApi.on('click', function() {
        self.cargarDatos();
      });
    }
  }

  /**
   * Carga o recarga los datos de incidentes desde la API REST.
   * @param {Object} filtros
   */
  async cargarDatos(filtros = {}) {
    this.vista.mostrarCargando(true);
    this.vista.mostrarMensaje('carga-mensaje', 'Conectando con la API REST del SOC...');
    this.vista.mostrarMensaje('carga-error', '');

    try {
      await this.modelo.cargar(filtros);
      this.actualizarVistaIncidentes(false);
      this.vista.mostrarMensaje('carga-mensaje', '');
    } catch (error) {
      console.error('[SOC] Error en carga de incidentes:', error);
      this.vista.mostrarMensaje('carga-mensaje', '');
      this.vista.mostrarMensaje(
        'carga-error',
        'No se pudieron recuperar los incidentes de la API. Compruebe la conexión con el servidor Node/Express.'
      );
      if (this.vista.body.rows.length && this.vista.body.rows[0].cells.length) {
        this.vista.body.rows[0].cells[0].textContent = 'Datos no disponibles temporalmente.';
      }
    } finally {
      this.vista.mostrarCargando(false);
      this.vista.$btnSubmit.prop('disabled', !this.modelo.cargado);
      this.vista.$btnReintentar.prop('hidden', this.modelo.cargado);
    }
  }

  /**
   * Aplica los filtros seleccionados consultando la API REST mediante Fetch.
   */
  async aplicarFiltros() {
    const severidad = this.vista.$filtroSeveridad.val() || 'todas';
    const busqueda = (this.vista.$filtroBusqueda.val() || '').trim();

    try {
      this.vista.mostrarCargando(true);
      await this.modelo.cargar({ severidad, busqueda });
      this.actualizarVistaIncidentes(false);
    } catch (error) {
      this.vista.mostrarMensaje('carga-error', `Error al filtrar: ${error.message}`);
    } finally {
      this.vista.mostrarCargando(false);
    }
  }

  /**
   * Restablece los controles de filtrado y consulta la colección completa.
   */
  limpiarFiltros() {
    if (this.vista.$filtroSeveridad.length) this.vista.$filtroSeveridad.val('todas');
    if (this.vista.$filtroBusqueda.length) this.vista.$filtroBusqueda.val('');
    this.cargarDatos({ severidad: 'todas', busqueda: '' });
  }

  /**
   * Refresca la tabla en la vista con los incidentes actuales y sus callbacks de acción.
   * @param {boolean} animarNuevo
   */
  actualizarVistaIncidentes(animarNuevo = false) {
    const incidentes = this.modelo.obtenerTodos();
    const estadisticas = this.modelo.obtenerEstadisticas();

    const callbacks = {
      onEliminar: (codigo) => this.eliminarIncidente(codigo),
      onCambiarEstado: (codigo, estadoActual) => this.cambiarEstadoIncidente(codigo, estadoActual)
    };

    this.vista.renderizarIncidentes(incidentes, estadisticas, animarNuevo, callbacks);
  }

  /**
   * Valida un campo individual contra las reglas del Modelo y actualiza la Vista.
   * @param {HTMLElement} campo
   * @param {boolean} anunciarEnLiveRegion
   * @returns {boolean}
   */
  validarCampo(campo, anunciarEnLiveRegion = false) {
    const datosCampo = {
      id: campo.id,
      value: campo.value,
      type: campo.type,
      checked: campo.checked,
      required: campo.required,
      minLength: campo.minLength,
      maxLength: campo.maxLength,
      file: campo.files ? campo.files[0] : null
    };

    const mensajeError = this.modelo.validarCampo(datosCampo);
    this.vista.mostrarErrorCampo(campo, mensajeError);

    if (anunciarEnLiveRegion && mensajeError) {
      const etiqueta = campo.labels && campo.labels[0]
        ? campo.labels[0].textContent.replace(/\s+/g, ' ').trim()
        : 'Campo';
      this.vista.mostrarMensaje('form-mensaje', `${etiqueta}: ${mensajeError}`);
    }

    return !mensajeError;
  }

  /**
   * Manejador del evento submit del formulario: crea incidente mediante POST Fetch.
   * @param {Event} evento
   */
  async manejarEnvio(evento) {
    evento.preventDefault();

    if (!this.modelo.cargado) {
      this.vista.mostrarMensaje('form-error', 'Espere a que los incidentes iniciales completen su carga.');
      return;
    }

    // 1. Ejecutar validación preventiva en el cliente
    const camposInvalidos = [];
    this.vista.$campos.each((_, campo) => {
      this.camposInteractuados.add(campo);
      const valido = this.validarCampo(campo, false);
      if (!valido) {
        camposInvalidos.push(campo);
      }
    });

    this.vista.mostrarMensaje('form-mensaje', '');
    this.vista.mostrarMensaje('form-error', '');

    if (camposInvalidos.length > 0) {
      this.vista.mostrarMensaje(
        'form-error',
        `No se pudo registrar el incidente. Por favor corrija los ${camposInvalidos.length} campo(s) señalados.`
      );
      this.vista.enfocarPrimerError(camposInvalidos[0]);
      return;
    }

    // 2. Extracción de valores
    const datosForm = Object.fromEntries(new FormData(this.vista.form));
    const inputArchivo = this.vista.form.querySelector('[type="file"]');
    const nombreArchivo = inputArchivo && inputArchivo.files[0] ? inputArchivo.files[0].name : '';

    const obtenerTextoSelect = (id) => {
      const elemento = document.getElementById(id);
      return elemento && elemento.selectedOptions[0] ? elemento.selectedOptions[0].textContent : '';
    };

    const payload = {
      codigo: datosForm.codigo_incidente.trim(),
      fecha: datosForm.fecha_deteccion,
      amenaza: obtenerTextoSelect('categoria-amenaza'),
      servicio: obtenerTextoSelect('servicio-hospitalario'),
      severidad: datosForm.nivel_severidad,
      estado: 'Pendiente de triaje',
      activo: datosForm.activo_afectado || '',
      analista: datosForm.analista_soc || '',
      descripcion: datosForm.descripcion_incidente || '',
      acciones: datosForm.acciones_inmediatas || '',
      evidencia: nombreArchivo
    };

    // 3. Envío asíncrono hacia la API REST de Express mediante Fetch
    try {
      this.vista.mostrarCargando(true);
      this.vista.mostrarMensaje('form-mensaje', 'Registrando incidente en el servidor Express...');

      const incidenteCreado = await this.modelo.crear(payload);

      // Actualizar la vista de la tabla con animación
      this.actualizarVistaIncidentes(true);

      // Restablecer el formulario
      this.guardando = true;
      this.vista.form.reset();
      this.camposInteractuados.clear();
      this.vista.limpiarErrores();
      this.guardando = false;

      this.vista.mostrarMensaje(
        'form-mensaje',
        `✅ Incidente ${incidenteCreado.codigo} registrado exitosamente en la API REST.`
      );
    } catch (error) {
      console.error('[SOC] Error al crear incidente vía API:', error);
      this.vista.mostrarMensaje('form-error', `Error del servidor: ${error.message}`);
    } finally {
      this.vista.mostrarCargando(false);
    }
  }

  /**
   * Elimina un incidente consumiendo DELETE /api/incidentes/:id mediante Fetch.
   * @param {string} codigo
   */
  async eliminarIncidente(codigo) {
    const confirmar = window.confirm(`¿Confirma que desea eliminar el incidente ${codigo} del catálogo de ciberseguridad?`);
    if (!confirmar) return;

    try {
      this.vista.mostrarCargando(true);
      await this.modelo.eliminar(codigo);
      this.actualizarVistaIncidentes(false);
      this.vista.mostrarMensaje('incidentes-resumen', `Incidente ${codigo} eliminado exitosamente del servidor.`);
    } catch (error) {
      alert(`No se pudo eliminar el incidente: ${error.message}`);
    } finally {
      this.vista.mostrarCargando(false);
    }
  }

  /**
   * Actualiza el estado de un incidente consumiendo PATCH /api/incidentes/:id.
   * @param {string} codigo
   * @param {string} estadoActual
   */
  async cambiarEstadoIncidente(codigo, estadoActual) {
    const estadosPosibles = [
      'Aislamiento VLAN',
      'Inspección Biomédica',
      'Bloqueo IP Externa',
      'Contención Activa',
      'Mitigado / Credenciales Revocadas',
      'Cerrado'
    ];

    const siguienteIndice = (estadosPosibles.indexOf(estadoActual) + 1) % estadosPosibles.length;
    const sugerido = estadosPosibles[siguienteIndice !== -1 ? siguienteIndice : 0];

    const nuevoEstado = window.prompt(
      `Actualizar estado de triaje para ${codigo}:\nOpciones: ${estadosPosibles.join(', ')}`,
      sugerido
    );

    if (!nuevoEstado || nuevoEstado.trim() === '' || nuevoEstado === estadoActual) {
      return;
    }

    try {
      this.vista.mostrarCargando(true);
      await this.modelo.actualizarEstado(codigo, nuevoEstado.trim());
      this.actualizarVistaIncidentes(false);
      this.vista.mostrarMensaje(
        'incidentes-resumen',
        `Estado de ${codigo} actualizado a "${nuevoEstado.trim()}" en la API REST.`
      );
    } catch (error) {
      alert(`No se pudo actualizar el estado: ${error.message}`);
    } finally {
      this.vista.mostrarCargando(false);
    }
  }
};

// Retrocompatibilidad
SOC.IncidentController = SOC.Controlador;
