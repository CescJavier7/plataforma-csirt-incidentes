const bcrypt = require('bcryptjs');
const env = require('../config/env');

const SALT_ROUNDS = 12;

/**
 * Servicio de Autenticación y Usuarios.
 * En modo persistente (PERSISTENCE=prisma), consulta la tabla 'usuarios' en la base de datos
 * aprovisionada previamente mediante el script de siembra (seed).
 * En modo memoria o fallback (PERSISTENCE=memory), resuelve contra un repositorio en memoria
 * cuyas credenciales se leen exclusivamente de variables de entorno (env.js), nunca hardcodeadas.
 */
class AuthService {
  constructor() {
    this.usuariosMemoria = [
      { id: 1, nombre: 'Ana Admin', email: 'admin@incidentes.com', rol: 'ADMIN', password: env.ADMIN_PASSWORD },
      { id: 2, nombre: 'Sergio Supervisor', email: 'supervisor@incidentes.com', rol: 'SUPERVISOR', password: env.SUPERVISOR_PASSWORD },
      { id: 3, nombre: 'Laura Analista', email: 'analista@incidentes.com', rol: 'ANALISTA', password: env.ANALISTA_PASSWORD },
    ].map(({ password, ...u }) => ({
      ...u,
      passwordHash: bcrypt.hashSync(password, SALT_ROUNDS),
    }));

    this.HASH_FICTICIO = bcrypt.hashSync('usuario-no-existente-fallback', SALT_ROUNDS);
  }

  /**
   * Busca un usuario por email según la persistencia configurada.
   * @param {string} email
   * @returns {Promise<{id: number, nombre: string, email: string, rol: string, passwordHash: string}|null>}
   */
  async buscarPorEmail(email) {
    if (env.PERSISTENCE === 'prisma') {
      try {
        const prisma = require('../config/prisma');
        const usuarioDb = await prisma.usuario.findUnique({
          where: { email },
        });
        if (usuarioDb) return usuarioDb;
      } catch (err) {
        // Si la base de datos no está levantada en la máquina de pruebas, recurre al almacén seguro
        console.warn('[AUTH] Prisma/MySQL no disponible, recurriendo al almacén de memoria seguro:', err.message);
      }
    }

    return this.usuariosMemoria.find((u) => u.email === email) || null;
  }

  /**
   * Verifica la contraseña de forma segura evitando timing attacks.
   */
  async verificarPassword(usuario, passwordPlana) {
    const hash = usuario ? usuario.passwordHash : this.HASH_FICTICIO;
    return await bcrypt.compare(passwordPlana, hash);
  }
}

module.exports = new AuthService();
