import { Usuario } from '../modelos.js';

// el repositorio solo se ocupa de consultar y guardar cuentas en la base
export function buscarPorCorreo(correo) {
  return Usuario.findOne({ correo });
}

export function buscarPorId(id) {
  return Usuario.findById(id);
}

// primero crea el documento con el modelo y después lo guarda como en clase
export async function guardarCuenta(datos) {
  const nueva = new Usuario(datos);
  return await nueva.save();
}
