/* Vista: presentación accesible. Los datos se insertan como texto, nunca como HTML. */
'use strict';
SOC.IncidentView = class {
  constructor() {
    this.form = document.querySelector('.incident-form');
    this.fields = [...this.form.querySelectorAll('input[id], select[id], textarea[id]')];
    this.body = document.getElementById('incidentes-body');
    this.submit = this.form.querySelector('[type="submit"]');
    this.retry = document.getElementById('reintentar');
    for (const field of this.fields) {
      const error = document.createElement('small');
      error.id = `error-${field.id}`;
      error.className = 'field-error';
      error.hidden = true;
      field.closest('.form-group').append(error);
      field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
    }
    this.form.noValidate = true;
  }
  message(id, text) { document.getElementById(id).textContent = text; }
  error(field, message) {
    field.setAttribute('aria-invalid', String(Boolean(message)));
    const node = document.getElementById(`error-${field.id}`);
    node.textContent = message;
    node.hidden = !message;
  }
  clear() {
    for (const field of this.fields) {
      this.error(field, '');
      field.removeAttribute('aria-invalid');
    }
    this.message('form-error', '');
  }
  loading(active) {
    this.body.closest('.table-responsive').setAttribute('aria-busy', String(active));
    this.submit.disabled = active;
    this.retry.hidden = true;
  }
  render(incidents) {
    const fragment = document.createDocumentFragment();
    const labels = { critica: ['critical', 'Crítica (Riesgo Vital)'], alta: ['high', 'Alta'], media: ['medium', 'Media'], baja: ['low', 'Baja'] };
    for (const item of incidents) {
      const row = document.createElement('tr');
      const values = [item.codigo, item.fecha, item.amenaza, item.servicio, item.severidad, item.estado];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) { cell.scope = 'row'; cell.className = 'font-mono'; }
        if (index === 1) {
          const time = document.createElement('time');
          time.dateTime = value;
          time.textContent = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
          cell.append(time);
        } else if (index === 4) {
          const badge = document.createElement('span');
          badge.className = `badge-severity severity-${labels[value][0]}`;
          badge.textContent = labels[value][1];
          cell.append(badge);
        } else { cell.textContent = value; }
        row.append(cell);
      });
      fragment.append(row);
    }
    this.body.replaceChildren(fragment);
    if (!incidents.length) {
      const cell = this.body.insertRow().insertCell();
      cell.colSpan = 6;
      cell.textContent = 'No hay incidentes registrados.';
    }
    this.message('incidentes-resumen', `${incidents.length} incidentes simulados · ${incidents.filter(item => item.severidad === 'critica').length} de severidad crítica.`);
  }
};
