# 🛡️ Plataforma CSIRT / SOC - Proyecto Final Integrador (Unidad 8)

## 📌 1. Descripción General
La **Plataforma Web para la Gestión de Incidentes de Ciberseguridad** es una solución integral diseñada para centros de operaciones de seguridad (SOC) y equipos de respuesta a incidentes (CSIRT). Permite la recepción, triaje, contención, investigación, actualización de ciclo de vida (ITIL/NIST SP 800-61) y erradicación de incidentes con control de acceso basado en roles (RBAC) y persistencia en bases de datos relacionales.

El proyecto implementa estrictamente las directrices del documento `skill_seguridad.md`, garantizando la mitigación del estándar **OWASP Top 10**, el **Principio de Menor Privilegio** y una política de **Cero Confianza (Zero-Trust)** en el frontend.

---

## 💻 2. Requisitos de Instalación y Ejecución

### 2.1 Requisitos Previos
- **Node.js**: v20.x o v22.x LTS
- **npm**: v10.x+
- **MySQL Server**: v8.4 LTS (o Docker para ejecución containerizada)
- **Nginx**: Opcional como proxy inverso y terminador TLS

### 2.2 Variables de Entorno (`.env`)
En `codigo/server/.env` configure:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://csirt_user:csirt_secure_pass_2026@localhost:3306/csirt_incidentes"
JWT_SECRET="clave_criptograficamente_robusta_para_produccion_2026"
JWT_EXPIRES_IN="30m"
CLIENT_ORIGIN="http://localhost:3000,http://localhost:5500"
ADMIN_PASSWORD="Admin123!"
SUPERVISOR_PASSWORD="Supervisor123!"
ANALISTA_PASSWORD="Analista123!"
```

### 2.3 Instrucciones de Arranque
```bash
# 1. Acceder al backend
cd codigo/server

# 2. Instalar dependencias
npm install

# 3. Generar cliente Prisma y desplegar migraciones
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js

# 4. Iniciar servicio
npm start
```
El servidor quedará operativo en `http://localhost:3000`.

---

## 👥 3. Credenciales Iniciales de Acceso (RBAC)

| Rol | Correo Electrónico | Contraseña | Permisos Operativos |
| :--- | :--- | :--- | :--- |
| **ANALISTA** | `analista@incidentes.com` | `Analista123!` | Consultar catálogo (`GET`) y reportar incidentes (`POST`). |
| **SUPERVISOR** | `supervisor@incidentes.com` | `Supervisor123!` | Consultar (`GET`), registrar (`POST`), actualizar estado y resolución técnica (`PUT/PATCH`). |
| **ADMINISTRADOR** | `admin@incidentes.com` | `Admin123!` | Control Total del sistema (`GET`, `POST`, `PUT/PATCH`, `DELETE`). |

