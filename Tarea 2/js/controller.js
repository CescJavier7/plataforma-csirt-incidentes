/* Controlador: conecta los eventos de la vista con las reglas del modelo. */
'use strict';
(() => {
  const url = new URL('../data/incidentes.json', document.currentScript.src);
  const model = new SOC.IncidentModel(url);
  const view = new SOC.IncidentView();
  const touched = new Set();
  let saving = false;
  async function load() {
    view.loading(true);
    view.message('carga-error', '');
    view.message('carga-mensaje', 'Cargando incidentes simulados…');
    view.body.rows[0].cells[0].textContent = 'Cargando…';
    try {
      await model.load();
      view.render(model.incidents);
      view.message('carga-mensaje', `Carga completada: ${model.incidents.length} incidentes.`);
    } catch (error) {
      view.message('carga-mensaje', '');
      view.message('carga-error', 'No se pudieron cargar los incidentes. Abra el proyecto con un servidor local (por ejemplo, Live Server) y reintente.');
      view.body.rows[0].cells[0].textContent = 'Datos no disponibles.';
    } finally {
      view.loading(false);
      view.submit.disabled = !model.ready;
      view.retry.hidden = model.ready;
    }
  }
  function validate(field, announce = false) {
    const message = model.validate(field);
    view.error(field, message);
    if (announce && message) {
      const label = field.labels[0]?.textContent.replace(/\s+/g, ' ').trim() || 'Campo';
      view.message('form-mensaje', `${label}: ${message}`);
    }
    return !message;
  }
  for (const field of view.fields) {
    field.addEventListener('blur', () => { touched.add(field); validate(field, true); });
    field.addEventListener('input', () => { if (touched.has(field)) validate(field); });
    field.addEventListener('change', () => { touched.add(field); validate(field, true); });
  }
  view.form.addEventListener('reset', () => {
    touched.clear();
    view.clear();
    if (!saving) view.message('form-mensaje', 'Formulario limpiado. Los incidentes registrados se mantienen.');
  });
  view.form.addEventListener('submit', event => {
    event.preventDefault();
    if (!model.ready) { view.message('form-error', 'Espere a que se carguen los incidentes.'); return; }
    const invalid = view.fields.filter(field => { touched.add(field); return !validate(field); });
    view.message('form-mensaje', '');
    view.message('form-error', '');
    if (invalid.length) {
      view.message('form-error', `No se registró el incidente. Revise ${invalid.length} campos con errores.`);
      invalid[0].focus();
      return;
    }
    const data = Object.fromEntries(new FormData(view.form));
    // Solo se conserva el nombre del adjunto; no se carga ni transmite su contenido.
    data.archivo_evidencia = view.form.querySelector('[type="file"]').files[0]?.name || '';
    const selected = id => document.getElementById(id).selectedOptions[0].textContent;
    const incident = {
      codigo: data.codigo_incidente.trim(), fecha: data.fecha_deteccion,
      amenaza: selected('categoria-amenaza'), servicio: selected('servicio-hospitalario'),
      severidad: data.nivel_severidad, estado: 'Pendiente de triaje (simulado)', detalle: data
    };
    try { model.add(incident); }
    catch (error) { view.message('form-error', error.message); return; }
    view.render(model.incidents);
    saving = true;
    view.form.reset();
    saving = false;
    view.message('form-mensaje', `Incidente ${incident.codigo} registrado en la tabla. Registro simulado, sin envío de alertas.`);
  });
  view.retry.addEventListener('click', load);
  load();
})();
