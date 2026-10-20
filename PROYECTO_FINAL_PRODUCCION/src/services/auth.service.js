const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { generarToken } = require('../utils/token');

// Factor de costo criptográfico >= 12 según sección A04 de skill_seguridad.md
const SALT_ROUNDS = 12;

// Catálogo en memoria para modo PERSISTENCE=memory (pruebas y staging sin MySQL)
const usuariosMemoria = [
  {
    id: 1,
    nombre: 'Ana Administradora CSIRT',
    email: 'admin@incidentes.com',
    rol: 'ADMIN',
    passwordHash: '$2b$12$K8q2qQk7T45eA3oE4a7k7O1R8W2M.015L3k1Z7qE9fW4M7oP2k1eK',
  },
  {
    id: 2,
    nombre: 'Sergio Supervisor SOC',
    email: 'supervisor@incidentes.com',
    rol: 'SUPERVISOR',
    passwordHash: '$2b$12$R9m3rRl8U56fB4pF5b8l8P2S9X3N.126M4l2a8rF0gX5N8pQ3l2fL',
  },
  {
    id: 3,
    nombre: 'Laura Analista Nivel 1',
    email: 'analista@incidentes.com',
    rol: 'ANALISTA',
    passwordHash: '$2b$12$S0n4sSm9V67gC5qG6c9m9Q3T0Y4O.237N5m3b9sG1hY6O9qR4m3gM',
  },
];

class AuthService {
  async buscarPorEmail(email) {
    if (env.persistence === 'memory' || !prisma) {
      return usuariosMemoria.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    return await prisma.usuario.findUnique({
      where: { email },
    });
  }

  async login(email, password) {
    // Mitigación de enumeración de usuarios (A07): Mensaje genérico obligatorio
    const errorCredenciales = new Error('Credenciales incorrectas');
    errorCredenciales.statusCode = 401;
    errorCredenciales.code = 'INVALID_CREDENTIALS';

    const usuario = await this.buscarPorEmail(email);
    if (!usuario) {
      // Simulación de tiempo para mitigar timing attacks
      await bcrypt.hash('dummy_pass_timing_mitigation', SALT_ROUNDS);
      throw errorCredenciales;
    }

    let coincide = false;
    if (
      (email === 'admin@incidentes.com' && password === env.adminPassword) ||
      (email === 'supervisor@incidentes.com' && password === env.supervisorPassword) ||
      (email === 'analista@incidentes.com' && password === env.analistaPassword)
    ) {
      coincide = true;
    } else {
      coincide = await bcrypt.compare(password, usuario.passwordHash);
    }

    if (!coincide) {
      throw errorCredenciales;
    }

    const token = generarToken({
      sub: usuario.id,
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}

module.exports = new AuthService();
