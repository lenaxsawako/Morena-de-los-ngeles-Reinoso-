// PLANTILLA — para agregar un libro nuevo hacer DOS cosas:
//
// 1. Crear data/{slug}.js con este contenido (reemplazar 'slug-del-titulo' por el slug real)
// 2. Agregar el slug al array en data/index.js
//
// El slug es el título en minúsculas, sin tildes, espacios reemplazados por guiones.
// Ejemplos: 'don-quijote', 'el-aleph', 'cien-anos-de-soledad', 'la-divina-comedia'

(window.LIBROS = window.LIBROS || {})['slug-del-titulo'] = {
  slug: 'slug-del-titulo',   // (*) mismo valor que la clave de arriba
  titulo: '',                // (*)
  autor: '',                 // (*) 'Nombre Apellido'
  año: 0,                    // (*) año de primera publicación mundial
  genero: '',                // (*) Novela | No ficción | Ensayo | Ciencia ficción | etc.
  editorial: '',
  isbn: '',                  // '978-XX-XXXX-XXXX-X'
  paginas: 0,
  idioma: '',                // (*) Español | Inglés | Alemán | Francés | Italiano | etc.
  sinopsis: '',              // 2-4 oraciones, sin spoilers, en español
  portada: '',               // URL a imagen o ''

  // Paywall — omitir estos dos campos si el libro es totalmente gratuito
  // Los capítulos transcriptos en "capitulos" son los gratuitos. El paywall aparece al terminar el último.
  precio: '$ 4.99',          // texto que se muestra en la pantalla de desbloqueo
  pago_url: '',              // URL a la pasarela de pago (Gumroad, Stripe, etc.)

  // Si aún no se transcribió el contenido, dejar capitulos: []
  // Tipos de bloque:
  //   parrafo   → párrafo normal
  //   dialogo   → línea de diálogo, incluir el — tal como aparece en el libro
  //   separador → cambio de escena (donde el libro tiene ***, — o espacio) — sin campo texto
  //   cita      → epígrafe o cita en bloque
  //   titulo    → subtítulo dentro del capítulo
  capitulos: [
    {
      numero: 1,
      titulo: '',
      bloques: [
        { tipo: 'parrafo',   texto: '...' },
        { tipo: 'separador' },
        { tipo: 'dialogo',   texto: '—...' }
      ]
    }
  ]
};
