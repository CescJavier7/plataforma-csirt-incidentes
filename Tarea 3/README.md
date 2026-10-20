# SOC Hospitalario — Prototipo MVC con JavaScript Moderno y jQuery

## Unidad 2 (Reto 1 / RDA 1): JavaScript Moderno, DOM, Fetch API, ARIA, jQuery, MVC y Modelo Local

Plataforma de triaje y monitoreo de incidentes de ciberseguridad para el **Hospital Clínico San Rafael**. Implementa arquitectura Modelo-Vista-Controlador (MVC) desacoplada en el cliente, consumo asíncrono mediante Fetch API, accesibilidad web WCAG 2.2 AA (regiones vivas ARIA y gestión del foco) y jQuery como herramienta curricular de transición para manipulación y transiciones visuales.

---

## Modos de Ejecución

El proyecto es 100% compatible tanto con servidores web estáticos de desarrollo frontal como con el servidor Node.js local:

### Opción 1: Live Server / Servidor Estático (Recomendado para Unidad 2)
1. Abra la carpeta en VS Code.
2. Haga clic derecho en `index.html` y seleccione **Open with Live Server** (o ejecute cualquier servidor HTTP como `npx serve .` o `python -m http.server 3000`).
3. La aplicación consumirá directamente `data/incidentes.json`.

### Opción 2: Servidor Node.js Local
1. Ejecute `npm start` (o `node server.js`).
2. Abra `http://127.0.0.1:3000` en su navegador.
3. Para ejecutar las pruebas automatizadas: `npm test`.

---

## Arquitectura y Separación MVC

El código JavaScript cliente se encuentra estrictamente desacoplado en la carpeta `js/`:

- **`js/modelo.js` (Modelo):**
  - Gestiona exclusivamente el estado de los datos en memoria (`this.incidentes = []`).
  - Implementa `cargar()` con Fetch API, sintaxis `async/await`, verificación de respuesta HTTP (`response.ok`) y validación de integridad JSON.
  - Expone métodos de consulta y agregación: `obtenerTodos()`, `filtrarPorSeveridad()` y `obtenerEstadisticas()`.
  - Contiene las reglas de validación de negocio desacopladas del DOM.
  - Persistencia simulada en memoria con `agregar()`.

- **`js/vista.js` (Vista):**
  - Manipula exclusivamente el DOM sin lógica de negocio.
  - Utiliza jQuery para animaciones y transiciones suaves (`slideDown(200)`, `slideUp(200)`, `fadeIn(400)`).
  - Gestiona la accesibilidad: actualización de atributos `aria-invalid`, `aria-describedby` y `aria-busy`.
  - Renderiza de forma segura (sin riesgo de inyección HTML) las filas de incidentes y el recuento accesible.

- **`js/controlador.js` (Controlador):**
  - Orquesta los eventos del usuario (`submit`, `reset`, `blur`, `input`, `change`, `click`).
  - Intercepta el envío nativo del formulario con `e.preventDefault()`.
  - Ejecuta la validación dinámica en tiempo real y al enviar, enfocando el primer campo erróneo.
  - Coordina la sincronización entre el Modelo y la Vista.

- **`js/app.js` (Punto de Entrada / Bootstrapper):**
  - Script de arranque que se ejecuta tras la carga del DOM (`$(document).ready(...)`).
  - Instancia las clases desacopladas del Modelo, la Vista y el Controlador, e inicia el flujo.

- **`js/vendor/jquery.min.js`:**
  - Copia local de jQuery 3.7.1 para garantizar funcionamiento autónomo e independiente de conexión a internet.

---

## Validaciones Dinámicas y Accesibilidad

1. **Validación de Formulario:**
   - **Campos obligatorios:** Tipo de incidente (`categoria-amenaza`), severidad (`nivel-severidad`), servicio, analista y certificación de custodia.
   - **Código de incidente:** Formato estricto `INC-XXXX` y rechazo de códigos duplicados.
   - **Fecha y hora:** Verificación de fecha válida y no futura.
   - **Descripción técnica:** **Mínimo 30 caracteres obligatorios** (validados en HTML5 con `minlength="30"` y en JavaScript en tiempo real).
   - **Evidencia forense:** Validación de extensiones permitidas (`.log`, `.pcap`, `.json`, `.txt`, `.csv`, `.hl7`, `.dcm`) y tamaño máximo de 15 MB.
2. **Accesibilidad Web (ARIA y WCAG 2.2 AA):**
   - **Regiones vivas:** Contenedores con `role="status"` y `aria-live="polite"` para mensajes de carga (`#carga-mensaje`), formulario (`#form-mensaje`) y recuento dinámico de incidentes (`#incidentes-resumen`).
   - **Alertas de error:** `#carga-error` y `#form-error` configurados con `role="alert"` y `aria-atomic="true"`.
   - **Asociación semántica:** Vinculación estricta `<label for="...">` con `<input id="...">` y ayudas/errores asociados dinámicamente mediante `aria-describedby`.
   - **Navegación y foco:** Foco visible universal con `:focus-visible` y reubicación automática del foco al primer campo inválido al intentar enviar.
