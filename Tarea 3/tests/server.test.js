// Pruebas reales de HTTP en un puerto libre; no modifican los datos.
'use strict';
// Usamos el ejecutor de pruebas y las aserciones integrados en Node.js, sin instalar paquetes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { createApp } = require('../server/app');
const { listIncidents } = require('../server/incident-service');
// Cada caso abre un servidor temporal. El puerto 0 hace que el sistema elija un puerto libre.
async function withServer(options, run) {
  const server = createApp(options);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  // Cerramos las conexiones incluso si una comprobación falla, para no dejar procesos escuchando.
  finally {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  }
}
// Verificamos ruta de salud del servidor
test('GET /api/salud responde con 200 y estado activo', async () => {
  await withServer({}, async base => {
    const response = await fetch(`${base}/api/salud`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json; charset=utf-8/);
    const data = await response.json();
    assert.equal(data.estado, 'activo');
    assert.ok(typeof data.uptimeSegundos === 'number');
    assert.ok(typeof data.timestamp === 'string');
  });
});
// Verificamos estado, tipo y cuerpo de la API, y que el modelo real del cliente pueda consumirla.
test('GET /api/incidentes devuelve el JSON y el modelo cliente lo consume', async () => {
  await withServer({}, async base => {
    const response = await fetch(`${base}/api/incidentes`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json; charset=utf-8/);
    const expected = JSON.parse(await readFile(path.join(__dirname, '../data/incidentes.json'), 'utf8'));
    assert.deepEqual(await response.json(), expected);
    // Simulamos el entorno global mínimo del modelo; no es una prueba visual de navegador.
    const context = vm.createContext({ fetch, AbortSignal });
    context.window = context;
    vm.runInContext(await readFile(path.join(__dirname, '../js/model.js'), 'utf8'), context);
    const model = new context.SOC.IncidentModel(`${base}/api/incidentes`);
    await model.load();
    assert.equal(model.ready, true);
    assert.equal(model.incidents.length, expected.length);
  });
});
// Comprobamos las dos entradas HTML y resolvemos sus rutas relativas a los scripts y estilos.
test('ambas páginas y sus recursos se entregan por HTTP', async () => {
  await withServer({}, async base => {
    for (const route of ['/', '/index.html', '/proyecto-incidentes-tema1/index.html']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      const html = await response.text();
      const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
      assert.ok(refs.length >= 4, 'Debe incluir estilos y scripts modulares');
      for (const ref of refs) assert.equal((await fetch(new URL(ref, base + route))).status, 200);
    }
    assert.match(await (await fetch(base + '/js/controller.js')).text(), /\/api\/incidentes/);
  });
});
// Una ruta desconocida o un archivo interno no debe quedar publicado por accidente.
test('rutas desconocidas y archivos privados devuelven 404', async () => {
  await withServer({}, async base => {
    for (const route of ['/no-existe', '/server.js', '/.git/config', '/%2e%2e/server.js']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 404);
      assert.ok((await response.json()).error);
    }
  });
});
// El prototipo solo permite lectura; POST debe indicar que el método no está permitido.
test('POST no se admite: devuelve 405 y Allow', async () => {
  await withServer({}, async base => {
    const response = await fetch(base + '/api/incidentes', { method: 'POST', body: '{}' });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET');
  });
});
// Sustituimos el servicio por uno que falla para comprobar la respuesta de error del servidor.
test('fallos de datos devuelven 500 sin exponer detalles internos', async () => {
  await withServer({ list: async () => { throw new Error('ruta privada'); } }, async base => {
    const response = await fetch(base + '/api/incidentes');
    assert.equal(response.status, 500);
    assert.ok((await response.json()).error);
  });
});
// Sin incidentes también hay una consulta correcta: 200 con un arreglo vacío.
test('lista vacía es una respuesta válida', async () => {
  await withServer({ list: async () => [] }, async base => {
    const response = await fetch(base + '/api/incidentes');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  });
});
// Probamos las reglas del servicio independientemente de HTTP y sin cambiar el JSON original.
test('servicio rechaza datos inválidos, duplicados y errores de lectura', async () => {
  const valid = (await listIncidents())[0];
  for (const invalid of [{}, [null], [{...valid, severidad:'desconocida'}], [valid, valid]]) {
    await assert.rejects(() => listIncidents(async () => invalid));
  }
  await assert.rejects(() => listIncidents(async () => { throw new Error('JSON inválido'); }));
  assert.deepEqual(await listIncidents(async () => []), []);
});
