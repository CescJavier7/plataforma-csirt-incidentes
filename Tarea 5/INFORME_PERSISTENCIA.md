# INFORME TÉCNICO: PERSISTENCIA Y SEGURIDAD EN LA GESTIÓN DE INCIDENTES CON MYSQL Y PRISMA ORM

## 1. Introducción y justificación de persistencia

El almacenamiento de incidentes en memoria volátil (RAM) constituye una vulnerabilidad crítica en sistemas de soporte y seguridad hospitalaria (SOC). Retener los datos únicamente en estructuras en memoria simplifica las pruebas iniciales; no obstante, cualquier detención imprevista, reinicio operativo de Node.js o actualización de código ocasiona la pérdida inmediata y total de los registros acumulados.

Esta volatilidad imposibilita la auditoría histórica, el cumplimiento de normativas sanitarias y la trazabilidad de incidentes recurrentes. En entornos hospitalarios, perder información socava la rendición de cuentas e impide evaluar tiempos de respuesta ante fallos de infraestructura. Por ende, incorporar un motor persistente garantiza la disponibilidad, integridad, durabilidad y continuidad del servicio, protegiendo los datos frente a fallos del entorno.

## 2. Criterio de selección: SQL MySQL vs NoSQL MongoDB

La elección del motor de almacenamiento requiere contrastar los modelos relacionales (SQL) y documentales (NoSQL). Aunque MongoDB brinda flexibilidad para documentos semiestructurados, los sistemas de incidentes operan con entidades previsibles, estructuradas y sujetas a estrictas reglas de integridad referencial.

Se seleccionó MySQL 8.4 por su soporte riguroso del estándar ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad), garantizando que las modificaciones de estado y prioridad se procesen sin inconsistencias concurrentes. Como argumenta Kleppmann (2017), los sistemas relacionales ofrecen garantías de consistencia que evitan trasladar a la aplicación la resolución de anomalías. Las restricciones mediante enumeraciones (`ENUM`) y claves primarias aseguran un modelo formal óptimo para la auditoría técnica.

## 3. Rol del ORM y control de versiones con migraciones

Prisma ORM actúa como una capa de abstracción tipada entre los objetos de JavaScript y el esquema relacional de MySQL. Prisma elimina la necesidad de sentencias SQL manuales propensas a errores o inyecciones, proveyendo un cliente autogenerado con tipado estricto en tiempo de diseño.

Asimismo, el mecanismo de migraciones declarativas (`prisma migrate`) solventa la evolución del esquema sin riesgo de pérdida de datos. Según Elmasri y Navathe (2016), la independencia de datos es fundamental para alterar el catálogo estructural preservando la consistencia preexistente. Mediante archivos `migration.sql` versionados, el equipo técnico reproduce idénticos esquemas en desarrollo, pruebas y producción, integrando formalmente la base de datos en Git.

## 4. Seguridad y desacoplamiento de credenciales

La arquitectura separa la configuración sensible del código fuente mediante variables de entorno gestionadas por `dotenv`. El archivo `.env`, que almacena credenciales y la URL de conexión (`DATABASE_URL`), está estrictamente excluido del repositorio mediante `.gitignore`. Se provee `.env.example` como plantilla segura sin datos confidenciales.

En Docker Compose, se aplica el principio de privilegio mínimo: el contenedor MySQL 8.4 opera con un usuario dedicado (`app_user`) limitado a la base `incidentes_db`, prescindiendo de credenciales de superusuario (`root`). El aislamiento del contenedor y el volumen persistente (`mysql_data`) previenen fugas involuntarias de secretos y aseguran que los datos sobrevivan a la sustitución de contenedores.

## 5. Estrategia defensiva: validación multinivel y manejo centralizado de excepciones

La robustez del sistema se fundamenta en dos niveles de validación:

1. *Validación sintáctica en el perímetro de entrada:* Mediante Zod (`incidente.schema.js`), se intercepta el cuerpo (`req.body`) y los filtros (`req.query`). Zod comprueba tipos, obligatoriedad, longitudes (título entre 5 y 120 caracteres; descripción mínima de 10) y enumeraciones, devolviendo HTTP 400 ante entradas incorrectas.
2. *Validación semántica y reglas de negocio:* En la capa de servicios (`incidente.service.js`), se controlan identificadores enteros positivos y la existencia previa del recurso.

El middleware centralizado (`error.middleware.js`) actúa como escudo defensivo. Normaliza respuestas en formato JSON, traduce errores de Prisma (código `P2025` a 404) y captura fallos imprevistos retornando HTTP 500 con un mensaje genérico. Esta política ofusca trazas de pila, consultas SQL y rutas del sistema, impidiendo fugas de información.

## 6. Guía de evidencias visuales requeridas

Para sustentar la entrega práctica, deben registrarse las siguientes cinco capturas:

1. *Docker en ejecución:* Contenedor `incidentes_mysql` activo y saludable en Docker Desktop o terminal (`docker ps`).
2. *Persistencia en Base de Datos:* Registros en la tabla `incidentes` visualizados en Prisma Studio (`npx prisma studio`) o MySQL Workbench.
3. *Migración de Prisma:* Salida de consola con `npx prisma migrate dev --name init` ejecutado exitosamente.
4. *Validación Sintáctica:* Respuesta HTTP `400 Bad Request` emitida ante un payload o filtro inválido.
5. *Comprobación de Persistencia:* Consulta `GET /api/incidentes/:id` devolviendo HTTP 200 tras reiniciar el servidor Node.js.

## 7. Referencias bibliográficas

- Elmasri, R., & Navathe, S. B. (2016). *Fundamentals of database systems* (7.ª ed.). Pearson.
- Kleppmann, M. (2017). *Designing data-intensive applications: The big ideas behind reliable, scalable, and maintainable systems*. O’Reilly Media.
- MySQL. (s. f.). *MySQL documentation*. Oracle. https://dev.mysql.com/doc/
- Prisma. (s. f.). *Prisma documentation*. https://www.prisma.io/docs

