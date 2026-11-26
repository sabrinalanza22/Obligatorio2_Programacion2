import { validarEquipo } from '../validaciones.js';
import {
  buscarEquipos,
  buscarEquipoPorId,
  guardarEquipo,
  actualizarEquipo,
  borrarEquipo,
} from '../repositories/equipos.repository.js';
import { errorCon, validar } from './errores.js';

// el usuario siempre viene del token y no del cuerpo enviado por el navegador
export function listarEquipos(usuario) {
  return buscarEquipos(usuario);
}

export function crearEquipo(datos, usuario) {
  const limpios = validar(validarEquipo, datos);
  limpios.usuario = usuario;
  return guardarEquipo(limpios);
}

// comprueba quién es el dueño del documento
function chequearQueSeaTuyo(equipo, usuario) {
  if (equipo.usuario.toString() !== usuario) {
    throw errorCon(403, 'Ese equipo no te pertenece.');
  }
}

// buscar y comprobar el dueño se hace antes de permitir cualquier cambio
async function buscarEquipoPropio(id, usuario) {
  const equipo = await buscarEquipoPorId(id);
  if (!equipo) throw errorCon(404, 'Equipo no encontrado.');
  chequearQueSeaTuyo(equipo, usuario);
  return equipo;
}

export async function editarEquipo(id, datos, usuario) {
  const limpios = validar(validarEquipo, datos);
  await buscarEquipoPropio(id, usuario);
  const equipo = await actualizarEquipo(id, limpios);
  if (!equipo) throw errorCon(404, 'Equipo no encontrado.');
  return equipo;
}

export async function eliminarEquipo(id, usuario) {
  await buscarEquipoPropio(id, usuario);
  const equipo = await borrarEquipo(id);
  if (!equipo) throw errorCon(404, 'Equipo no encontrado.');
}
