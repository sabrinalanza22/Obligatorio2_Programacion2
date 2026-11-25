# Pokemon - Armado de equipos

URL: https://obligatorio2-programacion2-1.onrender.com

Este sitio te permite crear una cuenta y armar tus propios equipos Pokemon. Lo desarrollé para el Obligatorio 2 de Programación 2.

Cada usuario tiene sus equipos separados y puede crearlos, editarlos o eliminarlos.

## ¿Qué se puede hacer?

- Crear una cuenta y/o iniciar sesión
- Armar equipos con hasta seis Pokemon
- Buscar Pokemon por nombre o número
- Personalizar mote, sexo, shiny, nivel, habilidad, movimientos, objeto, naturaleza, teratipo, EV e IV
- Agregar notas y guardar los cambios

Los datos de las cuentas y los equipos quedan guardados en MongoDB Atlas. La información de los Pokemon se consulta en PokéAPI.

## Tecnologías

Para el front usé HTML, CSS y JavaScript. El back está hecho con Node.js, Express y Mongoose.
Las contraseñas se guardan como hashes con bcrypt y el acceso a los equipos se controla con JWT.

## Cómo guardar un equipo

Guardar desde la pantalla de personalización aplica los cambios al borrador. Para que queden guardados en la base, después hay que presionar **Guardar cambios** en la pantalla del equipo.

# Anexo - Uso de inteligencia artificial

Para este proyecto usé ChatGPT como apoyo para implementar funciones específicas como el carrusel de pokemon del registro / inicio de sesión. También me sirvió de ayuda para localizar errores puntuales y darme sugerencias de cómo mejorar el sitio. También me ayudó con algunos temas de interfaz para que la web sea lo más user-friendly posible. Me ayudó a definir cómo organizar los archivos js del front, y me fue de gran utilidad en la creación del css.