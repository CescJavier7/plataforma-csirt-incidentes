# Especificación y Skill de Desarrollo: Proyecto Final Integrador (Unidad 8)

## 🎯 Objetivo General

Integrar, desplegar, monitorear y documentar la versión final de la **Plataforma Web para la Gestión de Incidentes de Ciberseguridad**.

La solución debe estar desplegada en producción en la nube con HTTPS activo, contener un CRUD persistente en base de datos relacional, control de acceso basado en roles (JWT), validación estricta en servidor, ruta de salud (*health check*), registros estructurados (*logging* sin secretos) y un expediente completo con documentación técnica, manual de usuario, guion de defensa de hasta 20 minutos y matriz de lecciones aprendidas.

---

## 📁 Estructura del Expediente Final (`entrega-final/`)

```text
entrega-final/
├── codigo/                                # Código fuente completo del proyecto
│   ├── client/                            # Front-end (HTML5, CSS3, JS ES6+ / React)
│   └── server/                            # Back-end API (Node.js, Express, Prisma ORM)
├── docs/                                  # Documentación del proyecto (Punto 16.3)
│   ├── README.md                          # Manual general, requisitos e instalación
│   ├── ARQUITECTURA.md                    # Diagrama n-capas, decisiones y flujo de datos
│   ├── API.md                             # Especificación de endpoints, contratos y JWT
│   ├── PRUEBAS.md                         # Matriz de casos funcionales, unitarios y seguridad
│   ├── MANUAL_USUARIO.md                  # Guía operativa para analistas y administradores
│   └── LECCIONES_APRENDIDAS.md            # Matriz de retroalimentación y mejoras (Punto 16.5)
├── evidencias/                            # Capturas y reportes verificables
│   ├── despliegue/                        # Capturas de Render/Vercel/Netlify y HTTPS
│   ├── pruebas/                           # Reporte de Jest, ESLint y verificación CRUD
│   └── monitoreo/                         # Logs del servidor y prueba de health check
├── scripts/
│   └── verificar-entrega.js               # Script de pruebas de humo sobre la URL pública
└── DEFENSA.md                             # Guion estructurado para el video de defensa (Máx 20 min)
```