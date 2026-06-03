# Landing Page API Documentation

## Base URL
```
http://localhost:3109
```

---

## Overview

El Landing Page API proporciona acceso a todo el contenido necesario para renderizar la página de inicio de la librería personal del autor. Con una sola solicitud, el frontend obtiene:

- **Último Lanzamiento** (sección hero)
- **Historias Destacadas** (featured stories)
- **Últimos Volúmenes** (últimos publicados)

---

## GET /landing

Obtiene todo el contenido de la página de inicio.

**Endpoint:**
```
GET /landing
```

**Autenticación:** No requerida (público)

**Response - 200 OK**
```json
{
  "latestRelease": {
    "_id": "667a1234567890abcdef1234",
    "title": "The Echo of Silence",
    "subtitle": "A Journey Through Forgotten Memories",
    "slug": "the-echo-of-silence",
    "description": "Una novela profunda que explora los límites entre el recuerdo y la realidad.",
    "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
    "priceCents": 1999,
    "currency": "USD"
  },
  "philosophy": {
    "title": "Arquitectura del Pensamiento",
    "content": "No escribo para llenar el silencio, sino para enmarcarlo. Mi trabajo vive en espacios liminales donde la palabra encuentra su verdadero peso..."
  },
  "featuredBooks": [
    {
      "_id": "667b5678901234abcdef5678",
      "title": "The Last Bridge",
      "subtitle": "Crossing Boundaries",
      "description": "Una épica de aventura y redención.",
      "coverUrl": "https://example.com/covers/last-bridge.jpg"
    },
    {
      "_id": "667c9876543210fedcba9876",
      "title": "Shadow Scripts",
      "subtitle": "Tales from the Dark",
      "description": "Historias de misterio y suspenso.",
      "coverUrl": "https://example.com/covers/shadow-scripts.jpg"
    },
    {
      "_id": "667d1111222233334444dddd",
      "title": "The Archive",
      "subtitle": "Secrets of Time",
      "description": "Un thriller arqueológico de proporciones épicas.",
      "coverUrl": "https://example.com/covers/the-archive.jpg"
    }
  ],
  "latestVolumes": [
    {
      "_id": "667e5555666677778888eeee",
      "title": "Midnight Axiom",
      "subtitle": "The Dark Philosophy",
      "publishedAt": "2026-05-25T10:00:00.000Z",
      "coverUrl": "https://example.com/covers/midnight-axiom.jpg"
    },
    {
      "_id": "667f9999888877776666ffff",
      "title": "Chronicle of Fog",
      "subtitle": "Whispers in the Mist",
      "publishedAt": "2026-05-15T14:30:00.000Z",
      "coverUrl": "https://example.com/covers/chronicle-fog.jpg"
    },
    {
      "_id": "667a1111222233334444aaaa",
      "title": "Static Waves",
      "subtitle": "Interference Patterns",
      "publishedAt": "2026-05-05T09:15:00.000Z",
      "coverUrl": "https://example.com/covers/static-waves.jpg"
    },
    {
      "_id": "667b2222333344445555bbbb",
      "title": "The Glass Horizon",
      "subtitle": "Reflections of Tomorrow",
      "publishedAt": "2026-04-20T16:45:00.000Z",
      "coverUrl": "https://example.com/covers/glass-horizon.jpg"
    }
  ]
}
```

---

## GET /landing/philosophy

Obtiene únicamente la sección de filosofía.

**Endpoint:**
```
GET /landing/philosophy
```

**Autenticación:** No requerida (público)

**Response - 200 OK**
```json
{
  "title": "Arquitectura del Pensamiento",
  "content": "No escribo para llenar el silencio, sino para enmarcarlo. Mi trabajo vive en espacios liminales donde la palabra encuentra su verdadero peso..."
}
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3109/landing/philosophy
```

---

## PUT /admin/landing/philosophy

Crea o actualiza la sección de filosofía.

**Endpoint:**
```
PUT /admin/landing/philosophy
```

**Autenticación:** Requerida (admin)

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Arquitectura del Pensamiento",
  "content": "No escribo para llenar el silencio, sino para enmarcarlo. Mi trabajo vive en espacios liminales donde la palabra encuentra su verdadero peso..."
}
```

**Validación:**
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `title` | string | ✅ Sí | Máximo 150 caracteres |
| `content` | string | ✅ Sí | Máximo 5000 caracteres |

**Response - 200 OK**
```json
{
  "title": "Arquitectura del Pensamiento",
  "content": "No escribo para llenar el silencio, sino para enmarcarlo..."
}
```

**Comportamiento:**
- Si SiteConfig no existe, se crea automáticamente
- Si ya existe, se actualiza
- El whitespace se elimina automáticamente antes de guardar

**Ejemplo:**
```bash
curl -X PUT http://localhost:3109/admin/landing/philosophy \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Arquitectura del Pensamiento",
    "content": "No escribo para llenar el silencio..."
  }'
```

**JavaScript Ejemplo:**
```typescript
async function updatePhilosophy(title: string, content: string) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3109/admin/landing/philosophy', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content })
  });

  const updated = await response.json();
  console.log('✅ Filosofía actualizada:', updated);
  return updated;
}
```

---

## Secciones del Landing

### 1. Latest Release (Hero)

**Propósito:** Mostrar el último lanzamiento del autor en un gran banner hero.

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | ObjectId | ID único del libro |
| `title` | string | Título del libro |
| `subtitle` | string | Subtítulo |
| `slug` | string | URL-friendly identifier |
| `description` | string | Descripción larga |
| `coverUrl` | string | URL de la portada |
| `priceCents` | number | Precio en centavos |
| `currency` | string | Divisa (ej: USD) |

**Criterio:**
- Debe tener `isLatestRelease = true`
- Solo puede haber un libro con este flag
- Si no hay ninguno, retorna `null`

**Ejemplo HTML:**
```html
<section class="hero">
  <img src="latestRelease.coverUrl" alt="hero image">
  <h1>{{latestRelease.title}}</h1>
  <p class="subtitle">{{latestRelease.subtitle}}</p>
  <p class="description">{{latestRelease.description}}</p>
  <button class="btn-buy">Buy: ${{latestRelease.priceCents / 100}}</button>
</section>
```

---

### 2. Philosophy (About Author)

**Propósito:** Mostrar la filosofía y visión del autor.

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | string | Título de la sección |
| `content` | string | Contenido/descripción |

**Criterio:**
- Se almacena en SiteConfig
- Un solo documento de configuración
- Se puede editar vía admin endpoint

**Ejemplo HTML:**
```html
<section class="philosophy">
  <h2>{{philosophy.title}}</h2>
  <p class="author-statement">{{philosophy.content}}</p>
</section>
```

---

### 3. Featured Books (Featured Stories)

**Propósito:** Mostrar 3 libros destacados del autor.

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | ObjectId | ID único del libro |
| `title` | string | Título |
| `subtitle` | string | Subtítulo |
| `description` | string | Descripción |
| `coverUrl` | string | URL de la portada |

**Criterio:**
- Debe tener `isFeatured = true`
- Máximo 3 libros
- Ordenados por orden de inserción

**Ejemplo HTML:**
```html
<section class="featured">
  <h2>Featured Stories</h2>
  <div class="cards">
    {{#each featuredBooks}}
      <div class="card">
        <img src="{{this.coverUrl}}">
        <h3>{{this.title}}</h3>
        <p class="subtitle">{{this.subtitle}}</p>
        <p class="description">{{this.description}}</p>
      </div>
    {{/each}}
  </div>
</section>
```

---

### 4. Latest Volumes (Latest Published)

**Propósito:** Mostrar los 4 últimos libros publicados.

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | ObjectId | ID único |
| `title` | string | Título |
| `subtitle` | string | Subtítulo |
| `publishedAt` | Date | Fecha de publicación |
| `coverUrl` | string | URL de portada |

**Criterio:**
- Debe tener `isPublished = true`
- Ordenado por `publishedAt` DESC (más recientes primero)
- Máximo 4 libros

**Ejemplo HTML:**
```html
<section class="latest-volumes">
  <h2>Latest Volumes</h2>
  <div class="grid">
    {{#each latestVolumes}}
      <div class="volume-item">
        <img src="{{this.coverUrl}}">
        <h4>{{this.title}}</h4>
        <p>{{this.subtitle}}</p>
        <span class="date">{{formatDate this.publishedAt}}</span>
      </div>
    {{/each}}
  </div>
</section>
```

---

## JavaScript Ejemplo

### Cargar landing page

```typescript
async function loadLandingPage() {
  try {
    const response = await fetch('http://localhost:3109/landing');
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error loading landing page:', data);
      return;
    }

    console.log('Landing page data:', data);
    
    // Renderizar hero
    if (data.latestRelease) {
      renderHero(data.latestRelease);
    }
    
    // Renderizar filosofía
    if (data.philosophy) {
      renderPhilosophy(data.philosophy);
    }
    
    // Renderizar featured
    if (data.featuredBooks.length > 0) {
      renderFeatured(data.featuredBooks);
    }
    
    // Renderizar latest volumes
    if (data.latestVolumes.length > 0) {
      renderLatestVolumes(data.latestVolumes);
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

function renderHero(book) {
  const hero = document.querySelector('.hero');
  hero.innerHTML = `
    <img src="${book.coverUrl}" alt="${book.title}">
    <div class="hero-content">
      <h1>${book.title}</h1>
      <p class="subtitle">${book.subtitle}</p>
      <p class="description">${book.description}</p>
      <button class="btn-primary">Buy for $${(book.priceCents / 100).toFixed(2)}</button>
    </div>
  `;
}

function renderPhilosophy(philosophy) {
  const section = document.querySelector('.philosophy');
  section.innerHTML = `
    <h2>${philosophy.title}</h2>
    <p class="author-statement">${philosophy.content}</p>
  `;
}

function renderFeatured(books) {
  const featured = document.querySelector('.featured-books');
  const html = books.map(book => `
    <div class="book-card">
      <img src="${book.coverUrl}" alt="${book.title}">
      <h3>${book.title}</h3>
      <p class="subtitle">${book.subtitle}</p>
      <p class="description">${book.description}</p>
    </div>
  `).join('');
  featured.innerHTML = html;
}

function renderLatestVolumes(books) {
  const volumes = document.querySelector('.latest-volumes');
  const html = books.map(book => `
    <div class="volume-card">
      <img src="${book.coverUrl}">
      <h4>${book.title}</h4>
      <p>${book.subtitle}</p>
      <small>${new Date(book.publishedAt).toLocaleDateString()}</small>
    </div>
  `).join('');
  volumes.innerHTML = html;
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadLandingPage);
```

---

## Curl Ejemplo

```bash
curl -X GET http://localhost:3109/landing \
  -H "Accept: application/json"
```

---

## Detalles Técnicos

### Optimización

- ✅ Queries con `.lean()` para mejor rendimiento
- ✅ Solo selecciona campos necesarios
- ✅ Ejecución paralela de 4 queries (`Promise.all()`)
- ✅ Sin poblaciones innecesarias
- ✅ Índices en campos críticos (`isFeatured`, `isLatestRelease`)

### Campos Seleccionados

**Latest Release:**
- `_id`, `title`, `subtitle`, `slug`, `description`, `coverUrl`, `priceCents`, `currency`

**Philosophy:**
- `title`, `content`

**Featured Books:**
- `_id`, `title`, `subtitle`, `description`, `coverUrl`

**Latest Volumes:**
- `_id`, `title`, `subtitle`, `publishedAt`, `coverUrl`

### Modelo de Datos

Nuevos campos en Book schema:

```typescript
@Prop({ default: '' })
subtitle!: string;

@Prop({ default: false, index: true })
isFeatured!: boolean;

@Prop({ default: false, unique: true, sparse: true })
isLatestRelease!: boolean;
```

---

## Casos de Uso

### 1. Primera carga de página
```typescript
// Una sola solicitud para cargar todo el contenido
const landingData = await fetch('/landing').then(r => r.json());

// Frontend renderiza 4 secciones sin llamadas adicionales
```

### 2. Actualizar admin
Cuando el admin marca un libro como `isFeatured = true`:
- El field se indexa para búsquedas rápidas
- El landing se actualiza automáticamente en próxima carga

### 3. Nuevo lanzamiento
Cuando se publica un nuevo libro:
1. Admin marca `isLatestRelease = true` (reemplaza anterior)
2. Frontend lo muestra en próxima carga
3. El índice único previene duplicados

---

## Restricciones

| Restricción | Implementación |
|-------------|-----------------|
| Un solo `isLatestRelease = true` | Índice único con `sparse: true` |
| Máximo 3 featured | `.limit(3)` en query |
| Máximo 4 latest | `.limit(4)` en query |
| Ordenado por fecha | `.sort({ publishedAt: -1 })` |
| Solo publicados | `.find({ isPublished: true })` |

---

## Flujo Completo

```
Frontend
   ↓
GET /landing
   ↓
LandingController
   ↓
LandingService.getLandingPage()
   ↓
Promise.all([
  getLatestRelease(),
  getPhilosophy(),
  getFeaturedBooks(),
  getLatestVolumes()
])
   ↓
4 queries optimizadas ejecutadas en paralelo
   ↓
{
  latestRelease: {},
  philosophy: { title, content },
  featuredBooks: [],
  latestVolumes: []
}
   ↓
Frontend renderiza 4 secciones
```

---

## Errores Potenciales

| Código | Significado | Causa |
|--------|-------------|-------|
| 200 | OK | Solicitud exitosa |
| 500 | Server Error | Error en la BD o servicio |

---

## Notas

- Endpoints públicos: `GET /landing` y `GET /landing/philosophy` - no requieren autenticación
- Endpoint admin: `PUT /admin/landing/philosophy` - requiere JWT con rol 'admin'
- Todas las queries usan `.lean()` para mejor rendimiento
- Las 4 queries se ejecutan en paralelo con `Promise.all()`
- Si no hay `latestRelease`, el campo retorna `null`
- Si no hay `featuredBooks` o `latestVolumes`, retornan arrays vacíos
