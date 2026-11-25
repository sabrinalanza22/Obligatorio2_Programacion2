import { Equipo } from '../modelos.js';

// trae los equipos del usuario en el orden en que los creó
export function buscarEquipos(usuario) {
  return Equipo.find({ usuario }).sort({ createdAt: 1 });
}

export function buscarEquipoPorId(id) {
  return Equipo.findById(id);
}

// el modelo arma el documento y save lo escribe en mongo
export async function guardarEquipo(datos) {
  const nuevo = new Equipo(datos);
  return await nuevo.save();
}

// el servicio ya comprobó el dueño y los campos permitidos antes de llegar acá
export function actualizarEquipo(id, datos) {
  datos.updatedAt = new Date();
  return Equipo.findByIdAndUpdate(id, datos, { new: true });
}

export function borrarEquipo(id) {
  return Equipo.findByIdAndDelete(id);
}
