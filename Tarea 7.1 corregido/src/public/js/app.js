const estadoElement = document.querySelector("#estado");
const listaElement = document.querySelector("#lista-incidentes");
const formEstado = document.querySelector("#form-estado");

async function cargarIncidentes() {
  try {
    const res = await fetch("/api/incidentes");
    const data = await res.json();
    listaElement.innerHTML = data.map(item => `
      <div class="incidente-item">
        <h3>[#${item.id}] ${item.titulo}</h3>
        <p><strong>Severidad:</strong> ${item.prioridad} | <strong>Estado:</strong> ${item.estado}</p>
        <p><em>Resolución:</em> ${item.resolucion || "Pendiente de resolución"}</p>
      </div>
    `).join("");
    estadoElement.textContent = `Plataforma sincronizada: ${data.length} incidentes cargados.`;
  } catch (error) {
    console.error("Fallo al obtener incidentes:", error);
    estadoElement.textContent = "Error al conectar con el servidor.";
  }
}

formEstado.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.querySelector("#incidente-id").value;
  const nuevoEstado = document.querySelector("#nuevo-estado").value;
  const resolucion = document.querySelector("#resolucion").value;

  try {
    const res = await fetch(`/api/incidentes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevoEstado, resolucion })
    });

    const resultado = await res.json();
    if (!res.ok) {
      alert(`Error ${res.status}: ${resultado.error}`);
    } else {
      alert("Estado actualizado exitosamente");
      await cargarIncidentes();
    }
  } catch (err) {
    console.error("Fallo en la petición PATCH:", err);
    alert("Error de red al actualizar estado.");
  }
});

cargarIncidentes();