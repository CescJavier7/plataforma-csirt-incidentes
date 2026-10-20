import { ApiError, onNoAutorizado } from './api.js';
import { login, logout, estaAutenticado, obtenerUsuario, tieneRol } from './auth.js';
import {
  listarIncidentes,
  crearIncidente,
  actualizarIncidente,
  eliminarIncidente,
} from './incidentes.js';

// ---------- Referencias al DOM ----------
const $ = (id) => document.getElementById(id);
const vistaLogin = $('vista-login');
const vistaPanel = $('vista-panel');
const sesion = $('sesion');
const mensaje = $('mensaje');
const tabla = $('tabla-incidentes');
const tablaVacia = $('tabla-vacia');
const plantillaFila = $('tpl-fila');
const filtroEstado = $('filtro-estado');

// ---------- Mensajes (SIEMPRE con textContent, nunca innerHTML) ----------
let temporizador;
function mostrarMensaje(texto, tipo = 'info', detalles = []) {
  mensaje.replaceChildren();
  mensaje.className = `mensaje ${tipo}`;

  const principal = document.createElement('strong');
  principal.textContent = texto;
  mensaje.append(principal);

  if (detalles.length) {
    const lista = document.createElement('ul');
    for (const d of detalles) {
      const li = document.createElement('li');
      li.textContent = d.campo ? `${d.campo}: ${d.mensaje}` : String(d.mensaje ?? d);
      lista.append(li);
    }
    mensaje.append(lista);
  }

  mensaje.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (mensaje.hidden = true), 6000);
}

function manejarError(error) {
  if (error instanceof ApiError) {
    const prefijos = { 0: 'Conexión', 400: 'Datos inválidos', 401: 'No autenticado', 403: 'Sin permisos', 404: 'No encontrado', 429: 'Demasiadas peticiones' };
    const prefijo = prefijos[error.status] ? `${prefijos[error.status]}: ` : '';
    mostrarMensaje(`${prefijo}${error.message}`, 'error', error.errores);
  } else {
    mostrarMensaje('Error inesperado en el cliente', 'error');
    console.error(error);
  }
}

// ---------- Vistas ----------
function aplicarPermisosUI(raiz = document) {
  // Oculta controles no permitidos (la autorización REAL la hace el servidor)
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
    $('sesion-usuario').textContent = usuario?.nombre ?? usuario?.email ?? '';
    $('sesion-rol').textContent = usuario?.rol ?? '';
    aplicarPermisosUI();
    cargarIncidentes();
  }
}

// ---------- Renderizado seguro de la tabla ----------
function crearFila(incidente) {
  const fila = plantillaFila.content.firstElementChild.cloneNode(true);
  fila.dataset.id = incidente.id;

  fila.querySelector('[data-campo="id"]').textContent = incidente.id;
  fila.querySelector('[data-campo="titulo"]').textContent = incidente.titulo;
  fila.querySelector('[data-campo="descripcion"]').textContent = incidente.descripcion;

  const prioridad = fila.querySelector('[data-campo="prioridad"]');
  prioridad.textContent = incidente.prioridad;
  prioridad.classList.add(`p-${String(incidente.prioridad).toLowerCase()}`);

  const estado = fila.querySelector('[data-campo="estado"]');
  estado.value = incidente.estado;
  estado.disabled = !tieneRol('SUPERVISOR', 'ADMIN');

  aplicarPermisosUI(fila);
  return fila;
}

async function cargarIncidentes() {
  try {
    const incidentes = await listarIncidentes({ estado: filtroEstado.value });
    tabla.replaceChildren(...incidentes.map(crearFila));
    tablaVacia.hidden = incidentes.length > 0;
  } catch (error) {
    manejarError(error);
  }
}

// ---------- Eventos ----------
$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const datos = new FormData(form);
  try {
    const usuario = await login(String(datos.get('email')).trim(), String(datos.get('password')));
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
  mostrarMensaje('Sesión cerrada', 'info');
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
    mostrarMensaje(`Incidente #${creado.id} creado`, 'exito');
    await cargarIncidentes();
  } catch (error) {
    manejarError(error);
  }
});

// Delegación de eventos para los botones de cada fila
tabla.addEventListener('click', async (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const fila = boton.closest('tr');
  const id = fila.dataset.id;

  try {
    if (boton.dataset.accion === 'actualizar') {
      const estado = fila.querySelector('[data-campo="estado"]').value;
      let resolucion = undefined;
      if (estado === 'CERRADO') {
        resolucion = prompt('Ingrese la resolución técnica del incidente (obligatoria para cerrar):');
        if (!resolucion || resolucion.trim().length < 5) {
          mostrarMensaje('Para cerrar un incidente es obligatorio ingresar una resolución de al menos 5 caracteres.', 'error');
          return;
        }
      }
      await actualizarIncidente(id, { estado, ...(resolucion ? { resolucion } : {}) });
      mostrarMensaje(`Incidente #${id} actualizado a ${estado}`, 'exito');
    } else if (boton.dataset.accion === 'eliminar') {
      if (!confirm(`¿Eliminar el incidente #${id}?`)) return;
      await eliminarIncidente(id);
      mostrarMensaje(`Incidente #${id} eliminado`, 'exito');
    }
    await cargarIncidentes();
  } catch (error) {
    manejarError(error);
  }
});

$('btn-refrescar').addEventListener('click', cargarIncidentes);
filtroEstado.addEventListener('change', cargarIncidentes);

// Si la API responde 401 (token expirado/inválido) se fuerza el regreso al login
onNoAutorizado(() => {
  logout();
  mostrarVista();
});

mostrarVista();
