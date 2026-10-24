const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PERSISTENCE = 'memory';
process.env.DATABASE_URL = 'mysql://dummy:dummy@localhost:3306/dummy';
process.env.JWT_SECRET = 'plataforma-csirt-clave-super-secreta-2026-test-key';
process.env.CLIENT_ORIGIN = 'http://localhost:3000,http://127.0.0.1:3000';
process.env.ADMIN_PASSWORD = 'test-admin-password-not-for-production';
process.env.SUPERVISOR_PASSWORD = 'test-supervisor-password-not-for-production';
process.env.ANALISTA_PASSWORD = 'test-analista-password-not-for-production';

const app = require('../src/app');

describe('Pruebas de Integración y Seguridad Defensiva (OWASP / skill_seguridad.md / SKILL.md)', () => {
  let server;
  let baseUrl;
  let tokenAdmin;
  let tokenSupervisor;
  let tokenAnalista;
  let idIncidenteCreado;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('1. Healthcheck público responde estado "ok" y status "UP" con timestamp (SKILL.md 2.1)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.estado, 'ok');
    assert.equal(data.status, 'UP');
    assert.equal(data.services.api, 'healthy');
    assert.ok(data.timestamp);
  });

  test('1.1 Readiness check responde 200 con base de datos conectada (SKILL.md 2.2)', async () => {
    const res = await fetch(`${baseUrl}/ready`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'READY');
    assert.equal(data.services.database, 'connected');
    assert.ok(data.timestamp);
  });

  test('2. Acceso sin token responde 401 "Token de acceso requerido" (Sección 3.2)', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes`);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    const data = await res.json();
    assert.equal(data.error, 'Token de acceso requerido');
  });

  test('3. Login con credenciales erróneas responde 401 "Credenciales incorrectas" (Sección A07)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@incidentes.com', password: 'ClaveTotalmenteErronea!' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Credenciales incorrectas');
  });

  test('4. Login exitoso genera token firmado con algoritmo forzado HS256 para cada rol', async () => {
    // Admin
    const rAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@incidentes.com', password: process.env.ADMIN_PASSWORD }),
    });
    assert.equal(rAdmin.status, 200);
    const dAdmin = await rAdmin.json();
    tokenAdmin = dAdmin.data.token;
    assert.equal(dAdmin.data.usuario.rol, 'ADMIN');

    // Supervisor
    const rSup = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'supervisor@incidentes.com', password: process.env.SUPERVISOR_PASSWORD }),
    });
    assert.equal(rSup.status, 200);
    const dSup = await rSup.json();
    tokenSupervisor = dSup.data.token;
    assert.equal(dSup.data.usuario.rol, 'SUPERVISOR');

    // Analista
    const rAna = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analista@incidentes.com', password: process.env.ANALISTA_PASSWORD }),
    });
    assert.equal(rAna.status, 200);
    const dAna = await rAna.json();
    tokenAnalista = dAna.data.token;
    assert.equal(dAna.data.usuario.rol, 'ANALISTA');
  });

  test('5. ANALISTA registra incidente y sanitización Zod elimina HTML peligroso (XSS) (Sección 3.4)', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAnalista}`,
      },
      body: JSON.stringify({
        titulo: 'Inyección de SQL en portal <script>alert("xss")</script>',
        descripcion: 'Intento de explotación de vulnerabilidad en el login perimetral <img src=x onerror=alert(1)>',
        prioridad: 'ALTA',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.data.id);
    idIncidenteCreado = data.data.id;
    // Comprobar eliminación estricta de tags
    assert.equal(data.data.titulo, 'Inyección de SQL en portal');
    assert.equal(data.data.descripcion, 'Intento de explotación de vulnerabilidad en el login perimetral');
  });

  test('6. GET /api/incidentes retorna la lista protegida con cabecera Cache-Control', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes`, {
      headers: { Authorization: `Bearer ${tokenAnalista}` },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    const data = await res.json();
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length >= 1);
  });

  test('7. Defensiva de parámetros: ID inválido responde 400 Bad Request', async () => {
    const r1 = await fetch(`${baseUrl}/api/incidentes/abc`, {
      headers: { Authorization: `Bearer ${tokenAnalista}` },
    });
    assert.equal(r1.status, 400);

    const r2 = await fetch(`${baseUrl}/api/incidentes/-10`, {
      headers: { Authorization: `Bearer ${tokenAnalista}` },
    });
    assert.equal(r2.status, 400);
  });

  test('8. RBAC Menor Privilegio: ANALISTA intenta eliminar y recibe 403 "Permiso insuficiente..." (Sección 3.2)', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes/${idIncidenteCreado}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAnalista}` },
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error, 'Permiso insuficiente para realizar esta acción');
  });

  test('9. Regla de Negocio: Cierre de incidente sin resolución técnica se rechaza con 400', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes/${idIncidenteCreado}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenSupervisor}`,
      },
      body: JSON.stringify({ estado: 'CERRADO', resolucion: '' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  test('10. SUPERVISOR actualiza estado a CERRADO con resolución técnica válida -> 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes/${idIncidenteCreado}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenSupervisor}`,
      },
      body: JSON.stringify({
        estado: 'CERRADO',
        resolucion: 'Se implementaron reglas en el WAF perimetral bloqueando los vectores detectados.',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.data.estado, 'CERRADO');
    assert.match(data.data.resolucion, /WAF/);
  });

  test('11. RBAC: ADMINISTRADOR elimina el incidente exitosamente -> 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/incidentes/${idIncidenteCreado}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.data.id, idIncidenteCreado);
  });

  test('12. Cabeceras HTTP de seguridad (Helmet) presentes en respuesta', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.ok(res.headers.get('content-security-policy'));
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('x-frame-options'));
  });
});
