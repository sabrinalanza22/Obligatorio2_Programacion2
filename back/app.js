import express from 'express';
import cors from 'cors';
import { pedirToken } from './token.js';
import { acceso } from './routes/usuarios.routes.js';
import { equipos } from './routes/equipos.routes.js';

// prepara el servidor para recibir peticiones del front separado
export function crearApp(configuracion = {}) {
  const production = configuracion.production || false;
  const app = express();
  if (production) app.set('trust proxy', 1);
  // lee los datos de la petición con un límite de tamaño
  // cors permite que el navegador llame a la api desde la dirección separada del front
  // el jwt sigue siendo necesario para acceder a los equipos de cada cuenta
  app.use(cors());
  app.use(express.json());
  // conecta las rutas públicas de acceso y protege las de equipos con el token
  app.use('/api/acceso', acceso);
  app.use('/api/equipos', pedirToken, equipos);
  app.use('/api', (req, res) =>
    res.status(404).json({ error: 'Ruta no encontrada.' }),
  );
  // da un mensaje entendible sin mostrar detalles internos del servidor
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = [400, 413].includes(error.status) ? error.status : 500;
    res.status(status).json({
      error:
        status === 500
          ? 'No se pudo completar la operación.'
          : 'Solicitud inválida.',
    });
  });
  return app;
}
