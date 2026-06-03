# Admin Analytics Dashboard API Documentation

## Overview
Comprehensive analytics dashboard for business metrics. All endpoints require JWT authentication and admin role. Focuses on sales metrics rather than writing metrics.

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

### 1. GET /admin/dashboard
**Description**: Complete admin dashboard with summary metrics, recent activity, and books overview.

**Method**: GET  
**Route**: `/admin/dashboard`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Response**:
```json
{
  "summary": {
    "totalSales": 287,
    "activeReaders": 156,
    "publishedBooks": 18,
    "monthlyRevenue": 4563.45
  },
  "recentActivity": [
    {
      "type": "purchase",
      "title": "New Purchase",
      "description": "Midnight Axiom purchased",
      "createdAt": "2026-06-02T12:34:56Z"
    },
    {
      "type": "registration",
      "title": "New User",
      "description": "user@example.com registered",
      "createdAt": "2026-06-02T11:20:00Z"
    }
  ],
  "books": [
    {
      "_id": "6a1e556b51bdb7c8c56fd3a1",
      "title": "The Great Novel",
      "coverUrl": "https://...",
      "priceCents": 2999,
      "sales": 45,
      "status": "published"
    }
  ]
}
```

**Summary Metrics**:
- **totalSales**: Count of all successful purchases
- **activeReaders**: Users with reading activity in last 30 days
- **publishedBooks**: Count of published books (isPublished: true)
- **monthlyRevenue**: Sum of all purchases in current month (as decimal currency)

**Recent Activity**:
- Last 10 events (purchases + registrations) sorted by date DESC
- Types: `purchase`, `registration`
- Each event includes type, title, description, createdAt

**Books Overview**:
- Last 10 published books sorted by publishedAt DESC
- Includes sales count for each book
- Fields: _id, title, coverUrl, priceCents, sales, status

---

### 2. GET /admin/books/:id/analytics
**Description**: Detailed analytics for a specific book.

**Method**: GET  
**Route**: `/admin/books/:id/analytics`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Book MongoDB ID |

**Response**:
```json
{
  "sales": 45,
  "revenue": 1349.55,
  "readers": 156,
  "conversionRate": 28.4,
  "averageProgress": 63.2
}
```

**Metrics**:
- **sales**: Number of purchase transactions for this book
- **revenue**: Total revenue from sales (as decimal currency)
- **readers**: Users with reading activity in last 30 days
- **conversionRate**: (readers / total views) × 100 (percentage)
- **averageProgress**: Average reading progress across all readers (0-100%)

---

## 3. GET /admin/analytics/activity

**Description**: Platform-wide reading activity analytics with daily breakdown and top books.

**Method**: GET  
**Route**: `/admin/analytics/activity`  
**Auth**: Required (admin)  
**Status**: `200 OK`

**Query Parameters**

| Parameter | Type | Default | Values |
|-----------|------|---------|--------|
| `period` | string | `7d` | `7d`, `30d`, `90d` |

**Response**:
```json
{
  "period": "7d",
  "summary": {
    "totalActiveSessions": 156,
    "totalPagesReadPlatform": 2845,
    "totalReadingTimePlatform": 4560,
    "averageSessionTime": 29,
    "activeReaderCount": 89
  },
  "chart": [
    {
      "label": "2026-05-27",
      "sessions": 22,
      "pagesRead": 412,
      "readingTime": 650,
      "activeReaders": 15
    },
    {
      "label": "2026-05-28",
      "sessions": 18,
      "pagesRead": 385,
      "readingTime": 580,
      "activeReaders": 12
    }
  ],
  "topBooks": [
    {
      "bookId": "667a1234567890abcdef1234",
      "title": "The Art of Programming",
      "sessionsCount": 45,
      "pagesRead": 1200
    }
  ]
}
```

**Summary Metrics**:
- **totalActiveSessions**: Total reading sessions in the period
- **totalPagesReadPlatform**: Total pages read across all users
- **totalReadingTimePlatform**: Total reading time in minutes across all users
- **averageSessionTime**: Average session duration in minutes
- **activeReaderCount**: Number of unique users with reading activity

**Chart Data** (Daily Breakdown):
- **label**: Date (YYYY-MM-DD)
- **sessions**: Number of reading sessions that day
- **pagesRead**: Pages read that day
- **readingTime**: Total reading time in minutes that day
- **activeReaders**: Unique users who read that day

**Top Books**:
- Top 5 most read books in the period
- **sessionsCount**: Number of reading sessions for this book
- **pagesRead**: Total pages read across all users

**Example**:
```bash
curl -X GET 'http://localhost:3109/admin/analytics/activity?period=7d' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**JavaScript/Node.js**:
```javascript
const response = await fetch(
  'http://localhost:3109/admin/analytics/activity?period=7d',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log(`📊 Total sesiones: ${data.summary.totalActiveSessions}`);
console.log(`📄 Páginas leídas: ${data.summary.totalPagesReadPlatform}`);
console.log(`⏱️ Tiempo total: ${data.summary.totalReadingTimePlatform} minutos`);
console.log(`👥 Lectores activos: ${data.summary.activeReaderCount}`);

// Plotear datos en gráfico
data.chart.forEach(day => {
  console.log(`${day.label}: ${day.sessions} sesiones, ${day.activeReaders} lectores`);
});
```

---

## Data Models

### Summary Object
```typescript
{
  totalSales: number;
  activeReaders: number;
  publishedBooks: number;
  monthlyRevenue: number;
}
```

### Activity Object
```typescript
{
  type: 'purchase' | 'registration';
  title: string;
  description: string;
  createdAt: Date;
}
```

### Book Overview Object
```typescript
{
  _id: ObjectId;
  title: string;
  coverUrl?: string;
  priceCents: number;
  sales: number;
  status: 'published' | 'draft' | 'preorder';
}
```

### Book Analytics Object
```typescript
{
  sales: number;
  revenue: number;
  readers: number;
  conversionRate: number;
  averageProgress: number;
}
```

### Platform Activity Object
```typescript
{
  period: '7d' | '30d' | '90d';
  summary: {
    totalActiveSessions: number;
    totalPagesReadPlatform: number;
    totalReadingTimePlatform: number;
    averageSessionTime: number;
    activeReaderCount: number;
  };
  chart: Array<{
    label: string;
    sessions: number;
    pagesRead: number;
    readingTime: number;
    activeReaders: number;
  }>;
  topBooks: Array<{
    bookId: string;
    title: string;
    sessionsCount: number;
    pagesRead: number;
  }>;
}
```

---

## Business Metrics Explained

### Total Sales
Count of all completed purchase records in database.
- Indicates total customer transactions
- Includes repeat purchases

### Active Readers
Number of unique users with reading activity in the last 30 days.
- Based on `ReadingProgress.lastReadAt > 30 days ago`
- Shows engagement level
- Helps identify platform usage

### Published Books
Count of books with `isPublished: true`.
- Indicates catalog size
- Excludes drafts and preorders
- Core content metric

### Monthly Revenue
Sum of all purchase amounts in current calendar month.
- Converted to decimal currency format (e.g., $45.99)
- Indicates business performance
- Resets monthly

### Conversion Rate
Percentage of unique readers who made a purchase: `(readers / views) × 100`
- Shows how many visitors become customers
- Higher percentage = better marketing/product fit
- Helps identify underperforming books

### Average Progress
Average reading progress across all active readers: mean of (currentPage / totalPages)
- Shows reader engagement depth
- 100% = book completed
- Lower progress suggests engagement issues

---

## Time-Based Filters

### Active Readers (Last 30 Days)
Queries `ReadingProgress.lastReadAt >= now - 30 days`
- Rolling 30-day window
- Updated real-time as readers open books

### Monthly Revenue
Queries `Purchase.createdAt >= beginning of current month`
- Current calendar month only
- Resets on 1st of each month
- UTC timezone

### Book Analytics Readers (Last 30 Days)
Only counts readers with activity in last 30 days
- Excludes inactive readers
- Shows current engagement

---

## Example Usage

### Monitor Dashboard
```javascript
const response = await fetch('http://localhost:3109/admin/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const dashboard = await response.json();

console.log('Total Sales:', dashboard.summary.totalSales);
console.log('Active Readers:', dashboard.summary.activeReaders);
console.log('Monthly Revenue: $' + dashboard.summary.monthlyRevenue);

// Latest activity
dashboard.recentActivity.forEach(activity => {
  console.log(`[${activity.type}] ${activity.description}`);
});

// Top books
dashboard.books.forEach(book => {
  console.log(`${book.title}: ${book.sales} sales`);
});
```

### Analyze Book Performance
```javascript
const bookId = '6a1e556b51bdb7c8c56fd3a1';
const response = await fetch(`http://localhost:3109/admin/books/${bookId}/analytics`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const analytics = await response.json();

console.log('Sales:', analytics.sales);
console.log('Revenue: $' + analytics.revenue.toFixed(2));
console.log('Conversion Rate: ' + analytics.conversionRate + '%');
console.log('Average Progress: ' + analytics.averageProgress + '%');

// Interpretation
if (analytics.conversionRate < 10) {
  console.log('⚠️  Low conversion - improve marketing or book visibility');
}

if (analytics.averageProgress < 30) {
  console.log('⚠️  Low engagement - readers not continuing');
}
```

---

## Performance Notes

- All queries use `.lean()` for optimal read performance
- Dashboard aggregations use parallel queries with Promise.all()
- No N+1 queries - book sales counted in single aggregation
- Recent activity limited to 10 most recent events
- Books overview limited to 10 most recent publications

---

## Caching Recommendations

Consider implementing caching for:
1. **Dashboard summary** - Update every 1 hour (less volatile)
2. **Recent activity** - Update every 15 minutes (user-facing)
3. **Books overview** - Update every 30 minutes (product metrics)
4. **Book analytics** - Update every 15 minutes (per-book view)

Suggested cache key format:
- `admin:dashboard` (TTL: 3600s)
- `admin:dashboard:activity` (TTL: 900s)
- `admin:dashboard:books` (TTL: 1800s)
- `admin:books:{id}:analytics` (TTL: 900s)

---

## Error Responses

### 404 Not Found (Book Analytics)
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

## Related Documentation
- [Admin Books API](./ADMIN_BOOKS_API.md) - Book management
- [Catalog API](./CATALOG_API.md) - Public catalog
- [Library API](./LIBRARY_API.md) - User reading progress
