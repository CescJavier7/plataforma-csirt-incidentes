/**
 * Pruebas de seguridad de la Tarea 6 (node:test, sin dependencias externas).
 * Levanta la API real en un puerto efímero usando persistencia en memoria y
 * genera automáticamente docs/tarea6/evidencias_resultados.md con Entrada / Esperado / Obtenido.
 *
 * Ejecutar:  npm run test:seguridad
 */
process.env.NODE_ENV = 'test';
process.env.PERSISTENCE = 'memory';
process.env.JWT_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres-123';
process.env.CLIENT_ORIGIN = 'http://localhost:5500';
process.env.ADMIN_PASSWORD = 'test-admin-password-not-production';
process.env.SUPERVISOR_PASSWORD = 'test-supervisor-password-not-production';
process.env.ANALISTA_PASSWORD = 'test-analista-password-not-production';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/app');

let server;
let base;
const tokens = {};
const evidencias = [];

const CRED = {
  ADMIN: { email: 'admin@incidentes.com', password: process.env.ADMIN_PASSWORD },
  SUPERVISOR: { email: 'supervisor@incidentes.com', password: process.env.SUPERVISOR_PASSWORD },
  ANALISTA: { email: 'analista@incidentes.com', password: process.env.ANALISTA_PASSWORD },
};

const acortar = (t) => (typeof t === 'string' && t.length > 40 ? `${t.slice(0, 20)}…${t.slice(-10)}` : t);

/** Realiza la petición y devuelve { status, headers, body } */
async function pedir(method, ruta, { body, token, headers = {} } = {}) {
  const h = { ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${ruta}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let json;
  try { json = JSON.parse(texto); } catch { json = texto; }
  return { status: res.status, headers: res.headers, body: json, reqHeaders: h };
}

/** Registra la evidencia de un caso */
function registrar({ n, titulo, method, ruta, req, esperado, res, extra }) {
  const cabeceras = { ...req.reqHeaders };
  if (cabeceras.Authorization) cabeceras.Authorization = `Bearer ${acortar(cabeceras.Authorization.slice(7))}`;
  const cuerpoPeticion = JSON.parse(JSON.stringify(req.body || {}));
  if (Object.prototype.hasOwnProperty.call(cuerpoPeticion, 'password')) {
    cuerpoPeticion.password = '[REDACTED]';
  }
  const cuerpo = JSON.parse(JSON.stringify(res.body, (k, v) => (k === 'token' ? acortar(v) : v)));
  evidencias.push({ n, titulo, method, ruta, cabeceras, body: cuerpoPeticion, esperado, status: res.status, cuerpo, extra });
}

async function caso(n, titulo, method, ruta, opciones, esperado, extra) {
  const res = await pedir(method, ruta, opciones);
  registrar({ n, titulo, method, ruta, req: { ...opciones, reqHeaders: res.reqHeaders }, esperado, res, extra: extra?.(res) });
  return res;
}

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  escribirEvidencias();
});

// ------------------------------------------------------------------ CASOS OBLIGATORIOS

test('1. Acceso sin token -> 401', async () => {
  const r = await caso(1, 'Acceso sin token', 'GET', '/api/incidentes', {}, '401 Unauthorized – "Token de acceso requerido"');
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'UNAUTHORIZED');
});

test('6. Login exitoso devuelve JWT (ANALISTA, SUPERVISOR, ADMIN)', async () => {
  const r = await caso(6, 'Flujo exitoso – Login', 'POST', '/api/auth/login', { body: CRED.ANALISTA },
    '200 OK con token JWT, tipo Bearer y datos del usuario (sin contraseña)');
  assert.equal(r.status, 200);
  assert.match(r.body.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
  assert.equal(r.body.data.usuario.rol, 'ANALISTA');
  assert.equal(r.body.data.usuario.passwordHash, undefined);
  tokens.ANALISTA = r.body.data.token;

  for (const rol of ['SUPERVISOR', 'ADMIN']) {
    const x = await pedir('POST', '/api/auth/login', { body: CRED[rol] });
    assert.equal(x.status, 200);
    tokens[rol] = x.body.data.token;
  }
});

test('2. Permisos insuficientes: ANALISTA intenta DELETE -> 403', async () => {
  const creado = await pedir('POST', '/api/incidentes', {
    token: tokens.ADMIN,
    body: { titulo: 'Incidente a proteger', descripcion: 'No debe poder borrarlo un analista' },
  });
  const r = await caso(2, 'Permisos insuficientes (ANALISTA → DELETE)', 'DELETE', `/api/incidentes/${creado.body.data.id}`,
    { token: tokens.ANALISTA }, '403 Forbidden – solo ADMIN puede eliminar');
  assert.equal(r.status, 403);
  assert.equal(r.body.error, 'FORBIDDEN');
});

test('3. Datos inválidos en login (correo mal formado y contraseña corta) -> 400', async () => {
  const r = await caso(3, 'Datos inválidos (Login)', 'POST', '/api/auth/login',
    { body: { email: 'correo-sin-arroba', password: '123' } }, '400 Bad Request con errores de Zod por campo');
  assert.equal(r.status, 400);
  const campos = r.body.errors.map((e) => e.campo);
  assert.ok(campos.includes('email'));
  assert.ok(campos.includes('password'));
});

test('4. Datos inválidos al crear incidente (campos faltantes / tipos incorrectos) -> 400', async () => {
  const r = await caso(4, 'Datos inválidos (Creación)', 'POST', '/api/incidentes',
    { token: tokens.ANALISTA, body: { titulo: 123, prioridad: 'URGENTE' } },
    '400 Bad Request: titulo debe ser string, descripcion obligatoria, prioridad fuera del enum');
  assert.equal(r.status, 400);
  const campos = r.body.errors.map((e) => e.campo);
  assert.ok(campos.includes('titulo'));
  assert.ok(campos.includes('descripcion'));
  assert.ok(campos.includes('prioridad'));
});

test('5. Limpieza de entradas: <script> eliminado antes de guardar', async () => {
  const r = await caso(5, 'Limpieza de entradas (sanitize-html)', 'POST', '/api/incidentes', {
    token: tokens.ANALISTA,
    body: {
      titulo: '<script>alert("XSS")</script>Caída del servidor web',
      descripcion: '<img src=x onerror="alert(1)">El portal no responde <b>desde las 8:00</b>',
      prioridad: 'ALTA',
    },
  }, '201 Created; el título y la descripción se guardan SIN etiquetas ni código JavaScript',
  (res) => `Consulta posterior GET /api/incidentes/${res.body.data?.id} confirma el valor persistido.`);
  assert.equal(r.status, 201);
  assert.equal(r.body.data.titulo, 'Caída del servidor web');
  assert.equal(r.body.data.descripcion, 'El portal no responde desde las 8:00');

  const guardado = await pedir('GET', `/api/incidentes/${r.body.data.id}`, { token: tokens.ANALISTA });
  assert.ok(!/[<>]/.test(guardado.body.data.titulo + guardado.body.data.descripcion));
});

let idCreado;
test('7. Crear como ANALISTA y verlo en el listado', async () => {
  const r = await caso(7, 'Flujo exitoso – Crear y Consultar', 'POST', '/api/incidentes', {
    token: tokens.ANALISTA,
    body: { titulo: 'Fallo en VPN corporativa', descripcion: 'Usuarios remotos no logran conectarse a la VPN', prioridad: 'CRITICA' },
  }, '201 Created y el incidente aparece en GET /api/incidentes (fila en la tabla del cliente)',
  () => null);
  assert.equal(r.status, 201);
  idCreado = r.body.data.id;

  const lista = await pedir('GET', '/api/incidentes', { token: tokens.ANALISTA });
  assert.equal(lista.status, 200);
  const fila = lista.body.data.find((i) => i.id === idCreado);
  assert.ok(fila);
  evidencias.at(-1).extra = `GET /api/incidentes → ${lista.status}, total=${lista.body.total}; fila encontrada: ` +
    `{ id: ${fila.id}, titulo: "${fila.titulo}", prioridad: ${fila.prioridad}, estado: ${fila.estado} }`;
});

test('8. SUPERVISOR actualiza el estado -> 200', async () => {
  const r = await caso(8, 'Flujo exitoso – Actualizar (SUPERVISOR)', 'PUT', `/api/incidentes/${idCreado}`,
    { token: tokens.SUPERVISOR, body: { estado: 'EN_PROCESO' } }, '200 OK con estado = EN_PROCESO');
  assert.equal(r.status, 200);
  assert.equal(r.body.data.estado, 'EN_PROCESO');
});

// ------------------------------------------------------------------ CASOS ADICIONALES

test('9. Token manipulado / inválido -> 401', async () => {
  const partes = tokens.ANALISTA.split('.');
  const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString());
  payload.rol = 'ADMIN'; // escalamiento de privilegios
  const falso = [partes[0], Buffer.from(JSON.stringify(payload)).toString('base64url'), partes[2]].join('.');
  const r = await caso(9, 'Token manipulado (rol cambiado a ADMIN)', 'DELETE', `/api/incidentes/${idCreado}`,
    { token: falso }, '401 – la firma ya no coincide, el servidor rechaza el token');
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'INVALID_TOKEN');
});

test('10. Credenciales incorrectas -> 401 con mensaje genérico', async () => {
  const r = await caso(10, 'Contraseña incorrecta', 'POST', '/api/auth/login',
    { body: { email: CRED.ADMIN.email, password: 'ClaveEquivocada1' } }, '401 "Credenciales inválidas" (no revela qué campo falló)');
  assert.equal(r.status, 401);
  assert.equal(r.body.message, 'Credenciales inválidas');
});

test('11. SUPERVISOR intenta crear -> 403', async () => {
  const r = await caso(11, 'Permisos insuficientes (SUPERVISOR → POST)', 'POST', '/api/incidentes', {
    token: tokens.SUPERVISOR,
    body: { titulo: 'Intento no autorizado', descripcion: 'El supervisor no puede crear incidentes' },
  }, '403 Forbidden – POST solo para ANALISTA y ADMIN');
  assert.equal(r.status, 403);
});

test('12. CORS: origen no permitido rechazado, origen permitido aceptado', async () => {
  const malo = await caso(12, 'CORS restringido (origen no autorizado)', 'GET', '/api/health',
    { headers: { Origin: 'http://sitio-malicioso.com' } }, '403 y SIN cabecera Access-Control-Allow-Origin',
    (res) => `Access-Control-Allow-Origin = ${res.headers.get('access-control-allow-origin') ?? '(ausente)'}`);
  assert.equal(malo.status, 403);
  assert.equal(malo.headers.get('access-control-allow-origin'), null);

  const bueno = await pedir('GET', '/api/health', { headers: { Origin: 'http://localhost:5500' } });
  assert.equal(bueno.status, 200);
  assert.equal(bueno.headers.get('access-control-allow-origin'), 'http://localhost:5500');
  evidencias.at(-1).extra += ` | Con Origin http://localhost:5500 → ${bueno.status}, Access-Control-Allow-Origin = ${bueno.headers.get('access-control-allow-origin')}`;
});

test('13. Cabeceras seguras de Helmet presentes', async () => {
  const r = await caso(13, 'Cabeceras de seguridad (Helmet)', 'GET', '/api/health', {},
    'Cabeceras CSP, HSTS, X-Content-Type-Options, X-Frame-Options; sin X-Powered-By',
    (res) => ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'x-powered-by']
      .map((h) => `${h}: ${res.headers.get(h) ?? '(ausente)'}`).join('\n'));
  assert.ok(r.headers.get('content-security-policy'));
  assert.ok(r.headers.get('strict-transport-security'));
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('14. ADMIN elimina el incidente -> 200', async () => {
  const r = await caso(14, 'Flujo exitoso – Eliminar (ADMIN)', 'DELETE', `/api/incidentes/${idCreado}`,
    { token: tokens.ADMIN }, '200 OK y el recurso deja de existir (GET posterior → 404)');
  assert.equal(r.status, 200);
  const despues = await pedir('GET', `/api/incidentes/${idCreado}`, { token: tokens.ADMIN });
  assert.equal(despues.status, 404);
  evidencias.at(-1).extra = `GET /api/incidentes/${idCreado} posterior → ${despues.status} (${despues.body.error})`;
});

// ------------------------------------------------------------------ GENERACIÓN DE EVIDENCIAS

function escribirEvidencias() {
  const ordenadas = [...evidencias].sort((a, b) => a.n - b.n);
  const bloques = ordenadas.map((e) => {
    const entrada = [`${e.method} ${e.ruta}`];
    for (const [k, v] of Object.entries(e.cabeceras)) entrada.push(`${k}: ${v}`);
    if (e.body !== undefined) entrada.push('', JSON.stringify(e.body, null, 2));
    return [
      `### Caso ${e.n}: ${e.titulo}`,
      '',
      '**Entrada**',
      '```http',
      entrada.join('\n'),
      '```',
      `**Resultado esperado:** ${e.esperado}`,
      '',
      `**Resultado obtenido:** HTTP \`${e.status}\``,
      '```json',
      JSON.stringify(e.cuerpo, null, 2),
      '```',
      e.extra ? `**Verificación adicional:**\n\n\`\`\`text\n${e.extra}\n\`\`\`\n` : '',
    ].join('\n');
  });

  const contenido = [
    '# Evidencias automáticas – Pruebas de seguridad (Tarea 6)',
    '',
    `> Generado por \`tests/seguridad.test.js\` el ${new Date().toLocaleString('es-EC')}. Persistencia: memoria.`,
    '',
    ...bloques,
  ].join('\n');

  const destino = path.join(__dirname, '..', 'docs', 'tarea6', 'evidencias_resultados.md');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, contenido, 'utf8');
}
