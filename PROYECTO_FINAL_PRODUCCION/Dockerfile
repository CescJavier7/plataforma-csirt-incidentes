# ==============================================================================
# Multi-stage Dockerfile para Despliegue de Producción CSIRT
# Base: Node.js 22 LTS sobre Alpine Linux (Mínima superficie de ataque)
# ==============================================================================

# ----------------- ETAPA 1: Construcción y Dependencias -----------------
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Instalar dependencias necesarias para Prisma y compilación nativa en Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

# Instalación limpia de dependencias
RUN npm ci

# Generar cliente de Prisma para la arquitectura Alpine
RUN npx prisma generate

# ----------------- ETAPA 2: Runtime de Producción -----------------
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Añadir dumb-init para gestión adecuada de señales PID 1 (evita procesos zombies)
RUN apk add --no-cache dumb-init openssl libc6-compat

# Copiar dependencias y artefactos generados desde el builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY public ./public/

# Seguridad: Ejecutar como usuario no privilegiado 'node'
USER node

# Exponer el puerto del servicio HTTP
EXPOSE 3000

# Healthcheck de contenedor para orquestadores (Docker Swarm, Kubernetes, AWS ECS)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Inicio del proceso mediante dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]

