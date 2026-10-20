# 📚 Documentación Oficial del Proyecto — Tarea 1: Desarrollo de Plataformas Web

## Sistema SOC Hospitalario: Hospital Clínico San Rafael

Bienvenido a la carpeta de documentación técnica y registro de trazabilidad del proyecto **`proyecto-incidentes-tema1`**.

Este repositorio contiene el código, las decisiones arquitectónicas, el registro íntegro de interacciones entre los agentes inteligentes y el usuario, así como las evaluaciones de auditoría técnica continua realizadas para el desarrollo de la interfaz web de un **Centro de Operaciones de Seguridad (SOC) especializado en el entorno de un hospital mediano**.

---

## 🗂️ Estructura del Proyecto

```text
c:/Desarrollo de Plataformas/Tarea 1/
├── .antigravity/
│   ├── Agente_constructor.md   # Prompt de sistema del Agente 1 (Constructor Front-End)
│   └── Agente_auditor.md       # Prompt de sistema del Agente 2 (Auditor Técnico y WCAG)
└── proyecto-incidentes-tema1/
    ├── assets/                 # Recursos multimedia, logotipos e iconos estáticos
    │   └── .gitkeep
    ├── css/
    │   └── styles.css          # Hoja de estilos en CSS3 puro (Mobile-First, Grid, Flexbox)
    ├── docs/                   # 📁 Carpeta de Documentación Técnica y Bitácora
    │   ├── README.md                   # Índice general de la documentación (este archivo)
    │   ├── pasos_realizados.md         # Metodología y evolución paso a paso del desarrollo
    │   └── registro_chat_completo.md   # Transcripción íntegra del chat y prompts del proyecto
    └── index.html              # Documento HTML5 semántico (Cero Divitis y WCAG 2.2 AA)
```

---

## 🧭 Índice de la Documentación

1. **[Pasos Realizados y Metodología de Desarrollo (`pasos_realizados.md`)](file:///c:/Desarrollo%20de%20Plataformas/Tarea%201/proyecto-incidentes-tema1/docs/pasos_realizados.md)**:
   * Describe la secuencia cronológica de 11 fases técnicas implementadas:
     * Definición e inicialización de los roles de los agentes.
     * Estructuración del scaffolding inicial de archivos.
     * Implementación semántica HTML5 pura (Cero Divitis).
     * Arquitectura modular CSS3 (Box Model, Flexbox 1D y CSS Grid 2D con `grid-template-areas`).
     * Dictámenes y subsanaciones de Auditoría v1.0 y v2.0.
     * Adaptación temática a infraestructura crítica hospitalaria (IoMT, HIS/EHR, PACS/DICOM).

2. **[Registro Completo del Chat y Trazabilidad de Agentes (`registro_chat_completo.md`)](file:///c:/Desarrollo%20de%20Plataformas/Tarea%201/proyecto-incidentes-tema1/docs/registro_chat_completo.md)**:
   * Transcripción detallada y fidedigna de cada turno de conversación entre el **Usuario**, el **Agente Constructor (Gemini 3.8 Flash)** y el **Agente Auditor (Claude Sonnet 4.6 Thinking)**.
   * Registro de solicitudes de usuario, respuestas técnicas, dictámenes emitidos y decisiones arquitectónicas adoptadas en tiempo real.

---

## ⚙️ Modelos de Inteligencia Artificial Asignados

| Rol del Agente | Identidad y Función | Modelo de IA Oficial |
|---|---|---|
| **Agente 1 — Constructor** | Desarrollador Front-End Sénior, Arquitectura limpia y accesibilidad universal | **Gemini 3.8 Flash** |
| **Agente 2 — Auditor** | Auditor Técnico de Teoría, Accesibilidad (WCAG 2.2 AA) y Seguridad Front-End | **Claude Sonnet 4.6 Thinking** |

---

## 🎯 Resumen de Estándares Técnicos Cumplidos

* **HTML5 Semántico Estricto (Cero Divitis):** Uso exclusivo de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<time>`, `<table>`, `<progress>` y `<footer>`. Ausencia total de contenedores `<div>` en la estructura de maquetación general.
* **Accesibilidad Universal (WCAG 2.2 Nivel AA):** 100% de controles vinculados bidireccionalmente (`<label for="id">`), ayudas contextuales enlazadas (`aria-describedby`), indicadores no exclusivamente cromáticos para severidades y obligatoriedad, estilos `:focus-visible` explícitos y enlace de salto `.skip-link`.
* **Seguridad Defensiva en Capa de Presentación:** Validación nativa de formulario (`required`, `minlength`, `maxlength`, `pattern="INC-[0-9]{4}"`, `type="datetime-local"`) y filtro de carga perimetral restrictivo para extensiones forenses y médicas (`accept=".log,.pcap,.json,.txt,.csv,.hl7,.dcm"`).
* **CSS3 Moderno:** Reseteo universal con `box-sizing: border-box`, diseño responsivo *Mobile-First* (Breakpoints en `768px`, `1024px` y `1440px`), separación paradigmática entre Flexbox (1D) y CSS Grid (2D), y ratios de contraste superiores a $5.5:1$ en toda la interfaz.

