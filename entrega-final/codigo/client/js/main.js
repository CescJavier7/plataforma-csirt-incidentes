import {
  estaAutenticado,
  obtenerUsuario,
  login,
  logout,
  tieneRol,
} from './auth.js';
import {
  listarIncidentes,
  crearIncidente,
  actualizarIncidente,
  eliminarIncidente,
} from './incidentes.js';
import { onNoAutorizado } from './api.js';

const $ = (id) => document.getElementById(id);

const vistaLogin = $('vista-login');
const vistaPanel = $('vista-panel');
const sesion = $('sesion');
const mensaje = $('mensaje');
const tabla = $('tabla-incidentes');
const tablaVacia = $('tabla-vacia');
const plantillaFila = $('tpl-fila');
const filtroEstado = $('filtro-estado');
const filtroPrioridad = $('filtro-prioridad');

function mostrarMensaje(texto, tipo = 'info', detalles = []) {
  mensaje.className = `mensaje ${tipo}`;
  mensaje.replaceChildren();

  const p = document.createElement('p');
  p.textContent = texto;
  mensaje.appendChild(p);

  if (detalles && detalles.length > 0) {
    const ul = document.createElement('ul');
    for (const d of detalles) {
      const li = document.createElement('li');
      li.textContent = d.campo ? `${d.campo}: ${d.mensaje}` : (d.mensaje || d);
      ul.appendChild(li);
    }
    mensaje.appendChild(ul);
  }

  mensaje.hidden = false;
  setTimeout(() => {
    mensaje.hidden = true;
  }, 6000);
}

function manejarError(error) {
  if (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404) {
    mostrarMensaje(error.message, 'error', error.detalles || []);
  } else {
    mostrarMensaje(`Error en la operación: ${error.message}`, 'error');
    console.error(error);
  }
}

function aplicarPermisosUI(raiz = document) {
  raiz.querySelectorAll('[data-roles]').forEach((el) => {
    const roles = el.dataset.roles.split(',');
    el.hidden = !tieneRol(...roles);
  });
}

function mostrarVista() {
  const autenticado = estaAutenticado();
  vistaLogin.hidden = autenticado;
  vistaPanel.hidden = !autenticado;
  sesion.hidden = !autenticado;

  if (autenticado) {
    const usuario = obtenerUsuario();
    $('sesion-usuario').textContent = usuario?.nombre || usuario?.email || '';
    $('sesion-rol').textContent = usuario?.rol || '';
    $('sesion-rol').className = `insignia ${usuario?.rol === 'ADMIN' ? 'p-critica' : usuario?.rol === 'SUPERVISOR' ? 'p-alta' : 'p-baja'}`;
    aplicarPermisosUI();
    cargarIncidentes();
  }
}

function crearFila(incidente) {
  const fila = plantillaFila.content.firstElementChild.cloneNode(true);
  fila.dataset.id = incidente.id;

  fila.querySelector('[data-campo="id"]').textContent = `#${incidente.id}`;
  fila.querySelector('[data-campo="titulo"]').textContent = incidente.titulo;
  
  const descEl = fila.querySelector('[data-campo="descripcion"]');
  descEl.textContent = incidente.descripcion;

  if (incidente.resolucion) {
    const resBox = document.createElement('div');
    resBox.className = 'resolucion-box';
    resBox.textContent = `Resolución: ${incidente.resolucion}`;
    descEl.appendChild(resBox);
  }

  const prioridad = fila.querySelector('[data-campo="prioridad"]');
  prioridad.textContent = incidente.prioridad;
  prioridad.className = `insignia p-${String(incidente.prioridad).toLowerCase()}`;

  const estadoSelect = fila.querySelector('[data-campo="estado"]');
  estadoSelect.value = incidente.estado;
  estadoSelect.disabled = !tieneRol('SUPERVISOR', 'ADMIN') || incidente.estado === 'CERRADO';

  aplicarPermisosUI(fila);
  return fila;
}

async function cargarIncidentes() {
  try {
    const filtros = {};
    if (filtroEstado && filtroEstado.value) filtros.estado = filtroEstado.value;
    if (filtroPrioridad && filtroPrioridad.value) filtros.prioridad = filtroPrioridad.value;

    const incidentes = await listarIncidentes(filtros);
    tabla.replaceChildren(...incidentes.map(crearFila));
    tablaVacia.hidden = incidentes.length > 0;
  } catch (error) {
    manejarError(error);
  }
}

// Eventos
$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const datos = new FormData(form);
  try {
    const usuario = await login(
      String(datos.get('email')).trim(),
      String(datos.get('password'))
    );
    form.reset();
    mostrarMensaje(`Bienvenido/a, ${usuario.nombre} (${usuario.rol})`, 'exito');
    mostrarVista();
  } catch (error) {
    manejarError(error);
  }
});

$('btn-logout').addEventListener('click', () => {
  logout();
  tabla.replaceChildren();
  mostrarVista();
  mostrarMensaje('Sesión cerrada correctamente', 'info');
});

$('form-crear').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const datos = new FormData(form);
  try {
    const creado = await crearIncidente({
      titulo: String(datos.get('titulo')),
      descripcion: String(datos.get('descripcion')),
      prioridad: String(datos.get('prioridad')),
    });
    form.reset();
    mostrarMensaje(`Incidente #${creado.id} creado exitosamente`, 'exito');
    await cargarIncidentes();
  } catch (error) {
    manejarError(error);
  }
});

// Delegación de eventos en tabla
tabla.addEventListener('click', async (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const fila = boton.closest('tr');
  const id = fila.dataset.id;

  try {
    if (boton.dataset.accion === 'actualizar') {
      const nuevoEstado = fila.querySelector('[data-campo="estado"]').value;
      let resolucion = undefined;

      // Regla de Negocio (Unidad 7): Para cerrar es obligatorio registrar resolución
      if (nuevoEstado === 'CERRADO') {
        resolucion = prompt('Ingrese la resolución técnica de contención/mitigación (mínimo 5 caracteres):');
        if (!resolucion || resolucion.trim().length < 5) {
          mostrarMensaje('Para cerrar un incidente es obligatorio ingresar una resolución de al menos 5 caracteres.', 'error');
          return;
        }
      }

      await actualizarIncidente(id, {
        estado: nuevoEstado,
        ...(resolucion ? { resolucion: resolucion.trim() } : {}),
      });

      mostrarMensaje(`Incidente #${id} actualizado a ${nuevoEstado}`, 'exito');
    } else if (boton.dataset.accion === 'eliminar') {
      if (!confirm(`¿Confirma la eliminación del incidente #${id}? Esta acción no se puede deshacer.`)) return;
      await eliminarIncidente(id);
      mostrarMensaje(`Incidente #${id} eliminado del sistema`, 'exito');
    }
    await cargarIncidentes();
  } catch (error) {
    manejarError(error);
  }
});

$('btn-refrescar').addEventListener('click', cargarIncidentes);
if (filtroEstado) filtroEstado.addEventListener('change', cargarIncidentes);
if (filtroPrioridad) filtroPrioridad.addEventListener('change', cargarIncidentes);

onNoAutorizado(() => {
  logout();
  mostrarVista();
  mostrarMensaje('Su sesión ha caducado. Inicie sesión nuevamente.', 'error');
});

mostrarVista();

