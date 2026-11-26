// el servicio puede indicar qué pasó sin tener que conocer el objeto res de express
export function errorCon(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function validar(validacion, datos) {
  try {
    return validacion(datos);
  } catch (error) {
    throw errorCon(400, error.message);
  }
}
