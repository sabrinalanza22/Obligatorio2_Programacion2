// relaciona cada tipo de la api con su nombre en español y su color
export const tipos = {
  normal: ['Normal', '#aaa69e'],
  fire: ['Fuego', '#e95332'],
  water: ['Agua', '#6496f3'],
  electric: ['Eléctrico', '#f2ce56'],
  grass: ['Planta', '#96c969'],
  ice: ['Hielo', '#9cdef5'],
  fighting: ['Lucha', '#cd7858'],
  poison: ['Veneno', '#b67ac5'],
  ground: ['Tierra', '#cbb07b'],
  flying: ['Volador', '#a5b9e3'],
  psychic: ['Psíquico', '#e35e99'],
  bug: ['Bicho', '#afc46c'],
  rock: ['Roca', '#b9a36e'],
  ghost: ['Fantasma', '#8272ba'],
  dragon: ['Dragón', '#8d83d5'],
  dark: ['Siniestro', '#745e50'],
  steel: ['Acero', '#a5bac0'],
  fairy: ['Hada', '#eab1f5'],
};

// traduce las naturalezas sin cambiar los nombres que se guardan en la base
export const naturalezas = {
  hardy: 'Fuerte',
  lonely: 'Huraña',
  brave: 'Audaz',
  adamant: 'Firme',
  naughty: 'Pícara',
  bold: 'Osada',
  docile: 'Dócil',
  relaxed: 'Plácida',
  impish: 'Agitada',
  lax: 'Floja',
  timid: 'Miedosa',
  hasty: 'Activa',
  serious: 'Seria',
  jolly: 'Alegre',
  naive: 'Ingenua',
  modest: 'Modesta',
  mild: 'Afable',
  quiet: 'Mansa',
  bashful: 'Tímida',
  rash: 'Alocada',
  calm: 'Serena',
  gentle: 'Amable',
  sassy: 'Grosera',
  careful: 'Cauta',
  quirky: 'Rara',
};

// lista de objetos competitivos más usados que se puede ampliar
export const objetos = {
  '': 'Sin objeto',
  'leftovers': 'Restos',
  'life-orb': 'Vidasfera',
  'choice-band': 'Cinta elegida',
  'choice-specs': 'Gafas elegidas',
  'choice-scarf': 'Pañuelo elegido',
  'focus-sash': 'Banda Focus',
  'assault-vest': 'Chaleco asalto',
  'sitrus-berry': 'Baya Zidra',
  'lum-berry': 'Baya Ziuela',
  'light-clay': 'Refleluz',
  'rocky-helmet': 'Casco dentado',
  'air-balloon': 'Globo helio',
  'expert-belt': 'Cinta experto',
  'fairy-feather': 'Pluma feérica',
  'pixie-plate': 'Tabla duende',
  'mystic-water': 'Agua mística',
  'charcoal': 'Carbón',
  'miracle-seed': 'Semilla milagro',
  'never-melt-ice': 'Antiderretir',
  'magnet': 'Imán',
  'eviolite': 'Mineral evolutivo',
  'heavy-duty-boots': 'Botas gruesas',
  'black-sludge': 'Lodo negro',
};

// arma la configuración inicial cuando se agrega un pokemon al equipo
export function nuevoIntegrante(pokemon) {
  return {
    pokemonId: pokemon.id,
    mote: '',
    sexo: pokemon.sexoInicial || '',
    shiny: false,
    nivel: 50,
    habilidad: pokemon.abilities.length > 0 ? pokemon.abilities[0].ability.name : '',
    teratipo: pokemon.types[0].type.name,
    naturaleza: 'hardy',
    objeto: '',
    notas: '',
    movimientos: ['', '', '', ''],
    ev: [0, 0, 0, 0, 0, 0],
    iv: [31, 31, 31, 31, 31, 31],
  };
}

// copia cada dato del integrante y crea arrays nuevos para que cancelar no cambie lo guardado
export function copiarIntegrante(original) {
  if (!original) return null;
  return {
    pokemonId: original.pokemonId,
    mote: original.mote,
    sexo: original.sexo,
    shiny: original.shiny,
    nivel: original.nivel,
    habilidad: original.habilidad,
    teratipo: original.teratipo,
    naturaleza: original.naturaleza,
    objeto: original.objeto,
    notas: original.notas,
    movimientos: original.movimientos.map(movimiento => movimiento),
    ev: original.ev.map(valor => valor),
    iv: original.iv.map(valor => valor),
  };
}

// un equipo nuevo arranca con seis lugares vacíos y uno existente conserva su identificador
export function copiarEquipo(original) {
  if (!original) {
    return { nombre: 'Nombre', integrantes: [null, null, null, null, null, null] };
  }
  return {
    _id: original._id,
    nombre: original.nombre,
    integrantes: original.integrantes.map(integrante =>
      copiarIntegrante(integrante),
    ),
  };
}
