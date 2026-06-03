# Admin Reporting API Documentation

Financial and analytics reporting endpoints for admin dashboard. All endpoints are protected with JWT authentication and admin role validation.

**Base URL**: `/admin/dashboard`  
**Authentication**: Required (JwtAuthGuard + RolesGuard with @Roles('admin'))  
**Rate Limiting**: Applies to all endpoints

---

## 1. GET /admin/dashboard/analytics

Get comprehensive financial analytics with summary metrics, revenue trends, and top performing books.

### Request

```http
GET /admin/dashboard/analytics?period=30d
Authorization: Bearer <jwt_token>
```

### Query Parameters

| Parameter | Type | Default | Required | Values |
|-----------|------|---------|----------|--------|
| `period` | string | `30d` | No | `7d`, `30d`, `90d`, `12m` |

### Response (200 OK)

```json
{
  "summary": {
    "totalRevenue": 5234.50,
    "monthlyRevenue": 1250.75,
    "totalPurchases": 187,
    "averageOrderValue": 27.96
  },
  "chart": [
    {
      "label": "2024-12-01",
      "revenue": 125.50,
      "purchases": 5
    },
    {
      "label": "2024-12-02",
      "revenue": 250.00,
      "purchases": 9
    }
  ],
  "topBooks": [
    {
      "bookId": "507f1f77bcf86cd799439011",
      "title": "The Art of Programming",
      "coverUrl": "https://drive.google.com/...",
      "revenue": 450.50,
      "purchases": 18,
      "conversionRate": 3.2
    }
  ]
}
```

### Response Schema

- **summary** (object)
  - `totalRevenue` (number): Total lifetime revenue in USD
  - `monthlyRevenue` (number): Revenue from current calendar month
  - `totalPurchases` (number): Total number of completed purchases
  - `averageOrderValue` (number): Average purchase amount in USD

- **chart** (array): Revenue trend data
  - `label` (string): Date string (format varies by period: YYYY-MM-DD, YYYY-Www, YYYY-MM)
  - `revenue` (number): Revenue for that period in USD
  - `purchases` (number): Number of purchases in that period

- **topBooks** (array): Top 10 performing books by revenue
  - `bookId` (ObjectId): MongoDB book ID
  - `title` (string): Book title
  - `coverUrl` (string|null): Cover image URL
  - `revenue` (number): Total revenue from this book in USD
  - `purchases` (number): Number of purchases
  - `conversionRate` (number): Purchase rate as percentage (purchases/views * 100)

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/dashboard/analytics?period=30d',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.summary.totalRevenue); // 5234.50
```

**cURL**

```bash
curl -X GET 'http://localhost:3109/admin/dashboard/analytics?period=30d' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Period Grouping

| Period | Format | Example |
|--------|--------|---------|
| `7d` | Daily (YYYY-MM-DD) | 2024-12-15 |
| `30d` | Daily (YYYY-MM-DD) | 2024-12-15 |
| `90d` | Weekly (YYYY-Www) | 2024-W50 |
| `12m` | Monthly (YYYY-MM) | 2024-12 |

---

## 2. GET /admin/dashboard/transactions

Retrieve transaction history with pagination and optional status filtering.

### Request

```http
GET /admin/dashboard/transactions?page=1&limit=20&status=paid
Authorization: Bearer <jwt_token>
```

### Query Parameters

| Parameter | Type | Default | Required | Values |
|-----------|------|---------|----------|--------|
| `page` | number | `1` | No | ≥ 1 |
| `limit` | number | `20` | No | 1-100 |
| `status` | string | (none) | No | `paid`, `pending`, `failed`, `refunded` |

### Response (200 OK)

```json
{
  "items": [
    {
      "purchaseId": "507f1f77bcf86cd799439011",
      "userEmail": "john.doe@example.com",
      "bookTitle": "The Art of Programming",
      "price": 29.99,
      "currency": "USD",
      "provider": "polar",
      "status": "paid",
      "createdAt": "2024-12-15T10:30:00.000Z"
    }
  ],
  "total": 187,
  "page": 1,
  "pages": 10
}
```

### Response Schema

- **items** (array): Transaction list
  - `purchaseId` (ObjectId): Unique purchase identifier
  - `userEmail` (string): Customer email
  - `bookTitle` (string): Book purchased
  - `price` (number): Purchase price in USD (or specified currency)
  - `currency` (string): ISO 4217 currency code (default: USD)
  - `provider` (string): Payment provider (e.g., "polar")
  - `status` (string): Current transaction status
  - `createdAt` (ISO8601): Timestamp of purchase

- **total** (number): Total transaction count matching filter
- **page** (number): Current page number
- **pages** (number): Total number of pages

### Examples

**JavaScript/Node.js**

```javascript
// Fetch paid transactions, page 2
const response = await fetch(
  'http://localhost:3109/admin/dashboard/transactions?page=2&limit=20&status=paid',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { items, total, pages } = await response.json();
console.log(`Showing ${items.length} of ${total} transactions (page 2/${pages})`);
```

**cURL**

```bash
curl -X GET 'http://localhost:3109/admin/dashboard/transactions?page=1&limit=50&status=paid' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. GET /admin/dashboard/reports/export

Export transaction history as CSV file attachment. Useful for accounting, tax reporting, and data analysis.

### Request

```http
GET /admin/dashboard/reports/export?status=paid
Authorization: Bearer <jwt_token>
```

### Query Parameters

| Parameter | Type | Default | Required | Values |
|-----------|------|---------|----------|--------|
| `status` | string | (none) | No | `paid`, `pending`, `failed`, `refunded` |

### Response (200 OK)

**Content-Type**: `text/csv`  
**Content-Disposition**: `attachment; filename="transactions.csv"`

```csv
"Date","Purchase ID","User Email","Book","Price","Currency","Provider","Status"
"2024-12-15","507f1f77bcf86cd799439011","john.doe@example.com","The Art of Programming","29.99","USD","polar","paid"
"2024-12-14","507f1f77bcf86cd799439012","jane.smith@example.com","Web Development Basics","24.99","USD","polar","paid"
```

### CSV Columns

| # | Column | Description | Example |
|---|--------|-------------|---------|
| 1 | Date | ISO 8601 date (YYYY-MM-DD) | 2024-12-15 |
| 2 | Purchase ID | MongoDB ObjectId | 507f1f77bcf86cd799439011 |
| 3 | User Email | Customer email address | john.doe@example.com |
| 4 | Book | Book title | The Art of Programming |
| 5 | Price | Purchase price | 29.99 |
| 6 | Currency | Currency code | USD |
| 7 | Provider | Payment provider | polar |
| 8 | Status | Transaction status | paid |

### Examples

**JavaScript/Browser**

```javascript
// Download CSV with status filter
const downloadLink = document.createElement('a');
downloadLink.href = 'http://localhost:3109/admin/dashboard/reports/export?status=paid';
downloadLink.setAttribute('Authorization', `Bearer ${token}`);
downloadLink.download = 'transactions.csv';
document.body.appendChild(downloadLink);
downloadLink.click();
```

**JavaScript/Node.js**

```javascript
const fs = require('fs');

const response = await fetch(
  'http://localhost:3109/admin/dashboard/reports/export?status=paid',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const csv = await response.text();
fs.writeFileSync('transactions.csv', csv);
console.log('CSV exported successfully');
```

**cURL**

```bash
curl -X GET 'http://localhost:3109/admin/dashboard/reports/export?status=paid' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -o transactions.csv
```

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
  "message": "Invalid period. Must be one of: 7d, 30d, 90d, 12m",
  "error": "Bad Request"
}
```

Returned when:
- Invalid `period` parameter (not one of: 7d, 30d, 90d, 12m)
- Invalid `status` parameter (not one of: paid, pending, failed, refunded)
- Invalid pagination (page < 1 or limit < 1)

---

## Performance Notes

### Aggregation Pipeline Optimization

- Revenue calculations use MongoDB aggregation pipelines (`$group`, `$sum`)
- Data is aggregated at the database level for maximum performance
- Indexes on `status`, `provider`, `createdAt` ensure fast filtering

### Recommended Practices

1. **Use period parameters** to limit data range for analytics queries
2. **Paginate transactions** - retrieve in batches rather than all at once
3. **Filter by status** - only export paid transactions if needed for accounting
4. **Cache results** - analytics don't need to be queried per-request in production

### Example Cache Pattern

```javascript
// Cache analytics for 5 minutes
const analyticsCache = new Map();

async function getAnalytics(period = '30d') {
  const cacheKey = `analytics_${period}`;
  
  if (analyticsCache.has(cacheKey)) {
    return analyticsCache.get(cacheKey);
  }
  
  const data = await fetch(`/admin/dashboard/analytics?period=${period}`);
  const result = await data.json();
  
  analyticsCache.set(cacheKey, result);
  setTimeout(() => analyticsCache.delete(cacheKey), 5 * 60 * 1000);
  
  return result;
}
```

---

## Data Schema Reference

### Purchase Model (Database)

```typescript
{
  _id: ObjectId,
  userRef: ObjectId,              // Reference to User
  bookRef: ObjectId,              // Reference to Book
  purchaseToken: string,          // Unique transaction ID
  provider: 'polar' | string,     // Payment provider
  status: 'paid' | 'pending' | 'failed' | 'refunded',
  providerOrderId?: string,       // External order reference
  providerCustomerId?: string,    // External customer reference
  amountCents: number,            // Price in cents (divide by 100 for USD)
  currency: 'USD',                // ISO 4217 code
  paidAt?: Date,                  // Payment completion time
  receipt: Record<string, any>,   // Payment receipt data
  metadata: Record<string, any>,  // Custom metadata
  createdAt: Date,                // Creation timestamp
  updatedAt: Date                 // Last update timestamp
}
```

---

## Related Endpoints

- [Admin Books API](./ADMIN_BOOKS_API.md) - Book management
- [Admin Analytics API](./ADMIN_ANALYTICS_API.md) - Dashboard metrics
- [Catalog API](./CATALOG_API.md) - Public catalog endpoints

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-15 | Initial release with analytics, transactions, and CSV export |
