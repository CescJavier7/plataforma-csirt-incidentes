'use strict';

const { spawnSync } = require('node:child_process');

const result = spawnSync(
  process.execPath,
  ['--test', 'tests/persistence.test.js'],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error('No se pudieron ejecutar las pruebas de persistencia:', result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
