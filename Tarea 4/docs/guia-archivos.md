# Guía de archivos y comentarios

## Archivos creados para la Tarea 3

| Archivo | Para qué sirve |
| --- | --- |
| `server.js` | Inicia el servidor y configura su puerto. |
| `server/app.js` | Recibe HTTP, resuelve rutas y construye respuestas. |
| `server/incident-service.js` | Comprueba los datos antes de devolverlos. |
| `server/incident-repository.js` | Lee el archivo JSON del disco. |
| `package.json` | Define el proyecto y los comandos npm start y npm test. |
| `tests/server.test.js` | Comprueba la API, recursos y errores con peticiones HTTP reales. |
| `docs/fase-3-documento-tecnico.md` | Documento de entrega con arquitectura, diagrama y explicación HTTP. |

## Archivos modificados para conectar la Tarea 3

- `js/controller.js`: consulta la ruta /api/incidentes y comunica el resultado.
- `js/model.js`: solicita la respuesta en formato JSON mediante la cabecera Accept.
- `README.md`: instrucciones de ejecución y listado de entregables actualizado.

## Archivos comentados en esta revisión

Se añadieron comentarios explicativos en los cuatro archivos del servidor, los tres archivos MVC del cliente y las pruebas. `js/view.js` ya pertenecía a la fase II; ahora también explica cómo construye la tabla y utiliza ARIA. Esta guía es nueva.

Los comentarios explican cada función y los bloques principales, las reglas de validación, los eventos, los errores, las promesas y el flujo de datos. No cambian el comportamiento del programa. El HTML y CSS conservan sus comentarios previos.

## Archivos JSON

JSON no admite comentarios. Para conservar su validez, sus campos se explican aquí:

- `package.json`: name identifica el proyecto; version indica la versión; private evita publicación accidental con npm; description resume su propósito; scripts.start ejecuta server.js; scripts.test ejecuta las pruebas; engines.node declara el requisito de Node.js.
- `data/incidentes.json`: arreglo de incidentes. Cada uno tiene codigo (identificador), fecha (detección), amenaza (descripción), servicio (área afectada), severidad (baja, media, alta o critica) y estado (situación del incidente). Fue creado en la fase II y se reutiliza en la fase III.

## Orden recomendado para estudiar el código

1. `server.js`: cómo se inicia el proceso.
2. `server/app.js`: cómo llega una petición y se responde.
3. Servicio y repositorio: cómo se comprueba y lee el JSON.
4. `js/controller.js`: cómo se inicia la consulta desde la página.
5. `js/model.js`: cómo se obtiene y valida la respuesta.
6. `js/view.js`: cómo aparecen los datos y mensajes en pantalla.
7. Pruebas: cómo se comprueba que el recorrido funciona.
