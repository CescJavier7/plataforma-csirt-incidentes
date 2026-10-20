# Informe Técnico y Evidencias de Funcionamiento: Tarea Unidad 3
**Asignatura:** Desarrollo en Plataformas  
**Institución:** Pontificia Universidad Católica del Ecuador (PUCE)  
**Tema:** Plataforma Digital, Arquitectura N-Capas, Protocolo HTTP y Flujo Cliente-Servidor con Node.js  
**Entorno de Ejecución:** Node.js v20+ (Módulos Nativos `node:http`, `node:fs/promises`, `node:path`), Vanilla JS / jQuery, HTML5 Semántico y CSS3 Puro  
**Proyecto Evaluado:** Centro de Operaciones de Seguridad (SOC) — Hospital Clínico San Rafael  

---

## 1. Fundamentos Conceptuales: Plataforma Digital, Componentes y Roles

### 1.1. Distinción Conceptual: Aplicación, Plataforma y Sistema

Para comprender la dimensión de la solución desarrollada en este proyecto de ciberseguridad hospitalaria, es imperativo deslindar con precisión teórica tres conceptos frecuentemente confundidos en el ámbito del desarrollo de software:

```
+-----------------------------------------------------------------------------------+
| SISTEMA GLOBAL DE GOBERNANZA HOSPITALARIA (SOC HIS/EHR + IoMT)                   |
| - Infraestructura de Red, Servidores PACS/DICOM, DMZ, VLANs UCI                   |
| - Políticas de Seguridad de la Información (NIST SP 800-61, ISO 27001, HIPAA)     |
| - Roles Asistenciales, Médicos de Guardia, Analistas Forenses y CSIRT             |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | PLATAFORMA DIGITAL SOC HOSPITALARIO (Arquitectura N-Capas)                |   |
|   | - Ecosistema tecnológico modular integrado e interoperable               |   |
|   | - Capa de Presentación Web (Dashboard accesible WCAG 2.2 AA)             |   |
|   | - Servicios HTTP y API REST (`/api/incidentes`, `/api/salud`)             |   |
|   | - Motor de validación, telemetría y persistencia local/remota             |   |
|   |                                                                           |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   | APLICACIÓN PUNTUAL (Módulo de Triaje y Registro de Incidentes)    |   |   |
|   |   | - Unidad funcional acotada: captura de vector, activo y severidad |   |   |
|   |   | - Formulario reactivo en el DOM con intercepción de eventos       |   |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |                                                                           |   |
|   +---------------------------------------------------------------------------+   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

1. **Aplicación Puntual (Módulo Aislado):**  
   Es un artefacto de software diseñado para resolver una tarea operativa específica y bien delimitada. En este proyecto, el formulario de triaje y reporte de incidentes constituye una aplicación puntual: recibe la entrada del operador, valida que el código cumpla con el formato `INC-XXXX` y que la descripción técnica posea al menos 30 caracteres, y añade el objeto a la memoria local. Si existiera de forma aislada, carecería de interoperabilidad, persistencia distribuida y comunicación con otros módulos.

2. **Plataforma Digital (Ecosistema Modular Integrado):**  
   Representa una estructura tecnológica integral y desacoplada que articula múltiples aplicaciones, usuarios, canales de comunicación, reglas de negocio y flujos de datos. La Plataforma SOC del Hospital San Rafael no es solo un formulario; es un entorno que orquesta un panel de monitoreo en tiempo real de sondas IoMT, un servidor HTTP en Node.js que expone contratos de datos estandarizados (`/api/incidentes` y `/api/salud`), una capa de presentación adaptable y accesible, y mecanismos de telemetría asistencial. La plataforma provee el sustrato técnico para que diversas aplicaciones interoperen de forma desacoplada.

3. **Sistema (Ecosistema Global y Gobernanza):**  
   Abarca la totalidad del entorno sociotécnico: el hardware físico (sensores de bombas de infusión en UCI, servidores PACS de imagenología, cortafuegos perimetrales), las personas que interactúan en distintos niveles (directores médicos, analistas SOC, personal de enfermería), los marcos normativos y de cumplimiento legal (secreto médico, protección de datos de salud, NIST SP 800-61) y las políticas operativas de contingencia (como la conmutación al protocolo de triaje en papel ante ataques de Ransomware). La plataforma digital es el componente informático que viabiliza los objetivos del sistema.

---

### 1.2. Matriz de Roles Técnicos en la Plataforma de Incidentes

En un entorno de producción hospitalario, el ciclo de vida de la plataforma involucra disciplinas especializadas con responsabilidades no solapadas:

| Rol Técnico | Responsabilidad en la Plataforma SOC | Aporte Concreto al Proyecto |
| :--- | :--- | :--- |
| **Front-End Developer** | Construcción de la interfaz de usuario, maquetación semántica sin *divitis*, experiencia de uso (UX), diseño responsive *Mobile-First* y accesibilidad universal conforme al estándar W3C WCAG 2.2 Nivel AA. | Implementación de `index.html` con landmarks, estilos puros en `css/styles.css` con Grid/Flexbox, foco visible (`:focus-visible`), regiones vivas ARIA (`role="status"`, `aria-live="polite"`) y transiciones visuales de apoyo mediante jQuery. |
| **Back-End Developer** | Diseño y aprovisionamiento del servidor de aplicaciones, gestión de conexiones de red, enrutamiento HTTP determinista, ejecución de servicios de negocio y serialización/deserialización de estructuras JSON. | Construcción de `server.js` y `server/app.js` empleando la API nativa `node:http`, sin frameworks como Express. Exposición de rutas con códigos de estado rigurosos (`200`, `404`, `405`, `500`) y tiempo límite de respuesta mediante `AbortSignal`. |
| **DBA / Especialista de Datos** | Modelado de datos, definición de esquemas de intercambio, integridad referencial, consistencia de tipos y persistencia confiable. | Diseño y validación del esquema de `data/incidentes.json` (código `INC-XXXX`, marcas temporales ISO 8601, tipado de severidades `critica`, `alta`, `media`, `baja`) y separación entre almacenamiento persistente y colecciones en memoria. |
| **Especialista en Ciberseguridad** | Seguridad defensiva en capa de presentación y transporte, hardening de servidores, control de inyecciones (XSS, Prototype Pollution), cabeceras de seguridad HTTP y políticas de acceso. | Endurecimiento perimetral mediante cabeceras defensivas (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Access-Control-Allow-Origin: *`), validación de extensiones forenses (`accept`) y erradicación de `innerHTML` en favor de `textContent`. |

---

## 2. Arquitectura N-Capas y Diagrama de Flujo de Comunicación

### 2.1. Desglose de las Capas Lógicas

La arquitectura del proyecto implementa una separación formal de responsabilidades dividida en tres capas principales:

```
===================================================================================
1. CAPA DE PRESENTACIÓN (CLIENTE / NAVEGADOR WEB)
   - Archivos: public/index.html, public/css/styles.css, public/js/app.js
   - Módulos MVC del Cliente:
       * js/vista.js: Manipulación de nodos del DOM, transiciones jQuery y ARIA.
       * js/controlador.js: Intercepción submit (preventDefault), validaciones dinámicas.
       * js/modelo.js: Consumo asíncrono con Fetch API y estado local.
   - Ejecución: Hilo principal (Main Thread) del motor JavaScript del navegador.
===================================================================================
                                      │  ▲
              Petición HTTP Request   │  │   Respuesta HTTP Response
          (GET /api/incidentes, etc.) │  │   (JSON + Cabeceras 200 OK)
                                      ▼  │
===================================================================================
2. CAPA DE SERVICIOS Y LÓGICA DE TRANSPORTE (SERVIDOR NODE.JS)
   - Archivos: server.js, server/app.js, server/incident-service.js
   - Responsabilidades:
       * server.js: Inicialización de socket TCP en 127.0.0.1:3000 con node:http.
       * server/app.js: Enrutamiento seguro, filtro de verbos HTTP, negociación OPTIONS.
       * server/incident-service.js: Validación estructural e integridad de datos.
===================================================================================
                                      │  ▲
       Lectura asíncrona no bloqueante │  │   Buffers de datos serializados
          (fs.promises.readFile)      │  │   (Array de objetos JSON validados)
                                      ▼  │
===================================================================================
3. CAPA DE ACCESO A DATOS Y PERSISTENCIA (ALMACÉN DE DATOS)
   - Archivo: server/incident-repository.js -> data/incidentes.json
   - Responsabilidades:
       * Lectura atómica del archivo físico en disco mediante streams asíncronos.
       * Aislamiento del origen de datos: la capa HTTP no accede directamente al disco.
===================================================================================
```

---

### 2.2. Diagrama de Flujo en Bloques (ASCII)

El siguiente diagrama detalla la traza completa y el ciclo de vida de una petición HTTP desde la interacción del analista SOC hasta la renderización accesible en la pantalla:

```
 [ Analista SOC ]
        │
        │ 1. Hace clic en "Reintentar carga" o carga inicial de la página
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ CAPA CLIENTE: Controlador / Vista (`js/controlador.js`)                 │
 │ - Muestra estado de espera visual y accesible (`aria-busy="true"`)      │
 │ - Anuncia en región viva: "Cargando incidentes del SOC sanitario…"     │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 2. Invocación asíncrona: `modelo.cargar()` (`js/modelo.js`)
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ CLIENTE FETCH API: `fetch('/api/incidentes', { headers: ... })`        │
 │ - Configura cabecera: `Accept: application/json`                       │
 │ - Activa señal de aborto preventivo: `AbortSignal.timeout(10000)`       │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 3. Petición HTTP en la red local:
        │    GET /api/incidentes HTTP/1.1
        │    Host: 127.0.0.1:3000
        │    Accept: application/json
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ ENRUTADOR HTTP NODE.JS (`server/app.js`)                               │
 │ - Valida método: ¿Es GET? Sí (si fuera POST/DELETE devuelve 405).      │
 │ - Resuelve ruta: Identifica `/api/incidentes` registrada.              │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 4. Delega a Capa de Negocio (`server/incident-service.js`)
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ SERVICIO DE INCIDENTES: `listIncidents()`                               │
 │ - Solicita al repositorio la lectura asíncrona del JSON.              │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 5. Lectura no bloqueante del Event Loop (`server/incident-repository.js`)
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ REPOSITORIO DE DATOS: `readFile('data/incidentes.json', 'utf8')`        │
 │ - Carga el archivo físico del disco sin congelar peticiones paralelas. │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 6. Retorna contenido deserializado y verificado
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ SERVICIO DE INCIDENTES (Validación del Contrato)                        │
 │ - Verifica que el arreglo contenga códigos válidos (INC-XXXX).         │
 │ - Comprueba que no existan códigos duplicados y fechas coherentes.     │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 7. Construcción de Respuesta HTTP en `server/app.js` (`send()`)
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ RESPUESTA HTTP SERVER:                                                 │
 │   HTTP/1.1 200 OK                                                      │
 │   Content-Type: application/json; charset=utf-8                        │
 │   Access-Control-Allow-Origin: *                                       │
 │   X-Content-Type-Options: nosniff                                      │
 │   X-Frame-Options: DENY                                                │
 │   Cache-Control: no-store                                              │
 │   Content-Length: [bytes]                                              │
 │                                                                        │
 │   [{"codigo":"INC-2041","fecha":"2026-09-11T11:20:00", ...}]            │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 8. Retorno a través del socket TCP hacia el navegador
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ CLIENTE FETCH API: Recepción de Respuesta                              │
 │ - Verifica: `if (!response.ok) throw new Error(...)`                   │
 │ - Parsea flujo: `const data = await response.json()`                   │
 └────────────────────────────────────────────────────────────────────────┘
        │
        │ 9. Sincronización MVC: Controlador actualiza Modelo y Vista
        ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ VISTA DOM ACCESIBLE (`js/vista.js`):                                   │
 │ - Genera filas `<tr>` de forma segura con `textContent` y badges.      │
 │ - Aplica transición visual de entrada con jQuery (`.fadeIn()`).        │
 │ - Actualiza `#incidentes-resumen` (`role="status"`, `aria-live`):      │
 │   "4 incidentes simulados · 1 de severidad crítica."                  │
 │ - Restablece `aria-busy="false"` y habilita el botón de registro.     │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Fundamentos del Protocolo HTTP en la Solución

### 3.1. Naturaleza del Protocolo: Modelo Cliente-Servidor y Principio Stateless

El protocolo HTTP (Hypertext Transfer Protocol) constituye la base de la comunicación en la web moderna. En la plataforma desarrollada, se evidencian dos de sus propiedades fundamentales:

1. **Modelo Cliente-Servidor Desacoplado:**  
   Existe una estricta asimetría funcional. El cliente (navegador web que ejecuta el front-end) actúa como emisor proactivo de solicitudes (*Requests*), mientras que el servidor Node.js permanece en escucha pasiva en una dirección y puerto determinados (`127.0.0.1:3000`), procesando las peticiones y retornando una respuesta (*Response*). El cliente desconoce la estructura de almacenamiento físico interna del servidor; únicamente consume contratos de interfaz predecibles.

2. **Principio sin Estado (Stateless):**  
   Conforme a la especificación HTTP (RFC 9110), cada transacción entre cliente y servidor es atómica e independiente. El servidor no conserva información de contexto ("memoria de sesión") entre peticiones sucesivas. Cada solicitud a `/api/incidentes` o `/api/salud` contiene en sí misma toda la información requerida para ser resuelta. El estado de la aplicación en ejecución (por ejemplo, nuevos incidentes registrados durante el triaje) se gestiona de manera deliberada en la memoria del cliente (`SOC.Modelo.incidentes`), garantizando que el servidor permanezca ligero, escalable y libre de sobrecarga de estado.

---

### 3.2. Métodos, Códigos de Estado y Cabeceras Implementadas

La plataforma implementa un manejo riguroso de la semántica HTTP en [`server/app.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/server/app.js):

#### A. Métodos HTTP Soportados
- **`GET`:**  
  Método seguro e idempotente empleado para solicitar recursos sin generar efectos colaterales en el servidor. Utilizado en:
  - `GET /api/salud`: Consulta de telemetría y estado operativo del servicio.
  - `GET /api/incidentes`: Recuperación del listado estructurado de incidentes sanitarios.
  - `GET /`, `GET /index.html`, `GET /styles.css`, `GET /app.js`: Entrega de activos estáticos del front-end.
- **`OPTIONS` (Negociación Preflight CORS):**  
  Implementado para permitir que clientes alojados en distintos orígenes o puertos realicen peticiones preeliminares de verificación cruzada. El servidor responde con código `204 No Content` y las cabeceras `Access-Control-Allow-Methods: GET, OPTIONS` y `Access-Control-Max-Age: 86400`.
- **Otros métodos (`POST`, `PUT`, `DELETE`):**  
  Al ser un prototipo de solo lectura en servidor, cualquier método distinto a `GET` y `OPTIONS` es interceptado y rechazado con código `405 Method Not Allowed`, informando en la cabecera `Allow: GET` los métodos admitidos.

#### B. Códigos de Estado HTTP Utilizados
- **`200 OK`:** Indica que la solicitud fue exitosa. Acompaña tanto la entrega del JSON de incidentes como la de los activos HTML, CSS y JavaScript.
- **`204 No Content`:** Empleado en la negociación preliminar `OPTIONS` de CORS, señalando que la solicitud de sondeo fue aceptada sin necesidad de enviar cuerpo.
- **`400 Bad Request`:** Se emite cuando la URL de la petición está mal estructurada o no puede ser decodificada por el motor URI de Node.js.
- **`404 Not Found`:** Retornado cuando un cliente solicita una ruta o archivo inexistente o privado (ej. `/api/no-existe`, `/server.js`, `/.git/config`). Protege los archivos sensibles del sistema.
- **`405 Method Not Allowed`:** Emitido ante intentos de escritura no autorizados (ej. `POST /api/incidentes`).
- **`500 Internal Server Error`:** Emitido de forma controlada cuando ocurre una falla imprevista en el repositorio de datos o en la interpretación del JSON, protegiendo al usuario de la exposición de trazas internas del servidor.

#### C. Cabeceras HTTP Aplicadas en la Respuesta
```http
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
Cache-Control: no-store
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Length: 1105
```
- **`Content-Type: application/json; charset=utf-8`:** Establece sin ambigüedad el formato MIME del payload y la codificación internacional UTF-8, garantizando que tildes y caracteres especiales se interpreten correctamente.
- **`Access-Control-Allow-Origin: *`:** Habilita el acceso desde cualquier origen cliente, permitiendo ejecutar el front-end en puertos dinámicos de desarrollo (Live Server, Vite, localhost:5500) sin bloqueos de política de mismo origen.
- **`Cache-Control: no-store`:** Evita que intermediarios o el caché del navegador almacenen respuestas obsoletas de la telemetría médica.
- **`X-Content-Type-Options: nosniff`:** Directiva defensiva que prohíbe a los navegadores realizar *MIME type sniffing*, mitigando vectores de ataque donde un script malicioso intente disfrazarse de JSON.
- **`X-Frame-Options: DENY`:** Impide que la plataforma sea incrustada en elementos `<iframe>` de dominios externos, erradicando por completo ataques de Clickjacking.

---

## 4. Auditoría Técnica del Prototipo Node.js

### 4.1. Verificación de Código y Dependencias

La inspección forense del código confirmó el cumplimiento estricto de las directrices académicas:

1. **Ausencia Total de Dependencias Externas:**  
   En [`package.json`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/package.json), el objeto `dependencies` no existe. El proyecto opera con cero módulos externos en `node_modules`. Tanto la escucha TCP como la lectura de archivos y la resolución de rutas se realizan con APIs integradas en el entorno de ejecución de Node.js:
   - `const http = require('node:http');`
   - `const { readFile } = require('node:fs/promises');`
   - `const path = require('node:path');`

2. **Ruta de Verificación Operativa (`/api/salud`):**  
   Implementada exitosamente en [`server/app.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/server/app.js). Retorna un objeto JSON con el estado del servicio, el tiempo de actividad del proceso (`process.uptime()`) y la marca cronológica en formato ISO 8601.

3. **Endpoint de Catálogo de Incidentes (`/api/incidentes`):**  
   Implementado a través de [`server/incident-service.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/server/incident-service.js) y [`server/incident-repository.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/server/incident-repository.js). La lectura de `data/incidentes.json` se ejecuta de forma asíncrona no bloqueante mediante promesas (`readFile`), protegiendo el bucle de eventos (*Event Loop*) frente a congelamientos.

4. **Distribución de Archivos Estáticos:**  
   La tabla de mapeo `publicFiles` sirve transparentemente los activos cliente requeridos tanto en rutas canónicas como alternativas:
   - `GET /` o `GET /index.html` -> Sirve la página principal.
   - `GET /styles.css` o `GET /css/styles.css` -> Sirve la hoja de estilos con `Content-Type: text/css`.
   - `GET /app.js` o `GET /js/app.js` -> Sirve el script cliente con `Content-Type: text/javascript`.
   - Soporte adicional para la carpeta física `public/` (`/public/index.html`, `/public/styles.css`, `/public/app.js`).

---

### 4.2. Estructura Completa de Carpetas del Proyecto

```text
c:/Desarrollo de Plataformas/Tarea 3/
├── .antigravity/
│   ├── Agente_auditor.md           # Especificación formal del rol de auditor
│   └── Agente_constructor.md       # Especificación formal del rol de constructor
├── .gitignore                      # Exclusión de archivos transitorios y temporales
├── README.md                       # Documentación operativa y manual de ejecución
├── INFORME_TAREA3.md               # 📄 Informe técnico oficial de auditoría (este documento)
├── package.json                    # Definición de scripts (start, test) sin dependencias
├── server.js                       # Punto de entrada y socket de escucha del servidor HTTP
├── css/
│   └── styles.css                  # Hoja de estilos en CSS3 Puro (Mobile-First y Grid 2D)
├── data/
│   └── incidentes.json             # Almacén de datos JSON simulado de incidentes SOC
├── docs/
│   ├── fase-3-documento-tecnico.md # Bitácora técnica y diagramas de arquitectura
│   └── guia-archivos.md            # Guía detallada de responsabilidades por archivo
├── js/
│   ├── app.js                      # Punto de entrada del cliente y arranque MVC
│   ├── modelo.js                   # Capa de datos, Fetch y validaciones de negocio
│   ├── vista.js                    # Capa de presentación DOM, animaciones y ARIA
│   ├── controlador.js              # Orquestador de eventos y mediador MVC
│   ├── model.js                    # Módulo alias de compatibilidad
│   ├── view.js                     # Módulo alias de compatibilidad
│   ├── controller.js               # Módulo alias de compatibilidad
│   └── vendor/
│       └── jquery.min.js           # jQuery 3.7.1 local (herramienta de transición)
├── public/                         # Directorio raíz público de distribución estática
│   ├── index.html                  # Copia distribuible del marcado semántico
│   ├── styles.css                  # Estilo enrutado para consumo directo
│   ├── app.js                      # Script principal enrutado
│   ├── css/
│   │   └── styles.css              # Ruta estática canónica
│   └── js/
│       ├── app.js
│       ├── modelo.js
│       ├── vista.js
│       ├── controlador.js
│       └── vendor/jquery.min.js
├── server/
│   ├── app.js                      # Despachador de rutas HTTP, CORS y cabeceras
│   ├── incident-service.js         # Capa de lógica y validación del contrato JSON
│   └── incident-repository.js      # Capa de lectura física de datos en disco
└── tests/
    └── server.test.js              # Pruebas automatizadas nativas (node --test)
```

---

## 5. Auditoría de Seguridad y Accesibilidad Front-End (Hallazgos y Parches)

### 5.1. Hardening del Servidor HTTP

1. **Mitigación de Bloqueo del Event Loop:**  
   En servidores de alto tráfico o infraestructura crítica, el uso de métodos síncronos como `fs.readFileSync` suspende la ejecución de todo el hilo de Node.js, impidiendo atender solicitudes concurrentes. La solución implementa `node:fs/promises` con `await readFile(...)`, permitiendo que el bucle de eventos continúe despachando conexiones entrantes mientras el kernel del sistema operativo completa la operación de entrada/salida de disco.
2. **Defensa contra Envenenamiento de Tipos (MIME Sniffing) y Clickjacking:**  
   Se aplicaron de forma mandatoria las cabeceras `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`.
3. **Control de Rutas Privadas:**  
   El despachador valida las solicitudes contra una lista blanca en un `Map` inmutable (`publicFiles`), respondiendo con código 404 ante intentos de acceso a archivos privados del servidor (`server.js`, carpetas del sistema, configuraciones git o secuencias de escape de directorio `../`).

---

### 5.2. Sanitización del DOM y Prevención de XSS

En la capa cliente ([`js/vista.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/js/vista.js)), se auditó el mecanismo de inserción de datos.  
- **Vulnerabilidad Evitada:** El uso de `element.innerHTML = variable` es susceptible a ataques de Cross-Site Scripting (XSS) si los datos del JSON contienen fragmentos HTML maliciosos (ej. `<img src=x onerror=alert(1)>`).
- **Mitigación:** La vista construye los nodos programáticamente mediante `document.createElement()` e inyecta los datos exclusivamente mediante la propiedad nativa `textContent` o los métodos `.text()` de jQuery, forzando al motor de renderizado a tratar toda entrada como cadena de texto plano inofensiva.

---

### 5.3. Accesibilidad Operativa (WCAG 2.2 Nivel AA)

- **Regiones Vivas ARIA:** El contenedor `#incidentes-resumen` y los contenedores de mensaje `#carga-mensaje` y `#form-mensaje` disponen de `role="status"`, `aria-live="polite"` y `aria-atomic="true"`. Esto asegura que los lectores de pantalla vocalicen el recuento de incidentes y las confirmaciones sin interrumpir al usuario.
- **Gestión Dinámica de Errores:** Cada campo erróneo recibe dinámicamente `aria-invalid="true"` y se vincula a su mensaje de error mediante `aria-describedby`. En el evento `submit`, si se detectan anomalías, el foco visual y accesible se desplaza automáticamente al primer control inválido (`invalid[0].focus()`).

---

### 5.4. Bloques Antes vs. Después (Matriz de Parches)

#### Parche A: Ruta `/api/salud` y Cabeceras Defensivas
```javascript
// ============================================================================
// ANTES (Vulnerable / Incompleto: sin /api/salud, sin CORS y sin cabeceras defensivas)
// ============================================================================
function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` });
  res.end(JSON.stringify(body));
}
// Al consultar /api/salud devolvía 404

// ============================================================================
// DESPUÉS (Auditoría Aprobada: server/app.js)
// ============================================================================
function send(res, status, body, type = 'application/json', headers = {}) {
  const payload = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(status, {
    'Content-Type': `${type}; charset=utf-8`,
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    ...headers
  });
  res.end(payload);
}

// Ruta agregada
if (pathname === '/api/salud') {
  send(res, 200, {
    estado: 'activo',
    servicio: 'SOC Hospital Clínico San Rafael',
    uptimeSegundos: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
  return;
}
```

#### Parche B: Lectura Asíncrona de Archivos (Protección del Event Loop)
```javascript
// ============================================================================
// ANTES (Bloqueante: congela el hilo de Node.js durante lectura de disco)
// ============================================================================
const fs = require('fs');
function leerIncidentes() {
  const data = fs.readFileSync('data/incidentes.json', 'utf8'); // BLOQUEANTE
  return JSON.parse(data);
}

// ============================================================================
// DESPUÉS (Auditoría Aprobada: server/incident-repository.js)
// ============================================================================
const { readFile } = require('node:fs/promises');
const path = require('node:path');
async function loadIncidentRecords() {
  const file = path.join(__dirname, '..', 'data', 'incidentes.json');
  const content = await readFile(file, 'utf8'); // ASÍNCRONO NO BLOQUEANTE
  return JSON.parse(content);
}
```

#### Parche C: Región Viva Accesible en el Recuento de Incidentes
```html
<!-- ============================================================================
     ANTES (Inaccesible: los lectores de pantalla no anuncian cambios dinámicos)
     ============================================================================ -->
<p id="incidentes-resumen"></p>

<!-- ============================================================================
     DESPUÉS (Auditoría Aprobada: index.html Línea 74)
     ============================================================================ -->
<p id="incidentes-resumen" role="status" aria-live="polite" aria-atomic="true"></p>
```

---

## 6. Plan de Pruebas y Evidencias de Funcionamiento

A continuación, se documenta la guía metodológica de ejecución y los espacios formalizados para adjuntar las 5 capturas de pantalla requeridas como evidencia técnica:

### 6.1. Prueba 1: Inicialización del Servidor en Terminal
* **Objetivo:** Verificar el arranque del proceso Node.js sin fallos ni dependencias externas.
* **Comando ejecutado:**
  ```bash
  npm start
  ```
* **Salida esperada por consola:**
  ```text
  > soc-hospitalario@3.0.0 start
  > node server.js

  SOC Hospitalario: http://127.0.0.1:3000
  API Incidentes: http://127.0.0.1:3000/api/incidentes
  API Salud: http://127.0.0.1:3000/api/salud
  Detener: Ctrl+C
  ```
* **Espacio para Evidencia Gráfica 1:**
  > *(Pegar aquí la captura de pantalla de la terminal mostrando la ejecución exitosa de `npm start` y los puertos abiertos).*

---

### 6.2. Prueba 2: Inspección de Endpoint de Salud (`GET /api/salud`)
* **Objetivo:** Confirmar que la ruta de health check responde con código `200 OK` y cabecera JSON.
* **URL de consulta:** `http://127.0.0.1:3000/api/salud`
* **Respuesta JSON obtenida:**
  ```json
  {
    "estado": "activo",
    "servicio": "SOC Hospital Clínico San Rafael",
    "uptimeSegundos": 14,
    "timestamp": "2026-09-18T18:02:55.143Z"
  }
  ```
* **Verificación de Cabeceras en DevTools:**
  - `Status Code: 200 OK`
  - `Content-Type: application/json; charset=utf-8`
  - `Access-Control-Allow-Origin: *`
* **Espacio para Evidencia Gráfica 2:**
  > *(Pegar aquí la captura de pantalla del navegador o Postman/Thunder Client consumiendo `/api/salud` con el JSON formateado).*

---

### 6.3. Prueba 3: Inspección de Endpoint de Incidentes (`GET /api/incidentes`)
* **Objetivo:** Validar la serialización correcta del catálogo de incidentes sanitarios desde el servidor.
* **URL de consulta:** `http://127.0.0.1:3000/api/incidentes`
* **Estructura del Payload:**
  - Arreglo con 4 incidentes iniciales (`INC-2041`, `INC-2040`, `INC-2039`, `INC-2038`).
  - Cada elemento contiene `codigo`, `fecha`, `amenaza`, `servicio`, `severidad` y `estado`.
* **Espacio para Evidencia Gráfica 3:**
  > *(Pegar aquí la captura de pantalla mostrando la respuesta JSON completa de `/api/incidentes` con código 200 OK).*

---

### 6.4. Prueba 4: Manejo Controlado de Error 404 (Ruta Inexistente)
* **Objetivo:** Comprobar que el enrutador protege rutas no declaradas sin exponer errores fatales del servidor.
* **URL de consulta:** `http://127.0.0.1:3000/api/ruta-desconocida`
* **Respuesta del Servidor:**
  - `Status Code: 404 Not Found`
  - `Content-Type: application/json; charset=utf-8`
  - Cuerpo:
    ```json
    {
      "error": "Ruta no encontrada."
    }
    ```
* **Espacio para Evidencia Gráfica 4:**
  > *(Pegar aquí la captura de pantalla de la pestaña Network en DevTools evidenciando la respuesta 404 limpia ante una URL errónea).*

---

### 6.5. Prueba 5: Interfaz Web Integrada y Petición Fetch en DevTools Network
* **Objetivo:** Demostrar la integración cliente-servidor completa en el navegador.
* **Procedimiento:**
  1. Abrir `http://127.0.0.1:3000` en el navegador con las Herramientas de Desarrollador abiertas (`F12`).
  2. Seleccionar la pestaña **Network (Red)** y filtrar por `Fetch/XHR`.
  3. Recargar la página: se observa la solicitud `incidentes` completada con éxito (código `200 OK`).
  4. En la pantalla, se observa la tabla cargada con los 4 incidentes, los indicadores de telemetría y el anuncio accesible:
     > *"GET /api/incidentes: respuesta HTTP 200. 4 incidentes recibidos del servidor Node.js."*
* **Espacio para Evidencia Gráfica 5:**
  > *(Pegar aquí la captura de pantalla completa del navegador mostrando la interfaz del SOC Hospitalario a la izquierda y el panel DevTools Network a la derecha con la petición Fetch en 200 OK).*

---

### 6.6. Verificación Automatizada Adicional (`npm test`)
Como evidencia complementaria de fiabilidad del software, se ejecutó la batería de 8 pruebas unitarias e integración en [`tests/server.test.js`](file:///c:/Desarrollo%20de%20Plataformas/Tarea%203/tests/server.test.js):
```text
✔ GET /api/salud responde con 200 y estado activo (46.60ms)
✔ GET /api/incidentes devuelve el JSON y el modelo cliente lo consume (58.09ms)
✔ ambas páginas y sus recursos se entregan por HTTP (528.21ms)
✔ rutas desconocidas y archivos privados devuelven 404 (39.69ms)
✔ POST no se admite: devuelve 405 y Allow (9.85ms)
✔ fallos de datos devuelven 500 sin exponer detalles internos (3.01ms)
✔ lista vacía es una respuesta válida (2.50ms)
✔ servicio rechaza datos inválidos, duplicados y errores de lectura (1.60ms)

ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
```

