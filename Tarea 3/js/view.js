/* ==========================================================================
   VIEW (js/view.js - English alias / Backwards Compatibility)
   SOC Hospitalario - Hospital Clínico San Rafael
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.IncidentView = class {
  constructor() {
    this.$form = $('.incident-form');
    this.$campos = this.$form.find('input[id], select[id], textarea[id]');
    this.$bodyTabla = $('#incidentes-body');
    this.$btnSubmit = this.$form.find('[type="submit"]');
    this.$btnReintentar = $('#reintentar');
    this.$resumenIncidentes = $('#incidentes-resumen');
    this.$contenedorTabla = this.$bodyTabla.closest('.table-responsive');

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

        const descritoPor = ($campo.attr('aria-describedby') || '').trim();
        $campo.attr('aria-describedby', descritoPor ? `${descritoPor} error-${id}` : `error-${id}`);
      }
    });

    if (this.$form.length) {
      this.$form[0].noValidate = true;
    }

    this.form = this.$form[0];
    this.fields = this.$campos.toArray();
    this.body = this.$bodyTabla[0];
    this.submit = this.$btnSubmit[0];
    this.retry = this.$btnReintentar[0];
  }

  mostrarMensaje(id, texto) {
    const $elem = $(`#${id}`);
    if ($elem.length) {
      $elem.text(texto);
    }
  }

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

  limpiarErrores() {
    this.$campos.each((_, campo) => {
      this.mostrarErrorCampo(campo, '');
    });
    this.mostrarMensaje('form-error', '');
  }

  mostrarCargando(activo) {
    this.$contenedorTabla.attr('aria-busy', String(activo));
    this.$btnSubmit.prop('disabled', activo);
    this.$btnReintentar.prop('hidden', true);
  }

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

    if (animarNuevo) {
      this.$bodyTabla.find('tr:first').hide().fadeIn(400);
    }

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

    const total = estadisticas ? estadisticas.total : incidentes.length;
    const criticos = estadisticas ? estadisticas.criticos : incidentes.filter(i => i.severidad === 'critica').length;
    this.mostrarMensaje(
      'incidentes-resumen',
      `${total} incidentes simulados · ${criticos} de severidad crítica.`
    );
  }

  enfocarPrimerError(campo) {
    if (campo && typeof campo.focus === 'function') {
      campo.focus();
    }
  }

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

SOC.Vista = SOC.IncidentView;
