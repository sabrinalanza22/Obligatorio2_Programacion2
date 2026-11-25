import { Router } from 'express';
import mongoose from 'mongoose';
import {
  listar,
  crear,
  editar,
  eliminar,
} from '../controllers/equipos.controller.js';

export const equipos = Router();

// revisamos el formato del id antes de llamar al controlador
function validarId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Identificador inválido.' });
  }
  next();
}

equipos.get('/', listar);
equipos.post('/', crear);
equipos.put('/:id', validarId, editar);
equipos.delete('/:id', validarId, eliminar);
