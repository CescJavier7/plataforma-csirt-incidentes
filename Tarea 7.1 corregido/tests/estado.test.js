const { puedeCambiarEstado } = require("../src/utils/estado");

describe("Pruebas Unitarias - Módulo de Transición de Estados (Unidad 7)", () => {

  test("Caso 1 (Defecto 1 corregido): Debe rechazar el cierre si la resolución está vacía", () => {
    // Arrange (Organizar)
    const estadoActual = "EN_PROCESO";
    const nuevoEstado = "CERRADO";
    const resolucionInvalida = "   ";

    // Act (Actuar)
    const resultado = puedeCambiarEstado(estadoActual, nuevoEstado, resolucionInvalida);

    // Assert (Afirmar)
    expect(resultado.valido).toBe(false);
    expect(resultado.razon).toMatch(/obligatorio ingresar una resolución/i);
  });

  test("Caso 2: Debe permitir el cierre cuando se entrega una justificación técnica válida", () => {
    // Arrange
    const estadoActual = "EN_PROCESO";
    const nuevoEstado = "CERRADO";
    const resolucionValida = "Regla de firewall perimetral aplicada y host aislado.";

    // Act
    const resultado = puedeCambiarEstado(estadoActual, nuevoEstado, resolucionValida);

    // Assert
    expect(resultado.valido).toBe(true);
    expect(resultado.razon).toBe("Transición permitida");
  });

  test("Caso 3: No debe permitir reactivar un incidente que ya se encuentra CERRADO", () => {
    // Arrange
    const estadoActual = "CERRADO";
    const nuevoEstado = "EN_PROCESO";

    // Act
    const resultado = puedeCambiarEstado(estadoActual, nuevoEstado);

    // Assert
    expect(resultado.valido).toBe(false);
    expect(resultado.razon).toMatch(/no puede reactivarse directamente/i);
  });

  test("Caso 4: Debe rechazar transiciones hacia estados desconocidos o inválidos", () => {
    // Arrange
    const estadoActual = "ABIERTO";
    const nuevoEstado = "ESTADO_INEXISTENTE";

    // Act
    const resultado = puedeCambiarEstado(estadoActual, nuevoEstado);

    // Assert
    expect(resultado.valido).toBe(false);
    expect(resultado.razon).toBe("Estado de destino no válido");
  });

  test("Caso 5: Debe permitir transiciones regulares entre ABIERTO y EN_PROCESO", () => {
    // Arrange
    const estadoActual = "ABIERTO";
    const nuevoEstado = "EN_PROCESO";

    // Act
    const resultado = puedeCambiarEstado(estadoActual, nuevoEstado);

    // Assert
    expect(resultado.valido).toBe(true);
  });
});