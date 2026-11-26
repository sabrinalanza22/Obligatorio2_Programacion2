import { tieneFormasPorSexo } from './api.js';
// ubica el espacio principal donde se dibujan las pantallas y el diálogo compartido
export const app = document.querySelector('#app');
export const modal = document.querySelector('#modal');
// evita que el texto escrito por alguien se interprete como etiquetas del sitio
export const escapar = valor =>
  String(valor === null || valor === undefined ? '' : valor).replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
// nidoran conserva sus dos especies y el resto muestra el nombre sin el sufijo del sexo
export function titulo(nombre) {
  if (nombre === 'nidoran-f') return 'Nidoran ♀';
  if (nombre === 'nidoran-m') return 'Nidoran ♂';
  const visible = tieneFormasPorSexo(nombre)
    ? nombre.replace('-female', '').replace('-male', '')
    : nombre;
  return visible.charAt(0).toUpperCase() + visible.slice(1).split('-').join(' ');
}

// guarda las líneas de cada icono para poder usar el mismo dibujo en varios botones
const trazos = {
  usuario: `
    <circle cx="12" cy="8" r="3" />
    <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
    <circle cx="12" cy="12" r="11" />
  `,
  editar: '<path d="m4 15 11-11 4 4L8 19l-5 1zM13 6l4 4M3 23h20"/>',
  borrar: '<path d="M4 5h16M9 5V2h6v3M6 5l1 17h10l1-17M10 9v9M14 9v9"/>',
  ojo: `
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12" />
    <circle cx="12" cy="12" r="3" />
  `,
  'ojo-tachado': [
    '<path d="M3 3l18 18M10 5.2a12 12 0 0 1 2-.2c7 0 11 7 11 7a17 17 0 0 1-3 3.6"/>',
    `
      <path
        d="M6.3 6.3A21 21 0 0 0 1 12s4 7 11 7a13 13 0 0 0 5.7-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2"
      />
    `,
  ].join(''),
};
// arma el dibujo y lo oculta del lector de pantalla cuando el botón ya tiene nombre
export const icono = nombre => `
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.1"
    aria-hidden="true"
  >
    ${trazos[nombre] || ''}
  </svg>
`;
let temporizador;
// muestra un mensaje breve y reinicia el tiempo si aparece otro
export function avisar(texto) {
  const aviso = document.querySelector('#aviso');
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (aviso.hidden = true), 5000);
}

// prepara el título y el contenido de la ventana y conecta el botón de cierre
export function abrirModal(tituloModal, contenido) {
  modal.innerHTML = `
    <div class="titulo-modal">
      <h2 id="titulo-modal">${escapar(tituloModal)}</h2>
      <button class="icono cerrar" aria-label="Cerrar">×</button>
    </div>
    ${contenido}
  `;
  modal.querySelector('.cerrar').onclick = () => modal.close();
  if (!modal.open) modal.showModal();
}

// si se toca por fuera del diálogo lo cerramos sin elegir nada
modal.addEventListener('click', evento => {
  if (evento.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (
      evento.clientX < rect.left ||
      evento.clientX > rect.right ||
      evento.clientY < rect.top ||
      evento.clientY > rect.bottom
    )
      modal.close();
  }
});

// espera el cierre y devuelve si la persona eligió eliminar o cancelar
export function confirmar(tituloModal, mensaje, alConfirmar) {
  abrirModal(
    tituloModal,
    `
      <p>${escapar(mensaje)}</p>
      <div class="acciones">
        <button data-no>Cancelar</button>
        <button class="primario" data-si>Eliminar</button>
      </div>
    `,
  );
  modal.querySelector('[data-no]').onclick = () => modal.close();
  modal.querySelector('[data-si]').onclick = () => {
    modal.close();
    alConfirmar();
  };
}

// repartir las listas largas para que se puedan recorrer sin desplazar la ventana
export function paginar(caja, elementos, porPagina, dibujar) {
  const controles = document.createElement('nav');
  controles.className = 'paginacion';
  controles.setAttribute('aria-label', 'Páginas de resultados');
  caja.after(controles);
  let pagina = 0;

  // dibuja un grupo a la vez y mueve el foco al botón que sigue disponible
  function mostrar() {
    const total = Math.max(1, Math.ceil(elementos.length / porPagina));
    dibujar(elementos.slice(pagina * porPagina, (pagina + 1) * porPagina));
    controles.hidden = total < 2;
    controles.innerHTML = `
      <button ${pagina === 0 ? 'disabled' : ''}>Anterior</button>
      <span aria-live="polite">${pagina + 1} / ${total}</span>
      <button ${pagina + 1 === total ? 'disabled' : ''}>Siguiente</button>
    `;
    const botones = controles.querySelectorAll('button');
    const anterior = botones[0];
    const siguiente = botones[1];
    anterior.onclick = () => {
      pagina--;
      mostrar();
      (pagina === 0
        ? controles.lastElementChild
        : controles.firstElementChild
      ).focus();
    };
    siguiente.onclick = () => {
      pagina++;
      mostrar();
      (pagina + 1 === total
        ? controles.firstElementChild
        : controles.lastElementChild
      ).focus();
    };
  }

  mostrar();
  return () => controles.remove();
}
