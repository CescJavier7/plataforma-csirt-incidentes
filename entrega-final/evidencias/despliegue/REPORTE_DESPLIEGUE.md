# 🌐 Evidencia de Despliegue en la Nube y Configuración HTTPS

## 1. Topología del Despliegue en Producción

El despliegue en la nube ha sido orquestado bajo un esquema de tres capas con terminación TLS estricta:

```
[ Internet / Analistas SOC ]
             │
             ▼  HTTPS (Puerto 443 / TLS 1.3 - Let's Encrypt / Cloudflare)
[ Proxy Perimetral Nginx 1.27 Alpine ]
   ├── Compresión Gzip dinámica
   ├── Caché estática (Cache-Control: public, max-age=86400)
   ├── Rate Limit perimetral (limit_req: 20 req/s)
   └── Headers de protección (X-Frame-Options, X-Content-Type-Options)
             │
             ▼  HTTP (Red interna Docker privada / 127.0.0.1:3000)
[ Servicio Web Node.js 22 LTS Alpine ] (Usuario no privilegiado `node`)
             │
             ▼  TCP (Puerto 3306 - Red interna segura)
[ Base de Datos Relacional MySQL 8.4 LTS ] (Almacenamiento persistente en volumen)
```

---

## 2. Parámetros de Seguridad del Certificado SSL/TLS Verificados
- **Protocolo mínimo:** TLSv1.2 y TLSv1.3.
- **Cifrado:** Curvas elípticas ECDHE-ECDSA-AES128-GCM-SHA256 y ECDHE-RSA-AES256-GCM-SHA384.
- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- **Calificación SSL Labs:** A+.

