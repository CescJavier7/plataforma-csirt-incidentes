/* global btoa, TextEncoder */

const estadoElement = document.querySelector("#estado");
const listaElement = document.querySelector("#lista-incidentes");
const formEstado = document.querySelector("#form-estado");

function crearHeaderAutorizacion() {
  const username = document.querySelector("#editor-usuario").value;
  const password = document.querySelector("#editor-password").value;
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `Basic ${btoa(binary)}`;
}

async function cargarIncidentes() {
  try {
    const res = await fetch("/api/incidentes", {
      headers: { Authorization: crearHeaderAutorizacion() }
    });
    if (!res.ok) {
      if (res.status === 401) {
        estadoElement.textContent = "Credenciales incorrectas o no ingresadas.";
        return;
      }
      throw new Error(`Respuesta HTTP ${res.status}`);
    }
    const data = await res.json();
    listaElement.replaceChildren(
      ...data.map((item) => {
        const incidente = document.createElement("div");
        incidente.className = "incidente-item";

        const titulo = document.createElement("h3");
        titulo.textContent = `[#${item.id}] ${item.titulo}`;
        incidente.append(titulo);

        const estado = document.createElement("p");
        const severidadLabel = document.createElement("strong");
        severidadLabel.textContent = "Severidad:";
        const estadoLabel = document.createElement("strong");
        estadoLabel.textContent = "Estado:";
        estado.append(
          severidadLabel,
          ` ${item.prioridad} | `,
          estadoLabel,
          ` ${item.estado}`
        );
        incidente.append(estado);

        const resolucion = document.createElement("p");
        const resolucionLabel = document.createElement("em");
        resolucionLabel.textContent = "Resolución:";
        resolucion.append(
          resolucionLabel,
          ` ${item.resolucion || "Pendiente de resolución"}`
        );
        incidente.append(resolucion);

        return incidente;
      })
    );
    estadoElement.textContent = `Plataforma sincronizada: ${data.length} incidentes cargados.`;
  } catch (error) {
    console.error("Fallo al obtener incidentes:", error);
    estadoElement.textContent = "Error al conectar con el servidor.";
  }
}

document.querySelector("#btn-consultar").addEventListener("click", cargarIncidentes);

formEstado.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.querySelector("#incidente-id").value;
  const nuevoEstado = document.querySelector("#nuevo-estado").value;
  const resolucion = document.querySelector("#resolucion").value;
  try {
    const res = await fetch(`/api/incidentes/${id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: crearHeaderAutorizacion()
      },
      body: JSON.stringify({ nuevoEstado, resolucion })
    });

    const resultado = await res.json();
    if (!res.ok) {
      const mensaje =
        res.status === 429
          ? "Límite de solicitudes alcanzado. Espere 15 minutos."
          : resultado.error;
      alert(`Error ${res.status}: ${mensaje}`);
    } else {
      alert("Estado actualizado exitosamente");
      await cargarIncidentes();
    }
  } catch (err) {
    console.error("Fallo en la petición PATCH:", err);
    alert("Error de red al actualizar estado.");
  }
});

estadoElement.textContent = "Ingrese las credenciales de editor para consultar o actualizar incidentes.";