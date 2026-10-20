const request = require("supertest");
process.env.NODE_ENV = "test";
process.env.INCIDENTE_ANALISTA_USERNAME = "analista-test";
process.env.INCIDENTE_ANALISTA_PASSWORD = "test-analista-password";
process.env.INCIDENTE_SUPERVISOR_USERNAME = "supervisor-test";
process.env.INCIDENTE_SUPERVISOR_PASSWORD = "test-supervisor-password";
process.env.INCIDENTE_ADMIN_USERNAME = "admin-test";
process.env.INCIDENTE_ADMIN_PASSWORD = "test-admin-password";
const app = require("../src/server");

describe("Pruebas de Integración - API de Incidentes y Controlador (Supertest)", () => {

  describe("GET /api/incidentes - Listado y Optimización de Rendimiento", () => {
    test("Debe retornar estado 200 con la cabecera Cache-Control optimizada", async () => {
      // Act
      const response = await request(app)
        .get("/api/incidentes")
        .auth("analista-test", "test-analista-password");

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers["content-security-policy"]).toBeDefined();
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["cache-control"]).toBe("private, no-store");
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("Debe retornar la proyección optimizada (incluyendo resolución y excluyendo metadatos pesados)", async () => {
      // Act
      const response = await request(app)
        .get("/api/incidentes")
        .auth("analista-test", "test-analista-password");
      const primerIncidente = response.body[0];

      // Assert: campos indispensables presentes para la vista
      expect(primerIncidente).toHaveProperty("id");
      expect(primerIncidente).toHaveProperty("titulo");
      expect(primerIncidente).toHaveProperty("prioridad");
      expect(primerIncidente).toHaveProperty("estado");
      expect(primerIncidente).toHaveProperty("resolucion");

      // Assert: proyección optimizada (no transporta createdAt en el resumen del tablero)
      expect(primerIncidente).not.toHaveProperty("createdAt");
    });
  });

  describe("GET /api/incidentes/:id - Defecto 2: Validación defensiva y manejo de errores", () => {
    test("Debe rechazar la consulta sin credenciales", async () => {
      const response = await request(app).get("/api/incidentes");

      expect(response.status).toBe(401);
      expect(response.headers["cache-control"]).toBe("private, no-store");
      expect(response.headers["www-authenticate"]).toMatch(/^Basic /);
    });

    test("Debe retornar 400 Bad Request cuando el identificador no es numérico (defecto 2)", async () => {
      // Arrange
      const idInvalido = "abc";

      // Act
      const response = await request(app)
        .get(`/api/incidentes/${idInvalido}`)
        .auth("analista-test", "test-analista-password");

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Parámetro inválido");
      expect(response.body.detalle).toMatch(/número entero positivo/i);
    });

    test("Debe retornar 400 Bad Request cuando el identificador es menor o igual a cero", async () => {
      // Arrange
      const idNegativo = -5;

      // Act
      const response = await request(app)
        .get(`/api/incidentes/${idNegativo}`)
        .auth("analista-test", "test-analista-password");

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Parámetro inválido");
    });

    test("Debe retornar 404 Not Found cuando el incidente no existe", async () => {
      // Arrange
      const idInexistente = 9999;

      // Act
      const response = await request(app)
        .get(`/api/incidentes/${idInexistente}`)
        .auth("analista-test", "test-analista-password");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "No encontrado");
    });

    test("Debe retornar 200 OK con el incidente solicitado cuando el ID es válido y existente", async () => {
      // Arrange
      const idExistente = 1;

      // Act
      const response = await request(app)
        .get(`/api/incidentes/${idExistente}`)
        .auth("analista-test", "test-analista-password");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("titulo");
      expect(response.body).toHaveProperty("estado");
    });
  });

  describe("PATCH /api/incidentes/:id/estado - Actualización y Reglas de Negocio", () => {
    test("Debe rechazar la actualización sin credenciales", async () => {
      const response = await request(app)
        .patch("/api/incidentes/1/estado")
        .send({ nuevoEstado: "EN_PROCESO" });

      expect(response.status).toBe(401);
      expect(response.headers["www-authenticate"]).toMatch(/^Basic /);
    });

    test("ANALISTA puede consultar pero no actualizar estados", async () => {
      const response = await request(app)
        .patch("/api/incidentes/1/estado")
        .auth("analista-test", "test-analista-password")
        .send({ nuevoEstado: "EN_PROCESO" });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Permiso insuficiente");
    });

    test("Debe rechazar credenciales incorrectas", async () => {
      const response = await request(app)
        .patch("/api/incidentes/1/estado")
        .auth("analista-test", "incorrect-password")
        .send({ nuevoEstado: "EN_PROCESO" });

      expect(response.status).toBe(401);
    });

    test("Debe rechazar con 400 el cierre de un incidente si la resolución técnica está vacía (defecto 1)", async () => {
      // Arrange
      const payload = {
        nuevoEstado: "CERRADO",
        resolucion: "   "
      };

      // Act
      const response = await request(app)
        .patch("/api/incidentes/1/estado")
        .auth("supervisor-test", "test-supervisor-password")
        .send(payload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/obligatorio ingresar una resolución/i);
    });

    test("Debe permitir con 200 el cambio de estado cuando cumple todas las reglas", async () => {
      // Arrange
      const payload = {
        nuevoEstado: "EN_PROCESO",
        resolucion: ""
      };

      // Act
      const response = await request(app)
        .patch("/api/incidentes/3/estado")
        .auth("supervisor-test", "test-supervisor-password")
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("estado", "EN_PROCESO");
    });

  });

});
