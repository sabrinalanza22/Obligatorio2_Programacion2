// en desarrollo apunta al back local y al publicar se cambia por la url del web service
const BASE_URL = 'http://localhost:3000';

// comparte las consultas de pokemon en un objeto para no repetirlas durante esta visita
const cache = {};
const claveToken = 'pokemon.token';
let alVencerSesion = null;

// el token se conserva en esta pestaña para poder recuperar la cuenta al recargar
export function guardarToken(token) {
  sessionStorage.setItem(claveToken, token);
}

export function borrarToken() {
  sessionStorage.removeItem(claveToken);
}

export function leerToken() {
  return sessionStorage.getItem(claveToken);
}

// la pantalla principal nos pasa una función para volver al acceso cuando vence el token
// usamos un callback normal en lugar de crear un evento personalizado
export function configurarSesionVencida(callback) {
  alVencerSesion = callback;
}

// hace las peticiones al servidor propio y agrega el token si hay una cuenta abierta
export async function solicitar(ruta, metodo = 'GET', datos) {
  const token = leerToken();
  const headers = {};
  if (datos !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;

  const respuesta = await fetch(BASE_URL + '/api' + ruta, {
    method: metodo,
    headers: headers,
    body: datos === undefined ? undefined : JSON.stringify(datos),
  });
  if (respuesta.status === 204) return null;
  const resultado = await respuesta.json();

  // esperamos a que termine la petición antes de cambiar de pantalla para no perder el mensaje de error
  if (respuesta.status === 401 && token && leerToken() === token) {
    borrarToken();
    setTimeout(() => {
      if (!leerToken() && alVencerSesion) alVencerSesion();
    }, 0);
  }
  if (!respuesta.ok) {
    throw new Error(resultado.error || 'No se pudo completar la operación.');
  }
  return resultado;
}

// guarda la consulta que está en curso y su resultado para que las tarjetas compartan los datos
// si falla se borra del objeto y el siguiente intento puede volver a pedirla
export function poke(ruta) {
  if (!cache[ruta]) {
    cache[ruta] = fetch('https://pokeapi.co/api/v2/' + ruta)
      .then(respuesta => {
        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los datos de Pokemon.');
        }
        return respuesta.json();
      })
      .catch(error => {
        delete cache[ruta];
        throw error;
      });
  }
  return cache[ruta];
}

// busca la traducción y recurre al nombre original si la api no tiene una en español
export function nombreES(datos) {
  if (datos.names) {
    const traduccion = datos.names.find(nombre => nombre.language.name === 'es');
    if (traduccion) return traduccion.name;
  }
  const nombre = datos.name.split('-').join(' ');
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

// obtiene el último número de una dirección aunque termine con una barra
export function numeroRecurso(url) {
  const partes = url.split('/').filter(parte => parte !== '');
  return Number(partes[partes.length - 1]);
}

// arma la dirección de la ilustración normal o shiny
export function imagen(id, shiny = false) {
  const carpeta =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
  return carpeta + (shiny ? 'shiny/' : '') + id + '.png';
}

// prepara hasta ocho consultas para que las listas largas no se vuelvan lentas
// cada respuesta queda como un objeto con dato o error y después se lee en su orden original
// los dos callbacks de then también evitan dejar errores sin atender mientras esperamos otra consulta
export async function cargarPorGrupos(lista, convertir, vigente = () => true) {
  const resultado = [];
  for (let i = 0; i < lista.length && vigente(); i += 8) {
    const consultas = [];
    for (let j = i; j < lista.length && j < i + 8; j++) {
      const consulta = convertir(lista[j]).then(
        dato => ({ dato: dato, error: null }),
        error => ({ dato: null, error: error }),
      );
      consultas.push(consulta);
    }
    for (let j = 0; j < consultas.length; j++) {
      const respuesta = await consultas[j];
      if (respuesta.error) throw respuesta.error;
      resultado.push(respuesta.dato);
    }
  }
  return resultado;
}

// estas son las ocho especies que cambian de apariencia al elegir el sexo
const especiesConFormasPorSexo = [
  'basculegion',
  'oinkologne',
  'indeedee',
  'unfezant',
  'meowstic',
  'pyroar',
  'frillish',
  'jellicent',
];

// saca el sufijo solamente cuando es el final del nombre y conserva las otras formas
function nombreSinSexo(nombre) {
  if (nombre.slice(-5) === '-male') return nombre.slice(0, -5);
  if (nombre.slice(-7) === '-female') return nombre.slice(0, -7);
  return nombre;
}

export function tieneFormasPorSexo(nombre) {
  return especiesConFormasPorSexo.includes(nombreSinSexo(nombre));
}

// la api indica si una especie solo puede ser macho hembra o no tener sexo
// las especies con dos formas separadas siguen permitiendo elegir cualquiera de las dos
export function sexoFijo(especie) {
  const nombres = especie.varieties.map(variedad => variedad.pokemon.name);
  const tieneHembra = nombres.some(nombre => nombre.includes('-female'));
  const tieneMacho = nombres.some(nombre => nombre.includes('-male'));
  if (especie.gender_rate === -1) return '';
  if (tieneHembra && tieneMacho) return null;
  if (especie.gender_rate === 0) return 'macho';
  if (especie.gender_rate === 8) return 'hembra';
  return null;
}

// una forma distinta puede tener otras habilidades y estadísticas por eso traemos todos sus datos
export async function formaPorSexo(pokemon, sexo, especie) {
  const base = nombreSinSexo(pokemon.name);
  if (!tieneFormasPorSexo(pokemon.name) || !sexo || base === pokemon.name)
    return pokemon;
  const nombre = base + (sexo === 'hembra' ? '-female' : '-male');
  if (nombre === pokemon.name) return pokemon;
  if (!especie)
    especie = await poke('pokemon-species/' + numeroRecurso(pokemon.species.url));
  const variedad = especie.varieties.find(item => item.pokemon.name === nombre);
  if (variedad) return poke('pokemon/' + nombre);
  return pokemon;
}

// conserva las ilustraciones elegidas y el encuadre de los tres shiny para que no cambien de tamaño
export function imagenPorSexo(pokemon, integrante = {}) {
  const femenina = integrante.sexo !== 'macho';
  const ilustracionesHembra = {
    pyroar: 'assets/pyroar-hembra.png',
    frillish: 'assets/frillish-hembra.png',
    jellicent: 'assets/jellicent-hembra.png',
  };
  const especie = nombreSinSexo(pokemon.name);
  if (femenina && ilustracionesHembra[especie]) {
    const ilustracion = ilustracionesHembra[especie];
    if (integrante.shiny) return ilustracion.replace('.png', '-shiny.svg');
    return ilustracion;
  }

  const sprites = pokemon.sprites || {};
  const otras = sprites.other || {};
  const arte = otras['official-artwork'] || {};
  const home = otras.home || {};
  const propiaFemenina = pokemon.name.slice(-7) === '-female';
  if (tieneFormasPorSexo(pokemon.name) && femenina && !propiaFemenina) {
    const hembra = integrante.shiny ? home.front_shiny_female : home.front_female;
    if (hembra) return hembra;
  }
  const ilustracion = integrante.shiny ? arte.front_shiny : arte.front_default;
  return ilustracion || imagen(pokemon.id, integrante.shiny);
}
