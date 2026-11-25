import {
  listarEquipos,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
} from '../services/equipos.service.js';

// el servicio decide si la operación está permitida y el controlador devuelve la respuesta
export async function listar(req, res) {
  try {
    const equipos = await listarEquipos(req.usuario.id);
    res.json(equipos);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}

export async function crear(req, res) {
  try {
    const equipo = await crearEquipo(req.body, req.usuario.id);
    res.status(201).json(equipo);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}

export async function editar(req, res) {
  try {
    const equipo = await editarEquipo(req.params.id, req.body, req.usuario.id);
    res.json(equipo);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}

export async function eliminar(req, res) {
  try {
    await eliminarEquipo(req.params.id, req.usuario.id);
    res.sendStatus(204);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? 'No se pudo completar la operación.' : error.message,
    });
  }
}
