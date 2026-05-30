# Biblioteca personal

Colección de libros para leer en el navegador. Funciona sin servidor — abrí el archivo o entrá por GitHub Pages.

Los libros se transcriben manualmente en archivos `.js` dentro de `data/`. El catálogo se arma solo a partir de lo que haya ahí.

## Leer un libro

Desde el catálogo, hacé click en cualquier tarjeta y luego en **Leer**. El progreso (capítulo donde quedaste) se guarda en el navegador.

## Agregar un libro

1. Crear `data/{slug}.js` siguiendo la plantilla en `templates/libro.js`
2. Agregar el slug al array en `data/index.js`

El estado de lectura (pendiente / leyendo / leído) se guarda por navegador, no en los archivos.
