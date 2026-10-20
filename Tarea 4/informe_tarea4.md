# Informe Técnico y Evidencias de Funcionamiento: Tarea Unidad 4

**Asignatura:** Desarrollo en Plataformas  
**Institución:** Pontificia Universidad Católica del Ecuador (PUCE)  
**Tema:** Node.js, Express, Estructura de Proyecto, CRUD, Middleware, REST, Componentes e Integración con APIs  
**Entorno de Ejecución:** Node.js v24.19.0 (LTS), Express 5.2.1, Fetch API nativa (ES6+), HTML5 Semántico y CSS3 Puro  
**Proyecto Evaluado:** Centro de Operaciones de Seguridad (SOC) — Hospital Clínico San Rafael  
**Estándares Aplicados:** W3C WCAG 2.2 Nivel AA, RFC 9110 (HTTP Semantics), OWASP Top 10 API Security  

---

## 1. Introducción y Contexto del Proyecto

En el contexto de la gestión de infraestructuras críticas sanitarias, el Centro de Operaciones de Seguridad (SOC) del **Hospital Clínico San Rafael** requiere plataformas digitales de alta disponibilidad capaces de registrar, categorizar, priorizar y mitigar incidentes de ciberseguridad en tiempo real. Amenazas como el secuestro de historiales médicos (Ransomware en HIS/EHR), la interceptación de telemetría médica en pasarelas IoMT (bombas de infusión en UCI) o la exfiltración de imágenes diagnósticas en servidores PACS/DICOM comprometen no solo la privacidad de los pacientes, sino directamente su integridad biológica y soporte vital.

El presente informe documenta la evolución integral de la plataforma hacia una **arquitectura cliente-servidor desacoplada basada en Express.js (Unidad 4)**. Se implementa una API REST completa con operaciones CRUD, controladores independientes, modelo de datos en memoria con validación defensiva perimetral (*Zero-Trust*), tuberías de middleware para trazabilidad y manejo seguro de excepciones, y una interfaz de usuario frontal construida bajo el patrón MVC que consume dichos servicios mediante la **Fetch API** moderna, garantizando accesibilidad universal conforme a **W3C WCAG 2.2 Nivel AA** y protección perimetral contra vulnerabilidades de inyección (*Cross-Site Scripting* - XSS).

---

## 2. Justificación Técnica Formal

*(Conteo de palabras certificado: 678 palabras)*

En el desarrollo de plataformas digitales modernas orientadas a sectores de alta criticidad, como los Centros de Operaciones de Seguridad (SOC) en infraestructuras sanitarias, la arquitectura del software debe responder a dos exigencias fundamentales: la confiabilidad operacional y la seguridad de la información. La transición desde un servidor HTTP elemental hacia una arquitectura profesional sustentada en Express.js representa un salto cualitativo indispensable para garantizar el desacoplamiento de responsabilidades, la mantenibilidad del código fuente y la escalabilidad del sistema.

Express.js se consolida como el estándar de facto en el ecosistema de Node.js al proveer una abstracción ligera y no intrusiva sobre el protocolo HTTP nativo. Su principal virtud técnica radica en el patrón de diseño basado en tuberías de middleware (pipeline pattern), el cual permite interceptar, procesar, auditar y transformar el flujo de las peticiones y respuestas antes de que alcancen los controladores de negocio. En esta solución, dicho mecanismo viabiliza la implementación de un middleware de registro que captura trazas deterministas de auditoría —incluyendo marcas temporales ISO, direcciones IP de origen, verbos HTTP y latencia en milisegundos— sin contaminar la lógica aplicativa. Paralelamente, la centralización del manejo de excepciones a través de un middleware de error especializado materializa el principio de defensa en profundidad, garantizando la supresión absoluta de volcados de memoria interna (stack traces) o rutas de almacenamiento local hacia el cliente. Esta medida elimina el riesgo de fuga de información técnica (Information Leakage), un vector perimetral primario que los adversarios explotan para mapear vulnerabilidades en sistemas hospitalarios.

Desde la perspectiva arquitectónica, la adopción del estilo arquitectónico REST (Representational State Transfer) establece un contrato de comunicación predecible, uniforme y sin estado (stateless) entre el cliente y el servidor. La exposición de las rutas CRUD para el recurso de incidentes asigna a cada verbo HTTP su propósito canónico: GET para la consulta idempotente del catálogo y búsqueda por filtros parametrizados, POST para la creación de nuevos tickets con retorno del código 201 Created, PATCH/PUT para la transición dinámica de los estados de contención asistencial y DELETE para la desincorporación física del registro. Este diseño formaliza los códigos de respuesta del estándar RFC 9110, distinguiendo anomalías sintácticas o violaciones de validación (400 Bad Request), recursos inexistentes (404 Not Found) y colisiones por duplicidad de códigos preexistentes (409 Conflict).

Asimismo, el modelo en memoria implementado en el backend no actúa como un repositorio pasivo, sino como un punto de control defensivo regido por la filosofía de Desconfianza Cero (Zero-Trust Validation). Aunque la interfaz web implemente validaciones visuales exhaustivas, el backend valida de forma independiente la integridad de los datos recibidos: exige la presencia del formato de ticket hospitalario mediante expresiones regulares estrictas (INC-XXXX), verifica que la fecha no represente una anomalía cronológica futura, restringe las severidades a un catálogo cerrado y demanda umbrales mínimos de caracteres en la descripción de los vectores de ataque. La validación en el navegador se concibe exclusivamente como una optimización de la experiencia de usuario (UX), mientras que la validación en el servidor funge como la barrera infranqueable de integridad perimetral.

En la capa de presentación, la integración de la Fetch API nativa y el paradigma asíncrono con async/await dentro de un esquema Modelo-Vista-Controlador (MVC) estrictamente desacoplado permite una sincronización bidireccional fluida con la API REST. El modelo cliente gestiona el estado transaccional en memoria, la vista gobierna el DOM sin involucrar reglas de negocio y el controlador canaliza los eventos interactivos. Para neutralizar cualquier amenaza de Cross-Site Scripting (XSS), la manipulación del árbol de documentos erradica categóricamente el uso de innerHTML o concatenaciones directas de texto de red, empleando en su lugar APIs nativas de instanciación como document.createElement y asignación por textContent. Esto se complementa con el cumplimiento del estándar internacional W3C WCAG 2.2 Nivel AA, mediante la vinculación estricta de etiquetas y controles con atributos for e id, regiones vivas ARIA (role status, aria-live polite) para la notificación sonora de registros exitosos y eliminación de incidentes, y un diseño responsive con CSS Grid y Flexbox que asegura la continuidad operativa tanto en estaciones fijas de monitoreo SOC como en dispositivos táctiles asistenciales.

---

## 3. Arquitectura del Proyecto y Modularidad por Capas

El proyecto implementa una estructura por capas estricta (*Clean Architecture*), segregando la capa de red HTTP, la capa de enrutamiento, los controladores de aplicación, los modelos de dominio y la capa de presentación frontal:

```text
Tarea 4/
├── package.json                         # Configuración del proyecto, dependencias (Express 5) y scripts
├── server.js                            # Punto de entrada HTTP y arranque del listener en 127.0.0.1:3000
├── server/
│   ├── app.js                           # Fábrica createApp() que encapsula la app de Express en http.Server
│   ├── incident-repository.js           # Lector desacoplado del dataset base de incidentes
│   └── incident-service.js              # Validador de contrato de datos para compatibilidad curricular
├── src/                                 # Módulos centrales de la aplicación Backend (Express)
│   ├── app.js                           # Ensamblado de Express, middlewares perimetrales y estáticos
│   ├── routes/
│   │   └── incidentes.routes.js         # Enrutador REST con definición semántica de endpoints CRUD
│   ├── controllers/
│   │   └── incidentes.controller.js     # Controladores desacoplados de entrada, proceso y salida JSON
│   ├── models/
│   │   └── incidentes.model.js          # Modelo en memoria con validación defensiva Zero-Trust
│   └── middleware/
│       ├── logger.js                    # Middleware de auditoría y telemetría HTTP (latencia en ms)
│       └── errorHandler.js              # Middleware centralizado de errores y supresión de stack traces
├── js/                                  # Capa de Presentación Front-End (Patrón MVC Desacoplado)
│   ├── modelo.js                        # Modelo cliente con métodos asíncronos Fetch (GET, POST, PATCH, DELETE)
│   ├── vista.js                         # Vista con renderizado seguro (XSS-safe), ARIA y acciones interactivas
│   ├── controlador.js                   # Controlador MVC que conecta eventos del DOM con llamadas a la API
│   ├── app.js                           # Bootstrapper del cliente conectado a /api/incidentes
│   ├── model.js / view.js / controller.js # Alias de compatibilidad curricular en inglés
│   └── vendor/jquery.min.js             # Biblioteca jQuery 3.7.1 local para transiciones visuales
├── css/
│   └── styles.css                       # CSS3 puro, box-model universal, CSS Grid 2D, Flexbox y accesibilidad
├── data/
│   └── incidentes.json                  # Dataset inicial con incidentes hospitalarios tipificados
├── tests/
│   └── server.test.js                   # Suite automatizada con 11 pruebas unitarias y de integración
└── index.html                           # Documento HTML5 semántico accesible (WCAG 2.2 AA)
```

### 3.1. Flujo de Datos y Pipeline de Peticiones

```
[ Cliente Web / Navegador / Thunder Client ]
                    │
                    ▼  (Petición HTTP / JSON)
        [ server.js : Puerto 3000 ]
                    │
                    ▼
     [ src/app.js : Express Application ]
  ├── 1. Cabeceras Defensivas (nosniff, DENY, no-store, CORS)
  ├── 2. Middleware de Registro (src/middleware/logger.js)
  └── 3. Parser de Cuerpos JSON (express.json limit: 1mb)
                    │
                    ▼
 [ Enrutador REST: src/routes/incidentes.routes.js ]
  ├── GET    /api/incidentes        ──► incidentes.controller.listarIncidentes
  ├── GET    /api/incidentes/:id    ──► incidentes.controller.obtenerIncidentePorId
  ├── POST   /api/incidentes        ──► incidentes.controller.crearIncidente
  ├── PATCH  /api/incidentes/:id    ──► incidentes.controller.actualizarIncidente
  └── DELETE /api/incidentes/:id    ──► incidentes.controller.eliminarIncidente
                    │
                    ▼
 [ Capa de Controladores: src/controllers/incidentes.controller.js ]
                    │
                    ▼
 [ Modelo en Memoria Defensivo: src/models/incidentes.model.js ]
  └── Validación Zero-Trust (Formato INC-XXXX, Unicidad, Catálogos)
                    │
                    ▼
        (Respuesta JSON Estandarizada)
                    │
                    ▼
 [ Middleware de Errores: src/middleware/errorHandler.js ] (Si ocurre excepción)
```

---

## 4. Especificación Técnica de la API REST y Contrato CRUD

La API expone los servicios bajo el prefijo `/api/incidentes`, empleando serialización JSON estricta (`Content-Type: application/json; charset=utf-8`):

### 4.1. Matriz de Endpoints

| Método | Endpoint | Parámetros / Query | Propósito Operativo | Códigos de Estado |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/salud` | Ninguno | Health Check y tiempo activo (*uptime*) del servidor. | `200 OK` |
| `GET` | `/api/incidentes` | `?severidad=...`<br>`?busqueda=...`<br>`?estado=...` | Listado general con soporte de filtrado reactivo por severidad o búsqueda libre en campos de texto. | `200 OK` |
| `GET` | `/api/incidentes/:id` | `:id` (ej. `INC-2041`) | Consulta individual de un incidente clínico por su código ticket único. | `200 OK`<br>`404 Not Found` |
| `POST` | `/api/incidentes` | Cuerpo JSON con el nuevo incidente | Creación de ticket con validación de unicidad, fechas e integridad de campos mínimos. | `201 Created`<br>`400 Bad Request`<br>`409 Conflict` |
| `PATCH` | `/api/incidentes/:id` | Cuerpo JSON parcial (`estado`, `severidad`, `acciones`) | Modificación controlada del estado de triaje o medidas inmediatas de contención asistencial. | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` |
| `PUT` | `/api/incidentes/:id` | Cuerpo JSON con modificaciones | Actualización completa o parcial de propiedades del incidente. | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` |
| `DELETE` | `/api/incidentes/:id` | `:id` (ej. `INC-2042`) | Baja o eliminación física del incidente del catálogo en memoria. | `200 OK`<br>`404 Not Found` |

### 4.2. Esquemas de Intercambio de Datos

#### Petición de Creación (`POST /api/incidentes`)
```json
{
  "codigo": "INC-2042",
  "fecha": "2026-09-26T03:44:00.000Z",
  "amenaza": "Intento de acceso no autorizado a historias clínicas",
  "servicio": "Urgencias y Triaje de Pacientes",
  "severidad": "alta",
  "estado": "Pendiente de triaje",
  "activo": "gw-iomt-uci02",
  "analista": "Ing. Carlos Vaca — Guardia SOC",
  "descripcion": "Se detectaron múltiples intentos de login fallidos contra el servidor EHR.",
  "acciones": "Bloqueo preventivo de IP y notificación a supervisor de guardia."
}
```

#### Respuesta de Éxito (`201 Created`)
```json
{
  "exito": true,
  "mensaje": "Incidente INC-2042 registrado exitosamente.",
  "datos": {
    "codigo": "INC-2042",
    "fecha": "2026-09-26T03:44:00.000Z",
    "amenaza": "Intento de acceso no autorizado a historias clínicas",
    "servicio": "Urgencias y Triaje de Pacientes",
    "severidad": "alta",
    "estado": "Pendiente de triaje",
    "activo": "gw-iomt-uci02",
    "analista": "Ing. Carlos Vaca — Guardia SOC",
    "descripcion": "Se detectaron múltiples intentos de login fallidos contra el servidor EHR.",
    "acciones": "Bloqueo preventivo de IP y notificación a supervisor de guardia.",
    "creadoEn": "2026-09-26T03:44:47.310Z"
  }
}
```

#### Respuestas Controladas ante Error (Defensa en Profundidad)
* **Código duplicado (`409 Conflict`):**
  ```json
  {
    "exito": false,
    "error": "El código de incidente INC-2042 ya está registrado en el sistema.",
    "codigo": 409
  }
  ```
* **Formato o campos inválidos (`400 Bad Request`):**
  ```json
  {
    "exito": false,
    "error": "El código de incidente debe cumplir con el formato hospitalario INC-XXXX (ejemplo: INC-2042).",
    "codigo": 400
  }
  ```
* **Recurso no existente (`404 Not Found`):**
  ```json
  {
    "exito": false,
    "error": "Incidente con código \"INC-9999\" no encontrado.",
    "codigo": 404
  }
  ```

---

## 5. Middlewares Defensivos Implementados

### 5.1. Middleware de Registro y Telemetría (`src/middleware/logger.js`)
Captura la ejecución de cada solicitud HTTP mediante marcas de alta resolución con `process.hrtime.bigint()`. Cuando la respuesta emite el evento `'finish'`, calcula la latencia con precisión de milisegundos (`ms`) y genera registros estructurados en la consola del servidor con etiquetas semánticas:
* `[INFO]` para respuestas exitosas (códigos 200–299).
* `[WARN]` para errores imputables al cliente (códigos 400–499).
* `[CRIT]` para fallos del servidor (códigos 500+).

```javascript
// Fragmento de auditoría en src/middleware/logger.js
console.log(`${etiqueta} [${timestamp}] ${ipCliente} "${req.method} ${req.originalUrl}" ${codigoEstado} ${duracionMs}ms`);
```

### 5.2. Middleware de Manejo de Errores y Supresión de Fugas (`src/middleware/errorHandler.js`)
Implementa el manejador cuádruple de Express `(err, req, res, next)` para interceptar errores de parsing JSON, excepciones de negocio y fallos imprevistos:
* **Zero Information Leakage:** Ante errores de servidor (500), el mensaje enviado al cliente se higieniza como `"Ocurrió un error interno en el servidor. Por favor intente más tarde."`, omitiendo completamente `err.stack`, rutas físicas del sistema de archivos y detalles de base de datos.
* **Controlador 404 de API:** Intercepta peticiones a rutas inexistentes bajo `/api/*` y retorna respuestas homogéneas en JSON, evitando que el servidor devuelva plantillas HTML por defecto.

### 5.3. Cabeceras Perimetrales de Seguridad HTTP
En cada transacción, Express inyecta cabeceras HTTP de protección perimetral:
* `X-Content-Type-Options: nosniff`: Impide que el navegador interprete tipos MIME distintos al declarado.
* `X-Frame-Options: DENY`: Mitiga vulnerabilidades de secuestro de clic (*Clickjacking*).
* `Cache-Control: no-store`: Evita el almacenamiento en caché de historiales o datos clínicos sensibles.
* `Access-Control-Allow-Origin: *` y preflight `OPTIONS` (204): Habilita la interoperabilidad controlada vía CORS.

---

## 6. Front-End Defensivo: Integración con Fetch API, Filtros y Acciones CRUD

### 6.1. Consumo Asíncrono en el Modelo Cliente (`js/modelo.js`)
El modelo frontal opera 100% desacoplado del DOM mediante `async/await` y la `Fetch API`:
* `cargar(filtros)`: Construye dinámicamente cadenas de consulta mediante `URLSearchParams` para consumir `GET /api/incidentes?severidad=...&busqueda=...`. Dispone de un mecanismo de respaldo (*fallback*) hacia `data/incidentes.json` si el servidor no se encontrara disponible.
* `crear(datos)`: Realiza una petición `POST` serializando el objeto JSON y actualiza la colección en memoria local sin corromper la estructura con arrays anidados.
* `actualizarEstado(codigo, nuevoEstado)`: Envía peticiones `PATCH /api/incidentes/:id` para reflejar transiciones de triaje.
* `eliminar(codigo)`: Invoca `DELETE /api/incidentes/:id` y remueve el registro del estado en memoria.

### 6.2. Vista Segura sin XSS y Accesibilidad ARIA (`js/vista.js`)
* **Erradicación de `innerHTML`:** Las celdas de la tabla se construyen exclusivamente mediante `document.createElement()`, `textContent`, `append()` y asignación de clases con `classList.add()`, garantizando la neutralización perimetral de inyecciones XSS.
* **Barra de Filtros:** Se incorporó un panel con selector de severidad, campo de búsqueda por texto, botón para restablecer filtros y botón de sincronización directa con la API REST.
* **Botones de Acción en Tabla:** Cada fila renderiza dos controles interactivos accesibles:
  * `⚡ Triaje`: Despliega un diálogo accesible para alternar el estado (*Aislamiento VLAN, Inspección Biomédica, Contención Activa, Mitigado*).
  * `🗑️ Eliminar`: Solicita confirmación y ejecuta la eliminación física vía REST.
* **Regiones Vivas ARIA:** Elementos `<p role="status" aria-live="polite">` comunican a lectores de pantalla los cambios de recuento y los mensajes de éxito tras las operaciones de red.

### 6.3. Controlador MVC y Debounce (`js/controlador.js`)
* **Validación en Tiempo Real:** Valida eventos `blur` e `input` sobre cada control del formulario, enfocando el primer campo inválido mediante `focus()` al intentar enviar.
* **Búsqueda con Debounce:** La búsqueda en vivo aplica un retraso de 300 ms (`clearTimeout` / `setTimeout`) para evitar saturar el servidor con peticiones innecesarias mientras el analista teclea.
* **Desplazamiento Suave (Auto-Scroll):** Al registrar exitosamente un nuevo incidente, la interfaz realiza un desplazamiento suave (`scrollIntoView`) hacia la tabla de incidentes (`#sec-monitoreo`), resaltando la nueva fila insertada mediante una animación en color cyan (`fadeIn(400)`).

---

## 7. Análisis de la Causa Raíz del Error de Pantalla en Blanco y Remediación

Durante las pruebas de integración en el Front-End, al registrar un nuevo incidente a través del formulario, la tabla de incidentes se vaciaba y permanecía en blanco. La investigación técnica arrojó los siguientes hallazgos:

### 7.1. Causa Raíz (Cadena de Fallos)
1. **Desalineación del Endpoint en el Bootstrapper:** En [`js/app.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%204/js/app.js), el modelo se instanciaba erróneamente con la ruta estática de la Unidad 2: `new SOC.Modelo('data/incidentes.json')`.
2. **Respuesta Anómala del Servidor:** Al enviar el formulario, el cliente ejecutaba `POST data/incidentes.json`. Como dicha ruta estaba registrada como archivo público, el servidor Express respondía con HTTP 200 entregando el archivo JSON estático completo (un **Arreglo** de 4 objetos).
3. **Corrupción de la Colección en Memoria:** En `modelo.crear()`, la instrucción `const nuevo = resultado.datos || resultado;` asignó a `nuevo` el arreglo completo recibido, insertando un array anidado `[[INC-2041, ...], INC-2041, ...]` al inicio de `this.incidentes`.
4. **Excepción Fatal en el Renderizado:** Al invocar `vista.renderizarIncidentes()`, el bucle `forEach` intentó procesar el primer elemento como incidente. Al evaluar `item.fecha` (que era `undefined`), la función `new Intl.DateTimeFormat().format(new Date(undefined))` lanzó la excepción no capturada `RangeError: Invalid time value`. Esto provocó que el vaciado previo de la tabla (`this.$bodyTabla.empty()`) no fuera completado con las nuevas filas, dejando la interfaz en blanco.

### 7.2. Solución Defensiva Aplicada
* Se corrigió el punto de entrada [`js/app.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%204/js/app.js) para inicializar el modelo con el endpoint oficial: `new SOC.Modelo('/api/incidentes')`.
* Se blindó `modelo.crear()` para garantizar que el nuevo elemento agregado sea estrictamente un **objeto individual** con propiedades válidas, descartando cualquier array anidado.
* Se agregó validación en `vista.renderizarIncidentes()` con `Number.isFinite(new Date(item.fecha).getTime())` y filtrado previo de elementos malformados.
* Se incorporó `scrollIntoView({ behavior: 'smooth' })` para que la pantalla navegue automáticamente desde el formulario inferior hasta la tabla superior, asegurando que el operador visualice el ticket recién creado.

---

## 8. Evidencias de Verificación y Pruebas

### 8.1. Suite Automatizada con Node.js (`node --test tests/server.test.js`)
Se ejecutó la suite completa de **11 pruebas automatizadas** que validan el servidor Express, el modelo en memoria, los controladores, las cabeceras defensivas y el consumo con el cliente:

```text
> soc-hospitalario@3.0.0 test
> node --test tests/server.test.js

[INFO] [2026-09-26T04:51:26.474Z] 127.0.0.1 "GET /api/salud" 200 3.00ms
✔ GET /api/salud responde con 200 y estado activo (46.8058ms)
[INFO] [2026-09-26T04:51:26.488Z] 127.0.0.1 "GET /api/incidentes" 200 0.52ms
[INFO] [2026-09-26T04:51:26.500Z] 127.0.0.1 "GET /api/incidentes" 200 0.42ms
✔ GET /api/incidentes devuelve el catálogo y el modelo cliente lo consume (18.8381ms)
[INFO] [2026-09-26T04:51:26.504Z] 127.0.0.1 "GET /api/incidentes?severidad=critica" 200 0.39ms
[INFO] [2026-09-26T04:51:26.506Z] 127.0.0.1 "GET /api/incidentes?busqueda=ransomware" 200 0.31ms
✔ GET /api/incidentes soporta filtros por severidad y búsqueda (5.9728ms)
[INFO] [2026-09-26T04:51:26.511Z] 127.0.0.1 "GET /api/incidentes/INC-2041" 200 0.65ms
[WARN] [2026-09-26T04:51:26.513Z] 127.0.0.1 "GET /api/incidentes/INC-9999" 404 0.29ms
✔ GET /api/incidentes/:id retorna incidente existente o 404 (6.3159ms)
[INFO] [2026-09-26T04:51:26.518Z] 127.0.0.1 "POST /api/incidentes" 201 7.00ms
[WARN] [2026-09-26T04:51:26.527Z] 127.0.0.1 "POST /api/incidentes" 409 0.59ms
[WARN] [2026-09-26T04:51:26.529Z] 127.0.0.1 "POST /api/incidentes" 400 0.37ms
✔ POST /api/incidentes crea un recurso (201) y rechaza datos inválidos (400/409) (15.5574ms)
[INFO] [2026-09-26T04:51:26.532Z] 127.0.0.1 "PATCH /api/incidentes/INC-2041" 200 0.49ms
[WARN] [2026-09-26T04:51:26.534Z] 127.0.0.1 "PATCH /api/incidentes/INC-0000" 404 0.29ms
✔ PATCH /api/incidentes/:id actualiza el estado asistencial (5.0008ms)
[INFO] [2026-09-26T04:51:26.537Z] 127.0.0.1 "DELETE /api/incidentes/INC-2038" 200 0.38ms
[WARN] [2026-09-26T04:51:26.538Z] 127.0.0.1 "GET /api/incidentes/INC-2038" 404 0.18ms
✔ DELETE /api/incidentes/:id elimina el incidente del catálogo (3.9752ms)
[INFO] [2026-09-26T04:51:26.541Z] 127.0.0.1 "GET /" 200 0.69ms
[INFO] [2026-09-26T04:51:26.543Z] 127.0.0.1 "GET /css/styles.css" 200 0.48ms
[INFO] [2026-09-26T04:51:26.547Z] 127.0.0.1 "GET /js/vendor/jquery.min.js" 200 0.43ms
[INFO] [2026-09-26T04:51:26.549Z] 127.0.0.1 "GET /js/modelo.js" 200 0.34ms
[INFO] [2026-09-26T04:51:26.550Z] 127.0.0.1 "GET /js/vista.js" 200 0.35ms
[INFO] [2026-09-26T04:51:26.563Z] 127.0.0.1 "GET /js/controlador.js" 200 0.66ms
[INFO] [2026-09-26T04:51:26.578Z] 127.0.0.1 "GET /js/app.js" 200 0.53ms
[INFO] [2026-09-26T04:51:26.593Z] 127.0.0.1 "GET /index.html" 200 0.63ms
[INFO] [2026-09-26T04:51:26.608Z] 127.0.0.1 "GET /css/styles.css" 200 0.56ms
[INFO] [2026-09-26T04:51:26.624Z] 127.0.0.1 "GET /js/vendor/jquery.min.js" 200 0.73ms
[INFO] [2026-09-26T04:51:26.626Z] 127.0.0.1 "GET /js/modelo.js" 200 0.49ms
[INFO] [2026-09-26T04:51:26.627Z] 127.0.0.1 "GET /js/vista.js" 200 0.45ms
[INFO] [2026-09-26T04:51:26.639Z] 127.0.0.1 "GET /js/controlador.js" 200 0.48ms
[INFO] [2026-09-26T04:51:26.640Z] 127.0.0.1 "GET /js/app.js" 200 0.48ms
[INFO] [2026-09-26T04:51:26.655Z] 127.0.0.1 "GET /proyecto-incidentes-tema1/index.html" 200 1.21ms
[INFO] [2026-09-26T04:51:26.671Z] 127.0.0.1 "GET /css/styles.css" 200 0.48ms
[INFO] [2026-09-26T04:51:26.686Z] 127.0.0.1 "GET /js/vendor/jquery.min.js" 200 0.67ms
[INFO] [2026-09-26T04:51:26.688Z] 127.0.0.1 "GET /js/modelo.js" 200 0.39ms
[INFO] [2026-09-26T04:51:26.689Z] 127.0.0.1 "GET /js/vista.js" 200 0.38ms
[INFO] [2026-09-26T04:51:26.701Z] 127.0.0.1 "GET /js/controlador.js" 200 0.55ms
[INFO] [2026-09-26T04:51:26.717Z] 127.0.0.1 "GET /js/app.js" 200 0.62ms
✔ ambas páginas y sus recursos se entregan por HTTP (180.4376ms)
[WARN] [2026-09-26T04:51:26.724Z] 127.0.0.1 "GET /no-existe" 404 0.26ms
[WARN] [2026-09-26T04:51:26.725Z] 127.0.0.1 "GET /server.js" 404 0.17ms
[WARN] [2026-09-26T04:51:26.733Z] 127.0.0.1 "GET /.git/config" 404 0.18ms
[WARN] [2026-09-26T04:51:26.748Z] 127.0.0.1 "GET /server.js" 404 0.27ms
✔ rutas desconocidas y archivos privados devuelven 404 (30.3624ms)
[ERROR CRÍTICO] Error: error simulado de base de datos
[CRIT] [2026-09-26T04:51:26.752Z] 127.0.0.1 "GET /api/incidentes" 500 0.47ms
✔ fallos de datos devuelven 500 sin exponer detalles internos (3.4122ms)
✔ servicio rechaza datos inválidos, duplicados y errores de lectura (1.5459ms)

ℹ tests 11 | suites 0 | pass 11 | fail 0 | cancelled 0 | duration_ms 496.66ms
```

### 8.2. Evidencias de Interacción Directa con Thunder Client
Las pruebas realizadas a través de la extensión Thunder Client en Visual Studio Code registraron las siguientes métricas en el archivo de respuestas (`thunderResponses.json`):

| Id de Prueba | Verbo | Endpoint Solicitado | Código | Latencia | Tamaño | Resultado de Validación |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `cd950790` | `GET` | `http://127.0.0.1:3000/api/incidentes` | `200 OK` | 6 ms | 901 B | Entrega íntegra del catálogo inicial con cabeceras `nosniff` y `DENY`. |
| `1f27f562` | `GET` | `http://127.0.0.1:3000/api/incidentes/1` | `404 Not Found` | 11 ms | 81 B | Control defensivo: mensaje seguro sin fuga de trazas internas. |
| `0ab7ca62` | `POST` | `http://127.0.0.1:3000/api/incidentes` | `201 Created` | 6 ms | 303 B | Creación exitosa del ticket `INC-2042` en el servidor Express. |
| `c119ecb7` | `GET` | `http://127.0.0.1:3000/api/incidentes/INC-2042` | `200 OK` | 5 ms | 224 B | Recuperación puntual del recurso recién persistido en memoria. |
| `3bf675e5` | `PUT` | `http://127.0.0.1:3000/api/incidentes/INC-2042` | `200 OK` | 10 ms | 355 B | Actualización del estado a `"En investigación"`. |
| `4af6e9d4` | `DELETE`| `http://127.0.0.1:3000/api/incidentes/INC-2042` | `200 OK` | 7 ms | 96 B | Eliminación confirmada del catálogo hospitalario. |

---

## 9. Conclusiones y Cumplimiento de Resultados de Aprendizaje

1. **Cumplimiento del RDA 2 (Arquitectura Cliente-Servidor y Backend Robusto):**
   Se consolidó un servidor modular con Node.js y Express 5 estructurado en carpetas dedicadas (`routes/`, `controllers/`, `models/`, `middleware/`). El modelo en memoria implementa validaciones estrictas *Zero-Trust*, mientras que las tuberías de middleware aseguran la trazabilidad de latencias y neutralizan la exposición de volcados de memoria técnica (*Zero Information Leakage*).

2. **Cumplimiento del RDA 1 (Capa de Presentación y Frontend Defensivo):**
   La interfaz web opera mediante el patrón MVC desacoplado consumiendo la API REST con la moderna Fetch API. Se garantizó la defensa perimetral contra inyecciones XSS erradicando `innerHTML`, se añadieron filtros reactivos con *debounce* y se aseguró el cumplimiento estricto del estándar de accesibilidad **W3C WCAG 2.2 Nivel AA** con regiones vivas ARIA y auto-desplazamiento suave.

3. **Verificación Formal y Calidad del Software:**
   El 100% de los casos de prueba unitarios y de integración (11/11 tests en `node:test`) y las pruebas interactivas en Thunder Client certifican que la plataforma opera de forma determinista, resiliente y preparada para entornos de misión crítica en ciberseguridad hospitalaria.
