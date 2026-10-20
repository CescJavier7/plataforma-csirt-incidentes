/**
 * scripts/verificar-entrega.js
 * Script de Pruebas de Humo (Smoke Tests) para Validación de Producción CSIRT
 * Uso: node scripts/verificar-entrega.js [URL_BASE]
 */

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error('Configure ADMIN_PASSWORD para ejecutar la prueba de humo autenticada');
}

async function ejecutarPruebasDeHumo() {
  console.log('================================================================');
  console.log(`🔍 INICIANDO PRUEBAS DE HUMO SOBRE: ${BASE_URL}`);
  console.log('================================================================\n');

  let fallos = 0;

  // 1. Verificación de Health Check
  try {
    process.stdout.write('1. Verificando Health Check (/health)... ');
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status === 200 && data.estado === 'ok') {
      console.log('✅ OK (200, estado: ok)');
    } else {
      console.log(`❌ FALLÓ (HTTP ${res.status}):`, data);
      fallos++;
    }
  } catch (err) {
    console.log(`❌ ERROR DE CONEXIÓN: ${err.message}`);
    fallos++;
  }

  // 2. Verificación de Protección de Rutas (Cero Confianza)
  try {
    process.stdout.write('2. Verificando rechazo sin token (/api/incidentes)... ');
    const res = await fetch(`${BASE_URL}/api/incidentes`);
    const data = await res.json();
    if (res.status === 401 && data.error === 'Token de acceso requerido') {
      console.log('✅ OK (401, Token de acceso requerido)');
    } else {
      console.log(`❌ FALLÓ (HTTP ${res.status}):`, data);
      fallos++;
    }
  } catch (err) {
    console.log(`❌ ERROR DE CONEXIÓN: ${err.message}`);
    fallos++;
  }

  // 3. Verificación de Autenticación Defensiva (Login con credenciales incorrectas)
  try {
    process.stdout.write('3. Verificando mitigación de enumeración (/api/auth/login)... ');
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'usuario_inexistente@csirt.com', password: 'ClaveInvalida123!' }),
    });
    const data = await res.json();
    if (res.status === 401 && data.error === 'Credenciales incorrectas') {
      console.log('✅ OK (401, Credenciales incorrectas)');
    } else {
      console.log(`❌ FALLÓ (HTTP ${res.status}):`, data);
      fallos++;
    }
  } catch (err) {
    console.log(`❌ ERROR DE CONEXIÓN: ${err.message}`);
    fallos++;
  }

  // 4. Verificación de Autenticación Válida y Generación JWT
  let tokenAdmin = null;
  try {
    process.stdout.write('4. Verificando autenticación de Administrador... ');
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@incidentes.com', password: ADMIN_PASSWORD }),
    });
    const data = await res.json();
    if (res.status === 200 && data.data && data.data.token) {
      tokenAdmin = data.data.token;
      console.log('✅ OK (200, JWT generado exitosamente)');
    } else {
      console.log(`❌ FALLÓ (HTTP ${res.status}):`, data);
      fallos++;
    }
  } catch (err) {
    console.log(`❌ ERROR DE CONEXIÓN: ${err.message}`);
    fallos++;
  }

  // 5. Verificación de Consulta Autorizada
  if (tokenAdmin) {
    try {
      process.stdout.write('5. Verificando lectura de incidentes con JWT Bearer... ');
      const res = await fetch(`${BASE_URL}/api/incidentes`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data)) {
        console.log(`✅ OK (200, ${data.data.length} incidentes recuperados)`);
      } else {
        console.log(`❌ FALLÓ (HTTP ${res.status}):`, data);
        fallos++;
      }
    } catch (err) {
      console.log(`❌ ERROR DE CONEXIÓN: ${err.message}`);
      fallos++;
    }
  }

  console.log('\n================================================================');
  if (fallos === 0) {
    console.log('🎉 TODAS LAS PRUEBAS DE HUMO PASARON SATISFACTORIAMENTE.');
    process.exit(0);
  } else {
    console.error(`⚠️ SE ENCONTRARON ${fallos} FALLOS EN LA VERIFICACIÓN.`);
    process.exit(1);
  }
}

ejecutarPruebasDeHumo();
