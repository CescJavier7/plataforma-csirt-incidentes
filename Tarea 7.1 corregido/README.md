# Plataforma de Gestión de Incidentes (CSIRT) · Tarea 7
## Unidad 7: Depuración, Pruebas Unitarias y de Integración, Calidad con ESLint, Rendimiento, Refactorización MVC y Documentación Técnica

**Asignatura:** Desarrollo en Plataformas  
**Institución:** Pontificia Universidad Católica del Ecuador (PUCE)  
**Versión:** 1.1.0 (Auditoría Técnica, Corrección y Optimización Integral)  
**Entorno de Ejecución:** Node.js (v20+ / v22+), Express 5, Jest 30, Supertest 7, ESLint 10 (Flat Config)

## Configuración de acceso

Antes de iniciar el servidor, configure variables únicas `INCIDENTE_ANALISTA_USERNAME/PASSWORD`, `INCIDENTE_SUPERVISOR_USERNAME/PASSWORD` e `INCIDENTE_ADMIN_USERNAME/PASSWORD` en el almacén seguro del entorno; cada contraseña debe tener al menos 12 caracteres. No existen credenciales predeterminadas. Analistas pueden consultar; supervisores y administradores también pueden actualizar estados. La API limita las consultas a 100 solicitudes por IP cada 15 minutos, intentos fallidos de autenticación a 10 en ese período y cambios a 5. Las credenciales no se guardan en `localStorage` ni `sessionStorage`; se mantienen en los campos de la página mientras esté abierta. El servidor escucha en `127.0.0.1` por defecto; permita acceso remoto solo detrás de un terminador TLS confiable. Si hay proxy, defina `TRUST_PROXY_HOPS` con el número exacto de saltos confiables y bloquee el acceso directo al backend. Los límites usan memoria local de una instancia; despliegues con réplicas requieren un almacén compartido como Redis.

---

## 1. Descripción del Proyecto

La plataforma es una solución web para Centros de Respuesta a Incidentes de Seguridad Informática (CSIRT / SOC) diseñada para el registro, consulta, contención y cierre formal de eventos de ciberseguridad (ataques de fuerza bruta SSH, malware ransomware en endpoints, campañas de phishing, etc.).

En el marco de la **Unidad 7**, el proyecto fue sometido a un proceso integral de aseguramiento de calidad del software:
1. **Depuración sistemática con Chrome DevTools** para la identificación y resolución de defectos lógicos y de transporte HTTP.
2. **Pruebas unitarias automatizadas con Jest** para validar de forma determinista las reglas de negocio de transición de estados.
3. **Pruebas de integración HTTP con Supertest** para verificar códigos de estado semánticos (200, 400, 404), cabeceras de red y contratos JSON del controlador.
4. **Análisis estático y formateo con ESLint** bajo la especificación Flat Config para estandarización de buenas prácticas.
5. **Auditoría y optimización de rendimiento real** sobre consultas a datos (proyección de payload ligero), renderizado seguro del contenido y optimización del recurso multimedia principal (conversión WebP y redimensionado a 21.9 KB con Lazy Loading).
6. **Refactorización modular bajo el patrón Modelo-Vista-Controlador (MVC)**, incorporando una capa de middlewares para sanitización y validación defensiva de parámetros.

---

## 2. Arquitectura del Proyecto (Patrón MVC + Middlewares)

El sistema implementa una arquitectura desacoplada en capas funcionales con separación estricta de responsabilidades:

```text
Tarea 7/
├── eslint.config.js                   # Configuración Flat Config de ESLint (ECMAScript 2022)
├── INFORME_TECNICO.md                 # Informe técnico completo de auditoría y rendimiento
├── package.json                       # Metadatos del proyecto, scripts y dependencias
├── README.md                          # Documentación técnica y guía de ejecución
├── Capturas evidencia/                # Evidencias gráficas (DevTools, Jest, ESLint y Rendimiento)
├── tests/
│   ├── estado.test.js                 # Suite Jest (5 pruebas): reglas puras de transición de estado
│   └── incidente.controller.test.js   # Suite Supertest (8 pruebas): integración HTTP y respuestas del controlador
└── src/
    ├── server.js                      # Punto de entrada Express y configuración del middleware estático
    ├── routes/
    │   └── incidente.routes.js        # Enrutador REST declarativo (/api/incidentes)
    ├── middlewares/
    │   └── validar-id.middleware.js   # [Refactor MVC] Sanitización y validación de IDs numéricos positivos
    ├── controllers/
    │   └── incidente.controller.js    # Controlador HTTP: orquestación, proyección de datos y códigos de estado
    ├── models/
    │   └── incidente.model.js         # Modelo de datos: acceso, mutación y proyecciones especializadas
    ├── utils/
    │   └── estado.js                  # Reglas de negocio puras (transiciones de estado de incidentes)
    └── public/                        # Capa de Presentación (Vista Frontend)
        ├── index.html                 # Marcado semántico, accesibilidad y componentes de vista
        ├── css/
        │   └── styles.css             # Estilos responsivos, tarjetas y estados
        ├── js/
        │   └── app.js                 # Controlador del cliente: consumo Fetch API y renderizado del DOM
        └── assets/
            ├── diagrama-red.png.png   # Imagen original sin optimizar (352 KB / 2536x1344 px)
            └── diagrama-red.png.webp  # Imagen optimizada en formato WebP redimensionada (21.9 KB / 610x323 px)
```

### Responsabilidades por Módulo:
* **Modelo (`src/models/incidente.model.js`):** Gestiona el almacén de datos en memoria. Expone métodos para consulta global (`obtenerTodos`), búsqueda puntual (`obtenerPorId`), actualización (`actualizar`) y proyección optimizada para el tablero (`obtenerResumen`), la cual preserva el campo `resolucion` requerido por la vista descartando metadatos pesados (`createdAt`).
* **Middleware (`src/middlewares/validar-id.middleware.js`):** Intercepta peticiones con identificador, verifica que sea un entero estrictamente positivo y responde de inmediato con `400 Bad Request` si la entrada es inválida, inyectando `req.incidenteId`.
* **Controlador (`src/controllers/incidente.controller.js`):** Orquesta el flujo de negocio, evita almacenar en caché datos de incidentes (`Cache-Control: private, no-store`) y responde con códigos semánticos REST (200, 400, 404).
* **Reglas de Negocio (`src/utils/estado.js`):** Función pura `puedeCambiarEstado` totalmente desacoplada de Express y persistencia para su evaluación unitaria determinista.
* **Vista (`src/public/`):** Interfaz web HTML5 semántica y responsiva que muestra el inventario de incidentes, formulario interactivo de transición y diagrama de red optimizado con `loading="lazy"` y dimensiones explícitas `width="610" height="323"`.

---

## 3. Defectos Identificados y Corregidos con DevTools

Mediante las herramientas de desarrollo del navegador (**Chrome DevTools: paneles Network, Sources y Console**), se diagnosticaron y subsanaron dos defectos críticos:

### Defecto 1: Cierre de incidentes sin resolución técnica requerida
* **Síntoma:** El analista podía enviar el formulario para cambiar el estado a `CERRADO` dejando el campo de resolución vacío o con espacios en blanco, vulnerando la trazabilidad del incidente.
* **Diagnóstico con DevTools:** Se establecieron puntos de interrupción (*breakpoints*) condicionales en el envío del formulario y se inspeccionó el payload PATCH en el panel *Network*. Se evidenció que el backend aceptaba el cambio sin verificar contenido técnico.
* **Solución aplicada:** Se reforzó la función `puedeCambiarEstado` en `src/utils/estado.js`:
  ```javascript
  if (nuevoEstado === "CERRADO") {
    if (!resolucion || resolucion.trim().length < 5) {
      return {
        valido: false,
        razon: "Para cerrar un incidente es obligatorio ingresar una resolución de al menos 5 caracteres"
      };
    }
  }
  ```
* **Evidencias:** `1.11 break point resolución vacía.png`, `1.2. 400 cerrado y vacío.png`, `1.5. cerrado y vacío 400.png`, `1.6. cerrado con resolución 200.png`.

### Defecto 2: Búsqueda por ID inconsistente y falta de tipado estricto
* **Síntoma:** Consultas a `/api/incidentes/:id` con valores no numéricos (`/api/incidentes/abc`) o IDs negativos producían respuestas anómalas o fallos de comparación estricta (`string === number`) contra el modelo.
* **Diagnóstico con DevTools:** El panel *Console* y *Network* registraban peticiones fallidas sin un código de error semántico del cliente (*Bad Request*).
* **Solución aplicada:** Se implementó saneamiento defensivo desacoplado en `src/middlewares/validar-id.middleware.js`:
  ```javascript
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: "Parámetro inválido",
      detalle: "El identificador del incidente debe ser un número entero positivo"
    });
  }
  ```
* **Evidencias:** `2.1 error HTTP obtener por ID.png`, `2.2 actualización obtenerporID.png`, `2.3 .defecto 2 por ID.png`.

---

## 4. Pruebas Automatizadas (Jest + Supertest)

La aplicación cuenta con **13 pruebas automatizadas pasando exitosamente (100%)** con patrón AAA (*Arrange-Act-Assert*):

### 4.1 Suite Unitaria (`tests/estado.test.js`) — Reglas de Negocio
| Caso de Prueba | Escenario Evaluado | Resultado Esperado | Estado |
|---|---|---|:---:|
| **Caso 1** | Cierre con resolución vacía o espacios en blanco (Defecto 1) | `valido: false` y mensaje explicativo | ✅ Aprobado |
| **Caso 2** | Cierre con justificación técnica válida (≥ 5 caracteres) | `valido: true` ("Transición permitida") | ✅ Aprobado |
| **Caso 3** | Intento de reactivación directa de un incidente `CERRADO` | `valido: false` ("no puede reactivarse") | ✅ Aprobado |
| **Caso 4** | Transición hacia un estado desconocido o inexistente | `valido: false` ("Estado de destino no válido") | ✅ Aprobado |
| **Caso 5** | Transición normal entre estados operativos (`ABIERTO` → `EN_PROCESO`) | `valido: true` | ✅ Aprobado |

* **Cobertura en `src/utils/estado.js`:** 100% en todas las métricas (sentencias, ramas, funciones, líneas).

### 4.2 Suite de Integración (`tests/incidente.controller.test.js`) — Controlador HTTP y API
| Caso de Prueba | Método / Endpoint | Escenario Evaluado | Código HTTP | Estado |
|---|---|---|:---:|:---:|
| **Caso 6** | `GET /api/incidentes` | Verificación de cabecera `Cache-Control: private, no-store` | 200 OK | ✅ Aprobado |
| **Caso 7** | `GET /api/incidentes` | Proyección optimizada (incluye `resolucion`, descarta `createdAt`) | 200 OK | ✅ Aprobado |
| **Caso 8** | `GET /api/incidentes/abc` | ID no numérico (Defecto 2) con mensaje de error | 400 Bad Request | ✅ Aprobado |
| **Caso 9** | `GET /api/incidentes/-5` | ID menor o igual a cero | 400 Bad Request | ✅ Aprobado |
| **Caso 10** | `GET /api/incidentes/9999` | Consulta de incidente inexistente | 404 Not Found | ✅ Aprobado |
| **Caso 11** | `GET /api/incidentes/1` | Consulta de incidente válido y existente | 200 OK | ✅ Aprobado |
| **Caso 12** | `PATCH /api/incidentes/1/estado` | Cierre con resolución vacía rechazada por el servidor (Defecto 1) | 400 Bad Request | ✅ Aprobado |
| **Caso 13** | `PATCH /api/incidentes/3/estado` | Transición permitida hacia `EN_PROCESO` | 200 OK | ✅ Aprobado |

* **Cobertura Global del Proyecto:** >93% de líneas ejecutadas en todo el código base.

---

## 5. Control de Calidad y Estándares de Código (ESLint)

Configurado bajo **Flat Config (`eslint.config.js`)** con `@eslint/js`:
* `eqeqeq: "error"`: Comparaciones estrictas (`===` y `!==`).
* `no-var: "error"`: Prohibición de `var`.
* `prefer-const: "warn"`: Inmutabilidad de referencias.
* `no-unused-vars: ["error", { argsIgnorePattern: "^_" }]`: Cero variables huérfanas.

**Resultado de la Ejecución:**  
Ejecución limpia con **0 errores y 0 advertencias** (`npm run lint`).

---

## 6. Rendimiento y Mejoras Verificables (Medición Real)

Todas las optimizaciones descritas están **físicamente implementadas y activas en el código**:

```
                       TRANSFERENCIA EN RED (BYTE COMPARISON)
  Línea Base (Antes): 352.4 KB  ████████████████████████████████████████████████████
  Optimizado (Después): 22.8 KB ███ (Reducción total: 93.4%)
```

1. **Optimización de Imagen (Formato WebP + Redimensionado Real):**
   * *Antes:* `diagrama-red.png.png` (PNG original de 2536×1344 px) con un peso de **351,969 bytes (343.7 KB)**.
   * *Después:* `diagrama-red.png.webp` redimensionada a escala de despliegue (610×323 px) con compresión WebP, pesando exactamente **22,418 bytes (21.9 KB)** (**reducción del 93.7% en el recurso multimedia**).
   * *Renderizado:* Atributos explícitos `width="610" height="323"` para erradicar el *Cumulative Layout Shift (CLS)* y atributo `loading="lazy"`.

2. **Optimización de Payload de Consulta (`GET /api/incidentes`):**
   * *Antes:* La respuesta con `obtenerTodos()` transfería 498 bytes.
   * *Después:* Proyección con `obtenerResumen()` en `src/models/incidente.model.js` y conectada en `src/controllers/incidente.controller.js`. Transfiere exactamente **381 bytes** (**reducción del 23.5% en la consulta**), manteniendo `resolucion` para la vista y eliminando metadatos pesados (`createdAt`).

3. **Estrategia de Almacenamiento en Caché:**
   * Cabecera `Cache-Control: private, no-store` en la API para impedir el almacenamiento compartido de datos de incidentes.

---

## 7. Instrucciones de Instalación y Ejecución

### 7.1 Requisitos Previos
* Node.js v20.x o superior instalado.
* Gestor de paquetes `npm`.

### 7.2 Instalación de Dependencias
```bash
npm install
```

### 7.3 Ejecución de Pruebas Automatizadas (Jest + Supertest)
```bash
# Ejecutar suite completa (13 pruebas unitarias y de integración)
npm test

# Generar reporte de cobertura de código
npm run test:coverage
```

### 7.4 Análisis de Calidad de Código (ESLint)
```bash
# Inspeccionar código en busca de problemas de sintaxis y estándares
npm run lint

# Aplicar correcciones automáticas
npm run lint:fix
```

### 7.5 Iniciar el Servidor de la Aplicación
```bash
npm start
```
* Acceso al tablero web: [http://localhost:3000](http://localhost:3000)
* Endpoint REST de incidentes: [http://localhost:3000/api/incidentes](http://localhost:3000/api/incidentes)
