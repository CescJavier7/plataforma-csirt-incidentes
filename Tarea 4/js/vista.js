/* ==========================================================================
   VISTA (js/vista.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Unidad 4: Node.js, Express, CRUD, Middleware e Integración REST con Fetch API
   Responsabilidad: Manipulación segura del DOM (prevención XSS), accesibilidad
   W3C WCAG 2.2 AA, renderizado de componentes y controles de filtrado.
   Sin lógica de negocio ni persistencia.
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.Vista = class {
  constructor() {
    // Selección de elementos del formulario y tabla
    this.$form = $('.incident-form');
    this.$campos = this.$form.find('input[id], select[id], textarea[id]');
    this.$bodyTabla = $('#incidentes-body');
    this.$btnSubmit = this.$form.find('[type="submit"]');
    this.$btnReintentar = $('#reintentar');
    this.$resumenIncidentes = $('#incidentes-resumen');
    this.$contenedorTabla = this.$bodyTabla.closest('.table-responsive');

    // Controles de filtrado y búsqueda de la API REST
    this.$filtroSeveridad = $('#filtro-severidad');
    this.$filtroBusqueda = $('#filtro-busqueda');
    this.$btnLimpiarFiltros = $('#btn-limpiar-filtros');
    this.$btnRecargarApi = $('#btn-recargar-api');

    // Inicialización accesible de contenedores de error por campo
    this.$campos.each((_, elemento) => {
      const id = elemento.id;
      const $campo = $(elemento);
      const $formGroup = $campo.closest('.form-group');

      if ($formGroup.find(`#error-${id}`).length === 0) {
        const $errorNode = $('<small>', {
          id: `error-${id}`,
          class: 'field-error',
          style: 'display: none;',
          'aria-live': 'polite'
        });
        $formGroup.append($errorNode);

        // Vinculación semántica accesible con aria-describedby
        const descritoPor = ($campo.attr('aria-describedby') || '').trim();
        $campo.attr('aria-describedby', descritoPor ? `${descritoPor} error-${id}` : `error-${id}`);
      }
    });

    // Desactivación de la validación nativa del navegador para gestión dinámica propia
    if (this.$form.length) {
      this.$form[0].noValidate = true;
    }

    // Elementos nativos para compatibilidad
    this.form = this.$form[0];
    this.fields = this.$campos.toArray();
    this.body = this.$bodyTabla[0];
    this.submit = this.$btnSubmit[0];
    this.retry = this.$btnReintentar[0];
  }

  /**
   * Actualiza el contenido de un elemento accesible por ID.
   * @param {string} id - ID del elemento en el DOM.
   * @param {string} texto - Texto plano a presentar.
   */
  mostrarMensaje(id, texto) {
    const $elem = $(`#${id}`);
    if ($elem.length) {
      $elem.text(texto);
    }
  }

  /**
   * Muestra u oculta el error de un campo con animación suave y estado ARIA.
   * @param {HTMLElement} campo
   * @param {string} mensaje
   */
  mostrarErrorCampo(campo, mensaje) {
    const $campo = $(campo);
    const $error = $(`#error-${campo.id}`);

    if (mensaje) {
      $campo.attr('aria-invalid', 'true');
      $campo.addClass('input-error');
      $error.text(mensaje).stop(true, true).slideDown(200);
    } else {
      $campo.removeAttr('aria-invalid');
      $campo.removeClass('input-error');
      $error.stop(true, true).slideUp(200, function() {
        $(this).text('');
      });
    }
  }

  /**
   * Restablece los estilos visuales y mensajes de error del formulario.
   */
  limpiarErrores() {
    this.$campos.each((_, campo) => {
      this.mostrarErrorCampo(campo, '');
    });
    this.mostrarMensaje('form-error', '');
  }

  /**
   * Comunica visual y sonoramente el estado de carga del sistema.
   * @param {boolean} activo
   */
  mostrarCargando(activo) {
    this.$contenedorTabla.attr('aria-busy', String(activo));
    this.$btnSubmit.prop('disabled', activo);
    this.$btnReintentar.prop('hidden', true);
  }

  /**
   * Renderiza las filas de incidentes en la tabla HTML con codificación 100% segura (XSS-safe).
   * Genera botones de acción CRUD para actualización de estado y eliminación vía REST.
   * @param {Array} incidentes - Lista de incidentes.
   * @param {Object} estadisticas - { total, criticos, altos }.
   * @param {boolean} animarNuevo - Transición si es un nuevo incidente.
   * @param {Object} callbacks - { onEliminar: fn, onCambiarEstado: fn }
   */
  renderizarIncidentes(incidentes, estadisticas, animarNuevo = false, callbacks = {}) {
    const fragmento = document.createDocumentFragment();
    const etiquetas = {
      critica: ['critical', 'Crítica (Riesgo Vital)'],
      alta: ['high', 'Alta'],
      media: ['medium', 'Media'],
      baja: ['low', 'Baja']
    };

    // Filtrar elementos para asegurar que solo procesamos objetos válidos de incidentes
    const listaSanitizada = (incidentes || []).filter(item => item && typeof item === 'object' && !Array.isArray(item));

    listaSanitizada.forEach((item, indice) => {
      const fila = document.createElement('tr');
      if (item.codigo) {
        fila.dataset.codigo = item.codigo;
      }

      if (animarNuevo && indice === 0) {
        fila.classList.add('fila-nueva-animada');
      }

      // 1. Ticket
      const celdaCodigo = document.createElement('th');
      celdaCodigo.scope = 'row';
      celdaCodigo.className = 'font-mono';
      celdaCodigo.textContent = item.codigo || 'INC-TEMP';
      fila.append(celdaCodigo);

      // 2. Detección (Time element accesible)
      const celdaFecha = document.createElement('td');
      const time = document.createElement('time');
      time.dateTime = item.fecha || '';
      let textoFecha = item.fecha || 'Sin fecha';
      if (item.fecha) {
        const fechaObj = new Date(item.fecha);
        if (Number.isFinite(fechaObj.getTime())) {
          try {
            textoFecha = new Intl.DateTimeFormat('es-EC', {
              dateStyle: 'short',
              timeStyle: 'short'
            }).format(fechaObj);
          } catch {
            textoFecha = item.fecha;
          }
        }
      }
      time.textContent = textoFecha;
      celdaFecha.append(time);
      fila.append(celdaFecha);

      // 3. Amenaza / Vector
      const celdaAmenaza = document.createElement('td');
      celdaAmenaza.textContent = item.amenaza || 'Amenaza sin especificar';
      fila.append(celdaAmenaza);

      // 4. Servicio Hospitalario
      const celdaServicio = document.createElement('td');
      celdaServicio.textContent = item.servicio || 'Servicio asistencial';
      fila.append(celdaServicio);

      // 5. Severidad con badge accesible
      const celdaSeveridad = document.createElement('td');
      const badge = document.createElement('span');
      const claveSeveridad = String(item.severidad || 'baja').toLowerCase();
      const [claseCss, textoSeveridad] = etiquetas[claveSeveridad] || ['low', item.severidad || 'Baja'];
      badge.className = `badge-severity severity-${claseCss}`;
      badge.textContent = textoSeveridad;
      celdaSeveridad.append(badge);
      fila.append(celdaSeveridad);

      // 6. Estado Asistencial
      const celdaEstado = document.createElement('td');
      const spanEstado = document.createElement('span');
      spanEstado.className = 'status-tag status-containment';
      spanEstado.textContent = item.estado || 'Pendiente';
      celdaEstado.append(spanEstado);
      fila.append(celdaEstado);

      // 7. Acciones CRUD REST (Botones accesibles)
      const celdaAcciones = document.createElement('td');
      const contAcciones = document.createElement('div');
      contAcciones.className = 'actions-cell';

      // Botón Cambiar Estado (PATCH /api/incidentes/:id)
      const btnEstado = document.createElement('button');
      btnEstado.type = 'button';
      btnEstado.className = 'btn-action-sm';
      btnEstado.setAttribute('aria-label', `Cambiar estado de triaje del incidente ${item.codigo || ''}`);
      btnEstado.textContent = '⚡ Triaje';
      btnEstado.addEventListener('click', () => {
        if (callbacks.onCambiarEstado && item.codigo) {
          callbacks.onCambiarEstado(item.codigo, item.estado || '');
        }
      });
      contAcciones.append(btnEstado);

      // Botón Eliminar (DELETE /api/incidentes/:id)
      const btnEliminar = document.createElement('button');
      btnEliminar.type = 'button';
      btnEliminar.className = 'btn-danger-sm';
      btnEliminar.setAttribute('aria-label', `Eliminar incidente ${item.codigo || ''} del catálogo`);
      btnEliminar.textContent = '🗑️ Eliminar';
      btnEliminar.addEventListener('click', () => {
        if (callbacks.onEliminar && item.codigo) {
          callbacks.onEliminar(item.codigo);
        }
      });
      contAcciones.append(btnEliminar);

      celdaAcciones.append(contAcciones);
      fila.append(celdaAcciones);

      fragmento.append(fila);
    });

    this.$bodyTabla.empty().append(fragmento);

    // Animación y desplazamiento hacia la tabla para ver el registro
    if (animarNuevo && listaSanitizada.length > 0) {
      const $primeraFila = this.$bodyTabla.find('tr:first');
      $primeraFila.hide().fadeIn(400);

      // Desplazamiento suave para que el usuario observe el nuevo incidente ingresado
      const $seccionMonitoreo = $('#sec-monitoreo');
      if ($seccionMonitoreo.length) {
        $seccionMonitoreo[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Manejo de estado vacío accesible
    if (!listaSanitizada.length) {
      const filaVacia = $('<tr>').append(
        $('<td>', {
          colspan: 7,
          class: 'text-center text-muted py-3',
          text: 'No se encontraron incidentes con los criterios de búsqueda actuales.'
        })
      );
      this.$bodyTabla.append(filaVacia);
    }

    // Actualización del anuncio accesible de recuento
    const total = estadisticas ? estadisticas.total : listaSanitizada.length;
    const criticos = estadisticas ? estadisticas.criticos : listaSanitizada.filter(i => i.severidad === 'critica').length;
    this.mostrarMensaje(
      'incidentes-resumen',
      `${total} incidentes en catálogo · ${criticos} de severidad crítica.`
    );
  }

  /**
   * Enfoca el primer elemento erróneo para facilitar navegación accesible.
   * @param {HTMLElement} campo
   */
  enfocarPrimerError(campo) {
    if (campo && typeof campo.focus === 'function') {
      campo.focus();
    }
  }
};

// Retrocompatibilidad
SOC.IncidentView = SOC.Vista;
