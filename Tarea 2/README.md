# SOC Hospitalario — Prototipo con JavaScript

## Ejecutar
Desde esta carpeta, ejecute `python -m http.server 8000` y visite http://localhost:8000.
También puede usar Live Server. No abra el HTML con doble clic: Fetch necesita servir el JSON mediante HTTP.
Ambas entradas (`index.html` y `proyecto-incidentes-tema1/index.html`) comparten CSS, JavaScript y datos.

## Separación MVC
- `js/model.js`: carga con Fetch, comprobación de respuesta HTTP y estructura JSON, estado en memoria y reglas de validación.
- `js/view.js`: tabla, resumen, errores por campo y mensajes accesibles; utiliza textContent para mostrar datos como texto.
- `js/controller.js`: eventos, validación al salir del campo y durante la corrección, envío, limpieza y reintento.
- `data/incidentes.json`: cuatro incidentes iniciales extraídos del prototipo original.

## Comportamiento
Se validan campos obligatorios, código INC-0000 y duplicados, fecha no futura, longitudes después de quitar espacios exteriores, consentimiento y extensión/tamaño del adjunto (15 MB).
El primer campo incorrecto recibe el foco al enviar. Los errores se asocian mediante aria-describedby y aria-invalid; los resultados usan role=status / aria-live y los fallos role=alert. Los errores no se anuncian en cada pulsación.
La carga tiene estados de espera, éxito, vacío y error con reintento; el registro se habilita al completar la carga. Una petición tarda como máximo 10 segundos.
El formulario válido añade una fila y actualiza el total y el número de incidentes críticos sin recargar la página.
Limpiar restablece el formulario y sus errores, conservando la tabla.

## Alcance
Demostración educativa sin backend. Al recargar se pierden los registros añadidos; no se modifica el JSON, no se envían alertas ni se suben archivos. Las métricas hospitalarias originales son ilustrativas.

## Verificación manual
1. Comprobar que aparecen cuatro filas al abrir la página mediante HTTP.
2. Enviar vacío: comprobar resumen, errores y foco en el código.
3. Probar INC-2041 (duplicado), formato incorrecto, fecha futura, textos cortos/solo espacios, archivo no permitido y archivo mayor de 15 MB.
4. Completar datos válidos y consentimiento: comprobar nueva fila, resumen y confirmación.
5. Volver a usar el código recién creado: debe rechazarse.
6. Limpiar: comprobar que desaparecen errores y que la tabla permanece.
7. Bloquear data/incidentes.json en las herramientas del navegador; recargar, comprobar error y botón Reintentar. Desbloquear y reintentar.
8. Probar un JSON vacío ([]), mal formado y con códigos duplicados.
9. Navegar con Tab y verificar anuncios con un lector de pantalla; comprobar también la entrada de la subcarpeta y una pantalla estrecha.
