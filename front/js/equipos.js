import { solicitar, poke } from './api.js';
import { app, escapar, titulo, icono, avisar, confirmar } from './interfaz.js';
import { tarjeta, vacio } from './tarjetas.js';

// pide al servidor los equipos de la cuenta que inició sesión
export async function mostrarEquipos(editar, desplazamiento = 0) {
  document.title = 'Pokemon · Mis equipos';
  app.innerHTML = '<p class="cargando">Cargando tus equipos…</p>';
  try {
    const equipos = await solicitar('/equipos');
    // consulta una sola vez cada especie que aparece en la lista
    const datos = {};
    for (let i = 0; i < equipos.length; i++) {
      const integrantes = equipos[i].integrantes;
      for (let j = 0; j < integrantes.length; j++) {
        const integrante = integrantes[j];
        if (integrante && !datos[integrante.pokemonId]) {
          datos[integrante.pokemonId] = await poke(
            'pokemon/' + integrante.pokemonId,
          );
        }
      }
    }
    // arma las tarjetas y cuenta solo los lugares ocupados de cada equipo
    app.innerHTML = `
      <section class="mis-equipos">
        <div class="titulo-equipos">
          <h1>MIS EQUIPOS</h1>
          <p>Un lugar para tus próximas aventuras</p>
          <div class="agregar-equipo">
            <small>${equipos.length} equipos</small>
            <button class="primario con-icono" data-nuevo>
              <span class="signo-mas" aria-hidden="true"></span>
              <span>Añadir equipo</span>
            </button>
          </div>
        </div>
        <div id="lista-equipos">
          ${
            equipos.length
              ? equipos
                  .map(equipo => {
                    const cantidad = equipo.integrantes.filter(Boolean).length;
                    return `
                      <article class="equipo">
                        <div class="cabecera-equipo">
                          <h2>${escapar(equipo.nombre)}</h2>
                          <small>${cantidad} de 6 Pokemon</small>
                          <div class="acciones-equipo">
                            <button data-editar="${equipo._id}">
                              ${icono('editar')}
                              <span>Editar</span>
                            </button>
                            <button
                              class="icono"
                              data-eliminar="${equipo._id}"
                              aria-label="Eliminar ${escapar(equipo.nombre)}"
                            >
                              ${icono('borrar')}
                            </button>
                          </div>
                        </div>
                        <div class="seis-lugares">
                          ${equipo.integrantes
                            .map(
                              (p, posicion) => `
                                <button
                                  class="lugar"
                                  data-abrir="${equipo._id}"
                                  data-posicion="${posicion}"
                                  aria-label="${
                                    p
                                      ? 'Editar ' +
                                        escapar(titulo(datos[p.pokemonId].name))
                                      : 'Agregar Pokemon'
                                  }"
                                >
                                  ${p ? tarjeta(datos[p.pokemonId], p) : vacio()}
                                  <span>
                                    ${
                                      p
                                        ? escapar(
                                            p.mote ||
                                              titulo(datos[p.pokemonId].name),
                                          )
                                        : ''
                                    }
                                  </span>
                                </button>
                              `,
                            )
                            .join('')}
                        </div>
                      </article>
                    `;
                  })
                  .join('')
              : `
                  <article class="equipo plantilla">
                    <div class="cabecera-equipo">
                      <h2>Nombre</h2>
                      <small>0 de 6 Pokemon</small>
                    </div>
                    <div class="seis-lugares">
                      ${[0, 1, 2, 3, 4, 5]
                        .map(
                          () => `
                            <button
                              class="lugar"
                              data-nuevo
                              aria-label="Crear equipo y agregar Pokemon"
                            >
                              ${vacio()}
                            </button>
                          `,
                        )
                        .join('')}
                    </div>
                  </article>
                `
          }
        </div>
      </section>
    `;
    app.parentElement.scrollTop = desplazamiento;
    app.querySelectorAll('[data-nuevo]').forEach(b => (b.onclick = () => editar()));
    app.querySelectorAll('[data-editar], [data-abrir]').forEach(
      b =>
        (b.onclick = () => {
          editar(
            equipos.find(e => e._id === (b.dataset.editar || b.dataset.abrir)),
            b.hasAttribute('data-posicion') ? Number(b.dataset.posicion) : undefined,
          );
        }),
    );
    // pide confirmación antes de borrar y conserva la posición al actualizar la lista
    app.querySelectorAll('[data-eliminar]').forEach(b => {
      b.onclick = () => {
        const equipo = equipos.find(item => item._id === b.dataset.eliminar);
        confirmar(
          'Eliminar equipo',
          `¿Querés eliminar “${equipo.nombre}”?`,
          async () => {
            b.disabled = true;
            const posicion = app.parentElement.scrollTop;
            try {
              await solicitar('/equipos/' + equipo._id, 'DELETE');
              await mostrarEquipos(editar, posicion);
              avisar('Equipo eliminado.');
            } catch (error) {
              avisar(error.message);
              b.disabled = false;
            }
          },
        );
      };
    });
  } catch (error) {
    app.innerHTML = `
      <section class="fallo">
        <p>${escapar(error.message)}</p>
        <button>Reintentar</button>
      </section>
    `;
    app.querySelector('button').onclick = () => mostrarEquipos(editar);
  }
}
