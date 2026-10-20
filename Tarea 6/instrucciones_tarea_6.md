# Tarea 6: Seguridad, Autenticación, Autorización e Integración Cliente-Servidor

Vamos a resolver la Tarea 6 basándonos en el documento de referencia "Desarrollo de Plataformas ".

## Objetivo Principal
Fortalecer la plataforma de incidentes existente implementando seguridad (JWT, roles, bcrypt, CORS, HTTPS), validación y limpieza de datos, e integrando el cliente web (HTML/JS) con la API (Node/Express). Además, debes generar el código, preparar la evidencia de las pruebas y redactar el informe final.

---

## FASE 1: Configuración e Instalación del Backend

1. **Instalación de dependencias requeridas:**
   Asegúrate de que el `package.json` incluya e instale las siguientes librerías:
   `npm install jsonwebtoken bcryptjs cors helmet express-rate-limit sanitize-html zod dotenv`

2. **Estructura del Proyecto Backend:**
   Crea/actualiza la siguiente estructura de carpetas y archivos en el backend:
   - `src/config/env.js` (Validación y exportación de variables de entorno: JWT_SECRET, CLIENT_ORIGIN, PORT).
   - `src/utils/token.js` (Funciones `crearToken` y `verificarToken` usando `jsonwebtoken`).
   - `src/controllers/auth.controller.js` (Mock de usuarios de demo con contraseñas encriptadas con `bcryptjs`, y función de `login`).
   - `src/schemas/auth.schema.js` (Validación de entradas con `zod`).
   - `src/middlewares/auth.middleware.js` (Funciones `autenticar` verificando JWT y `permitir` verificando roles).
   - `src/middlewares/error.middleware.js` (Manejo centralizado de errores).
   - `src/app.js` (Configuración de Express, CORS, Helmet, rate-limit, limpieza con `sanitize-html` en el body, y ruteo).
   - `src/server.js` (Punto de entrada).

3. **Lógica de Roles y Rutas de Incidentes (`src/routes/incidente.routes.js`):**
   Protege las rutas aplicando los middlewares:
   - `GET /` -> Solo autenticación (`autenticar`).
   - `POST /` -> Roles: "ANALISTA", "ADMIN" (`permitir("ANALISTA", "ADMIN")`).
   - `PUT /:id` -> Roles: "SUPERVISOR", "ADMIN".
   - `DELETE /:id` -> Roles: "ADMIN".

---

## FASE 2: Integración del Cliente (Frontend)

Crea la interfaz estática para consumir la API de manera segura utilizando Fetch.

1. **Estructura del Cliente:**
   - `index.html` (UI principal con formulario de login, tabla de incidentes y controles CRUD).
   - `js/api.js` (Servicio base con `fetch` que intercepte y adjunte el token JWT en la cabecera `Authorization: Bearer <token>`).
   - `js/auth.js` (Función para hacer POST a `/auth/login` y guardar el token/rol en `sessionStorage`).
   - `js/incidentes.js` (Funciones para listar, crear, actualizar y eliminar incidentes usando `api.js`).
   - `js/main.js` (Controlador del DOM, eventos de botones, y renderizado seguro usando `textContent` para evitar XSS).

---

## FASE 3: Pruebas y Evidencias (Casos de Uso)

Genera un documento (puede ser Markdown que luego convertiré a PDF) con el registro paso a paso de al menos 8 casos de prueba, detallando Entrada, Resultado Esperado y Resultado Obtenido:
1. **Acceso sin token:** Intentar hacer GET a `/api/incidentes` sin iniciar sesión. (Debe dar 401).
2. **Permisos insuficientes:** Intentar hacer DELETE a un incidente con el rol "ANALISTA". (Debe dar 403).
3. **Datos inválidos (Login):** Enviar un correo mal formateado o contraseña corta al endpoint de login. (Debe dar 400 por Zod).
4. **Datos inválidos (Creación):** Intentar crear un incidente con campos faltantes o tipos incorrectos.
5. **Limpieza de entradas:** Enviar un incidente con etiquetas HTML `<script>` en el título. Verificar que `sanitize-html` las elimine antes de guardar.
6. **Flujo CRUD Exitoso - Login:** Iniciar sesión correctamente con credenciales válidas y recibir el token.
7. **Flujo CRUD Exitoso - Crear y Consultar:** Crear un incidente como ANALISTA y ver reflejada la fila en la tabla.
8. **Flujo CRUD Exitoso - Actualizar:** Actualizar el estado de un incidente con el rol SUPERVISOR (200 OK).

---

## FASE 4: Generación del Informe Final

Escribe un informe técnico de **800 a 1000 palabras** estructurado de la siguiente manera:
1. **Introducción:** Resumen de las mejoras de seguridad aplicadas a la plataforma de incidentes.
2. **Fallos Encontrados (Riesgos Iniciales):** Basado en OWASP Top 10 (Falta de autenticación, exposición de datos, falta de validación, CORS permisivo).
3. **Mejoras Realizadas:**
   - Explicación de la implementación de JWT, roles, y Bcrypt.
   - Configuración de políticas de seguridad (CORS restringido, cabeceras seguras con Helmet, documentación de por qué se usaría HTTPS en producción).
   - Validaciones (Zod) y Sanitización (sanitize-html) como defensa en profundidad.
4. **Conclusión:** Cómo la arquitectura cliente-servidor actual garantiza contratos seguros y protege la integridad de los datos.

Por favor, entrégame el código fuente completo en sus respectivos bloques de código organizados para poder exportarlos, así como el informe requerido.