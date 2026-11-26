// el servidor tiene sus propias listas permitidas y no depende de los archivos del navegador
const tiposPermitidos = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

const naturalezasPermitidas = [
  'hardy',
  'lonely',
  'brave',
  'adamant',
  'naughty',
  'bold',
  'docile',
  'relaxed',
  'impish',
  'lax',
  'timid',
  'hasty',
  'serious',
  'jolly',
  'naive',
  'modest',
  'mild',
  'quiet',
  'bashful',
  'rash',
  'calm',
  'gentle',
  'sassy',
  'careful',
  'quirky',
];

const objetosPermitidos = [
  '',
  'leftovers',
  'life-orb',
  'choice-band',
  'choice-specs',
  'choice-scarf',
  'focus-sash',
  'assault-vest',
  'sitrus-berry',
  'lum-berry',
  'light-clay',
  'rocky-helmet',
  'air-balloon',
  'expert-belt',
  'fairy-feather',
  'pixie-plate',
  'mystic-water',
  'charcoal',
  'miracle-seed',
  'never-melt-ice',
  'magnet',
  'eviolite',
  'heavy-duty-boots',
  'black-sludge',
];

// normaliza el correo y revisa el tamaño de la contraseña antes de usarla
export function validarCuenta(datos = {}) {
  if (!datos || typeof datos !== 'object')
    throw new Error('Datos de cuenta inválidos.');
  const correo =
    typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254)
    throw new Error('Ingresá un correo válido.');
  if (
    typeof datos.password !== 'string' ||
    datos.password.length < 8 ||
    Buffer.byteLength(datos.password) > 72
  )
    throw new Error(
      'La contraseña debe tener al menos 8 caracteres y hasta 72 bytes.',
    );
  return { correo, password: datos.password };
}

// revisa que el dato sea texto y que no supere el largo permitido
function texto(valor, maximo) {
  if (typeof valor !== 'string' || valor.length > maximo)
    throw new Error('Texto inválido o demasiado largo.');
  return valor.trim();
}

// acepta solo números enteros dentro del rango indicado
function entero(valor, minimo, maximo) {
  if (
    typeof valor !== 'number' ||
    valor % 1 !== 0 ||
    valor < minimo ||
    valor > maximo
  )
    throw new Error('Número fuera de rango.');
  return valor;
}

// comprueba los seis valores de esfuerzo o individuales según su límite
function estadisticas(valores, maximo) {
  if (!Array.isArray(valores) || valores.length !== 6)
    throw new Error('Se necesitan seis estadísticas.');
  return valores.map(n => entero(n, 0, maximo));
}

// revisa los seis lugares y conserva los vacíos
// solo copia los campos permitidos y deja que el servidor decida quién es el dueño
export function validarEquipo(datos = {}) {
  if (!datos || typeof datos !== 'object')
    throw new Error('Datos de equipo inválidos.');
  const nombre = texto(datos.nombre, 40);
  if (!nombre) throw new Error('Ingresá el nombre del equipo.');
  if (!Array.isArray(datos.integrantes) || datos.integrantes.length !== 6)
    throw new Error('El equipo debe tener seis lugares.');
  const integrantes = datos.integrantes.map(p => {
    if (p === null) return null;
    if (!p || typeof p !== 'object') throw new Error('Integrante inválido.');
    if (!['', 'hembra', 'macho'].includes(p.sexo) || typeof p.shiny !== 'boolean')
      throw new Error('Sexo o estado shiny inválido.');
    if (
      !tiposPermitidos.includes(p.teratipo) ||
      !naturalezasPermitidas.includes(p.naturaleza) ||
      !objetosPermitidos.includes(p.objeto)
    )
      throw new Error('Teratipo, naturaleza u objeto inválido.');
    if (!Array.isArray(p.movimientos) || p.movimientos.length !== 4)
      throw new Error('Se necesitan cuatro lugares para movimientos.');
    // comprueba los cuatro lugares y evita guardar el mismo movimiento dos veces
    const movimientos = p.movimientos.map(m => texto(m, 80));
    const elegidos = movimientos.filter(Boolean);
    const sinRepetir = [];
    elegidos.forEach(movimiento => {
      if (sinRepetir.includes(movimiento))
        throw new Error('No repitas movimientos.');
      sinRepetir.push(movimiento);
    });
    // revisa tanto el límite por estadística como el total del pokemon
    const ev = estadisticas(p.ev, 252);
    if (ev.reduce((a, b) => a + b, 0) > 510)
      throw new Error('Los EV no pueden superar 510 en total.');
    // armar un objeto nuevo en vez de guardar todo lo que llegó en la petición
    return {
      pokemonId: entero(p.pokemonId, 1, 20000),
      mote: texto(p.mote, 12),
      sexo: p.sexo,
      shiny: p.shiny,
      nivel: entero(p.nivel, 1, 100),
      habilidad: texto(p.habilidad, 80),
      teratipo: texto(p.teratipo, 30),
      naturaleza: texto(p.naturaleza, 80),
      objeto: texto(p.objeto, 80),
      notas: texto(p.notas, 1000),
      movimientos,
      ev,
      iv: estadisticas(p.iv, 31),
    };
  });
  return { nombre, integrantes };
}
