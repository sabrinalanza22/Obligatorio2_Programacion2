import {
  tieneFormasPorSexo,
  formaPorSexo,
  sexoFijo,
  imagenPorSexo,
  poke,
  imagen,
  numeroRecurso,
} from './api.js';
import { abrirModal, modal, escapar, titulo, paginar } from './interfaz.js';

// agrupa solo las ocho especies elegidas y prefiere la hembra para el buscador
// las formas regionales y las megaevoluciones siguen teniendo sus propias opciones
function catalogoSinSexos(lista) {
  const resultado = [];
  const grupos = {};
  for (let i = 0; i < lista.length; i++) {
    const pokemon = lista[i];
    const clave = tieneFormasPorSexo(pokemon.name)
      ? pokemon.name.replace('-female', '').replace('-male', '')
      : pokemon.name;
    const numero = numeroRecurso(pokemon.url);
    const anterior = grupos[clave];
    if (!anterior) {
      const opcion = { name: pokemon.name, url: pokemon.url, numeroBase: numero };
      grupos[clave] = opcion;
      resultado.push(opcion);
    } else {
      anterior.numeroBase = Math.min(anterior.numeroBase, numero);
      if (pokemon.name.includes('-female')) {
        anterior.name = pokemon.name;
        anterior.url = pokemon.url;
      }
    }
  }
  return resultado;
}

// usa el catálogo solo para buscar integrantes y elegir uno para el lugar actual
export async function seleccionarPokemon(alElegir) {
  abrirModal(
    'Seleccionar Pokemon',
    `
      <label class="busqueda">
        Buscar por nombre o número
        <input type="search" placeholder="Ej: Sylveon o 700" autofocus />
      </label>
      <p class="error" role="alert"></p>
      <div class="resultados-selector">Cargando…</div>
    `,
  );
  const caja = modal.querySelector('.resultados-selector');
  const campo = modal.querySelector('input');
  let lista;
  try {
    lista = catalogoSinSexos((await poke('pokemon?limit=20000')).results);
  } catch (error) {
    caja.textContent = error.message;
    return;
  }
  if (!caja.isConnected) return;
  // saca el número del pokemon de la dirección que devuelve el catálogo
  const idDe = item => numeroRecurso(item.url);
  const favoritos = [38, 350, 282, 699, 497, 700, 10163, 359, 407, 730, 655, 471];
  let quitarPaginacion = () => {};
  // filtra por nombre o número y vuelve a la primera página cuando cambia la búsqueda
  let version = 0;
  const mostrar = () => {
    const actual = ++version;
    const consulta = campo.value.trim().toLowerCase().split(' ').join('-');
    const encontrados = consulta
      ? lista.filter(
          p =>
            p.name.includes(consulta) ||
            String(idDe(p)) === consulta ||
            String(p.numeroBase) === consulta,
        )
      : favoritos.map(id => lista.find(p => idDe(p) === id)).filter(Boolean);
    quitarPaginacion();
    quitarPaginacion = paginar(caja, encontrados, 6, visibles => {
      caja.innerHTML = visibles.length
        ? visibles
            .map(
              p => `
                <button data-id="${idDe(p)}">
                  <img src="${imagen(idDe(p))}" alt="" loading="lazy" />
                  <span>${escapar(titulo(p.name))}</span>
                </button>
              `,
            )
            .join('')
        : '<p>No hay resultados.</p>';
      // pide los datos completos del pokemon elegido antes de devolverlo al editor
      // completa las imágenes visibles sin cargar todo el catálogo de golpe
      caja.querySelectorAll('button').forEach(async b => {
        try {
          const pokemon = await poke('pokemon/' + b.dataset.id);
          if (actual !== version || !b.isConnected) return;
          b.querySelector('img').src = imagenPorSexo(pokemon);
        } catch {
          /* conserva la ilustración inicial si falla la consulta */
        }
      });
      caja.querySelectorAll('button').forEach(
        b =>
          (b.onclick = async () => {
            b.disabled = true;
            try {
              let pokemon = await poke('pokemon/' + b.dataset.id);
              const especie = await poke(
                'pokemon-species/' + numeroRecurso(pokemon.species.url),
              );
              const fijo = sexoFijo(especie);
              pokemon = await formaPorSexo(pokemon, fijo || 'hembra', especie);
              // la vista previa femenina de estas ocho especies también queda marcada al agregarlas
              // hacemos una copia porque la caché comparte el objeto de la api
              const elegido = {};
              for (const propiedad in pokemon)
                elegido[propiedad] = pokemon[propiedad];
              elegido.sexoInicial =
                fijo !== null
                  ? fijo
                  : tieneFormasPorSexo(pokemon.name)
                    ? 'hembra'
                    : '';
              pokemon = elegido;
              if (!caja.isConnected) return;
              modal.close();
              await alElegir(pokemon);
            } catch (error) {
              if (caja.isConnected)
                modal.querySelector('.error').textContent = error.message;
              b.disabled = false;
            }
          }),
      );
    });
  };
  campo.oninput = mostrar;
  mostrar();
}
