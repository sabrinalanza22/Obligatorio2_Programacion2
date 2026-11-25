import mongoose from 'mongoose';

// define qué se guarda de cada cuenta y exige un correo único
const usuarioSchema = new mongoose.Schema({
  correo: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// define las opciones de cada pokemon sin crearle un identificador adicional
const integranteSchema = new mongoose.Schema(
  {
    pokemonId: Number,
    mote: String,
    sexo: String,
    shiny: Boolean,
    nivel: Number,
    habilidad: String,
    teratipo: String,
    naturaleza: String,
    objeto: String,
    notas: String,
    movimientos: [String],
    ev: [Number],
    iv: [Number],
  },
  { _id: false },
);

// une el nombre y los seis lugares con la cuenta dueña del equipo
const equipoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true,
  },
  nombre: { type: String, required: true, maxlength: 40 },
  integrantes: [integranteSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// crea los modelos que usan las rutas para trabajar con la base
export const Usuario = mongoose.model('Usuario', usuarioSchema);
export const Equipo = mongoose.model('Equipo', equipoSchema);
