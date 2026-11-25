import {
  tieneFormasPorSexo,
  formaPorSexo,
  sexoFijo,
  poke,
  nombreES,
  numeroRecurso,
} from './api.js';
import { app, escapar, titulo, avisar } from './interfaz.js';
import { tarjeta } from './tarjetas.js';
import { tipos, naturalezas, objetos, copiarIntegrante } from './datos.js';
import { datosMovimiento, seleccionarMovimiento } from './movimientos.js';

// recorre el diccionario y arma cada opción conservando el valor que se guarda en mongo
function opciones(datos, elegido) {
  let html = '';
  for (const valor in datos) {
    const seleccionado = valor === elegido ? 'selected' : '';
    html += `
      <option value="${escapar(valor)}" ${seleccionado}>
        ${escapar(datos[valor])}
      </option>
    `;
  }
  return html;
}

// la marca de habilidad oculta cambia solo el texto de la opción y no su identificador
function nombresHabilidades(pokemon, habilidades) {
  const nombres = {};
  habilidades.forEach(habilidad => {
    const detalle = pokemon.abilities.find(
      item => item.ability.name === habilidad.name,
    );
    const oculta = detalle && detalle.is_hidden;
    nombres[habilidad.name] = nombreES(habilidad) + (oculta ? ' — H.O' : '');
  });
  return nombres;
}

// pide las traducciones en orden para poder seguir cada consulta con await
async function cargarHabilidades(pokemon) {
  const habilidades = [];
  for (let i = 0; i < pokemon.abilities.length; i++) {
    habilidades.push(await poke('ability/' + pokemon.abilities[i].ability.name));
  }
  return habilidades;
}

// trabaja sobre una copia para poder cancelar sin tocar el integrante original
export async function personalizar(pokemon, original, volver) {
  const copia = copiarIntegrante(original);
  document.title = 'Pokemon · Personalizar ' + titulo(pokemon.name);
  app.innerHTML = '<p class="cargando">Cargando personalización…</p>';
  try {
    // busca la especie y los nombres de sus habilidades antes de armar la pantalla
    const especie = await poke(
      'pokemon-species/' + numeroRecurso(pokemon.species.url),
    );
    // marca automáticamente el único sexo posible y corrige formas guardadas antes del cambio
    const fijo = sexoFijo(especie);
    if (fijo !== null) copia.sexo = fijo;
    else if (!copia.sexo && tieneFormasPorSexo(pokemon.name)) copia.sexo = 'hembra';
    pokemon = await formaPorSexo(pokemon, copia.sexo || 'hembra', especie);
    copia.pokemonId = pokemon.id;
    const habilidades = await cargarHabilidades(pokemon);
    if (!pokemon.abilities.some(a => a.ability.name === copia.habilidad))
      copia.habilidad = pokemon.abilities[0].ability.name;
    const opcionesTipos = {};
    for (const clave in tipos) opcionesTipos[clave] = tipos[clave][0];
    const elegir = (etiqueta, nombre, datos) => `
      <label>
        ${etiqueta}
        <select name="${nombre}">
          ${opciones(datos, copia[nombre])}
        </select>
      </label>
    `;
    // junta la tarjeta el formulario los movimientos y las estadísticas en una sola vista
    app.innerHTML = `
      <form id="form-personalizar" class="personalizacion">
        <aside>
          <section class="resumen-pokemon">
            ${tarjeta(pokemon, copia, true)}
            <p class="numero-especie">#${especie.id}</p>
            <h1>${escapar(titulo(pokemon.name))}</h1>
            <div class="tipos">
              ${pokemon.types
                .map(
                  t => `
                    <span style="--color:${(tipos[t.type.name] || tipos.normal)[1]}">
                      ${(tipos[t.type.name] || tipos.normal)[0]}
                    </span>
                  `,
                )
                .join('')}
            </div>
            <label class="mote">
              Mote
              <input
                name="mote"
                maxlength="12"
                value="${escapar(copia.mote)}"
                placeholder="${escapar(titulo(pokemon.name))}"
              />
            </label>
          </section>
          <label class="notas">
            Notas
            <textarea name="notas" maxlength="1000">
${escapar(copia.notas)}</textarea>
          </label>
          <p class="error" role="alert"></p>
          <div class="acciones">
            <button class="primario" type="submit">Guardar cambios</button>
            <button type="button" data-cancelar>Cancelar</button>
          </div>
        </aside>
        <div class="paneles-personalizacion">
          <section class="panel informacion">
            <h2>Información</h2>
            <div class="fila-info">
              <fieldset class="sexo">
                <legend>Sexo</legend>
                ${
                  especie.gender_rate === -1
                    ? '<span>Sin sexo</span>'
                    : `
                        <label title="Hembra">
                          <input
                            type="radio"
                            name="sexo"
                            value="hembra"
                            ${copia.sexo === 'hembra' ? 'checked' : ''}
                            ${fijo === 'macho' ? 'disabled' : ''}
                          />
                          <span>♀</span>
                        </label>
                        <label title="Macho">
                          <input
                            type="radio"
                            name="sexo"
                            value="macho"
                            ${copia.sexo === 'macho' ? 'checked' : ''}
                            ${fijo === 'hembra' ? 'disabled' : ''}
                          />
                          <span>♂</span>
                        </label>
                      `
                }
              </fieldset>
              <label class="shiny">
                Shiny
                <input
                  type="checkbox"
                  name="shiny"
                  ${copia.shiny ? 'checked' : ''}
                  ${
                    !(
                      pokemon.sprites &&
                      pokemon.sprites.other &&
                      pokemon.sprites.other['official-artwork'] &&
                      pokemon.sprites.other['official-artwork'].front_shiny
                    )
                      ? 'disabled'
                      : ''
                  }
                />
                <span></span>
              </label>
              <label>
                Nivel
                <input
                  type="number"
                  name="nivel"
                  min="1"
                  max="100"
                  value="${copia.nivel}"
                  required
                />
              </label>
              ${elegir(
                'Habilidad',
                'habilidad',
                nombresHabilidades(pokemon, habilidades),
              )}
            </div>
            <div class="fila-info secundaria">
              ${elegir('Teratipo', 'teratipo', opcionesTipos)}
              ${elegir('Naturaleza', 'naturaleza', naturalezas)}
              ${elegir('Objeto', 'objeto', objetos)}
            </div>
          </section>
          <section class="panel movimientos">
            <h2>Movimientos</h2>
            <div class="cuatro-movimientos"></div>
          </section>
          <section class="panel estadisticas">
            <h2>Estadísticas</h2>
            <div class="tabla-estadisticas">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    ${[
                      'PS',
                      'ATAQUE',
                      'DEFENSA',
                      'AT. ESP.',
                      'DEF. ESP.',
                      'VELOCIDAD',
                    ]
                      .map(
                        n => `
                          <th scope="col">${n}</th>
                        `,
                      )
                      .join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Base</th>
                    ${pokemon.stats
                      .map(
                        s => `
                          <td>${s.base_stat}</td>
                        `,
                      )
                      .join('')}
                  </tr>
                  ${['ev', 'iv']
                    .map(
                      tipo => `
                        <tr>
                          <th scope="row">${tipo.toUpperCase()}</th>
                          ${copia[tipo]
                            .map(
                              (n, i) => `
                                <td>
                                  <input
                                    type="number"
                                    name="${tipo}${i}"
                                    min="0"
                                    max="${tipo === 'ev' ? 252 : 31}"
                                    value="${n}"
                                    aria-label="${tipo.toUpperCase()} ${
                                      [
                                        'PS',
                                        'Ataque',
                                        'Defensa',
                                        'Ataque especial',
                                        'Defensa especial',
                                        'Velocidad',
                                      ][i]
                                    }"
                                    required
                                  />
                                </td>
                              `,
                            )
                            .join('')}
                        </tr>
                      `,
                    )
                    .join('')}
                </tbody>
              </table>
              <small class="total-ev">
                EV totales:
                <span>0</span>
                / 510
              </small>
            </div>
          </section>
        </div>
      </form>
    `;
    const form = app.querySelector('form');
    form.querySelector('[data-cancelar]').onclick = () => volver();
    // suma los puntos elegidos y evita guardar si se pasa del límite de 510
    const actualizarEv = () => {
      const total = copia.ev
        .map((_, i) => Number(form.elements['ev' + i].value))
        .reduce((a, b) => a + b, 0);
      form.querySelector('.total-ev span').textContent = total;
      form.elements.ev0.setCustomValidity(
        total > 510 ? 'El total de EV no puede superar 510.' : '',
      );
      form.querySelector('.total-ev').classList.toggle('error', total > 510);
    };
    copia.ev.forEach((_, i) => (form.elements['ev' + i].oninput = actualizarEv));
    actualizarEv();
    // cambia el dibujo sin redibujar el formulario para conservar los textos que ya se escribieron
    const actualizarImagen = () => {
      form.querySelector('.tarjeta-pokemon').outerHTML = tarjeta(
        pokemon,
        copia,
        true,
      );
    };
    form.elements.shiny.onchange = () => {
      copia.shiny = form.elements.shiny.checked;
      actualizarImagen();
    };
    // si el sexo cambia la forma también pueden cambiar sus habilidades y valores base
    // bloqueamos guardar durante la consulta y descartamos respuestas de elecciones anteriores
    let cambioActual = 0;
    let cambiando = false;
    form.querySelectorAll('input[name="sexo"]').forEach(
      input =>
        (input.onchange = async () => {
          const version = ++cambioActual;
          const anterior = copia.sexo;
          const elegido = input.value;
          cambiando = true;
          form.querySelector('[type="submit"]').disabled = true;
          try {
            const forma = await formaPorSexo(pokemon, elegido, especie);
            const nuevasHabilidades = await cargarHabilidades(forma);
            if (version !== cambioActual || !form.isConnected) return;
            const habilidadActual = form.elements.habilidad.value;
            pokemon = forma;
            copia.pokemonId = forma.id;
            copia.sexo = elegido;
            form.elements.habilidad.innerHTML = opciones(
              nombresHabilidades(forma, nuevasHabilidades),
              habilidadActual,
            );
            form
              .querySelectorAll('.estadisticas tbody tr:first-child td')
              .forEach((celda, i) => (celda.textContent = forma.stats[i].base_stat));
            // conserva los movimientos compartidos y vacía solo los que la nueva forma no aprende
            const permitidos = forma.moves.map(m => m.move.name);
            copia.movimientos = copia.movimientos.map(m =>
              permitidos.includes(m) ? m : '',
            );
            actualizarImagen();
            await dibujarMovimientos();
            form.querySelector('aside>.error').textContent = '';
          } catch (error) {
            if (version !== cambioActual || !form.isConnected) return;
            form
              .querySelectorAll('input[name="sexo"]')
              .forEach(radio => (radio.checked = radio.value === anterior));
            form.querySelector('aside>.error').textContent = error.message;
          } finally {
            if (version === cambioActual && form.isConnected) {
              cambiando = false;
              form.querySelector('[type="submit"]').disabled = false;
            }
          }
        }),
    );
    // convierte los números del formulario y devuelve la copia al editor del equipo
    form.onsubmit = evento => {
      evento.preventDefault();
      if (cambiando) return;
      // leemos cada campo por su nombre y convertimos a número los valores numéricos
      const sexoElegido = form.querySelector('input[name="sexo"]:checked');
      copia.mote = form.elements.mote.value.trim();
      copia.notas = form.elements.notas.value.trim();
      copia.sexo = sexoElegido ? sexoElegido.value : '';
      copia.shiny = form.elements.shiny.checked;
      copia.nivel = Number(form.elements.nivel.value);
      copia.habilidad = form.elements.habilidad.value;
      copia.teratipo = form.elements.teratipo.value;
      copia.naturaleza = form.elements.naturaleza.value;
      copia.objeto = form.elements.objeto.value;
      copia.ev = copia.ev.map((valor, i) => Number(form.elements['ev' + i].value));
      copia.iv = copia.iv.map((valor, i) => Number(form.elements['iv' + i].value));

      // esto actualiza el borrador y la base cambia recién al guardar el equipo
      volver(copia);
      avisar('Personalización aplicada. Guardá el equipo para conservarla.');
    };
    // dibuja los cuatro lugares y abre el selector cuando se elige uno
    const dibujarMovimientos = async () => {
      const caja = form.querySelector('.cuatro-movimientos');
      try {
        const movimientos = [];
        for (let i = 0; i < copia.movimientos.length; i++) {
          const nombre = copia.movimientos[i];
          movimientos.push(nombre ? await poke('move/' + nombre) : null);
        }
        if (!caja.isConnected) return;
        caja.innerHTML = movimientos
          .map(
            (m, i) => `
              <div>
                <div class="columnas-mov">
                  <span></span>
                  <span>Pot.</span>
                  <span>Prec.</span>
                  <span>Tipo</span>
                  <span>Cat.</span>
                </div>
                <button type="button" class="fila-movimiento" data-pos="${i}">
                  <span>${m ? escapar(nombreES(m)) : 'Seleccionar movimiento'}</span>
                  ${
                    m
                      ? datosMovimiento(m)
                      : '<span>—</span><span>—</span><span>—</span><span>—</span>'
                  }
                </button>
              </div>
            `,
          )
          .join('');
        caja.querySelectorAll('button').forEach(
          b =>
            (b.onclick = () => {
              const i = Number(b.dataset.pos);
              seleccionarMovimiento(
                pokemon,
                copia.movimientos.filter((_, j) => j !== i),
                nombre => {
                  copia.movimientos[i] = nombre;
                  dibujarMovimientos();
                },
              );
            }),
        );
      } catch (error) {
        caja.innerHTML = `
          <p class="error">${escapar(error.message)}</p>
          <button type="button">Reintentar</button>
        `;
        caja.querySelector('button').onclick = dibujarMovimientos;
      }
    };
    await dibujarMovimientos();
  } catch (error) {
    app.innerHTML = `
      <div class="fallo">
        <p>${escapar(error.message)}</p>
        <button data-reintentar>Reintentar</button>
        <button data-volver>Volver al equipo</button>
      </div>
    `;
    app.querySelector('[data-reintentar]').onclick = () =>
      personalizar(pokemon, original, volver);
    app.querySelector('[data-volver]').onclick = () => volver();
  }
}
