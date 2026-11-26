import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { crearApp } from './app.js';

// carga las variables privadas antes de leerlas
dotenv.config();

// lee la conexión y el secreto desde la configuración privada
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV;
// frena el arranque si falta la configuración necesaria
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('Completá MONGODB_URI y JWT_SECRET (mínimo 32 caracteres) en .env.');
  process.exit(1);
}
// conecta la base prepara los modelos y abre el servidor para recibir peticiones
async function iniciarServidor() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    crearApp({
      production: NODE_ENV === 'production',
    }).listen(PORT, () =>
      console.log(`API de Pokemon disponible en http://localhost:${PORT}`),
    );
  } catch {
    console.error(
      'No se pudo conectar a MongoDB. Revisá la configuración y los permisos de Atlas.',
    );
    await mongoose.disconnect();
    process.exit(1);
  }
}

iniciarServidor();
