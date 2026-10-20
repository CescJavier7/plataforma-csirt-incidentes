// Pruebas automatizadas de la API REST con Express y Suite CRUD (Unidad 4)
'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { createApp } = require('../server/app');
const { listIncidents } = require('../server/incident-service');
const { incidentesModel } = require('../src/models/incidentes.model');

// Helper para levantar un servidor temporal en puerto libre (puerto 0)
async function withServer(options, run) {
  const server = createApp(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
}

// 1. Endpoint de Monitoreo de Salud
test('GET /api/salud responde con 200 y estado activo', async () => {
  await withServer({}, async base => {
    const response = await fetch(`${base}/api/salud`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const data = await response.json();
    assert.equal(data.estado, 'activo');
    assert.ok(typeof data.uptimeSegundos === 'number');
    assert.ok(typeof data.timestamp === 'string');
  });
});

// 2. GET /api/incidentes: Catálogo completo y consumo por el Modelo Front-End
test('GET /api/incidentes devuelve el catálogo y el modelo cliente lo consume', async () => {
  await withServer({}, async base => {
    const response = await fetch(`${base}/api/incidentes`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const data = await response.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 4);

    // Verificación de consumo por el modelo del cliente
    const context = vm.createContext({ fetch, AbortSignal, URLSearchParams });
    context.window = context;
    vm.runInContext(await readFile(path.join(__dirname, '../js/model.js'), 'utf8'), context);
    const model = new context.SOC.IncidentModel(`${base}/api/incidentes`);
    await model.load();
    assert.equal(model.ready, true);
    assert.equal(model.incidents.length, data.length);
  });
});

// 3. GET /api/incidentes con filtros de Query Params
test('GET /api/incidentes soporta filtros por severidad y búsqueda', async () => {
  await withServer({}, async base => {
    // Filtro por severidad crítica
    const resCritica = await fetch(`${base}/api/incidentes?severidad=critica`);
    assert.equal(resCritica.status, 200);
    const dataCritica = await resCritica.json();
    assert.ok(dataCritica.every(i => i.severidad === 'critica'));

    // Filtro por búsqueda
    const resBusqueda = await fetch(`${base}/api/incidentes?busqueda=ransomware`);
    assert.equal(resBusqueda.status, 200);
    const dataBusqueda = await resBusqueda.json();
    assert.ok(dataBusqueda.length > 0);
    assert.ok(dataBusqueda[0].amenaza.toLowerCase().includes('ransomware'));
  });
});

// 4. GET /api/incidentes/:id: Búsqueda por identificador único
test('GET /api/incidentes/:id retorna incidente existente o 404', async () => {
  await withServer({}, async base => {
    const resOk = await fetch(`${base}/api/incidentes/INC-2041`);
    assert.equal(resOk.status, 200);
    const inc = await resOk.json();
    assert.equal(inc.codigo, 'INC-2041');

    const res404 = await fetch(`${base}/api/incidentes/INC-9999`);
    assert.equal(res404.status, 404);
    const err = await res404.json();
    assert.equal(err.exito, false);
  });
});

// 5. POST /api/incidentes: Creación CRUD con validación Zero-Trust
test('POST /api/incidentes crea un recurso (201) y rechaza datos inválidos (400/409)', async () => {
  incidentesModel.reiniciar();
  await withServer({}, async base => {
    // 5.1 Creación exitosa
    const payloadValido = {
      codigo: 'INC-3001',
      fecha: '2026-09-25T14:00:00',
      amenaza: 'Infiltración sospechosa en servidor DICOM',
      servicio: 'Radiología e Imagen',
      severidad: 'alta',
      estado: 'Inspección de Tráfico'
    };

    const resPost = await fetch(`${base}/api/incidentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadValido)
    });

    assert.equal(resPost.status, 201);
    const postData = await resPost.json();
    assert.equal(postData.exito, true);
    assert.equal(postData.datos.codigo, 'INC-3001');

    // 5.2 Rechazo por duplicidad de código (409 Conflict)
    const resDuplicado = await fetch(`${base}/api/incidentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadValido)
    });
    assert.equal(resDuplicado.status, 409);

    // 5.3 Rechazo por código malformado (400 Bad Request)
    const resInvalido = await fetch(`${base}/api/incidentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payloadValido, codigo: 'MALFORMADO' })
    });
    assert.equal(resInvalido.status, 400);
  });
});

// 6. PATCH /api/incidentes/:id: Actualización de estado
test('PATCH /api/incidentes/:id actualiza el estado asistencial', async () => {
  await withServer({}, async base => {
    const resPatch = await fetch(`${base}/api/incidentes/INC-2041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Mitigado y Auditado' })
    });

    assert.equal(resPatch.status, 200);
    const dataPatch = await resPatch.json();
    assert.equal(dataPatch.exito, true);
    assert.equal(dataPatch.datos.estado, 'Mitigado y Auditado');

    // 404 si el incidente no existe
    const resPatch404 = await fetch(`${base}/api/incidentes/INC-0000`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Prueba' })
    });
    assert.equal(resPatch404.status, 404);
  });
});

// 7. DELETE /api/incidentes/:id: Eliminación del catálogo
test('DELETE /api/incidentes/:id elimina el incidente del catálogo', async () => {
  await withServer({}, async base => {
    const resDelete = await fetch(`${base}/api/incidentes/INC-2038`, {
      method: 'DELETE'
    });
    assert.equal(resDelete.status, 200);

    // Ya no debe encontrarse
    const resGet = await fetch(`${base}/api/incidentes/INC-2038`);
    assert.equal(resGet.status, 404);
  });
});

// 8. Entrega segura de archivos estáticos públicos autorizados
test('ambas páginas y sus recursos se entregan por HTTP', async () => {
  await withServer({}, async base => {
    for (const route of ['/', '/index.html', '/proyecto-incidentes-tema1/index.html']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      const html = await response.text();
      const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
      assert.ok(refs.length >= 4, 'Debe incluir estilos y scripts modulares');
      for (const ref of refs) {
        assert.equal((await fetch(new URL(ref, base + route))).status, 200);
      }
    }
  });
});

// 9. Bloqueo de rutas privadas y protección contra Information Leakage
test('rutas desconocidas y archivos privados devuelven 404', async () => {
  await withServer({}, async base => {
    for (const route of ['/no-existe', '/server.js', '/.git/config', '/%2e%2e/server.js']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 404);
      assert.ok((await response.json()).error);
    }
  });
});

// 10. Manejo de errores defensivo: Sin filtración de stack traces
test('fallos de datos devuelven 500 sin exponer detalles internos', async () => {
  await withServer({ list: async () => { throw new Error('error simulado de base de datos'); } }, async base => {
    const response = await fetch(base + '/api/incidentes');
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.exito, false);
    assert.ok(body.error);
    // Verificamos que no se filtre la traza de ejecución interna
    assert.equal(body.stack, undefined);
  });
});

// 11. Reglas del servicio independiente de HTTP
test('servicio rechaza datos inválidos, duplicados y errores de lectura', async () => {
  const valid = (await listIncidents())[0];
  for (const invalid of [{}, [null], [{...valid, severidad:'desconocida'}], [valid, valid]]) {
    await assert.rejects(() => listIncidents(async () => invalid));
  }
  await assert.rejects(() => listIncidents(async () => { throw new Error('JSON inválido'); }));
  assert.deepEqual(await listIncidents(async () => []), []);
});
