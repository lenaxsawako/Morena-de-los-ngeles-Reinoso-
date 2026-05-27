# Instrucciones para GitHub Copilot — Biblioteca de lectura

Sitio estático en GitHub Pages. Sin servidor, sin build. Los datos son archivos `.js`.

## Estructura de datos

```
data/
  index.js                  → lista de slugs de todos los libros
  cien-anos-de-soledad.js   → libro completo (metadata + capítulos)
  el-nombre-de-la-rosa.js
  sapiens.js
  ...
```

Cada libro es un único archivo en `data/`. El nombre del archivo es el **slug** del título.

**Slug:** título en minúsculas, sin tildes, espacios reemplazados por guiones.
Ejemplos: `don-quijote`, `el-aleph`, `la-divina-comedia`, `cien-anos-de-soledad`

---

## Cómo agregar un libro — dos pasos

### Paso 1 — Crear data/{slug}.js

Ver plantilla completa en `templates/libro.js`.

```js
(window.LIBROS = window.LIBROS || {})['el-proceso'] = {
  slug: 'el-proceso',
  titulo: 'El proceso',
  autor: 'Franz Kafka',
  año: 1925,
  genero: 'Novela',
  editorial: 'Verlag Die Schmiede',
  isbn: '978-84-206-3113-3',
  paginas: 264,
  idioma: 'Alemán',
  sinopsis: 'Josef K. es arrestado sin explicación. Intenta enfrentarse a un sistema judicial opaco e inapelable.',
  portada: '',
  capitulos: [
    {
      numero: 1,
      titulo: 'I',
      bloques: [
        { tipo: 'parrafo', texto: 'Alguien debía haber calumniado a Josef K...' },
        { tipo: 'separador' },
        { tipo: 'parrafo', texto: 'Esto nunca había ocurrido antes.' }
      ]
    }
  ]
};
```

### Paso 2 — Agregar el slug a data/index.js

```js
window.INDEX = [
  'cien-anos-de-soledad',
  'el-nombre-de-la-rosa',
  'sapiens',
  '1984',
  'el-proceso'   // ← agregar aquí
];
```

---

## Campos del libro

| Campo | Tipo | Requerido |
|---|---|---|
| `slug` | string | sí — mismo valor que el nombre del archivo y la clave |
| `titulo` | string | sí |
| `autor` | string | sí — 'Nombre Apellido' |
| `año` | number | sí — año de primera publicación mundial |
| `genero` | string | sí |
| `editorial` | string | no |
| `isbn` | string | no — '978-XX-XXXX-XXXX-X' |
| `paginas` | number | no |
| `idioma` | string | sí — idioma original en español |
| `sinopsis` | string | no — 2-4 oraciones, sin spoilers, en español |
| `portada` | string | no — URL o '' |
| `precio` | string | no — texto visible en la pantalla de pago. Ej: `'$ 4.99'` |
| `pago_url` | string | no — URL a la pasarela de pago (Gumroad, Stripe, etc.) |
| `capitulos` | array | sí — vacío `[]` si aún no se transcribió |

**Géneros:** `Novela` · `Novela histórica` · `Cuento` · `Poesía` · `Ensayo` · `No ficción` · `Ciencia ficción` · `Distopía` · `Fantasía` · `Terror` · `Thriller` · `Biografía` · `Autobiografía` · `Filosofía` · `Historia` · `Ciencia` · `Tecnología` · `Economía` · `Psicología` · `Arte`

---

## Tipos de bloque en capitulos

| `tipo` | Cuándo usarlo |
|---|---|
| `parrafo` | Párrafo normal — uno por párrafo del libro |
| `dialogo` | Línea de diálogo — incluir el — tal como aparece |
| `separador` | Cambio de escena (`***`, `—`, espacio) — **sin campo `texto`** |
| `cita` | Epígrafe o cita en bloque |
| `titulo` | Subtítulo dentro del capítulo |

- Un párrafo del libro = un objeto `parrafo`. No unir ni partir párrafos.
- Respetar ortografía y puntuación original.
- Si el capítulo no tiene título usar `''`.

---

---

## Workflow con PDF — cómo procesar un libro nuevo

Cuando se adjunte un PDF para transcribir, seguir estos pasos:

### 1. Analizar el PDF

Leer el libro completo e identificar:
- Título, autor, año, género, editorial, ISBN, páginas, idioma
- Total de capítulos
- **Punto de corte épico**: el momento de mayor tensión narrativa que NO esté cerca del final (idealmente entre el 30% y el 60% del libro). Tiene que ser un capítulo que termine en un momento de alta tensión, revelación o giro — algo que deje al lector con ganas de continuar.

### 2. Transcribir solo los capítulos gratuitos

Transcribir únicamente los capítulos hasta el corte épico.
El array `capitulos` contiene solo los capítulos gratuitos — el paywall aparece automáticamente al terminar el último.
Los capítulos restantes NO se transcriben — el usuario los descarga en PDF tras el pago.

### 4. Crear el archivo data/{slug}.js

Incluir `libre_hasta`, `precio` y `pago_url` (la URL se completará después si no se tiene aún).

---

## No modificar

`index.html` · `leer.html` · `css/` · `js/main.js` · `js/leer.js`
