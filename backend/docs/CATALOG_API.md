# Catalog API Documentation

## Overview
The Catalog API provides endpoints for browsing books, searching, and accessing catalog organization (categories). All endpoints are public and do not require authentication.

---

## Endpoints

### 1. GET /catalog
**Description**: Returns catalog landing page with latest release, preorder book, categories, and featured books.

**Method**: GET  
**Route**: `/catalog`  
**Auth**: None (Public)  
**Status**: `200 OK`

**Response**:
```json
{
  "latestRelease": {
    "_id": "6a1e556b51bdb7c8c56fd3a1",
    "title": "The Great Novel",
    "subtitle": "A journey through time",
    "description": "An epic tale...",
    "coverUrl": "https://...",
    "publishedAt": "2026-06-01T00:00:00Z"
  },
  "preorderBook": {
    "_id": "6a1e556b51bdb7c8c56fd3a2",
    "title": "Coming Soon",
    "description": "Highly anticipated...",
    "coverUrl": "https://...",
    "releaseDate": "2026-07-15T00:00:00Z"
  },
  "categories": [
    {
      "_id": "6a1e556b51bdb7c8c56fd3a3",
      "name": "FANTASÍA",
      "slug": "fantasia"
    },
    {
      "_id": "6a1e556b51bdb7c8c56fd3a4",
      "name": "ROMANCE",
      "slug": "romance"
    }
  ],
  "featuredBooks": [
    {
      "_id": "6a1e556b51bdb7c8c56fd3a5",
      "title": "Featured Title",
      "description": "...",
      "coverUrl": "https://...",
      "priceCents": 2999
    }
  ]
}
```

---

### 2. GET /catalog/categories
**Description**: Returns all active categories sorted by order.

**Method**: GET  
**Route**: `/catalog/categories`  
**Auth**: None (Public)  
**Status**: `200 OK`

**Response**:
```json
[
  {
    "_id": "6a1e556b51bdb7c8c56fd3a3",
    "name": "FANTASÍA",
    "slug": "fantasia"
  },
  {
    "_id": "6a1e556b51bdb7c8c56fd3a4",
    "name": "ROMANCE",
    "slug": "romance"
  },
  {
    "_id": "6a1e556b51bdb7c8c56fd3a5",
    "name": "TODO",
    "slug": "todo"
  }
]
```

---

### 3. GET /books
**Description**: Search and list published books with pagination, text search, and category filtering.

**Method**: GET  
**Route**: `/books`  
**Auth**: None (Public)  
**Status**: `200 OK`

**Query Parameters**:
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `q` | string | No | Text search (searches title and description) | - |
| `category` | string | No | Filter by category slug | - |
| `page` | number | No | Page number | 1 |
| `limit` | number | No | Items per page | 12 |

**Examples**:
```
GET /books
GET /books?q=fantasy
GET /books?category=fantasia
GET /books?category=romance&page=2&limit=20
GET /books?q=adventure&category=fantasia&page=1
```

**Response**:
```json
{
  "items": [
    {
      "_id": "6a1e556b51bdb7c8c56fd3a1",
      "title": "The Great Novel",
      "description": "An epic tale...",
      "coverUrl": "https://...",
      "priceCents": 2999,
      "category": "FANTASÍA"
    },
    {
      "_id": "6a1e556b51bdb7c8c56fd3a2",
      "title": "Love Story",
      "description": "A romantic journey...",
      "coverUrl": "https://...",
      "priceCents": 1999,
      "category": "ROMANCE"
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 4
}
```

---

### 4. GET /books/:slug
**Description**: Get complete book details by slug (Quick View).

**Method**: GET  
**Route**: `/books/:slug`  
**Auth**: None (Public)  
**Status**: `200 OK`  
**Status**: `null` if book not found

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Book slug (unique identifier) |

**Example**:
```
GET /books/the-great-novel
GET /books/love-story
```

**Response** (on success):
```json
{
  "_id": "6a1e556b51bdb7c8c56fd3a1",
  "title": "The Great Novel",
  "subtitle": "A journey through time",
  "description": "An epic tale of adventure and discovery...",
  "coverUrl": "https://...",
  "priceCents": 2999,
  "currency": "USD",
  "previewPages": 50,
  "totalPages": 342,
  "category": {
    "_id": "6a1e556b51bdb7c8c56fd3a3",
    "name": "FANTASÍA",
    "slug": "fantasia"
  }
}
```

**Response** (not found):
```json
null
```

---

## Data Models

### Book Object (in catalog context)
```typescript
{
  _id: ObjectId;
  title: string;
  subtitle?: string;
  description: string;
  coverUrl?: string;
  priceCents: number;
  currency: string;
  previewPages: number;
  totalPages: number;
  categoryRef: ObjectId;
  isPublished: boolean;
  isPreorder: boolean;
  releaseDate?: Date;
  isFeatured: boolean;
  publishedAt?: Date;
}
```

### Category Object
```typescript
{
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
}
```

---

## Filtering & Search Rules

### Text Search
- Searches across `title` and `description` fields
- Case-insensitive
- Requires a valid search query in `q` parameter

### Category Filtering
- Filter by category `slug` (not ID)
- Must be an active category
- If category slug doesn't exist, returns empty results

### Pagination
- Default page: 1
- Default limit: 12 items per page
- Total pages calculated: `Math.ceil(total / limit)`
- Invalid page numbers return empty results

### Publishing Rules
- Only shows `isPublished: true` books
- Preorder books (`isPreorder: true`) shown separately in `/catalog` landing only
- Search and catalog listings exclude preorder books

---

## JavaScript Examples

### Fetch catalog landing page
```javascript
const response = await fetch('http://localhost:3109/catalog');
const data = await response.json();

console.log('Latest Release:', data.latestRelease);
console.log('Featured Books:', data.featuredBooks);
console.log('Categories:', data.categories);
```

### Search books by query
```javascript
const query = 'fantasy';
const response = await fetch(`http://localhost:3109/books?q=${encodeURIComponent(query)}`);
const data = await response.json();

console.log('Found:', data.total, 'books');
console.log('Page', data.page, 'of', data.pages);
data.items.forEach(book => {
  console.log(`- ${book.title} (${book.category})`);
});
```

### Filter by category with pagination
```javascript
const category = 'fantasia';
const page = 2;
const limit = 20;
const url = `http://localhost:3109/books?category=${category}&page=${page}&limit=${limit}`;
const response = await fetch(url);
const data = await response.json();

console.log(`Showing ${data.items.length} of ${data.total} books in ${category}`);
```

### Get book details
```javascript
const slug = 'the-great-novel';
const response = await fetch(`http://localhost:3109/books/${slug}`);
const book = await response.json();

if (book) {
  console.log(`Title: ${book.title}`);
  console.log(`Price: $${(book.priceCents / 100).toFixed(2)}`);
  console.log(`Pages: ${book.totalPages}`);
  console.log(`Category: ${book.category.name}`);
} else {
  console.log('Book not found');
}
```

### Combined search with category and pagination
```javascript
const params = new URLSearchParams({
  q: 'adventure',
  category: 'fantasia',
  page: '1',
  limit: '15'
});

const response = await fetch(`http://localhost:3109/books?${params}`);
const data = await response.json();

data.items.forEach(book => {
  console.log(`${book.title} - ${book.category} - $${(book.priceCents/100).toFixed(2)}`);
});
```

---

## Error Handling

### Invalid Query Parameters
- Invalid `page` or `limit` values default to 1 and 12 respectively
- Empty `q` parameter is treated as no search filter
- Invalid `category` slug returns empty results (no 404)

### Book Not Found
- Endpoint returns `null` instead of 404
- Frontend should check for null and display "Book not found"

---

## Performance Notes

- All queries use `.lean()` for optimal read performance
- Indexes exist on: `slug`, `title`, `categoryRef`, `publishedAt`, `isPreorder`
- Text search is supported on `title` and `description`
- Pagination is required for `/books` endpoint to avoid large result sets
- Featured books limited to 6 results max

---

## Related Documentation
- [Library API](./LIBRARY_API.md) - User library and reading progress
- [Landing API](./LANDING_API.md) - Landing page content
