import { imagenPorSexo } from './api.js';
import { tipos } from './datos.js';
import { escapar, titulo } from './interfaz.js';

// arma la tarjeta con el color del primer tipo y la imagen normal o brillante
// si falla la imagen oficial intenta mostrar la versión básica
export function tarjeta(pokemon, integrante, grande = false) {
  const tipo = tipos[pokemon.types[0].type.name] || tipos.normal;
  return `
    <div
      class="tarjeta-pokemon ${grande ? 'grande' : ''}"
      style="--color:${tipo[1]}"
    >
      <span class="bola-fondo" aria-hidden="true"></span>
      <img
        src="${imagenPorSexo(pokemon, integrante)}"
        alt="${escapar(titulo(pokemon.name))}"
        ${grande ? '' : 'loading="lazy"'}
        onerror="
          this.onerror = null;
          this.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png';
        "
      />
    </div>
  `;
}

// muestra un lugar sin pokemon con un signo más dibujado por los estilos
export function vacio() {
  return `
    <div class="tarjeta-pokemon vacia">
      <span class="bola-fondo" aria-hidden="true"></span>
      <span class="mas" aria-hidden="true"></span>
    </div>
  `;
}
