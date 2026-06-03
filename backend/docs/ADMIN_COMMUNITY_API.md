# Admin Community Insights API Documentation

Community analytics endpoints for reader engagement, reviews, and activity tracking. All endpoints are protected with JWT authentication and require admin role.

**Base URLs**: 
- `/admin/community` - Dashboard and activity
- `/admin/reviews` - Review management
- `/admin/readers` - Reader statistics

**Authentication**: Required (JwtAuthGuard + RolesGuard with @Roles('admin'))  
**Rate Limiting**: Applies to all endpoints

---

## 1. GET /admin/community

Get complete community dashboard with summary metrics, reader activity, top readers, and latest reviews.

### Request

```http
GET /admin/community
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "summary": {
    "totalReaders": 1248,
    "newsletterSubscribers": 412,
    "reviewsCount": 156,
    "averageRating": 4.8
  },
  "activity": [
    {
      "label": "2026-05",
      "activeReaders": 145,
      "readingSessions": 487
    },
    {
      "label": "2026-06",
      "activeReaders": 238,
      "readingSessions": 612
    }
  ],
  "topReaders": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "name": "Denis",
      "booksOwned": 4,
      "averageProgress": 82.5,
      "lastActivity": "2026-06-02T10:30:00Z"
    }
  ],
  "latestReviews": [
    {
      "reviewId": "507f1f77bcf86cd799439012",
      "userName": "John Doe",
      "bookTitle": "The Art of Programming",
      "rating": 5,
      "content": "Excellent book, highly recommend!",
      "createdAt": "2026-06-02T08:15:00Z"
    }
  ]
}
```

### Response Schema

- **summary** (object): Community statistics
  - `totalReaders` (number): Unique users who purchased or have reading activity
  - `newsletterSubscribers` (number): Active newsletter subscribers
  - `reviewsCount` (number): Total approved reviews
  - `averageRating` (number): Average rating across all approved reviews (1-5)

- **activity** (array): Reader activity trend data (last 12 months)
  - `label` (string): Month in YYYY-MM format
  - `activeReaders` (number): Distinct readers active that month
  - `readingSessions` (number): Total reading progress updates

- **topReaders** (array): Top 10 most engaged readers
  - `userId` (ObjectId): Unique user identifier
  - `name` (string): User name (or email if name not set)
  - `booksOwned` (number): Total books purchased (paid status only)
  - `averageProgress` (number): Average reading progress across all books (0-100%)
  - `lastActivity` (ISO8601|null): Last reading timestamp

- **latestReviews** (array): 10 most recent approved reviews
  - `reviewId` (ObjectId): Review ID
  - `userName` (string): Reviewer name
  - `bookTitle` (string): Book being reviewed
  - `rating` (number): Star rating (1-5)
  - `content` (string): Review text
  - `createdAt` (ISO8601): Publication date

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/community',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const dashboard = await response.json();
console.log(`${dashboard.summary.totalReaders} total readers`);
```

**cURL**

```bash
curl -X GET 'http://localhost:3109/admin/community' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 2. GET /admin/community/activity

Get reader activity trend chart with configurable period grouping.

### Request

```http
GET /admin/community/activity?period=monthly
Authorization: Bearer <jwt_token>
```

### Query Parameters

| Parameter | Type | Default | Required | Values |
|-----------|------|---------|----------|--------|
| `period` | string | `monthly` | No | `weekly`, `monthly` |

### Response (200 OK)

```json
{
  "items": [
    {
      "label": "2026-06-01",
      "activeReaders": 52,
      "readingSessions": 131
    },
    {
      "label": "2026-06-02",
      "activeReaders": 48,
      "readingSessions": 117
    }
  ]
}
```

### Response Schema

- **items** (array): Activity data points
  - `label` (string): Time period identifier
    - Monthly: `YYYY-MM-DD` (first day of month)
    - Weekly: `YYYY-Www` (ISO week number)
  - `activeReaders` (number): Distinct users with reading activity that period
  - `readingSessions` (number): Total reading progress updates

### Period Details

| Period | Range | Format | Example |
|--------|-------|--------|---------|
| `monthly` | Last 12 months | `YYYY-MM-DD` (1st of month) | 2026-06-01 |
| `weekly` | Last 56 days (8 weeks) | `YYYY-Www` | 2026-W22 |

### Examples

**JavaScript/Node.js - Monthly Activity**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/community/activity?period=monthly',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { items } = await response.json();
items.forEach(month => {
  console.log(`${month.label}: ${month.activeReaders} readers`);
});
```

**JavaScript/Node.js - Weekly Activity**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/community/activity?period=weekly',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { items } = await response.json();
// Items will be grouped by ISO week
```

---

## 3. GET /admin/reviews

Get paginated list of latest approved reviews sorted by creation date (newest first).

### Request

```http
GET /admin/reviews?page=1&limit=20
Authorization: Bearer <jwt_token>
```

### Query Parameters

| Parameter | Type | Default | Required | Values |
|-----------|------|---------|----------|--------|
| `page` | number | `1` | No | ≥ 1 |
| `limit` | number | `10` | No | 1-100 |

### Response (200 OK)

```json
{
  "items": [
    {
      "reviewId": "507f1f77bcf86cd799439012",
      "userName": "Denis",
      "bookTitle": "Midnight Axiom",
      "rating": 5,
      "content": "Absolutely brilliant. The philosophical depth combined with practical examples makes this a must-read. I've recommended it to all my colleagues.",
      "createdAt": "2026-06-02T08:15:00Z"
    },
    {
      "reviewId": "507f1f77bcf86cd799439013",
      "userName": "Sarah Chen",
      "bookTitle": "The Art of Programming",
      "rating": 4,
      "content": "Great content, though some chapters felt rushed.",
      "createdAt": "2026-06-01T14:32:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "pages": 16
}
```

### Response Schema

- **items** (array): Approved reviews
  - `reviewId` (ObjectId): Review document ID
  - `userName` (string): Reviewer name (or email if name unavailable)
  - `bookTitle` (string): Book being reviewed
  - `rating` (number): Star rating (1-5)
  - `content` (string): Review text (up to 5000 characters)
  - `createdAt` (ISO8601): Review publication timestamp

- **total** (number): Total approved review count
- **page** (number): Current page number
- **pages** (number): Total number of pages at current limit

### Notes

- Only **approved** reviews are returned
- Sorted by `createdAt DESC` (newest first)
- Pending and rejected reviews are not included

### Examples

**JavaScript/Node.js**

```javascript
async function getReviews(page = 1, limit = 20) {
  const response = await fetch(
    `http://localhost:3109/admin/reviews?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const { items, total, pages } = await response.json();
  console.log(`Showing page ${page} of ${pages} (${total} total reviews)`);
  
  items.forEach(review => {
    console.log(`⭐${review.rating} - ${review.userName}: "${review.bookTitle}"`);
  });
}

// Pagination example
await getReviews(1, 50);  // First 50 reviews
```

**cURL**

```bash
# Get first 20 reviews
curl -X GET 'http://localhost:3109/admin/reviews?page=1&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Get reviews on page 5
curl -X GET 'http://localhost:3109/admin/reviews?page=5&limit=20' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 4. GET /admin/readers

Get top 10 most engaged readers sorted by books owned (descending).

### Request

```http
GET /admin/readers
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "items": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "name": "Denis",
      "booksOwned": 4,
      "averageProgress": 82.5,
      "lastActivity": "2026-06-02T10:30:00Z"
    },
    {
      "userId": "507f1f77bcf86cd799439014",
      "name": "Sarah Chen",
      "booksOwned": 3,
      "averageProgress": 65.3,
      "lastActivity": "2026-06-02T09:15:00Z"
    },
    {
      "userId": "507f1f77bcf86cd799439015",
      "name": "michael@example.com",
      "booksOwned": 3,
      "averageProgress": 0,
      "lastActivity": null
    }
  ]
}
```

### Response Schema

- **items** (array): Top 10 readers
  - `userId` (ObjectId): Unique user identifier
  - `name` (string): User name (or email if name not set)
  - `booksOwned` (number): Count of paid purchases
  - `averageProgress` (number): Average reading progress across all books (0-100%)
  - `lastActivity` (ISO8601|null): Most recent reading timestamp, or null if no reading activity

### Sorting

- Primary: `booksOwned DESC` (most books first)
- Limit: Top 10 readers only
- Filter: Only includes users with `status: 'paid'` purchases

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/readers',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { items } = await response.json();

items.forEach((reader, index) => {
  console.log(
    `${index + 1}. ${reader.name} - ${reader.booksOwned} books, ` +
    `${reader.averageProgress}% avg progress`
  );
});
```

**cURL**

```bash
curl -X GET 'http://localhost:3109/admin/readers' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## Data Models Reference

### Review Schema

```typescript
{
  _id: ObjectId,
  userRef: ObjectId,              // Reference to User
  bookRef: ObjectId,              // Reference to Book
  rating: number,                 // 1-5 stars
  content: string,                // Review text (10-5000 chars)
  status: 'pending'|'approved'|'rejected',
  rejectionReason?: string,       // Optional reason if rejected
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `bookRef`, `userRef`, `status`, `createdAt` (individual)
- `{ userRef, bookRef }` (unique, sparse) - one review per user per book

### ReadingProgress Schema

```typescript
{
  _id: ObjectId,
  userRef: ObjectId,              // Reference to User (indexed)
  bookRef: ObjectId,              // Reference to Book (indexed)
  currentPage: number,            // Current page number
  progressPercentage: number,     // 0-100%
  lastReadAt: Date,               // Last reading timestamp (indexed)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ userRef, bookRef }` (unique) - one progress per user per book
- `userRef`, `bookRef`, `lastReadAt`

---

## Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Returned when JWT token is missing, invalid, or expired.

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

Returned when user is authenticated but does not have `admin` role.

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid period. Must be one of: weekly, monthly",
  "error": "Bad Request"
}
```

Returned when:
- Invalid `period` parameter (not weekly or monthly)
- Invalid pagination (page < 1 or limit < 1)

---

## Performance Optimization

### Aggregation Pipeline Queries

The dashboard uses MongoDB aggregation pipelines for efficient data calculation:

```javascript
// Example: Get unique reader count (optimized)
db.purchases.distinct('userRef')  // Database-level distinct
db.readingprogresses.distinct('userRef')

// Then merged in service layer (fast set union)
```

### Indexes

All queries leverage compound and single-field indexes:
- Reviews grouped by `status` and sorted by `createdAt`
- Purchases filtered by `status` ('paid') and distinct `userRef`
- Reading progress sorted by `lastReadAt` for activity tracking

### Recommended Caching

```javascript
const cache = new Map();

async function getCachedDashboard() {
  if (cache.has('community_dashboard')) {
    return cache.get('community_dashboard');
  }
  
  const data = await fetch('/admin/community').then(r => r.json());
  cache.set('community_dashboard', data);
  
  // Expire cache after 5 minutes
  setTimeout(() => cache.delete('community_dashboard'), 5 * 60 * 1000);
  
  return data;
}
```

---

## Review Moderation

### Status Values

| Status | Visibility | Description |
|--------|------------|-------------|
| `approved` | Public | Published, visible in UI and API |
| `pending` | Internal only | Awaiting moderation, visible in admin only |
| `rejected` | Internal only | Flagged by moderator, not shown to users |

### Future Moderation Endpoints

These will be added in upcoming releases:
- `PATCH /admin/reviews/:id/approve` - Approve pending review
- `PATCH /admin/reviews/:id/reject` - Reject with reason
- `GET /admin/reviews/pending` - Moderation queue

---

## Related Endpoints

- [Admin Books API](./ADMIN_BOOKS_API.md) - Book management
- [Admin Analytics API](./ADMIN_ANALYTICS_API.md) - Business metrics
- [Admin Reporting API](./ADMIN_REPORTING_API.md) - Financial reports
- [Catalog API](./CATALOG_API.md) - Public catalog

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-02 | Initial release with dashboard, activity, reviews, and readers endpoints |
