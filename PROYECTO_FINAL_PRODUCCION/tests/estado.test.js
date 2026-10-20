const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { puedeCambiarEstado } = require('../src/utils/estado');

describe('Pruebas Unitarias - Máquina de Estados del Incidente (ITIL / Unidad 7)', () => {
  test('1. Rechaza el cierre de un incidente si la resolución técnica está vacía', () => {
    const res = puedeCambiarEstado('EN_PROCESO', 'CERRADO', '');
    assert.equal(res.valido, false);
    assert.match(res.razon, /resolución de al menos 5 caracteres/);
  });

  test('2. Permite el cierre cuando se provee una resolución técnica válida', () => {
    const res = puedeCambiarEstado('EN_PROCESO', 'CERRADO', 'Host aislado y malware erradicado');
    assert.equal(res.valido, true);
    assert.equal(res.razon, 'Transición permitida');
  });

  test('3. No permite reactivar un incidente que ya se encuentra CERRADO', () => {
    const res = puedeCambiarEstado('CERRADO', 'EN_PROCESO');
    assert.equal(res.valido, false);
    assert.match(res.razon, /no puede reactivarse directamente/);
  });

  test('4. Rechaza transiciones hacia estados desconocidos o no válidos', () => {
    const res = puedeCambiarEstado('ABIERTO', 'ESTADO_INVENTADO');
    assert.equal(res.valido, false);
    assert.match(res.razon, /Estado de destino no válido/);
  });

  test('5. Permite transiciones regulares operativas (ABIERTO -> EN_PROCESO -> RESUELTO)', () => {
    const t1 = puedeCambiarEstado('ABIERTO', 'EN_PROCESO');
    const t2 = puedeCambiarEstado('EN_PROCESO', 'RESUELTO');
    assert.equal(t1.valido, true);
    assert.equal(t2.valido, true);
  });
});

