# INFORME TÉCNICO DE AUDITORÍA, OPTIMIZACIÓN Y ASEGURAMIENTO DE CALIDAD
## Unidad 7: Depuración, Pruebas Unitarias y de Integración, Análisis Estático, Rendimiento y Refactorización MVC

**Institución:** Pontificia Universidad Católica del Ecuador (PUCE)  
**Asignatura:** Desarrollo en Plataformas  
**Proyecto:** Plataforma de Gestión de Incidentes de Seguridad (CSIRT / SOC)  
**Versión de Entrega:** 1.1.0 (Auditoría y Corrección Integral)  
**Entorno de Ejecución:** Node.js (v20+ / v22+), Express 5, Jest 30, Supertest 7, ESLint 10 (Flat Config)

---

## 1. Introducción y Contexto del Proyecto

Mejorar una plataforma de software exige evidencia reproducible. Antes de modificar el código fuente resulta indispensable reproducir los defectos, establecer una línea base cuantitativa de rendimiento y registrar de forma sistemática el impacto de cada intervención.

En el marco de la Unidad 7, la **Plataforma de Gestión de Incidentes (CSIRT)** fue sometida a una auditoría técnica y proceso de aseguramiento de calidad estructurado en cinco dimensiones:
1. **Depuración con Chrome DevTools:** Reproducción y corrección de dos defectos de transporte y validación lógica.
2. **Pruebas Automatizadas (Jest + Supertest):** Cobertura unitaria de reglas de negocio con Jest (patrón AAA) y pruebas de integración sobre los endpoints HTTP con Supertest.
3. **Control de Calidad Estático (ESLint):** Estandarización de sintaxis moderna y tipado defensivo bajo Flat Config sin advertencias ni errores.
4. **Optimización de Rendimiento Verificable:** Reducción del tamaño de payload (proyección en modelo), activación de directivas de caché HTTP y redimensionado del recurso multimedia principal a formato WebP moderno.
5. **Refactorización Modular hacia MVC:** Desacoplamiento de la validación de parámetros mediante middlewares especializados, preservando la separación de responsabilidades y la integridad visual de la interfaz.

---

## 2. Diagnóstico y Corrección de Defectos (Chrome DevTools)

Mediante la inspección interactiva con **Chrome DevTools** (paneles *Sources*, *Network* y *Console*), se identificaron y subsanaron dos defectos operacionales:

### Defecto 1: Cierre de incidentes sin resolución técnica requerida
* **Síntoma:** El analista de seguridad podía transicionar un incidente al estado `CERRADO` enviando cadenas vacías o solo espacios en blanco en el campo de resolución, vulnerando el registro forense de contención.
* **Diagnóstico con DevTools:** Se ubicó un punto de interrupción condicional (*breakpoint*) en el manejador del evento `submit` del formulario en el frontend y se capturó la petición `PATCH /api/incidentes/:id/estado`. Se evidenció que el backend aceptaba el cambio sin evaluar el contenido del texto.
* **Causa Raíz:** La función de reglas de estado validaba la pertenencia al catálogo de estados, pero omitía la longitud útil del campo `resolucion`.
* **Solución Técnica:** Se blindó la función pura `puedeCambiarEstado` en `src/utils/estado.js`:
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
* **Evidencias Gráficas:** `1.11 break point resolución vacía.png`, `1.2. 400 cerrado y vacío.png`, `1.5. cerrado y vacío 400.png`, `1.6. cerrado con resolución 200.png`.

### Defecto 2: Búsqueda por ID inconsistente y falta de tipado estricto
* **Síntoma:** Peticiones HTTP como `GET /api/incidentes/abc` o `GET /api/incidentes/-1` producían respuestas ambiguas o errores no tipificados debido a comparaciones estrictas entre tipos incompatibles (`string === number`).
* **Diagnóstico con DevTools:** En la pestaña *Network*, la consulta fallida no emitía un código semántico representativo de un error del cliente (*Bad Request*).
* **Solución Técnica:** Se implementó saneamiento y conversión numérica defensiva con `parseInt(id, 10)`, validando `isNaN(id) || id <= 0` con respuesta inmediata `400 Bad Request` y `404 Not Found` en caso de no coincidencia en el almacén de datos.
* **Evidencias Gráficas:** `2.1 error HTTP obtener por ID.png`, `2.2 actualización obtenerporID.png`, `2.3 .defecto 2 por ID.png`.

---

## 3. Pruebas Automatizadas: Reglas Unitarias y Pruebas de Integración

Para garantizar que el software permanezca determinista y protegido contra regresiones, se implementó una estrategia de testing en dos niveles:

### 3.1 Suite Unitaria: Reglas de Negocio Puras (`tests/estado.test.js`)
Evalúa el comportamiento de `puedeCambiarEstado` sin levantar el servidor Express ni depender de red:

| Caso de Prueba | Escenario Evaluado | Resultado Esperado | Estado |
|---|---|---|:---:|
| **Caso 1** | Cierre con resolución vacía o con espacios en blanco (Defecto 1) | `valido: false` y mensaje explicativo | ✅ Aprobado |
| **Caso 2** | Cierre con resolución técnica válida (≥ 5 caracteres) | `valido: true` ("Transición permitida") | ✅ Aprobado |
| **Caso 3** | Intento de reactivación directa de un incidente en estado `CERRADO` | `valido: false` ("no puede reactivarse") | ✅ Aprobado |
| **Caso 4** | Transición hacia un estado inexistente o tipográficamente erróneo | `valido: false` ("Estado de destino no válido") | ✅ Aprobado |
| **Caso 5** | Transición operativa permitida (`ABIERTO` → `EN_PROCESO`) | `valido: true` | ✅ Aprobado |

* **Cobertura de Código en `estado.js`:** 100% de sentencias, 100% de ramas, 100% de funciones y 100% de líneas.

### 3.2 Suite de Integración HTTP con Supertest (`tests/incidente.controller.test.js`)
Respondiendo a la recomendación de la evaluación técnica, se añadieron 8 pruebas automatizadas de integración sobre el servidor Express utilizando la librería `supertest`:
* **Validación de códigos 400 y 404 (Defecto 2):**
  - `GET /api/incidentes/abc` → Valida respuesta `400 Bad Request` con mensaje de parámetro inválido.
  - `GET /api/incidentes/-5` → Valida respuesta `400 Bad Request`.
  - `GET /api/incidentes/9999` → Valida respuesta `404 Not Found` ante recurso inexistente.
  - `GET /api/incidentes/1` → Valida respuesta `200 OK` con la entidad solicitada.
* **Validación de Contrato y Rendimiento (Defecto 1 y Optimización):**
  - `GET /api/incidentes` → Valida código `200 OK`, presencia obligatoria de la cabecera `Cache-Control: public, max-age=60`, inclusión del campo `resolucion` y omisión de metadatos pesados (`createdAt`).
  - `PATCH /api/incidentes/1/estado` con resolución vacía → Valida rechazo automático con `400 Bad Request`.
  - `PATCH /api/incidentes/3/estado` con transición válida → Valida actualización exitosa con `200 OK`.

---

## 4. Análisis Estático de Código (ESLint)

Se configuró ESLint empleando la especificación moderna **Flat Config (`eslint.config.js`)** con reglas estrictas de la industria:
- `eqeqeq: "error"`: Previene coerción implícita de tipos forzando `===` y `!==`.
- `no-var: "error"`: Obliga el uso exclusivo de variables con alcance de bloque (`let` y `const`).
- `prefer-const: "warn"`: Exige declarar como inmutables aquellas variables que nunca son reasignadas.
- `no-unused-vars: ["error", { argsIgnorePattern: "^_" }]`: Elimina variables huérfanas en el código fuente.

**Resultado de la Ejecución:**
Tras refactorizar variables reasignables en `src/models/incidente.model.js` y depurar argumentos en controladores, el comando `npm run lint` finaliza con **0 errores y 0 advertencias**.

---

## 5. Auditoría de Rendimiento: Mediciones Reales Antes y Después

A diferencia de entregas preliminares donde existían discrepancias entre las afirmaciones documentales y el código empaquetado, en esta versión el código fuente ejecuta exactamente las medidas optimizadas:

```
                            VOLUMEN DE TRANSFERENCIA (BYTES)
  Antes: 344.2 KB  ████████████████████████████████████████████████████
  Después: 22.8 KB ███ (Reducción total: 93.4%)
```

### Tabla Comparativa de Mediciones Verificables

| Componente Medido | Antes (Línea Base) | Después (Optimizado) | Técnica de Optimización Aplicada | Verificación en Código |
|---|---|---|---|---|
| **Recurso Multimedia Principal** | 351,969 bytes (~343.7 KB) | 22,418 bytes (**21.9 KB**) | Conversión a formato moderno WebP y redimensionado de 2536×1344 px a tamaño de presentación (610×323 px). | `src/public/assets/diagrama-red.png.webp` |
| **Payload de Consulta (`GET /api/incidentes`)** | 498 bytes (todos los campos con `obtenerTodos`) | **381 bytes** (`obtenerResumen` proyectado con `resolucion`) | Proyección modular en el modelo omitiendo campos no requeridos por la vista (`createdAt`). | `src/models/incidente.model.js` y `src/controllers/incidente.controller.js` |
| **Política de Caché de Red** | Sin cabecera (recarga completa en cada petición) | **`Cache-Control: public, max-age=60`** | Directiva HTTP para almacenamiento local en el cliente y validación de 304 Not Modified. | `src/controllers/incidente.controller.js` (Línea 7) |
| **Volumen Total Transferido en Carga** | ~352,467 bytes | **~22,799 bytes** | **Reducción neta superior al 93%** en transferencia de red. | Comprobable en DevTools Network |

### Corrección de la Regresión Latente de la Vista
Al habilitar `obtenerResumen()`, el modelo preliminar descartaba el atributo `resolucion`. Puesto que el script del frontend (`src/public/js/app.js`, línea 13) renderiza `<p><em>Resolución:</em> ${item.resolucion || "Pendiente de resolución"}</p>`, la proyección fue corregida para incluir este atributo. De esta forma se reduce el payload de 498 B a 381 B sin provocar pérdidas visuales en el tablero de monitoreo.

---

## 6. Refactorización Modular hacia MVC y Capa de Middlewares

Para superar la observación sobre la ausencia de una refactorización novedosa hacia MVC, se aplicó un desacoplamiento arquitectónico en la capa de transporte:

```text
src/
├── server.js                      # Inicialización y configuración de middlewares globales
├── routes/
│   └── incidente.routes.js        # Enrutador REST declarativo con inyección de middleware
├── middlewares/
│   └── validar-id.middleware.js   # [NUEVO] Capa de validación defensiva y sanitización de parámetros
├── controllers/
│   └── incidente.controller.js    # Orquestación pura: recibe datos validados y responde HTTP semántico
├── models/
│   └── incidente.model.js         # Abstracción de acceso a datos y proyecciones especializadas
├── utils/
│   └── estado.js                  # Lógica pura de dominio y reglas de transición
└── public/                        # Capa de Presentación (Frontend cliente)
```

### Justificación de la Refactorización:
* **Problema previo:** La validación numérica del parámetro `:id` se repetía de forma imperativa dentro de cada método del controlador (`obtenerPorId` y `actualizarEstado`), mezclando responsabilidades de sanitización HTTP con la lógica de orquestación.
* **Solución aplicada:** Se creó el middleware reutilizable `src/middlewares/validar-id.middleware.js`, que intercepta las peticiones con identificador, valida su integridad (`isNaN` y rango positivo), inyecta `req.incidenteId` y detiene tempranamente peticiones maliciosas o deformadas.
* **Beneficio:** Principio de Responsabilidad Única (SRP), código del controlador más conciso y cobertura unitaria independiente para la capa de intercepción.

---

## 7. Verificación de Hallazgos y Cierre de Brechas de la Auditoría

En cumplimiento estricto de las observaciones del comité evaluador:
1. **Sincronización Código-Documentación:** Se eliminaron las discrepancias. El código entregado tiene `obtenerResumen()` conectado, la cabecera `Cache-Control` descomentada y operativa, y el archivo WebP de 21.9 KB generado físicamente.
2. **Pruebas Automatizadas de Controlador:** Se incorporó `supertest` cubriendo exhaustivamente los códigos 400 y 404 del Defecto 2 y las transiciones del Defecto 1.
3. **Presencia de Entregables:** Este documento (`INFORME_TECNICO.md`) se encuentra versionado en la raíz del repositorio, coincidiendo en cada cifra y comportamiento con el `README.md`.

---

## 8. Conclusiones

La intervención integral sobre la Plataforma de Incidentes demuestra que el aseguramiento de calidad de software no reside únicamente en la redacción de informes teóricos, sino en la **consistencia rigurosa y reproducible entre el código fuente, las pruebas automatizadas y las métricas documentadas**. La arquitectura desacoplada en MVC con middlewares, el 100% de cobertura en reglas críticas, y la reducción verificable del 93.4% en volumen transferido dotan a la plataforma de alta confiabilidad y rendimiento.

