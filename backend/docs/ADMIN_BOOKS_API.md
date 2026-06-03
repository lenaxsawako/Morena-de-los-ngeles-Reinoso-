# Admin Book Management API Documentation

## Overview
Complete admin panel API for managing books. Single-author platform where books are stored in Google Drive. All endpoints require JWT authentication and admin role.

---

## Security
All endpoints require:
- **JWT Authentication**: Valid access token from login
- **Admin Role**: User must have `role: 'admin'`

**Header**:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. GET /admin/books/dashboard
**Description**: Get admin dashboard statistics.

**Method**: GET  
**Route**: `/admin/books/dashboard`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Response**:
```json
{
  "totalBooks": 24,
  "publishedBooks": 18,
  "draftBooks": 4,
  "preorders": 2,
  "totalPurchases": 156,
  "revenue": {
    "month": 14999,
    "total": 125450
  }
}
```

---

### 2. GET /admin/books
**Description**: List all books with optional filtering by status.

**Method**: GET  
**Route**: `/admin/books`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Query Parameters**:
| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| `status` | string | Filter by publication status | `published`, `draft`, `preorder` |
| `page` | number | Page number | Default: 1 |
| `limit` | number | Items per page | Default: 12 |

**Examples**:
```
GET /admin/books
GET /admin/books?status=published
GET /admin/books?status=draft&page=2&limit=20
GET /admin/books?status=preorder
```

**Response**:
```json
{
  "items": [
    {
      "_id": "6a1e556b51bdb7c8c56fd3a1",
      "title": "The Great Novel",
      "subtitle": "A journey through time",
      "isPublished": true,
      "isPreorder": false,
      "previewPages": 50,
      "totalPages": 342,
      "priceCents": 2999,
      "publishedAt": "2026-06-01T00:00:00Z",
      "createdAt": "2026-05-20T10:30:00Z"
    }
  ],
  "total": 18,
  "page": 1,
  "pages": 2
}
```

---

### 3. GET /admin/books/:id
**Description**: Get book details by ID.

**Method**: GET  
**Route**: `/admin/books/:id`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Book MongoDB ID |

**Response**:
```json
{
  "_id": "6a1e556b51bdb7c8c56fd3a1",
  "title": "The Great Novel",
  "slug": "the-great-novel",
  "subtitle": "A journey through time",
  "description": "A captivating story about...",
  "coverUrl": "https://drive.google.com/uc?id=cover-file-id",
  "driveFileId": "drive-file-id-pdf",
  "mimeType": "application/pdf",
  "fileSize": 5242880,
  "totalPages": 342,
  "previewPages": 50,
  "priceCents": 2999,
  "currency": "USD",
  "categoryRef": "6a1e556b51bdb7c8c56fd3a3",
  "authorRef": null,
  "isPublished": true,
  "isPreorder": false,
  "isLatestRelease": true,
  "releaseDate": null,
  "publishedAt": "2026-06-01T00:00:00Z",
  "views": 1234,
  "sales": 45,
  "metadata": {},
  "createdAt": "2026-05-20T10:30:00Z",
  "updatedAt": "2026-06-02T14:30:00Z"
}
```

**Error Cases**:
- 404 Not Found: Book with given ID does not exist

---

### 4. POST /admin/books
**Description**: Create a new book (draft) with optional cover image.

**Method**: POST  
**Route**: `/admin/books`  
**Auth**: Required (admin)  
**Content-Type**: `multipart/form-data`  
**Status**: `201 Created`

**Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Book title |
| `subtitle` | string | No | Book subtitle |
| `description` | string | No | Book description |
| `priceCents` | number | No | Price in cents |
| `currency` | string | No | Currency code (default: 'USD') |
| `previewPages` | number | No | Number of preview pages |
| `categoryRef` | string | No | Category MongoDB ObjectId |
| `cover` | file | No | Cover image (JPEG, PNG, WebP) |

**Example (curl)**:
```bash
curl -X POST http://localhost:3109/admin/books \
  -H "Authorization: Bearer <token>" \
  -F "title=New Book Title" \
  -F "description=Book description here" \
  -F "priceCents=1499" \
  -F "previewPages=20" \
  -F "categoryRef=6a1e556b51bdb7c8c56fd3a3" \
  -F "cover=@cover.jpg"
```

**Response**:
```json
{
  "_id": "6a1e556b51bdb7c8c56fd3a9",
  "title": "New Book Title",
  "slug": "new-book-title",
  "subtitle": "",
  "description": "Book description here",
  "priceCents": 1499,
  "currency": "USD",
  "previewPages": 20,
  "categoryRef": "6a1e556b51bdb7c8c56fd3a3",
  "coverUrl": "https://drive.google.com/uc?id=drive-file-id-cover",
  "isPublished": false,
  "isPreorder": false,
  "createdAt": "2026-06-02T00:00:00Z"
}
```

**Notes**:
- `cover` file is optional - can be added now or later via `/admin/books/:id/upload` endpoint
- `driveFileId`: Added later via `/admin/books/:id/upload` endpoint for PDF
- `authorRef`: Optional (single-author platform)
- `coverUrl`: Automatically uploaded to Google Drive if cover image is provided

---

### 5. PUT /admin/books/:id
**Description**: Update book fields.

**Method**: PUT  
**Route**: `/admin/books/:id`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Book MongoDB ID |

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "subtitle": "Updated subtitle",
  "description": "Updated description",
  "priceCents": 2999,
  "currency": "USD",
  "previewPages": 30,
  "categoryRef": "6a1e556b51bdb7c8c56fd3a4"
}
```

**Response**: Updated book object

---

### 6. POST /admin/books/:id/upload
**Description**: Upload PDF and cover image to Google Drive.

**Method**: POST  
**Route**: `/admin/books/:id/upload`  
**Auth**: Required (admin)  
**Content-Type**: `multipart/form-data`  
**Status**: `200 OK`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Book MongoDB ID |

**Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdf` | file | No | PDF file (must be application/pdf) |
| `cover` | file | No | Cover image (JPEG, PNG, WebP) |

**Example (curl)**:
```bash
curl -X POST http://localhost:3109/admin/books/6a1e556b51bdb7c8c56fd3a9/upload \
  -H "Authorization: Bearer <token>" \
  -F "pdf=@book.pdf" \
  -F "cover=@cover.jpg"
```

**Response**:
```json
{
  "_id": "6a1e556b51bdb7c8c56fd3a9",
  "driveFileId": "drive-file-id-pdf",
  "mimeType": "application/pdf",
  "fileSize": 5242880,
  "coverUrl": "https://drive.google.com/uc?id=drive-file-id-cover"
}
```

---

### 7. PATCH /admin/books/:id/publish
**Description**: Publish book (make it public).

**Method**: PATCH  
**Route**: `/admin/books/:id/publish`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Book MongoDB ID |

**Behavior**:
- Sets `isPublished = true`
- Sets `publishedAt = current timestamp`

**Response**: Updated book object

---

### 8. PATCH /admin/books/:id/unpublish
**Description**: Unpublish book (remove from public).

**Method**: PATCH  
**Route**: `/admin/books/:id/unpublish`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Behavior**:
- Sets `isPublished = false`
- Keeps `publishedAt` timestamp

**Response**: Updated book object

---

### 9. PATCH /admin/books/:id/latest
**Description**: Mark book as latest release (only one allowed).

**Method**: PATCH  
**Route**: `/admin/books/:id/latest`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Behavior**:
- Removes `isLatestRelease: true` from all other books
- Sets this book to `isLatestRelease: true`
- Used in `/catalog` landing page as featured release

**Response**: Updated book object

---

### 10. PATCH /admin/books/:id/preorder
**Description**: Mark book as preorder.

**Method**: PATCH  
**Route**: `/admin/books/:id/preorder`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Request Body**:
```json
{
  "releaseDate": "2026-07-15T00:00:00Z"
}
```

**Behavior**:
- Sets `isPreorder = true`
- Stores `releaseDate` for future availability

**Response**: Updated book object

---

### 11. GET /admin/books/:id/stats
**Description**: Get statistics for a specific book.

**Method**: GET  
**Route**: `/admin/books/:id/stats`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Book MongoDB ID |

**Response**:
```json
{
  "views": 1234,
  "previewReaders": 89,
  "purchases": 45,
  "revenue": 134955,
  "conversionRate": 3.65
}
```

**Metrics**:
- **views**: Total page views (from book schema)
- **previewReaders**: Users who accessed preview pages
- **purchases**: Number of purchase transactions
- **revenue**: Total revenue in cents (sum of all purchases)
- **conversionRate**: (purchases / views) × 100 (percentage)

---

## Data Models

### Book Object (Admin context)
```typescript
{
  _id: ObjectId;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  coverUrl?: string;
  driveFileId?: string;
  mimeType?: string;
  fileSize?: number;
  totalPages: number;
  previewPages: number;
  priceCents: number;
  currency: string;
  categoryRef?: ObjectId;
  authorRef?: ObjectId;
  isPublished: boolean;
  isPreorder: boolean;
  releaseDate?: Date;
  isLatestRelease: boolean;
  publishedAt?: Date;
  views: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Important Notes**:
- `driveFileId`: Optional, added after PDF upload via `/admin/books/:id/upload`
- `authorRef`: Optional (single-author platform)
- `coverUrl`: Optional, added when uploading cover image
- `metadata`: Free-form object for custom data

---

## Validation Rules

### Create Book
- `title`: Required, string
- `subtitle`: Optional, string
- `description`: Optional, string
- `priceCents`: Optional, number ≥ 0
- `currency`: Optional, string (default: 'USD')
- `previewPages`: Optional, number ≥ 0
- `categoryRef`: Optional, valid MongoDB ObjectId
- `authorRef`: Optional (single-author platform)
- `cover`: Optional, image file (JPEG, PNG, WebP) - uploaded to Google Drive automatically

### Update Book
- All fields optional
- Title change updates slug automatically
- Duplicate title check on slug collision

### Mark Preorder
- `releaseDate`: Required, ISO8601 date string

### File Upload (required before publish)
- **PDF**: Must be `application/pdf`
- **Cover**: Must be JPEG, PNG, or WebP
- Max size: 100MB per file (configurable)
- `driveFileId` is populated after successful upload

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Book with title 'X' already exists",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Book not found",
  "error": "Not Found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden - Admin role required"
}
```

---

## Workflow Examples

### Complete Book Publishing Workflow
```javascript
// 1. Create draft book WITH cover image
const formData = new FormData();
formData.append('title', 'My New Book');
formData.append('description', 'A great story');
formData.append('priceCents', '1999');
formData.append('categoryRef', categoryId);
formData.append('cover', coverImageFile); // Include cover image here

const book = await fetch('http://localhost:3109/admin/books', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const bookData = await book.json();
const bookId = bookData._id;

// 2. Upload PDF (optional - can skip if not needed)
const uploadFormData = new FormData();
uploadFormData.append('pdf', pdfFile);

await fetch(`http://localhost:3109/admin/books/${bookId}/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: uploadFormData
});

// 3. Publish the book
await fetch(`http://localhost:3109/admin/books/${bookId}/publish`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. Mark as latest release (optional)
await fetch(`http://localhost:3109/admin/books/${bookId}/latest`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Create Preorder Book
```javascript
const preorderDate = new Date('2026-07-15').toISOString();

const book = await fetch('http://localhost:3109/admin/books', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    title: 'Coming Soon',
    description: 'Highly anticipated release',
    priceCents: 2499
  })
});

const bookData = await book.json();

// Mark as preorder
await fetch(`http://localhost:3109/admin/books/${bookData._id}/preorder`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ releaseDate: preorderDate })
});
```

---

## Performance Notes

- All queries use `.lean()` for optimal read performance
- Database indexes on: `title`, `slug`, `isPublished`, `isLatestRelease`, `isPreorder`, `publishedAt`
- Pagination required for list endpoints
- Slug generation is automatic from title
- Only one book can have `isLatestRelease = true` at a time

---

## Related Documentation
- [Catalog API](./CATALOG_API.md) - Public catalog browsing
- [Landing API](./LANDING_API.md) - Landing page content
- [Library API](./LIBRARY_API.md) - User library and reading progress
