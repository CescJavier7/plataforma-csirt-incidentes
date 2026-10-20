/* ==========================================================================
   CONTROLLER (js/controller.js - English alias / Backwards Compatibility)
   SOC Hospitalario - Hospital Clínico San Rafael
   Soporte híbrido /api/incidentes y data/incidentes.json
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.IncidentController = class extends SOC.Controlador {
  constructor(model, view) {
    // Si no se proporcionan dependencias, las inicializa por defecto
    const m = model || new SOC.IncidentModel(new URL('data/incidentes.json', window.location.href));
    const v = view || new SOC.IncidentView();
    super(m, v);
    // Compatibilidad con endpoint /api/incidentes para pruebas automatizadas
    this.apiEndpoint = '/api/incidentes';
  }
};

SOC.Controlador = SOC.Controlador || SOC.IncidentController;
