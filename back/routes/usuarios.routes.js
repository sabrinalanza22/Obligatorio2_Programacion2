import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { pedirToken } from '../token.js';
import { registro, login, sesion } from '../controllers/usuarios.controller.js';

export const acceso = Router();

const limite = rateLimit({
  windowMs: 900000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá más tarde.' },
});

// el registro y el login son públicos y recuperar el perfil pide token
acceso.post('/registro', limite, registro);
acceso.post('/login', limite, login);
acceso.get('/sesion', pedirToken, sesion);
