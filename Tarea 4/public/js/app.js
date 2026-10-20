/* ==========================================================================
   PUNTO DE ENTRADA (BOOTSTRAPPER - js/app.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Unidad 4: Node.js, Express, CRUD, Middleware e Integración REST con Fetch API
   Responsabilidad: Arrancar la aplicación, instanciar las capas MVC
   y enlazar con el endpoint oficial de la API REST (/api/incidentes).
   ========================================================================== */
'use strict';

$(document).ready(function() {
  // 1. Endpoint oficial de la API REST con Express (Unidad 4)
  const endpointApi = '/api/incidentes';

  // 2. Instanciación desacoplada de los componentes del patrón MVC
  const modelo = new SOC.Modelo(endpointApi);
  const vista = new SOC.Vista();
  const controlador = new SOC.Controlador(modelo, vista);

  // 3. Puesta en marcha del orquestador de eventos y carga inicial
  controlador.iniciar();

  // Exposición en el espacio de nombres para depuración en consola DevTools
  SOC.app = {
    modelo,
    vista,
    controlador
  };
});
