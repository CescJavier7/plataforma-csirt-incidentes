# 🚀 Guía Técnica Integral de Despliegue en Producción
## Plataforma de Gestión y Respuesta a Incidentes CSIRT / SOC

Esta guía documenta los procedimientos estándar para el aprovisionamiento, configuración, despliegue y mantenimiento continuo de la **Plataforma CSIRT** en entornos de infraestructura productiva.

---

## 📋 1. Requisitos Previos y Dimensionamiento

### 1.1 Especificaciones de Servidor Recomendadas
* **Entorno de Pruebas / Staging:** 1 vCPU, 1 GB RAM, 20 GB SSD.
* **Entorno de Producción (Tráfico Medio / 50 analistas concurrentes):** 2 vCPUs, 4 GB RAM, 50 GB SSD NVMe.
* **Sistema Operativo Recomendado:** Ubuntu Server 22.04 LTS o 24.04 LTS / Debian 12 / Rocky Linux 9.

### 1.2 Dependencias del Sistema
* Docker Engine v24.0+ y Docker Compose v2.20+ (para despliegue en contenedores).
* Node.js v20.x o v22.x LTS y npm v10+ (para despliegue bare-metal o VPS).
* Servidor MySQL v8.4 LTS (si no se utiliza Docker).
* Nginx v1.24+ o Caddy v2 (como reverse proxy y terminador SSL/TLS).

---

## 🐳 2. Despliegue Automatizado con Docker Compose (Recomendado)

El método más seguro y estandarizado para desplegar la plataforma es utilizando la pila de tres capas orquestada en `PROYECTO_FINAL_PRODUCCION/docker-compose.yml`:
1. **`db`**: MySQL 8.4 LTS con volúmenes de almacenamiento persistente y healthcheck nativo.
2. **`app`**: Contenedor Node.js 22 Alpine, ejecutando bajo usuario sin privilegios (`node`), ejecutando migraciones y siembra al arrancar.
3. **`proxy`**: Nginx Alpine como proxy inverso perimetral con compresión gzip y caché de estáticos.

### Paso 2.1: Clonación y Preparación de Variables de Entorno
En el servidor de producción:

```bash
cd /opt
git clone <URL_DEL_REPOSITORIO> csirt-platform
cd csirt-platform/PROYECTO_FINAL_PRODUCCION

# Crear archivo de entorno de producción a partir de la plantilla
cp .env.example .env
```

Edite el archivo `.env` configurando secretos criptográficos de alta entropía:
```bash
nano .env
```
> [!IMPORTANT]
> Genere un secreto JWT seguro con:
> ```bash
> openssl rand -base64 48
> ```
> Configure también contraseñas únicas para MySQL y `ADMIN_PASSWORD`, `SUPERVISOR_PASSWORD` y `ANALISTA_PASSWORD`. La aplicación falla al arrancar si falta una variable crítica o si `JWT_SECRET` tiene menos de 32 bytes.
> Como `MYSQL_PASSWORD` se incluye en la URL de conexión de Compose, genérelo en hexadecimal: `openssl rand -hex 24`.

El proxy se publica solo en `127.0.0.1:80`; no exponga el puerto 3000 ni HTTP directamente. Para acceso remoto, use un terminador TLS confiable y rote los secretos antiguos.

### Paso 2.2: Construcción y Lanzamiento de la Pila
```bash
docker compose up --build -d
```

### Paso 2.3: Verificación del Estado de los Contenedores
```bash
docker compose ps
docker compose logs -f app
```

Verifique la salud del sistema accediendo a:
```bash
curl http://localhost/api/health
```
Respuesta esperada:
```json
{"status":"UP","persistence":"prisma","timestamp":"2026-10-19T23:30:00.000Z"}
```

---

## 🖥️ 3. Despliegue en Servidor VPS Linux (Bare-Metal / Sin Docker)

Si se prefiere una instalación directa en una instancia virtual Linux (ej. DigitalOcean, AWS EC2, Linode, Hetzner):

### Paso 3.1: Instalación de Node.js, MySQL y Nginx
```bash
# Actualizar repositorios
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx mysql-server git

# Instalar PM2 para gestión de procesos en segundo plano
sudo npm install -g pm2
```

### Paso 3.2: Configuración de la Base de Datos MySQL 8.4
Acceda a la consola de MySQL y cree la base de datos y usuario dedicado:
```sql
sudo mysql

CREATE DATABASE csirt_incidentes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'csirt_user'@'localhost' IDENTIFIED WITH caching_sha2_password BY '<SECRETO_UNICO_GENERADO_FUERA_DEL_REPOSITORIO>';
GRANT ALL PRIVILEGES ON csirt_incidentes.* TO 'csirt_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3.3: Configuración del Proyecto y Migraciones Prisma
```bash
cd /var/www/
sudo git clone <URL_DEL_REPOSITORIO> csirt-platform
cd csirt-platform/PROYECTO_FINAL_PRODUCCION

# Asignar permisos al usuario de despliegue
sudo chown -R $USER:$USER /var/www/csirt-platform

# Instalar dependencias de producción
npm ci --omit=dev

# Configurar variables de entorno
cp .env.example .env
# Configure DATABASE_URL with your MySQL account and URL-encoded password

# Ejecutar migraciones y siembra
npx prisma migrate deploy
node prisma/seed.js
```

### Paso 3.4: Gestión del Proceso con PM2
```bash
# Iniciar la aplicación con PM2
pm2 start src/server.js --name "csirt-api" -i max --env production

# Configurar arranque automático tras reinicio del servidor
pm2 startup
pm2 save
```

### Paso 3.5: Configuración de Nginx y Certificados SSL/TLS (HTTPS)
Copie la configuración de Nginx:
```bash
sudo cp nginx/conf.d/default.conf /etc/nginx/sites-available/csirt.conf
sudo ln -s /etc/nginx/sites-available/csirt.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Para habilitar HTTPS de forma gratuita y automatizada mediante Certbot (Let's Encrypt):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d incidentes.suempresa.com
```

---

## ☁️ 4. Despliegue en Plataformas Cloud PaaS (Render, Railway, AWS App Runner)

Para desplegar en servicios Serverless o PaaS:

### 4.1 Railway / Render
1. Conecte su repositorio GitHub a la plataforma.
2. Cree un servicio **MySQL** gestionado e inhiera la variable `DATABASE_URL`.
3. Configure el servicio web con:
   - **Root Directory:** `PROYECTO_FINAL_PRODUCCION`
   - **Build Command:** `npm ci && npx prisma generate`
   - **Start Command:** `npx prisma migrate deploy && node prisma/seed.js && node src/server.js`
4. En la pestaña de Variables de Entorno, defina:
   - `NODE_ENV=production`
   - `PERSISTENCE=prisma`
   - `JWT_SECRET=<secreto_aleatorio>`
   - `CLIENT_ORIGIN=https://su-dominio.up.railway.app`
   - `HOST=0.0.0.0` solo si el ingress de la plataforma termina TLS.

---

## 🛡️ 5. Políticas de Respaldo y Recuperación (Disaster Recovery)

### 5.1 Respaldo Diario Automatizado de Base de Datos
Configure una tarea en `cron` para generar respaldos diarios comprimidos:
```bash
sudo crontab -e
```
Agregue la siguiente directiva para ejecutar el respaldo a las 02:00 AM:
```bash
0 2 * * * mysqldump --defaults-extra-file=/root/.my.cnf csirt_incidentes | gzip > /backups/csirt_$(date +\%F).sql.gz
```
El archivo `/root/.my.cnf` debe contener las credenciales del usuario de respaldo y tener permisos `0600`; no incluya contraseñas en la línea de comandos ni en crontab.

### 5.2 Procedimiento de Restauración
```bash
gunzip < /backups/csirt_2026-10-19.sql.gz | mysql -u csirt_user -p csirt_incidentes
```

---

## 🔒 6. Checklist de Seguridad Pre-Lanzamiento (Auditoría CSIRT)

- [x] **Protección contra Inyecciones SQL:** Verificada mediante consultas parametrizadas con Prisma ORM.
- [x] **Sanitización contra XSS:** Implementada con `sanitize-html` eliminando scripts en el cuerpo de peticiones.
- [x] **Autenticación y Sesiones:** Tokens JWT firmados con expiración predeterminada de 30 minutos.
- [x] **Cifrado de Credenciales:** Hashing unidireccional con Bcrypt (12 rondas de salt).
- [x] **Control de Acceso (RBAC):** Restricción en backend (`autorizar('ADMIN')` para eliminación, `SUPERVISOR` para estados).
- [x] **Validación de Datos:** Esquemas declarativos Zod que impiden campos no reconocidos y tipos erróneos.
- [x] **Cabeceras HTTP de Seguridad:** `helmet` activo (`CSP`, `HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`).
- [x] **Mitigación de DoS / Fuerza Bruta:** `express-rate-limit` (300 req/15 min en API, 15 req/15 min en login).
- [x] **Optimización de Rendimiento:** Imágenes en formato WebP con compresión de 93.6% y cabeceras de caché HTTP.
