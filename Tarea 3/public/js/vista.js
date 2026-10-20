/* ==========================================================================
   VISTA (js/vista.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Responsabilidad única: Manipulación del DOM, accesibilidad ARIA,
   renderizado de componentes y transiciones visuales mediante jQuery.
   Sin lógica de negocio ni persistencia.
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.Vista = class {
  constructor() {
    // Selección mediante jQuery como herramienta de transición curricular
    this.$form = $('.incident-form');
    this.$campos = this.$form.find('input[id], select[id], textarea[id]');
    this.$bodyTabla = $('#incidentes-body');
    this.$btnSubmit = this.$form.find('[type="submit"]');
    this.$btnReintentar = $('#reintentar');
    this.$resumenIncidentes = $('#incidentes-resumen');
    this.$contenedorTabla = this.$bodyTabla.closest('.table-responsive');

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

    // Elementos nativos para compatibilidad con código existente
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
   * Muestra u oculta el error de un campo con animación suave de jQuery y estado ARIA.
   * @param {HTMLElement} campo - Elemento del campo.
   * @param {string} mensaje - Mensaje de error (vacío si es válido).
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
   * @param {boolean} activo - Verdadero si la consulta asíncrona está en proceso.
   */
  mostrarCargando(activo) {
    this.$contenedorTabla.attr('aria-busy', String(activo));
    this.$btnSubmit.prop('disabled', activo);
    this.$btnReintentar.prop('hidden', true);
  }

  /**
   * Renderiza las filas de incidentes en la tabla HTML con codificación segura (XSS-safe).
   * @param {Array} incidentes - Lista de incidentes del modelo.
   * @param {Object} estadisticas - Resumen { total, criticos }.
   * @param {boolean} animarNuevo - Aplica transición jQuery al primer elemento si es nuevo.
   */
  renderizarIncidentes(incidentes, estadisticas, animarNuevo = false) {
    const fragmento = document.createDocumentFragment();
    const etiquetas = {
      critica: ['critical', 'Crítica (Riesgo Vital)'],
      alta: ['high', 'Alta'],
      media: ['medium', 'Media'],
      baja: ['low', 'Baja']
    };

    incidentes.forEach((item, indice) => {
      const fila = document.createElement('tr');
      if (animarNuevo && indice === 0) {
        fila.classList.add('fila-nueva-animada');
      }

      const columnas = [
        item.codigo,
        item.fecha,
        item.amenaza,
        item.servicio,
        item.severidad,
        item.estado
      ];

      columnas.forEach((valor, i) => {
        const celda = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) {
          celda.scope = 'row';
          celda.className = 'font-mono';
          celda.textContent = valor;
        } else if (i === 1) {
          const time = document.createElement('time');
          time.dateTime = valor;
          try {
            time.textContent = new Intl.DateTimeFormat('es-EC', {
              dateStyle: 'short',
              timeStyle: 'short'
            }).format(new Date(valor));
          } catch {
            time.textContent = valor;
          }
          celda.append(time);
        } else if (i === 4) {
          const badge = document.createElement('span');
          const [claseCss, textoSeveridad] = etiquetas[valor] || ['low', valor];
          badge.className = `badge-severity severity-${claseCss}`;
          badge.textContent = textoSeveridad;
          celda.append(badge);
        } else {
          celda.textContent = valor;
        }
        fila.append(celda);
      });

      fragmento.append(fila);
    });

    this.$bodyTabla.empty().append(fragmento);

    // Animación suave con jQuery si se ha insertado un nuevo incidente
    if (animarNuevo) {
      this.$bodyTabla.find('tr:first').hide().fadeIn(400);
    }

    // Manejo de estado vacío accesible
    if (!incidentes.length) {
      const filaVacia = $('<tr>').append(
        $('<td>', {
          colspan: 6,
          class: 'text-center text-muted py-3',
          text: 'No hay incidentes registrados en el sistema.'
        })
      );
      this.$bodyTabla.append(filaVacia);
    }

    // Actualización del anuncio accesible de recuento con los datos provistos por el Modelo
    const total = estadisticas ? estadisticas.total : incidentes.length;
    const criticos = estadisticas ? estadisticas.criticos : incidentes.filter(i => i.severidad === 'critica').length;
    this.mostrarMensaje(
      'incidentes-resumen',
      `${total} incidentes simulados · ${criticos} de severidad crítica.`
    );
  }

  /**
   * Mueve el foco visible al primer control con error.
   * @param {HTMLElement} campo 
   */
  enfocarPrimerError(campo) {
    if (campo && typeof campo.focus === 'function') {
      campo.focus();
    }
  }

  // Métodos de compatibilidad con la implementación previa
  message(id, txt) { this.mostrarMensaje(id, txt); }
  error(campo, msg) { this.mostrarErrorCampo(campo, msg); }
  clear() { this.limpiarErrores(); }
  loading(act) { this.mostrarCargando(act); }
  render(lista) {
    const stats = {
      total: lista.length,
      criticos: lista.filter(i => i.severidad === 'critica').length
    };
    this.renderizarIncidentes(lista, stats);
  }
};

// Alias de retrocompatibilidad
SOC.IncidentView = SOC.Vista;

