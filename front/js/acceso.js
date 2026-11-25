import { solicitar, imagen } from './api.js';
import { app, icono, escapar } from './interfaz.js';

// sorteamos veinte especies una vez por carga y usamos un conjunto para no repetir ninguna
const elegidos = [];

while (elegidos.length < 20) {
  const numero = 1 + Math.floor(Math.random() * 1025);
  if (!elegidos.includes(numero)) elegidos.push(numero);
}

// cada fila toma cinco especies y las dos pestañas comparten el mismo sorteo
const idsCarrusel = elegidos;
const filas = [];
for (let i = 0; i < 4; i++) {
  filas.push(idsCarrusel.slice(i * 5, i * 5 + 5));
}

function dibujarCarrusel() {
  // repetimos cada fila para que la animación vuelva al comienzo sin un salto visible
  return filas
    .map((fila, i) => {
      const imagenes = fila
        .concat(fila)
        .map(
          id => `
            <img src="${imagen(id)}" alt="" />
          `,
        )
        .join('');

      return `
        <div class="fila-carrusel">
          <div class="tira" style="--duracion:${32 + i * 6}s">${imagenes}</div>
        </div>
      `;
    })
    .join('');
}

function conectarVisibilidad(form) {
  const campo = form.elements.password;
  const boton = form.querySelector('[data-ver]');

  // cambiamos el tipo del campo y el icono sin borrar ni volver a escribir la contraseña
  boton.onclick = () => {
    const visible = campo.type === 'password';

    campo.type = visible ? 'text' : 'password';
    boton.innerHTML = icono(visible ? 'ojo-tachado' : 'ojo');
    boton.setAttribute('aria-pressed', String(visible));
    boton.setAttribute(
      'aria-label',
      visible ? 'Ocultar contraseña' : 'Mostrar contraseña',
    );
  };
}

function conectarEnvio(form, ruta, alIngresar) {
  const boton = form.querySelector('[type=submit]');
  const mensaje = form.querySelector('.error');

  form.onsubmit = async evento => {
    // evitamos recargar la página y bloqueamos el botón para no mandar el formulario dos veces
    evento.preventDefault();
    boton.disabled = true;
    mensaje.textContent = '';

    try {
      // los nombres de los campos se convierten en las claves que espera el servidor
      const datos = {
        correo: form.elements.correo.value,
        password: form.elements.password.value,
      };
      const usuario = await solicitar(ruta, 'POST', datos);

      // el servidor deja la sesión abierta y devuelve el perfil para pasar a mis equipos
      await alIngresar(usuario);
    } catch (error) {
      // si no se pudo entrar mostramos el motivo y dejamos corregir los datos
      mensaje.textContent = error.message;
      boton.disabled = false;
    }
  };
}

// el registro y el ingreso comparten la estructura y solo cambian los textos y la ruta de envío
export function mostrarAcceso(alIngresar, registro = false, errorInicial = '') {
  const accion = registro ? 'Registrarme' : 'Iniciar sesión';
  const accionAlternativa = registro ? 'Iniciar sesión' : 'Registrarme';
  const saludo = registro ? '¡Te damos la bienvenida!' : '¡Qué bueno verte!';
  const ruta = registro ? '/acceso/registro' : '/acceso/login';

  document.title = 'Pokemon · ' + accion;

  app.innerHTML = `
    <section class="acceso">
      <div class="bienvenida">
        <h1>Tu aventura empieza acá.</h1>
        <p>Armá tus equipos soñados.</p>

        <div class="mosaico" aria-hidden="true">${dibujarCarrusel()}</div>
      </div>

      <section class="panel-acceso">
        <div class="pestanas">
          <button data-ingreso class="${registro ? '' : 'activa'}">
            Iniciar sesión
          </button>
          <button data-registro class="${registro ? 'activa' : ''}">
            Registrarme
          </button>
        </div>

        <h2>${saludo}</h2>
        <p>Ingresá para continuar.</p>

        <form id="form-acceso">
          <label for="correo-acceso">
            Correo electrónico
            <input
              id="correo-acceso"
              name="correo"
              type="email"
              placeholder="nombre@ejemplo.com"
              autocomplete="email"
              maxlength="254"
              required
            />
          </label>

          <label for="clave-acceso">Contraseña</label>
          <div class="campo-clave">
            <input
              id="clave-acceso"
              name="password"
              type="password"
              minlength="8"
              placeholder="${
                registro ? 'Ej: Pokemon2026_' : 'Ingresá tu contraseña'
              }"
              autocomplete="${registro ? 'new-password' : 'current-password'}"
              required
            />
            <button
              type="button"
              data-ver
              aria-label="Mostrar contraseña"
              aria-pressed="false"
            >
              ${icono('ojo')}
            </button>
          </div>

          <p class="error" role="alert">${escapar(errorInicial)}</p>
          <button class="primario ancho" type="submit">${accion}</button>
        </form>

        <p class="pie-acceso">
          ${registro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}
          <button class="enlace" data-alternar>${accionAlternativa}</button>
        </p>
      </section>
    </section>
  `;

  // volvemos a dibujar el mismo formulario al cambiar de pestaña
  app.querySelector('[data-ingreso]').onclick = () => mostrarAcceso(alIngresar);
  app.querySelector('[data-registro]').onclick = () =>
    mostrarAcceso(alIngresar, true);
  app.querySelector('[data-alternar]').onclick = () =>
    mostrarAcceso(alIngresar, !registro);

  const form = app.querySelector('#form-acceso');
  conectarVisibilidad(form);
  conectarEnvio(form, ruta, alIngresar);
}
