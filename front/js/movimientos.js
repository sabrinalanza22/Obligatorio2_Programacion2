import { poke, nombreES, cargarPorGrupos } from './api.js';
import { abrirModal, modal, escapar } from './interfaz.js';
import { tipos } from './datos.js';

// define el símbolo y el nombre de cada categoría de movimiento
const categorias = {
  physical: ['✹', 'Físico'],
  special: ['◎', 'Especial'],
  status: ['◕', 'Estado'],
};
// arma las columnas de potencia y precisión junto a los iconos de tipo y categoría
export function datosMovimiento(movimiento) {
  const tipo = tipos[movimiento.type.name] || tipos.normal;
  const categoria = categorias[movimiento.damage_class.name];
  return `
    <span class="numero-mov">
      ${movimiento.power === null ? '—' : movimiento.power}
    </span>
    <span class="numero-mov">
      ${movimiento.accuracy === null ? '—' : movimiento.accuracy}
    </span>
    <span
      class="tipo-mov"
      style="--color:${tipo[1]}"
      title="${tipo[0]}"
      aria-label="Tipo ${tipo[0]}"
    >
      ${tipo[0].slice(0, 1)}
    </span>
    <span
      class="categoria-mov ${movimiento.damage_class.name}"
      title="${categoria[1]}"
      aria-label="${categoria[1]}"
    >
      ${categoria[0]}
    </span>
  `;
}

// abre la lista de movimientos que aprende el pokemon elegido
export async function seleccionarMovimiento(pokemon, seleccionados, alElegir) {
  abrirModal(
    'Seleccionar movimiento',
    `
      <div class="columnas-mov">
        <span></span>
        <span>Pot.</span>
        <span>Prec.</span>
        <span>Tipo</span>
        <span>Cat.</span>
      </div>
      <div
        class="lista-movimientos"
        tabindex="0"
        role="region"
        aria-label="Movimientos disponibles"
      >
        <p>Cargando movimientos…</p>
      </div>
      <button class="enlace sin-movimiento" data-vaciar hidden>
        Dejar este movimiento vacío
      </button>
    `,
  );
  const caja = modal.querySelector('.lista-movimientos');
  const vigente = () => modal.open && caja.isConnected;
  try {
    // quita nombres repetidos y deja de pedir datos si la ventana ya se cerró
    const nombres = [];
    pokemon.moves.forEach(item => {
      if (!nombres.includes(item.move.name)) nombres.push(item.move.name);
    });
    const movimientos = await cargarPorGrupos(
      nombres,
      nombre => poke('move/' + nombre),
      vigente,
    );
    if (!vigente()) return;
    movimientos.sort((a, b) => nombreES(a).localeCompare(nombreES(b), 'es'));
    // muestra toda la lista y desactiva los movimientos que ya ocupan otro lugar
    caja.innerHTML =
      movimientos
        .map(
          m => `
            <button
              class="fila-movimiento"
              data-mov="${m.name}"
              ${seleccionados.includes(m.name) ? 'disabled' : ''}
            >
              <span>${escapar(nombreES(m))}</span>
              ${datosMovimiento(m)}
            </button>
          `,
        )
        .join('') || '<p>No hay movimientos disponibles.</p>';
    caja.querySelectorAll('[data-mov]').forEach(
      b =>
        (b.onclick = () => {
          modal.close();
          alElegir(b.dataset.mov);
        }),
    );
    const vaciar = modal.querySelector('[data-vaciar]');
    vaciar.hidden = false;
    vaciar.onclick = () => {
      modal.close();
      alElegir('');
    };
  } catch (error) {
    if (vigente()) {
      caja.innerHTML = `
        <p class="error">${escapar(error.message)}</p>
        <button>Reintentar</button>
      `;
      caja.querySelector('button').onclick = () =>
        seleccionarMovimiento(pokemon, seleccionados, alElegir);
    }
  }
}
