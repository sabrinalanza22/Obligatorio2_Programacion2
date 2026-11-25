import jwt from 'jsonwebtoken';

// el token lleva el id de la cuenta y vence después de dos horas
export function crearToken(id) {
  return jwt.sign({ id: String(id) }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });
}

// el middleware verifica la firma y el vencimiento antes de dejar pasar la petición
export function pedirToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const partes = cabecera.split(' ');
  const token = partes[1];
  if (partes[0].toLowerCase() !== 'bearer' || !token || partes.length !== 2) {
    return res.status(401).json({ error: 'Iniciá sesión para continuar.' });
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof datos.id !== 'string' || !/^[a-f0-9]{24}$/i.test(datos.id)) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    req.usuario = datos;
  } catch {
    return res
      .status(401)
      .json({ error: 'Tu sesión venció o el token no es válido.' });
  }

  next();
}
