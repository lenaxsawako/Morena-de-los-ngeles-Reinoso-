# Library & Reading Progress API Documentation

## Base URL
```
http://localhost:3109
```

---

## Overview

El Library API proporciona funcionalidad completa para gestionar la lectura, el progreso de lectura, favoritos y sincronización entre dispositivos.

Con esta API puedes:
- Actualizar progreso de lectura
- Obtener la colección de libros del usuario
- Gestionar favoritos con marcapáginas
- Sincronizar progreso entre dispositivos
- Obtener estadísticas de lectura

**Autenticación:** Todos los endpoints requieren JWT token válido

---

## Endpoints

### 1. POST /reading-progress/:bookId

Actualiza o crea el progreso de lectura para un libro.

**Endpoint:**
```
POST /reading-progress/:bookId
```

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPage": 180
}
```

**Validación:**
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `currentPage` | number | ✅ Sí | Mínimo 1 |

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "currentPage": 180,
  "progressPercentage": 64,
  "lastReadAt": "2026-06-02T15:30:45.123Z"
}
```

**Comportamiento:**
- Crea un registro si no existe
- Actualiza si ya existe
- Calcula automáticamente `progressPercentage` basado en `totalPages`
- Actualiza `lastReadAt` con timestamp actual

**Ejemplo:**
```bash
curl -X POST http://localhost:3109/reading-progress/667a1234567890abcdef1234 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 180
  }'
```

---

### 2. GET /reading-progress/:bookId

Obtiene el progreso de lectura actual para un libro.

**Endpoint:**
```
GET /reading-progress/:bookId
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "currentPage": 180,
  "progressPercentage": 64,
  "lastReadAt": "2026-06-02T15:30:45.123Z"
}
```

---

### 3. GET /reading-progress

Obtiene todo el progreso de lectura del usuario.

**Endpoint:**
```
GET /reading-progress
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "bookTitle": "The Echo of Silence",
    "bookCoverUrl": "https://example.com/covers/echo-of-silence.jpg",
    "currentPage": 180,
    "progressPercentage": 64,
    "lastReadAt": "2026-06-02T15:30:45.123Z"
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "bookTitle": "The Last Bridge",
    "bookCoverUrl": "https://example.com/covers/last-bridge.jpg",
    "currentPage": 45,
    "progressPercentage": 18,
    "lastReadAt": "2026-06-01T10:15:22.456Z"
  }
]
```

---

## Library Endpoints

### 4. GET /library

Obtiene la colección de libros comprados con estado de lectura.

**Endpoint:**
```
GET /library
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "title": "The Echo of Silence",
    "slug": "the-echo-of-silence",
    "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
    "progressPercentage": 64,
    "status": "reading"
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "title": "The Last Bridge",
    "slug": "the-last-bridge",
    "coverUrl": "https://example.com/covers/last-bridge.jpg",
    "progressPercentage": 0,
    "status": "unread"
  },
  {
    "bookId": "667c9876543210fedcba9876",
    "title": "Shadow Scripts",
    "slug": "shadow-scripts",
    "coverUrl": "https://example.com/covers/shadow-scripts.jpg",
    "progressPercentage": 100,
    "status": "completed"
  }
]
```

**Status Mapping:**
- `unread`: 0% progress
- `reading`: 1-99% progress
- `completed`: 100% progress

---

### 5. GET /library/dashboard

Obtiene el dashboard completo: libro en lectura + colección.

**Endpoint:**
```
GET /library/dashboard
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
{
  "continueReading": {
    "bookId": "667a1234567890abcdef1234",
    "title": "The Echo of Silence",
    "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
    "currentPage": 180,
    "progressPercentage": 64,
    "remainingPages": 120,
    "lastReadAt": "2026-06-02T15:30:45.123Z"
  },
  "collection": [
    {
      "bookId": "667a1234567890abcdef1234",
      "title": "The Echo of Silence",
      "slug": "the-echo-of-silence",
      "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
      "progressPercentage": 64,
      "status": "reading"
    }
  ]
}
```

---

### 6. GET /library/continue-reading

Obtiene el libro más recientemente abierto.

**Endpoint:**
```
GET /library/continue-reading
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "title": "The Echo of Silence",
  "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
  "currentPage": 180,
  "progressPercentage": 64,
  "remainingPages": 120,
  "lastReadAt": "2026-06-02T15:30:45.123Z"
}
```

**Response si no hay libro:**
```json
null
```

---

### 7. GET /library/recent

Obtiene libros abiertos recientemente.

**Endpoint:**
```
GET /library/recent
```

**Autenticación:** Requerida

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 5 | Número de libros a retornar |

**Response - 200 OK**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "title": "The Echo of Silence",
    "slug": "the-echo-of-silence",
    "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
    "currentPage": 180,
    "progressPercentage": 64,
    "lastReadAt": "2026-06-02T15:30:45.123Z"
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "title": "The Last Bridge",
    "slug": "the-last-bridge",
    "coverUrl": "https://example.com/covers/last-bridge.jpg",
    "currentPage": 45,
    "progressPercentage": 18,
    "lastReadAt": "2026-06-01T10:15:22.456Z"
  }
]
```

---

### 8. GET /library/favorites

Obtiene los libros marcados como favoritos (con al menos un marcapáginas).

**Endpoint:**
```
GET /library/favorites
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "title": "The Echo of Silence",
    "slug": "the-echo-of-silence",
    "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
    "progressPercentage": 64,
    "bookmarkCount": 5
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "title": "The Last Bridge",
    "slug": "the-last-bridge",
    "coverUrl": "https://example.com/covers/last-bridge.jpg",
    "progressPercentage": 45,
    "bookmarkCount": 3
  }
]
```

---

### 9. POST /library/sync

Sincroniza el progreso de lectura del invitado con la cuenta autenticada.

**Endpoint:**
```
POST /library/sync
```

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
[
  {
    "bookId": "667a1234567890abcdef1234",
    "currentPage": 180,
    "progressPercentage": 64,
    "lastReadAt": "2026-06-01T15:30:45.123Z"
  },
  {
    "bookId": "667b5678901234abcdef5678",
    "currentPage": 45,
    "progressPercentage": 18,
    "lastReadAt": "2026-06-01T10:15:22.456Z"
  }
]
```

**Response - 200 OK**
```json
{
  "synced": 2,
  "details": [
    {
      "bookId": "667a1234567890abcdef1234",
      "action": "created",
      "currentPage": 180,
      "progressPercentage": 64
    },
    {
      "bookId": "667b5678901234abcdef5678",
      "action": "updated",
      "currentPage": 45,
      "progressPercentage": 18
    }
  ]
}
```

**Comportamiento de Sincronización:**
- Si el libro no existe en la cuenta: **crea** un nuevo registro
- Si el libro existe: **compara timestamps**
  - Si el progreso del invitado es más reciente: **actualiza**
  - Si el progreso del backend es más reciente: **omite** (preserva los datos más actuales)

---

### 10. GET /library/stats

Obtiene estadísticas de lectura del usuario.

**Endpoint:**
```
GET /library/stats
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
{
  "totalBooks": 8,
  "booksInProgress": 3,
  "booksFinished": 2,
  "averageProgress": 42,
  "lastReadAt": "2026-06-02T15:30:45.123Z"
}
```

---

### 11. GET /library/:bookId

Obtiene detalles completos de un libro con progreso de lectura.

**Endpoint:**
```
GET /library/:bookId
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
{
  "bookId": "667a1234567890abcdef1234",
  "title": "The Echo of Silence",
  "slug": "the-echo-of-silence",
  "description": "Una novela profunda que explora los límites entre el recuerdo y la realidad.",
  "coverUrl": "https://example.com/covers/echo-of-silence.jpg",
  "authorRef": "667z0000000000000000zzzz",
  "driveFileId": "drive_file_123",
  "currentPage": 180,
  "progressPercentage": 64,
  "lastReadAt": "2026-06-02T15:30:45.123Z",
  "purchasedAt": "2026-05-15T10:20:30.000Z"
}
```

---

## Bookmark Endpoints

### 12. POST /reading-progress/:bookId/bookmarks

Crear un marcapáginas.

**Endpoint:**
```
POST /reading-progress/:bookId/bookmarks
```

**Autenticación:** Requerida

**Request Body:**
```json
{
  "page": 180,
  "note": "Important quote about identity"
}
```

---

### 13. GET /reading-progress/:bookId/bookmarks

Obtener todos los marcapáginas de un libro.

**Endpoint:**
```
GET /reading-progress/:bookId/bookmarks
```

**Autenticación:** Requerida

**Response - 200 OK**
```json
[
  {
    "id": "bookmark_id_1",
    "page": 180,
    "note": "Important quote about identity",
    "createdAt": "2026-06-02T15:30:45.123Z"
  }
]
```

---

## JavaScript Ejemplos

### Cargar Dashboard

```typescript
async function loadDashboard(token: string) {
  const response = await fetch('http://localhost:3109/library/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  const dashboard = await response.json();
  
  // Mostrar libro en lectura
  if (dashboard.continueReading) {
    renderContinueReading(dashboard.continueReading);
  }
  
  // Mostrar colección
  renderCollection(dashboard.collection);
}

function renderContinueReading(book) {
  const html = `
    <section class="continue-reading">
      <h2>Continue Reading</h2>
      <div class="book-card">
        <img src="${book.coverUrl}" alt="${book.title}">
        <h3>${book.title}</h3>
        <p>Page ${book.currentPage} of ${book.currentPage + book.remainingPages}</p>
        <div class="progress-bar">
          <div class="progress" style="width: ${book.progressPercentage}%"></div>
        </div>
      </div>
    </section>
  `;
  document.getElementById('dashboard').innerHTML += html;
}
```

### Actualizar Progreso

```typescript
async function updateReadingProgress(bookId: string, currentPage: number, token: string) {
  const response = await fetch(`http://localhost:3109/reading-progress/${bookId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPage })
  });

  const result = await response.json();
  console.log(`✅ Progress updated: ${result.progressPercentage}%`);
}
```

### Sincronizar Progreso de Invitado

```typescript
async function syncGuestProgress(guestProgress: Array<any>, token: string) {
  const response = await fetch('http://localhost:3109/library/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(guestProgress)
  });

  const result = await response.json();
  console.log(`✅ Synced ${result.synced} books`);
  console.log(result.details);
}
```

---

## Detalles Técnicos

### Unique Compound Index
ReadingProgress tiene un índice único compuesto:
```
{ userRef: 1, bookRef: 1 }
```
Esto asegura que solo hay un registro de progreso por usuario por libro.

### Ordenamiento
- **Recent Books**: `lastReadAt DESC` (más recientes primero)
- **Continue Reading**: Retorna el libro con `lastReadAt` más reciente
- **Bookmarks**: Ordenados por `page ASC`

### Cálculo de Porcentaje
```
progressPercentage = (currentPage / totalPages) * 100
```

### Sincronización de Invitados
Preserva los datos más actuales comparando `lastReadAt`:
- Si `guestLastReadAt > backendLastReadAt`: **actualiza**
- Si `guestLastReadAt ≤ backendLastReadAt`: **omite**

---

## Status Mapping

| Porcentaje | Status |
|-----------|--------|
| 0% | `unread` |
| 1-99% | `reading` |
| 100% | `completed` |

---

## Errores Potenciales

| Código | Significado | Causa |
|--------|-------------|-------|
| 200 | OK | Solicitud exitosa |
| 401 | Unauthorized | Token inválido o expirado |
| 404 | Not Found | Libro o recurso no encontrado |
| 400 | Bad Request | Datos inválidos |
| 500 | Server Error | Error interno |

---

## Notas

- Todos los endpoints requieren autenticación JWT
- `lastReadAt` se actualiza automáticamente cada vez que se actualiza progreso
- El progreso de lectura se crea automáticamente si no existe (upsert)
- Los marcapáginas son fundamentales para marcar un libro como favorito
- La sincronización de invitados preserva los datos más recientes
