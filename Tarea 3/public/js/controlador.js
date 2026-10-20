/* ==========================================================================
   CONTROLADOR (js/controlador.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Responsabilidad única: Orquestar eventos del usuario, ejecutar validación
   dinámica, coordinar el flujo asíncrono y sincronizar Modelo y Vista.
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
  }

  /**
   * Inicializa la suscripción de eventos con jQuery y ejecuta la carga inicial.
   */
  iniciar() {
    this.vincularEventos();
    this.cargarDatos();
  }

  /**
   * Vinculación de eventos mediante jQuery (delegación y selectores optimizados).
   */
  vincularEventos() {
    const self = this;

    // Validación interactiva por campo (blur: al salir; input: al corregir; change: selects/checks)
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

    // Evento reset: limpiar marcas de error conservando los datos de la tabla
    this.vista.$form.on('reset', function() {
      self.camposInteractuados.clear();
      self.vista.limpiarErrores();
      if (!self.guardando) {
        self.vista.mostrarMensaje('form-mensaje', 'Formulario restablecido. Los incidentes en memoria se conservan.');
      }
    });

    // Evento submit: interceptar recarga y validar dinámicamente
    this.vista.$form.on('submit', function(evento) {
      self.manejarEnvio(evento);
    });

    // Botón de reintento en caso de falla de carga
    this.vista.$btnReintentar.on('click', function() {
      self.cargarDatos();
    });
  }

  /**
   * Ejecuta la consulta asíncrona de incidentes hacia el archivo local o API.
   */
  async cargarDatos() {
    this.vista.mostrarCargando(true);
    this.vista.mostrarMensaje('carga-error', '');
    this.vista.mostrarMensaje('carga-mensaje', 'Cargando incidentes del SOC sanitario…');
    if (this.vista.body.rows.length && this.vista.body.rows[0].cells.length) {
      this.vista.body.rows[0].cells[0].textContent = 'Cargando incidentes…';
    }

    try {
      const incidentes = await this.modelo.cargar();
      const estadisticas = this.modelo.obtenerEstadisticas();
      this.vista.renderizarIncidentes(incidentes, estadisticas);
      this.vista.mostrarMensaje(
        'carga-mensaje',
        `Carga exitosa (${this.modelo.url} / /api/incidentes): ${incidentes.length} incidentes disponibles en memoria.`
      );
    } catch (error) {
      this.vista.mostrarMensaje('carga-mensaje', '');
      this.vista.mostrarMensaje(
        'carga-error',
        `No fue posible cargar los datos (${error.message}). Compruebe la conexión o servidor local y presione Reintentar.`
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
   * Valida un campo individual contra las reglas del Modelo y actualiza la Vista.
   * @param {HTMLElement} campo 
   * @param {boolean} anunciarEnLiveRegion 
   * @returns {boolean} true si es válido
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
   * Manejador del evento submit del formulario.
   * @param {Event} evento 
   */
  manejarEnvio(evento) {
    // 1. Interceptar el comportamiento nativo de envío y recarga
    evento.preventDefault();

    if (!this.modelo.cargado) {
      this.vista.mostrarMensaje('form-error', 'Espere a que los incidentes iniciales completen su carga.');
      return;
    }

    // 2. Ejecutar validación dinámica completa sobre todos los campos requeridos
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

    // 3. Si existen campos inválidos, mostrar alerta y enfocar el primer elemento erróneo
    if (camposInvalidos.length > 0) {
      this.vista.mostrarMensaje(
        'form-error',
        `No se pudo registrar el incidente. Por favor corrija ${camposInvalidos.length} campo(s) señalados.`
      );
      this.vista.enfocarPrimerError(camposInvalidos[0]);
      return;
    }

    // 4. Extracción sanitizada de valores
    const datosForm = Object.fromEntries(new FormData(this.vista.form));
    const inputArchivo = this.vista.form.querySelector('[type="file"]');
    datosForm.archivo_evidencia = inputArchivo && inputArchivo.files[0] ? inputArchivo.files[0].name : '';

    const obtenerTextoSelect = (id) => {
      const elemento = document.getElementById(id);
      return elemento && elemento.selectedOptions[0] ? elemento.selectedOptions[0].textContent : '';
    };

    const nuevoIncidente = {
      codigo: datosForm.codigo_incidente.trim(),
      fecha: datosForm.fecha_deteccion,
      amenaza: obtenerTextoSelect('categoria-amenaza'),
      servicio: obtenerTextoSelect('servicio-hospitalario'),
      severidad: datosForm.nivel_severidad,
      estado: 'Pendiente de triaje (simulado)',
      detalle: datosForm
    };

    // 5. Persistencia simulada en el Modelo y sincronización con la Vista
    try {
      this.modelo.agregar(nuevoIncidente);
    } catch (error) {
      this.vista.mostrarMensaje('form-error', error.message);
      return;
    }

    // Actualizar renderizado y estadísticas
    const estadisticasActualizadas = this.modelo.obtenerEstadisticas();
    this.vista.renderizarIncidentes(this.modelo.obtenerTodos(), estadisticasActualizadas, true);

    // 6. Restablecer el formulario tras el registro exitoso
    this.guardando = true;
    this.vista.form.reset();
    this.guardando = false;

    this.vista.mostrarMensaje(
      'form-mensaje',
      `Incidente ${nuevoIncidente.codigo} registrado exitosamente en memoria local.`
    );
  }
};

// Alias de retrocompatibilidad
SOC.IncidentController = SOC.Controlador;

