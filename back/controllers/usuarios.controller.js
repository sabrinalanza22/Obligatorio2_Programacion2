import {
  registrarUsuario,
  iniciarSesion,
  recuperarPerfil,
} from '../services/usuarios.service.js';

// el controlador recibe la petición llama al servicio y responde con su resultado
export async function registro(req, res) {
  try {
    const resultado = await registrarUsuario(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}

export async function login(req, res) {
  try {
    const resultado = await iniciarSesion(req.body);
    res.json(resultado);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}

export async function sesion(req, res) {
  try {
    const usuario = await recuperarPerfil(req.usuario.id);
    res.json(usuario);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}
