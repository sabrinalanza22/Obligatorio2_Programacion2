import bcrypt from 'bcryptjs';
import { crearToken } from '../token.js';
import { validarCuenta } from '../validaciones.js';
import {
  buscarPorCorreo,
  buscarPorId,
  guardarCuenta,
} from '../repositories/usuarios.repository.js';
import { errorCon, validar } from './errores.js';

// el navegador recibe solo los datos públicos de la cuenta
function perfil(usuario) {
  return { id: String(usuario._id), correo: usuario.correo };
}

function respuestaAcceso(usuario) {
  return {
    token: crearToken(usuario._id),
    usuario: perfil(usuario),
  };
}

export async function registrarUsuario(datos) {
  const limpios = validar(validarCuenta, datos);

  if (await buscarPorCorreo(limpios.correo)) {
    throw errorCon(409, 'Ese correo ya está registrado.');
  }

  // guardar el hash en el mismo campo que usan las cuentas existentes
  const passwordHash = await bcrypt.hash(limpios.password, 12);
  let usuario;

  try {
    usuario = await guardarCuenta({ correo: limpios.correo, passwordHash });
  } catch (error) {
    // la base también evita duplicados si llegan dos registros al mismo tiempo
    if (error.code === 11000) throw errorCon(409, 'Ese correo ya está registrado.');
    throw error;
  }

  return respuestaAcceso(usuario);
}

export async function iniciarSesion(datos) {
  const limpios = validar(validarCuenta, datos);
  const usuario = await buscarPorCorreo(limpios.correo);

  // damos el mismo mensaje si el correo no existe o si la contraseña no coincide
  if (!usuario || !(await bcrypt.compare(limpios.password, usuario.passwordHash))) {
    throw errorCon(401, 'Correo o contraseña incorrectos.');
  }

  return respuestaAcceso(usuario);
}

export async function recuperarPerfil(id) {
  const usuario = await buscarPorId(id);
  if (!usuario) throw errorCon(401, 'La cuenta ya no está disponible.');
  return perfil(usuario);
}
