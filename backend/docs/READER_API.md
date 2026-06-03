# Reader API Documentation

## Base URL
```
http://localhost:3109
```

---

## Overview

El Reader API proporciona endpoints para gestionar el progreso de lectura, marcadores y la biblioteca personal del usuario.

---

## 1. Reading Progress

### GET /reading-progress/:bookId
Obtiene el progreso de lectura actual del usuario en un libro específico.

**Headers Requeridos:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "currentPage": 45,
  "progressPercentage": 15,
  "lastReadAt": "2026-06-02T14:30:00.000Z"
}
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3109/reading-progress/667a1234567890abcdef1234 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### POST /reading-progress/:bookId
Crea o actualiza el progreso de lectura del usuario.

**Headers Requeridos:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPage": 45
}
```

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "currentPage": 45,
  "progressPercentage": 15,
  "lastReadAt": "2026-06-02T14:35:00.000Z"
}
```

**Validación:**
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `currentPage` | number | ✅ Sí | Mínimo 1 |

**Ejemplo:**
```bash
curl -X POST http://localhost:3109/reading-progress/667a1234567890abcdef1234 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 45
  }'
```

**JavaScript Ejemplo:**
```typescript
const bookId = "667a1234567890abcdef1234";
const token = localStorage.getItem('token');

const response = await fetch(`http://localhost:3109/reading-progress/${bookId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentPage: 45
  })
});

const progress = await response.json();
console.log(`📖 Progreso guardado: ${progress.progressPercentage}%`);
```

---

### GET /reading-progress
Obtiene todo el progreso de lectura del usuario.

**Response - 200 OK**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "bookTitle": "El Quijote",
    "bookCoverUrl": "https://example.com/covers/quijote.jpg",
    "currentPage": 45,
    "progressPercentage": 15,
    "lastReadAt": "2026-06-02T14:30:00.000Z"
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "bookTitle": "Cien años de soledad",
    "bookCoverUrl": "https://example.com/covers/cien-anos.jpg",
    "currentPage": 120,
    "progressPercentage": 40,
    "lastReadAt": "2026-06-01T10:15:00.000Z"
  }
]
```

---

## 2. Bookmarks

### GET /bookmarks/:bookId
Obtiene todos los marcadores del usuario en un libro específico.

**Response - 200 OK**
```json
[
  {
    "id": "667a1234567890abcdef1111",
    "page": 20,
    "note": "Introducción importante",
    "createdAt": "2026-06-02T12:00:00.000Z",
    "updatedAt": "2026-06-02T12:00:00.000Z"
  },
  {
    "id": "667a1234567890abcdef2222",
    "page": 75,
    "note": "Personaje clave",
    "createdAt": "2026-06-02T13:00:00.000Z",
    "updatedAt": "2026-06-02T13:00:00.000Z"
  }
]
```

---

### POST /bookmarks/:bookId
Crea un marcador en un libro específico.

**Request Body:**
```json
{
  "page": 75,
  "note": "Personaje clave"
}
```

**Response - 200 OK**
```json
{
  "id": "667a1234567890abcdef2222",
  "page": 75,
  "note": "Personaje clave",
  "createdAt": "2026-06-02T13:00:00.000Z"
}
```

**Validación:**
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `page` | number | ✅ Sí | Mínimo 1 |
| `note` | string | ❌ No | Máximo 500 caracteres |

**Ejemplo:**
```bash
curl -X POST http://localhost:3109/bookmarks/667a1234567890abcdef1234 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 75,
    "note": "Escena importante"
  }'
```

---

### PUT /bookmarks/:bookmarkId
Actualiza un marcador existente.

**Request Body:**
```json
{
  "page": 76,
  "note": "Escena muy importante"
}
```

**Response - 200 OK**
```json
{
  "id": "667a1234567890abcdef2222",
  "page": 76,
  "note": "Escena muy importante",
  "updatedAt": "2026-06-02T13:30:00.000Z"
}
```

---

### DELETE /bookmarks/:bookmarkId
Elimina un marcador.

**Response - 200 OK**
```json
{
  "message": "Bookmark deleted"
}
```

**Error - 404 Not Found:**
```json
{
  "message": "Bookmark not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3109/bookmarks/667a1234567890abcdef2222 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### GET /bookmarks
Obtiene todos los marcadores del usuario en todos los libros.

**Response - 200 OK**
```json
[
  {
    "id": "667a1234567890abcdef1111",
    "bookId": "667a1234567890abcdef1234",
    "bookTitle": "El Quijote",
    "bookCoverUrl": "https://example.com/covers/quijote.jpg",
    "page": 20,
    "note": "Introducción importante",
    "createdAt": "2026-06-02T12:00:00.000Z"
  },
  {
    "id": "667b5678901234abcdef3333",
    "bookId": "667b5678901234abcdef5678",
    "bookTitle": "Cien años de soledad",
    "bookCoverUrl": "https://example.com/covers/cien-anos.jpg",
    "page": 150,
    "note": "Muerte del personaje principal",
    "createdAt": "2026-06-01T14:30:00.000Z"
  }
]
```

---

## 3. Library

### GET /library
Obtiene todos los libros comprados por el usuario con su progreso de lectura.

**Response - 200 OK**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "title": "El Quijote",
    "slug": "el-quijote",
    "description": "La novela más importante de la literatura española",
    "coverUrl": "https://example.com/covers/quijote.jpg",
    "currentPage": 45,
    "progressPercentage": 15,
    "lastReadAt": "2026-06-02T14:30:00.000Z",
    "purchasedAt": "2026-05-20T10:00:00.000Z"
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "title": "Cien años de soledad",
    "slug": "cien-anos-de-soledad",
    "description": "La obra maestra de García Márquez",
    "coverUrl": "https://example.com/covers/cien-anos.jpg",
    "currentPage": 120,
    "progressPercentage": 40,
    "lastReadAt": "2026-06-01T10:15:00.000Z",
    "purchasedAt": "2026-05-15T14:00:00.000Z"
  }
]
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3109/library \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### GET /library/stats
Obtiene estadísticas de lectura del usuario.

**Response - 200 OK**
```json
{
  "totalBooks": 5,
  "booksInProgress": 3,
  "booksFinished": 0,
  "averageProgress": 35,
  "lastReadAt": "2026-06-02T14:30:00.000Z"
}
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3109/library/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### GET /library/:bookId
Obtiene detalles de un libro específico con el progreso de lectura.

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "title": "El Quijote",
  "slug": "el-quijote",
  "description": "La novela más importante de la literatura española",
  "coverUrl": "https://example.com/covers/quijote.jpg",
  "authorRef": "667c9999888877776666cccc",
  "driveFileId": "1AbCd-EfGhIjKlMnOpQrStUvWxYz",
  "currentPage": 45,
  "progressPercentage": 15,
  "lastReadAt": "2026-06-02T14:30:00.000Z",
  "purchasedAt": "2026-05-20T10:00:00.000Z"
}
```

---

## Flujo Completo de Lectura

### 1. Obtener biblioteca
```typescript
async function loadLibrary() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3109/library', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const books = await response.json();
  console.log('📚 Libros:', books);
  
  // Mostrar primer libro
  const firstBook = books[0];
  console.log(`📖 Retomar: ${firstBook.title} en página ${firstBook.currentPage}`);
}
```

### 2. Abrir un libro y obtener progreso
```typescript
async function openBook(bookId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3109/reading-progress/${bookId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const progress = await response.json();
  console.log(`📖 Leyendo: página ${progress.currentPage}`);
  
  return progress.currentPage;
}
```

### 3. Cambiar página durante la lectura
```typescript
async function changePage(bookId, newPage) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3109/reading-progress/${bookId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPage: newPage })
  });
  
  const updated = await response.json();
  console.log(`✅ Página ${updated.currentPage} (${updated.progressPercentage}%)`);
}
```

### 4. Crear un marcador
```typescript
async function addBookmark(bookId, page, note) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3109/bookmarks/${bookId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page, note })
  });
  
  const bookmark = await response.json();
  console.log(`🔖 Marcador creado en página ${bookmark.page}`);
}
```

### 5. Ver marcadores
```typescript
async function viewBookmarks(bookId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3109/bookmarks/${bookId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const bookmarks = await response.json();
  bookmarks.forEach(b => {
    console.log(`🔖 Página ${b.page}: ${b.note}`);
  });
}
```

### 6. Obtener estadísticas
```typescript
async function getStats() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3109/library/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const stats = await response.json();
  console.log(`📊 Estadísticas:`);
  console.log(`   - Libros totales: ${stats.totalBooks}`);
  console.log(`   - En progreso: ${stats.booksInProgress}`);
  console.log(`   - Finalizados: ${stats.booksFinished}`);
  console.log(`   - Progreso promedio: ${stats.averageProgress}%`);
}
```

---

## Errores Comunes

| Código | Significado | Causa |
|--------|-------------|-------|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Validación fallida o datos inválidos |
| 401 | Unauthorized | Token ausente o inválido |
| 404 | Not Found | Recurso no encontrado |
| 500 | Server Error | Error interno del servidor |

---

## Notas de Implementación

### Actualización Automática de Progreso
Cuando el usuario cambia de página en el lector:

```typescript
// Debounce para no enviar demasiadas solicitudes
let debounceTimer;

function onPageChange(newPage) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    changePage(bookId, newPage);
  }, 1000); // Esperar 1 segundo sin cambios
}
```

### Sincronización
- El progreso se sincroniza automáticamente con `POST /reading-progress/:bookId`
- Al abrir un libro, siempre llamar a `GET /reading-progress/:bookId` para restaurar la posición
- Los marcadores se sincronizan en tiempo real

### Índices MongoDB
- `ReadingProgress` tiene índice único en `(userRef, bookRef)`
- `Bookmark` tiene índices para búsquedas rápidas por usuario y libro
- Se pueden recuperar todos los marcadores del usuario ordenados por fecha

---

## Requisitos de Autorización

Todos los endpoints requieren un JWT válido en el header `Authorization: Bearer <token>`.

El token debe contener:
- `sub`: ID del usuario en MongoDB
- `email`: Email del usuario
- `iat`: Fecha de emisión
- `exp`: Fecha de expiración (1 hora)

Ejemplo:
```typescript
const headers = {
  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJzdWIiOiI2NjdhMTIzNDU2Nzg5MGFiY2RlZjEyMzQiLCJpYXQiOjE3NzAwNjcyMDAsImV4cCI6MTc3MDA2NzkyMH0.abc123...`
};
```

---

## 3. Reader Analytics

### GET /reader/analytics/activity

Obtiene estadísticas de actividad de lectura del usuario con tendencias diarias.

**Headers Requeridos:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters**

| Parameter | Type | Default | Required | Values |
|-----------|------|---------|----------|--------|
| `period` | string | `7d` | No | `7d`, `30d`, `90d` |

**Response - 200 OK**

```json
{
  "period": "7d",
  "summary": {
    "totalSessions": 12,
    "totalPagesRead": 156,
    "totalReadingTime": 480,
    "averageSessionTime": 40,
    "booksInProgress": 3,
    "booksFinished": 5
  },
  "chart": [
    {
      "label": "2026-05-27",
      "sessions": 2,
      "pagesRead": 28,
      "readingTime": 45
    },
    {
      "label": "2026-05-28",
      "sessions": 1,
      "pagesRead": 18,
      "readingTime": 30
    },
    {
      "label": "2026-05-29",
      "sessions": 3,
      "pagesRead": 45,
      "readingTime": 75
    }
  ],
  "topBooks": [
    {
      "bookId": "667a1234567890abcdef1234",
      "title": "The Art of Programming",
      "coverUrl": "https://drive.google.com/...",
      "pagesRead": 156,
      "progressPercentage": 52,
      "lastReadAt": "2026-06-02T14:30:00.000Z"
    }
  ]
}
```

**Response Schema**

- **period** (string): Período solicitado (7d, 30d, 90d)

- **summary** (object): Resumen de estadísticas
  - `totalSessions` (number): Total de sesiones de lectura
  - `totalPagesRead` (number): Total de páginas leídas
  - `totalReadingTime` (number): Tiempo total de lectura en minutos
  - `averageSessionTime` (number): Tiempo promedio por sesión en minutos
  - `booksInProgress` (number): Libros actualmente en lectura
  - `booksFinished` (number): Libros completados

- **chart** (array): Datos de actividad diaria
  - `label` (string): Fecha (YYYY-MM-DD)
  - `sessions` (number): Número de sesiones de lectura ese día
  - `pagesRead` (number): Páginas leídas ese día
  - `readingTime` (number): Tiempo de lectura en minutos ese día

- **topBooks** (array): Top 5 libros más leídos en el período
  - `bookId` (ObjectId): ID del libro
  - `title` (string): Título del libro
  - `coverUrl` (string|null): URL de portada
  - `pagesRead` (number): Páginas leídas de este libro
  - `progressPercentage` (number): Porcentaje de progreso
  - `lastReadAt` (ISO8601): Última vez que se leyó

**Ejemplo:**

```bash
curl -X GET 'http://localhost:3109/reader/analytics/activity?period=7d' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**JavaScript/Node.js:**

```javascript
const response = await fetch(
  'http://localhost:3109/reader/analytics/activity?period=7d',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log(`📊 Sesiones de lectura: ${data.summary.totalSessions}`);
console.log(`📄 Páginas leídas: ${data.summary.totalPagesRead}`);
console.log(`⏱️ Tiempo total: ${data.summary.totalReadingTime} minutos`);

// Plotear datos en gráfico
data.chart.forEach(day => {
  console.log(`${day.label}: ${day.sessions} sesiones, ${day.pagesRead} páginas`);
});
```

**Period Grouping**

| Period | Rango | Ejemplo |
|--------|-------|---------|
| `7d` | Últimos 7 días | Datos diarios |
| `30d` | Últimos 30 días | Datos diarios |
| `90d` | Últimos 90 días | Datos por semana |

---

### GET /reader/analytics/stats

Obtiene estadísticas generales del usuario sobre su historial de lectura.

**Headers Requeridos:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response - 200 OK**

```json
{
  "totalBooksFinished": 12,
  "totalBooksInProgress": 3,
  "totalPagesRead": 3456,
  "totalReadingTime": 5760,
  "averageReadingTime": 480,
  "favoriteCategory": "Science Fiction",
  "longestBook": {
    "bookId": "667a1234567890abcdef1234",
    "title": "War and Peace",
    "pages": 1200
  },
  "recentBooks": [
    {
      "bookId": "667a1234567890abcdef1234",
      "title": "The Art of Programming",
      "progressPercentage": 52,
      "lastReadAt": "2026-06-02T14:30:00.000Z"
    }
  ]
}
```

**Response Schema**

- `totalBooksFinished` (number): Libros completados
- `totalBooksInProgress` (number): Libros en progreso
- `totalPagesRead` (number): Total de páginas leídas
- `totalReadingTime` (number): Tiempo total de lectura en minutos
- `averageReadingTime` (number): Tiempo promedio de lectura por libro en minutos
- `favoriteCategory` (string): Categoría con más libros leídos
- `longestBook` (object): Libro más largo leído
- `recentBooks` (array): Últimos 5 libros abiertos

**Ejemplo:**

```javascript
const response = await fetch(
  'http://localhost:3109/reader/analytics/stats',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const stats = await response.json();
console.log(`📚 Libros completados: ${stats.totalBooksFinished}`);
console.log(`⏳ Horas de lectura: ${(stats.totalReadingTime / 60).toFixed(1)}`);
console.log(`⭐ Categoría favorita: ${stats.favoriteCategory}`);
```
