import {
  solicitar,
  guardarToken,
  borrarToken,
  leerToken,
  configurarSesionVencida,
} from './api.js';
import { mostrarAcceso } from './acceso.js';
import { mostrarEquipos } from './equipos.js';
import { abrirEditor } from './editor.js';
import { app, icono, abrirModal, modal, escapar, avisar } from './interfaz.js';

// guarda el perfil de la sesión mientras la página está abierta
let usuario = null;

const cuenta = document.querySelector('#cuenta');
cuenta.innerHTML = icono('usuario');

// decide si se ve el acceso o los equipos según la sesión activa
async function lista() {
  cuenta.hidden = !usuario;
  if (!usuario) return mostrarAcceso(ingresar);
  await mostrarEquipos((equipo, posicion) => abrirEditor(equipo, lista, posicion));
}

// recibe el perfil después del registro o del inicio de sesión
async function ingresar(respuesta) {
  guardarToken(respuesta.token);
  usuario = respuesta.usuario;
  await lista();
}

// el logo vuelve a la pantalla principal y la cuenta abre su ventana
document.querySelector('header .marca').onclick = evento => {
  evento.preventDefault();
  lista();
};
cuenta.onclick = () => {
  abrirModal(
    'Mi cuenta',
    `
      <p>${escapar(usuario.correo)}</p>
      <button class="primario" data-salir>Cerrar sesión</button>
    `,
  );
  modal.querySelector('[data-salir]').onclick = salir;
};

// el servidor no guarda sesiones así que salir consiste en borrar el token de la pestaña
function salir() {
  borrarToken();
  usuario = null;
  if (modal.open) modal.close();
  return lista();
}

configurarSesionVencida(() => {
  salir();
  avisar('Tu sesión venció. Volvé a iniciar sesión.');
});

// al cargar preguntamos si el navegador ya tiene una sesión abierta
async function iniciar() {
  app.innerHTML = '<p class="cargando">Preparando tu aventura…</p>';
  try {
    usuario = leerToken() ? await solicitar('/acceso/sesion') : null;
    await lista();
  } catch {
    mostrarAcceso(
      ingresar,
      false,
      'No se pudo conectar con el servidor. Revisá que esté iniciado.',
    );
  }
}

iniciar();
