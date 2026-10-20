# Informe Técnico – Tarea 6
## Seguridad, Autenticación, Autorización e Integración Cliente-Servidor en la Plataforma de Incidentes

**Asignatura:** Desarrollo de Plataformas

---

## 1. Introducción

La plataforma de incidentes de las unidades anteriores ofrecía una API REST en Node.js y Express, con persistencia en MySQL mediante Prisma, validación con Zod y manejo centralizado de errores. Sin embargo, la API era completamente pública: cualquier persona que conociera la URL podía consultar, crear, modificar o eliminar incidentes. El objetivo de esta tarea fue reforzar la plataforma con controles de seguridad en varias capas e integrar un cliente web en HTML y JavaScript que consuma la API de forma segura.

Las mejoras aplicadas fueron: autenticación con JSON Web Tokens (JWT), autorización por roles (ADMIN, SUPERVISOR y ANALISTA), contraseñas protegidas con bcrypt, CORS restringido, cabeceras seguras con Helmet, limitación de peticiones, validación con Zod y limpieza de entradas con sanitize-html. Todo se verificó con catorce pruebas automatizadas.

## 2. Fallos encontrados (riesgos iniciales)

Tomando como referencia el OWASP Top 10, se identificaron estos riesgos:

- **Falta de autenticación y de control de acceso (A01 y A07).** Ningún endpoint pedía identificar al usuario. Una petición `DELETE /api/incidentes/1` enviada desde cualquier cliente borraba el registro. Tampoco había roles para separar funciones.
- **Exposición de datos (A02).** Los incidentes podían leerse libremente y no estaba definido cómo guardar credenciales. Almacenar contraseñas en texto plano habría expuesto a todos los usuarios ante una fuga.
- **Validación incompleta (A03).** Zod verificaba tipos y longitudes, pero aceptaba HTML y JavaScript. Un título `<script>alert(1)</script>` se guardaba tal cual y podía provocar un XSS almacenado.
- **CORS permisivo y configuración insegura (A05).** No había política CORS explícita ni cabeceras de seguridad, y la cabecera `X-Powered-By: Express` revelaba la tecnología del servidor.
- **Sin límites de uso.** El login quedaba expuesto a fuerza bruta y la API aceptaba cuerpos de cualquier tamaño.

## 3. Mejoras realizadas

### 3.1 JWT, roles y bcrypt

Se creó el endpoint `POST /api/auth/login`. Un esquema Zod estricto exige un correo válido y una contraseña de 8 a 72 caracteres (72 es el máximo que procesa bcrypt) y rechaza campos inesperados, como un `rol` enviado desde el cliente.

Los usuarios están desacoplados del código: las contraseñas se leen de variables de entorno y se persisten mediante siembra (`prisma/seed.js`) con hashes **bcrypt (costo 12)**, sin credenciales en texto plano. Si un correo no existe, se compara contra un hash señuelo para evitar ataques de tiempo (timing attacks), respondiendo siempre "Credenciales inválidas".

Con credenciales correctas se firma un JWT con algoritmo **HS256 fijado explícitamente**, emisor definido, expiración de una hora y solo identificador, correo y rol. El secreto `JWT_SECRET` se valida al arrancar: si falta o tiene menos de 32 caracteres, la aplicación no inicia.

La autorización usa dos middlewares. `autenticar` verifica la cabecera `Authorization: Bearer <token>` (firma, algoritmo, emisor y expiración) y responde **401** si algo falla. `permitir(...roles)` responde **403** si el rol no está autorizado. Las rutas quedaron así: `GET` para cualquier usuario autenticado, `POST` para ANALISTA y ADMIN, `PUT` para SUPERVISOR y ADMIN, y `DELETE` solo para ADMIN. Una prueba confirmó que cambiar el rol dentro del token invalida la firma y el servidor lo rechaza.

### 3.2 CORS, Helmet y HTTPS

**CORS** solo admite los orígenes de `CLIENT_ORIGIN` (`http://localhost:5500`), los métodos GET, POST, PUT y DELETE y las cabeceras `Content-Type` y `Authorization`. Un origen no autorizado recibe 403 sin `Access-Control-Allow-Origin`, por lo que el navegador bloquea la respuesta. El cliente se sirve en un puerto distinto al de la API para probar esta política en condiciones reales.

**Helmet** añade CSP, HSTS, `X-Content-Type-Options` y `X-Frame-Options`, y se desactivó `X-Powered-By`. Además se fijaron 300 peticiones cada 15 minutos por IP, 10 intentos fallidos de login en el mismo periodo y un máximo de 10 KB por cuerpo JSON.

**HTTPS** no se activó en el entorno local, pero es obligatorio en producción. El JWT viaja en cada petición y, sobre HTTP, cualquiera que intercepte la red (por ejemplo, en una Wi-Fi pública) podría robarlo y suplantar al usuario. TLS cifra el canal, protege la integridad de los mensajes y autentica al servidor. Lo recomendable es un proxy inverso (Nginx o un balanceador) con certificado válido que redirija todo el tráfico HTTP a HTTPS. La aplicación ya habilita `trust proxy` en producción, y la cabecera HSTS obliga al navegador a usar HTTPS.

### 3.3 Validación y sanitización como defensa en profundidad

Cada petición pasa por este orden: CORS → límite de peticiones → JSON → **sanitize-html** → autenticación → autorización → **Zod** → controlador. El sanitizador elimina todas las etiquetas HTML del cuerpo, descarta por completo el contenido de `<script>` y bloquea claves como `__proto__`. Las contraseñas no se modifican, porque solo se comparan con bcrypt. Después, Zod valida el texto ya limpio, así que un título formado solo por código malicioso queda vacío y se rechaza por longitud.

El cliente muestra todo el contenido con `textContent` y plantillas, nunca con `innerHTML`, y tiene su propia CSP. Por eso, aunque una capa fallara, el texto no se ejecutaría como código. El token se guarda en `sessionStorage`, que se borra al cerrar la pestaña, y el cliente vuelve al login ante un 401.

## 4. Conclusión

La arquitectura separa con claridad las responsabilidades: el cliente se ocupa de la presentación y el servidor de la seguridad. El cliente oculta los botones que el rol no puede usar, pero eso es solo una ayuda visual: la autorización real la decide el servidor en cada petición. Así lo demostraron los casos en que un ANALISTA intentó eliminar y un SUPERVISOR intentó crear, y ambos recibieron 403.

Los contratos entre cliente y servidor son explícitos: los esquemas Zod definen qué datos se aceptan, los códigos HTTP (400, 401, 403, 404, 429) indican cada tipo de error y el manejador centralizado no filtra trazas ni detalles de la base de datos. Con bcrypt, JWT firmado, roles, CORS restringido, cabeceras seguras, validación y sanitización, la plataforma pasó de no tener controles a contar con varias capas independientes que protegen la confidencialidad y la integridad de los incidentes. Las pruebas automatizadas permiten repetir esta verificación después de cualquier cambio.
