/* ==========================================================================
   PUNTO DE ENTRADA (BOOTSTRAPPER - js/app.js)
   Centro de Operaciones de Seguridad (SOC) - Hospital Clínico San Rafael
   Responsabilidad única: Arrancar la aplicación, instanciar las capas MVC
   y enlazar el modelo de datos local de solo lectura.
   ========================================================================== */
'use strict';

$(document).ready(function() {
  // 1. Definición del recurso local de solo lectura (Unidad 2 / RDA 1)
  const rutaJsonLocal = 'data/incidentes.json';

  // 2. Instanciación desacoplada de los componentes del patrón MVC
  const modelo = new SOC.Modelo(rutaJsonLocal);
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

