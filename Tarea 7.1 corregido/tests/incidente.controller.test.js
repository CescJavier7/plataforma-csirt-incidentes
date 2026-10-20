const request = require("supertest");
const app = require("../src/server");

describe("Pruebas de Integración - API de Incidentes y Controlador (Supertest)", () => {

  describe("GET /api/incidentes - Listado y Optimización de Rendimiento", () => {
    test("Debe retornar estado 200 con la cabecera Cache-Control optimizada", async () => {
      // Act
      const response = await request(app).get("/api/incidentes");

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers["cache-control"]).toBe("public, max-age=60");
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("Debe retornar la proyección optimizada (incluyendo resolución y excluyendo metadatos pesados)", async () => {
      // Act
      const response = await request(app).get("/api/incidentes");
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
    test("Debe retornar 400 Bad Request cuando el identificador no es numérico (defecto 2)", async () => {
      // Arrange
      const idInvalido = "abc";

      // Act
      const response = await request(app).get(`/api/incidentes/${idInvalido}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Parámetro inválido");
      expect(response.body.detalle).toMatch(/número entero positivo/i);
    });

    test("Debe retornar 400 Bad Request cuando el identificador es menor o igual a cero", async () => {
      // Arrange
      const idNegativo = -5;

      // Act
      const response = await request(app).get(`/api/incidentes/${idNegativo}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Parámetro inválido");
    });

    test("Debe retornar 404 Not Found cuando el incidente no existe", async () => {
      // Arrange
      const idInexistente = 9999;

      // Act
      const response = await request(app).get(`/api/incidentes/${idInexistente}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "No encontrado");
    });

    test("Debe retornar 200 OK con el incidente solicitado cuando el ID es válido y existente", async () => {
      // Arrange
      const idExistente = 1;

      // Act
      const response = await request(app).get(`/api/incidentes/${idExistente}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("titulo");
      expect(response.body).toHaveProperty("estado");
    });
  });

  describe("PATCH /api/incidentes/:id/estado - Actualización y Reglas de Negocio", () => {
    test("Debe rechazar con 400 el cierre de un incidente si la resolución técnica está vacía (defecto 1)", async () => {
      // Arrange
      const payload = {
        nuevoEstado: "CERRADO",
        resolucion: "   "
      };

      // Act
      const response = await request(app)
        .patch("/api/incidentes/1/estado")
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
        .send(payload);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("estado", "EN_PROCESO");
    });
  });

});

