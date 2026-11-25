import { formaPorSexo, poke, solicitar } from './api.js';

import { app, escapar, titulo, icono, avisar } from './interfaz.js';
import { tarjeta, vacio } from './tarjetas.js';
import { seleccionarPokemon } from './selector.js';
import { nuevoIntegrante, copiarEquipo } from './datos.js';
import { personalizar } from './personalizar.js';

// dibuja cada lugar por separado para distinguir el encabezado de sus botones
function dibujarLugar(pokemon, integrante, i) {
  const nombre = pokemon ? escapar(titulo(pokemon.name)) : 'Agregar Pokemon';
  const numero = '0' + (i + 1);
  const quitar = pokemon
    ? `
        <button
          type="button"
          class="icono"
          data-quitar="${i}"
          aria-label="Quitar ${nombre}"
        >
          ×
        </button>
      `
    : '<span></span>';

  const contenido = pokemon
    ? `
    ${tarjeta(pokemon, integrante)}
    <button type="button" class="personalizar con-icono" data-personalizar="${i}">
      ${icono('editar')}
      <span>Personalizar</span>
    </button>
    <button type="button" class="enlace cambiar" data-elegir="${i}">
      Cambiar Pokemon
    </button>
  `
    : `
        <button
          type="button"
          class="lugar"
          data-elegir="${i}"
          aria-label="Agregar Pokemon en el lugar ${i + 1}"
        >
          ${vacio()}
        </button>
      `;

  return `
    <article class="editor-lugar">
      <div class="encabezado-lugar">
        <span>${numero}</span>
        <span>${nombre}</span>
        ${quitar}
      </div>
      ${contenido}
    </article>
  `;
}

// abre un equipo guardado o empieza uno nuevo con seis lugares vacíos
export function abrirEditor(original, volver, posicionInicial) {
  // los cambios viven en una copia hasta que se guarda el equipo
  const borrador = copiarEquipo(original);
  let ocupado = false;
  // recupera los datos de los integrantes y arma las tarjetas del borrador
  const dibujar = async () => {
    document.title = 'Pokemon · Editar equipo';
    app.innerHTML = '<p class="cargando">Preparando el equipo…</p>';
    try {
      // pedimos los datos de las especies ocupadas y dejamos los huecos en su posición
      const datos = [];
      for (let i = 0; i < borrador.integrantes.length; i++) {
        const integrante = borrador.integrantes[i];
        if (integrante) {
          const pokemon = await poke('pokemon/' + integrante.pokemonId);
          datos.push(await formaPorSexo(pokemon, integrante.sexo));
        } else {
          datos.push(null);
        }
      }
      const lugares = datos
        .map((pokemon, i) => {
          return dibujarLugar(pokemon, borrador.integrantes[i], i);
        })
        .join('');
      const cantidad = borrador.integrantes.filter(Boolean).length;

      app.innerHTML = `
        <button class="volver enlace con-icono">
          <span aria-hidden="true">←</span>
          <span>Mis equipos</span>
        </button>
        <section class="editor-equipo">
          <form id="form-equipo">
            <div class="barra-editor">
              <label>
                Nombre del equipo
                <span class="nombre-equipo">
                  ${icono('editar')}
                  <input
                    name="nombre"
                    value="${escapar(borrador.nombre)}"
                    maxlength="40"
                    required
                  />
                </span>
              </label>
              <small>${cantidad} de 6 Pokemon</small>
              <div class="acciones">
                <button type="button" data-cancelar>Cancelar</button>
                <button class="primario" type="submit">Guardar cambios</button>
              </div>
            </div>
            <div class="grilla-editor">${lugares}</div>
            <p class="error" role="alert"></p>
          </form>
        </section>
      `;
      const form = app.querySelector('form');
      // conserva lo escrito antes de redibujar o de abrir otra pantalla
      const guardarNombre = () => (borrador.nombre = form.elements.nombre.value);
      const salir = () => {
        if (!ocupado) volver();
      };
      app.querySelector('.volver').onclick = salir;
      app.querySelector('[data-cancelar]').onclick = salir;
      // elige entre crear y actualizar según si el borrador ya tiene identificador
      form.onsubmit = async evento => {
        evento.preventDefault();
        guardarNombre();

        // mientras esperamos la respuesta evitamos salir o guardar una segunda vez
        ocupado = true;
        form.querySelectorAll('button').forEach(b => (b.disabled = true));

        const ruta = borrador._id ? '/equipos/' + borrador._id : '/equipos';
        const metodo = borrador._id ? 'PUT' : 'POST';

        try {
          // mandamos solo los datos del equipo porque el dueño sale de la sesión
          await solicitar(ruta, metodo, {
            nombre: borrador.nombre,
            integrantes: borrador.integrantes,
          });

          await volver();
          avisar('Equipo guardado.');
        } catch (error) {
          // si falla el guardado dejamos el borrador abierto para que no se pierda
          form.querySelector('.error').textContent = error.message;
          ocupado = false;
          form.querySelectorAll('button').forEach(b => (b.disabled = false));
        }
      };
      // quitar deja el lugar vacío y elegir permite reemplazarlo sin mover los demás
      app.querySelectorAll('[data-quitar]').forEach(
        b =>
          (b.onclick = () => {
            guardarNombre();
            borrador.integrantes[Number(b.dataset.quitar)] = null;
            dibujar();
          }),
      );
      app.querySelectorAll('[data-elegir]').forEach(
        b =>
          (b.onclick = () => {
            guardarNombre();
            elegir(Number(b.dataset.elegir));
          }),
      );
      // actualiza la copia del integrante solo si se guardó su personalización
      app.querySelectorAll('[data-personalizar]').forEach(
        b =>
          (b.onclick = () => {
            guardarNombre();
            const i = Number(b.dataset.personalizar);
            personalizar(datos[i], borrador.integrantes[i], configuracion => {
              if (configuracion) borrador.integrantes[i] = configuracion;
              dibujar();
            });
          }),
      );
    } catch (error) {
      app.innerHTML = `
        <div class="fallo">
          <p>${escapar(error.message)}</p>
          <button>Reintentar</button>
        </div>
      `;
      app.querySelector('button').onclick = dibujar;
    }
  };
  // abre el catálogo y usa la configuración inicial para el nuevo integrante
  const elegir = i =>
    seleccionarPokemon(pokemon => {
      borrador.integrantes[i] = nuevoIntegrante(pokemon);
      return dibujar();
    });
  // si se abrió desde un lugar vacío mostramos el selector después de dibujar el editor
  dibujar().then(() => {
    if (posicionInicial !== undefined && !borrador.integrantes[posicionInicial]) {
      elegir(posicionInicial);
    }
  });
}
