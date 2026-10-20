'use strict';

require('dotenv').config();
process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createServer } = require('node:net');
const path = require('node:path');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const projectRoot = path.resolve(__dirname, '..');
const serverPath = path.join(projectRoot, 'src', 'server.js');
const activeServerUrl = 'http://127.0.0.1';
let server;
let activeUrl;
let dbDisponible = false;

async function verificarMysql() {
  return new Promise((resolve) => {
    const socket = require('node:net').createConnection({ port: 3306, host: '127.0.0.1', timeout: 300 });
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { resolve(false); });
  });
}

before(async () => {
  dbDisponible = await verificarMysql();
  if (!dbDisponible) {
    console.warn('\n[AVISO PERSISTENCIA] Servidor MySQL (puerto 3306) no detectado.');
    console.warn('Para pruebas con persistencia real MySQL, inicie Docker con: docker compose up -d\n');
  }
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  activeUrl = `${activeServerUrl}:${server.address().port}/api/incidentes`;
});

after(async () => {
  if (server?.listening) {
    server.close();
    await once(server, 'close');
  }
  await prisma.$disconnect();
});

async function requestJson(url, options) {
  const response = await fetch(url, options);
  return { response, body: await response.json() };
}

function incidentPayload(overrides = {}) {
  return {
    titulo: 'Incidente persistente de prueba',
    descripcion: 'Registro temporal para verificar la API y la base de datos.',
    prioridad: 'ALTA',
    estado: 'ABIERTO',
    ...overrides,
  };
}

async function availablePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  probe.close();
  await once(probe, 'close');
  return port;
}

async function startChildServer(port, extraEnv = {}) {
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port), ...extraEnv },
    stdio: 'ignore',
  });
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`El servidor de prueba terminó con código ${child.exitCode}.`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return { child, url };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  child.kill();
  throw new Error('El servidor de prueba no inició dentro del tiempo esperado.');
}

async function stopChildServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  let timeout;
  const exited = await Promise.race([
    once(child, 'exit').then(() => true),
    new Promise((resolve) => {
      timeout = setTimeout(() => resolve(false), 10000);
    }),
  ]);
  clearTimeout(timeout);
  if (!exited) {
    child.kill();
    throw new Error('El servidor de prueba no se detuvo dentro del tiempo esperado.');
  }
}

test('CRUD, valores predeterminados y filtros persisten correctamente', async (t) => {
  if (!dbDisponible) {
    t.skip('Requiere base de datos MySQL activa (iniciar con: docker compose up -d)');
    return;
  }
  const created = await requestJson(activeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentPayload({ prioridad: 'CRITICA' })),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.data.estado, 'ABIERTO');
  assert.equal(created.body.data.prioridad, 'CRITICA');
  const id = created.body.data.id;
  t.after(() => prisma.incidente.deleteMany({ where: { id } }));

  const filtered = await requestJson(
    `${activeUrl}?estado=ABIERTO&prioridad=CRITICA`,
  );
  assert.equal(filtered.response.status, 200);
  assert.ok(filtered.body.data.some((incident) => incident.id === id));
  assert.ok(filtered.body.data.every(
    (incident) => incident.estado === 'ABIERTO' && incident.prioridad === 'CRITICA',
  ));

  const updated = await requestJson(`${activeUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'EN_PROCESO' }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.estado, 'EN_PROCESO');

  const retrieved = await requestJson(`${activeUrl}/${id}`);
  assert.equal(retrieved.response.status, 200);
  assert.equal(retrieved.body.data.id, id);

  const removed = await requestJson(`${activeUrl}/${id}`, { method: 'DELETE' });
  assert.equal(removed.response.status, 200);
});

test('rechaza payloads, filtros e identificadores inválidos con HTTP 400', async () => {
  const invalidBody = await requestJson(activeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentPayload({ titulo: 'x' })),
  });
  assert.equal(invalidBody.response.status, 400);
  assert.equal(invalidBody.body.success, false);
  assert.ok(invalidBody.body.errors.length > 0);

  for (const filter of ['estado=DESCONOCIDO', 'prioridad=URGENTE']) {
    const invalidFilter = await requestJson(`${activeUrl}?${filter}`);
    assert.equal(invalidFilter.response.status, 400);
    assert.equal(invalidFilter.body.success, false);
  }

  const invalidId = await requestJson(`${activeUrl}/1.5`);
  assert.equal(invalidId.response.status, 400);
});

test('recurso inexistente responde 404 uniforme', async (t) => {
  if (!dbDisponible) {
    t.skip('Requiere base de datos MySQL activa (iniciar con: docker compose up -d)');
    return;
  }
  const { response, body } = await requestJson(`${activeUrl}/999999999`);
  assert.equal(response.status, 404);
  assert.equal(body.error, 'INCIDENTE_NO_ENCONTRADO');
});

test('una base de datos inaccesible responde 500 sin filtrar detalles', async () => {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const secret = databaseUrl.password;
  databaseUrl.port = '1';
  const port = await availablePort();
  const { child, url } = await startChildServer(port, {
    DATABASE_URL: databaseUrl.toString(),
  });

  try {
    const { response, body } = await requestJson(`${url}/api/incidentes`);
    assert.equal(response.status, 500);
    assert.equal(body.message, 'Error interno del servidor');
    assert.equal(JSON.stringify(body).includes(secret), false);
    assert.equal(JSON.stringify(body).includes('DATABASE_URL'), false);
    assert.equal(JSON.stringify(body).includes('stack'), false);
  } finally {
    await stopChildServer(child);
  }
});

test('los registros sobreviven al reinicio del proceso Node.js', async (t) => {
  if (!dbDisponible) {
    t.skip('Requiere base de datos MySQL activa (iniciar con: docker compose up -d)');
    return;
  }
  const port = await availablePort();
  const firstRun = await startChildServer(port);
  let child = firstRun.child;
  let id;

  try {
    const created = await requestJson(`${firstRun.url}/api/incidentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentPayload()),
    });
    assert.equal(created.response.status, 201);
    id = created.body.data.id;
    await stopChildServer(child);

    const secondRun = await startChildServer(port);
    child = secondRun.child;
    const persisted = await requestJson(`${secondRun.url}/api/incidentes/${id}`);
    assert.equal(persisted.response.status, 200);
    assert.equal(persisted.body.data.id, id);
  } finally {
    await stopChildServer(child);
    if (id) {
      await prisma.incidente.deleteMany({ where: { id } });
    }
  }
});
