# Admin Settings & Configuration API Documentation

Platform-wide configuration endpoints for managing website settings, categories, payment providers, storage, email, and system maintenance. All endpoints are protected with JWT authentication and require admin role.

**Base URLs**: 
- `/admin/settings` - Platform configuration
- `/admin/categories` - Content categories

**Authentication**: Required (JwtAuthGuard + RolesGuard with @Roles('admin'))  
**Rate Limiting**: Applies to all endpoints

---

## Quick Start: Google Drive Configuration

### Step 1: Create Service Account in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable Google Drive API
4. Create Service Account (Service Accounts → Create Service Account)
5. Under Keys → Create New Key → JSON
6. Download the JSON file (save securely)
7. Share your Google Drive folders with the service account email (e.g., `lbb@your-project.iam.gserviceaccount.com`)

### Step 2: Upload JSON to LBB Admin Settings

1. Get JWT token from login
2. Call `PUT /admin/settings` with Service Account JSON
3. Test connection with `POST /admin/settings/test-drive`
4. Verify both book and cover folders are accessible

### Step 3: Verify Configuration

```javascript
// Test if Google Drive is connected
const response = await fetch('/admin/settings/test-drive', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const result = await response.json();
console.log(result.success ? 'Connected!' : 'Failed');
```

---

## 1. GET /admin/settings

Get all platform settings grouped by category.

### Request

```http
GET /admin/settings
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "website": {
    "siteName": "Literary Book Broker",
    "contactEmail": "contact@example.com",
    "description": "A curated collection of literary works",
    "logoUrl": "https://example.com/logo.png",
    "socialLinks": {
      "instagram": "https://instagram.com/lbb",
      "twitter": "https://twitter.com/lbb",
      "tiktok": "https://tiktok.com/@lbb",
      "youtube": "https://youtube.com/@lbb"
    },
    "seo": {
      "title": "Literary Book Broker - Premium Books",
      "description": "Discover the finest literary works curated by experts"
    }
  },
  "notifications": {
    "newPurchase": true,
    "newReview": true,
    "dailySummary": false,
    "weeklySummary": true,
    "monthlySummary": true
  },
  "payments": {
    "polar": {
      "provider": "polar",
      "environment": "sandbox",
      "connected": false,
      "webhookSecret": "***"
    }
  },
  "storage": {
    "googleDrive": {
      "enabled": true,
      "booksFolderId": "folder-id-123",
      "coversFolderId": "folder-id-456",
      "serviceAccountJson": {}
    }
  },
  "email": {
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "user": "noreply@example.com",
      "senderEmail": "noreply@example.com"
    }
  },
  "system": {
    "maintenanceMode": false,
    "maintenanceMessage": "Site under maintenance"
  }
}
```

### Response Schema

- **website** (object): Website branding and metadata
  - `siteName` (string): Site name
  - `contactEmail` (string): Admin contact email
  - `description` (string): Site description
  - `logoUrl` (string|null): Logo image URL
  - `socialLinks` (object): Social media URLs
  - `seo` (object): SEO metadata

- **notifications** (object): Email notification preferences
  - `newPurchase` (boolean): Notify on new purchase
  - `newReview` (boolean): Notify on new review
  - `dailySummary` (boolean): Daily summary enabled
  - `weeklySummary` (boolean): Weekly summary enabled
  - `monthlySummary` (boolean): Monthly summary enabled

- **payments** (object): Payment provider configuration
  - `polar` (object): Polar payment settings
    - `provider` (string): Always "polar"
    - `environment` (string): "sandbox" or "production"
    - `connected` (boolean): Provider connectivity status
    - `webhookSecret` (string): "***" (never shown in full)

- **storage** (object): Cloud storage configuration
  - `googleDrive` (object): Google Drive Service Account settings
    - `enabled` (boolean): Whether Google Drive is enabled
    - `booksFolderId` (string): Folder ID for book PDFs
    - `coversFolderId` (string): Folder ID for book covers
    - `serviceAccountJson` (object): Service account credentials (never shown in full GET responses)

- **email** (object): Email configuration
  - `smtp` (object): SMTP server settings
    - `host` (string): SMTP server hostname
    - `port` (number): SMTP port (typically 587)
    - `user` (string): SMTP username
    - `senderEmail` (string): Sender email address
    - Note: Password never returned

- **system** (object): System-wide settings
  - `maintenanceMode` (boolean): Enable maintenance mode
  - `maintenanceMessage` (string): Message shown during maintenance

### Notes

- SMTP password is never returned (use PUT to update)
- All settings are cached for 5 minutes server-side
- Settings follow singleton pattern (one document per system)

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/settings',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const settings = await response.json();
console.log(`Site: ${settings.website.siteName}`);
console.log(`Maintenance: ${settings.system.maintenanceMode}`);
```

**cURL**

```bash
curl -X GET 'http://localhost:3109/admin/settings' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 2. PUT /admin/settings

Update platform settings.

### Request

```http
PUT /admin/settings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "siteName": "New Site Name",
  "contactEmail": "newemail@example.com",
  "notifications": {
    "dailySummary": true
  },
  "polar": {
    "environment": "production",
    "apiKey": "new-api-key",
    "webhookSecret": "new-webhook-secret"
  },
  "googleDrive": {
    "enabled": true,
    "serviceAccountJson": {
      "type": "service_account",
      "project_id": "your-project-id",
      "private_key_id": "key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
      "client_id": "123456789",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/..."
    },
    "booksFolderId": "folder-id-for-pdfs",
    "coversFolderId": "folder-id-for-covers"
  },
  "system": {
    "maintenanceMode": true,
    "maintenanceMessage": "Upgrading our platform..."
  }
}
```

### Request Schema (All optional)

- `siteName` (string): Update site name
- `contactEmail` (string): Update contact email
- `description` (string): Update site description
- `logoUrl` (string): Update logo URL
- `socialLinks` (object): Update social media links
- `seo` (object): Update SEO metadata
- `notifications` (object): Update notification settings
- `polar` (object): Update Polar configuration
- `googleDrive` (object): Update Google Drive Service Account configuration
  - `enabled` (boolean): Enable/disable Google Drive
  - `serviceAccountJson` (object): Google Service Account JSON (download from Google Cloud Console)
  - `booksFolderId` (string): Folder ID for storing book PDFs
  - `coversFolderId` (string): Folder ID for storing book cover images
- `smtp` (object): Update SMTP configuration (including password)
- `system` (object): Update system settings

### Response (200 OK)

Returns updated settings (same format as GET /admin/settings)

### Examples

**JavaScript/Node.js - Update Google Drive Configuration**

```javascript
const serviceAccountJson = {
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/..."
};

const response = await fetch(
  'http://localhost:3109/admin/settings',
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      googleDrive: {
        enabled: true,
        serviceAccountJson,
        booksFolderId: 'folder-id-for-pdfs',
        coversFolderId: 'folder-id-for-covers'
      }
    })
  }
);

const updated = await response.json();
console.log(`Google Drive enabled: ${updated.storage.googleDrive.enabled}`);
```

**JavaScript/Node.js - Update Site Name**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/settings',
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      siteName: 'My Bookstore',
      contactEmail: 'support@mybookstore.com'
    })
  }
);

const updated = await response.json();
console.log(`Updated to: ${updated.website.siteName}`);
```

**JavaScript/Node.js - Enable Maintenance Mode**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/settings',
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system: {
        maintenanceMode: true,
        maintenanceMessage: 'Scheduled maintenance 10-11 PM EST'
      }
    })
  }
);
```

---

## 3. POST /admin/settings/test-polar

Test Polar payment provider connectivity and configuration.

### Request

```http
POST /admin/settings/test-polar
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Polar configuration is valid"
}
```

### Error Cases

- 400 Bad Request: Polar API key not configured
- 500 Internal Server Error: Failed to connect to Polar

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/settings/test-polar',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
if (result.success) {
  console.log('Polar is configured correctly');
}
```

---

## 4. POST /admin/settings/test-drive

Test Google Drive connectivity and folder access.

### Request

```http
POST /admin/settings/test-drive
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Google Drive configuration is valid"
}
```

### Error Cases

- 400 Bad Request: Google Drive not enabled, service account JSON missing, or invalid
- 500 Internal Server Error: Failed to connect to Google Drive

### Notes

- Service account JSON must be valid and contain required fields
- Validates access to both booksFolderId and coversFolderId (if configured)

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/settings/test-drive',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
if (result.success) {
  console.log('Google Drive folders are accessible');
}
```

**cURL**

```bash
curl -X POST 'http://localhost:3109/admin/settings/test-drive' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 5. POST /admin/settings/test-email

Test SMTP configuration and send test email to configured address.

### Request

```http
POST /admin/settings/test-email
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "SMTP configuration is valid and test email would be sent"
}
```

### Error Cases

- 400 Bad Request: SMTP server not configured
- 500 Internal Server Error: Failed to send test email

### Notes

- Test email sent to configured senderEmail address
- Validates connectivity, authentication, and delivery

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/settings/test-email',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
if (result.success) {
  console.log('Email configuration working');
}
```

---

## 6. GET /admin/categories

Get all categories sorted by display order.

### Request

```http
GET /admin/categories
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Fiction",
      "slug": "fiction",
      "description": "Novels and short stories",
      "order": 1,
      "active": true,
      "createdAt": "2026-06-01T10:00:00Z",
      "updatedAt": "2026-06-02T14:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Philosophy",
      "slug": "philosophy",
      "description": "Philosophical works and essays",
      "order": 2,
      "active": true,
      "createdAt": "2026-06-01T10:05:00Z",
      "updatedAt": "2026-06-02T14:30:00Z"
    }
  ]
}
```

### Response Schema

- **items** (array): Category list
  - `_id` (ObjectId): Category ID
  - `name` (string): Category name
  - `slug` (string): URL-safe slug
  - `description` (string): Category description
  - `order` (number): Display order
  - `active` (boolean): Whether category is visible
  - `createdAt` (ISO8601): Creation timestamp
  - `updatedAt` (ISO8601): Last update timestamp

### Sorting

- Primary: `order` ASC (1, 2, 3...)
- Secondary: `name` ASC (alphabetical)

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/categories',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { items } = await response.json();
items.forEach(cat => {
  console.log(`${cat.order}. ${cat.name} (${cat.slug})`);
});
```

---

## 7. POST /admin/categories

Create new category.

### Request

```http
POST /admin/categories
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Science Fiction",
  "slug": "sci-fi",
  "description": "Science fiction and futuristic novels",
  "order": 3,
  "active": true
}
```

### Request Schema

- `name` (string, required): Category name
- `slug` (string, required): URL-safe slug (must be unique)
- `description` (string, optional): Category description
- `order` (number, optional): Display order (default: 0)
- `active` (boolean, optional): Visibility (default: true)

### Response (201 Created)

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Science Fiction",
  "slug": "sci-fi",
  "description": "Science fiction and futuristic novels",
  "order": 3,
  "active": true,
  "createdAt": "2026-06-02T15:00:00Z",
  "updatedAt": "2026-06-02T15:00:00Z"
}
```

### Validation

- `slug` must be unique (400 Bad Request if duplicate)
- `name` is required
- `slug` is required

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/categories',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Mystery',
      slug: 'mystery',
      description: 'Mystery and detective stories',
      order: 4
    })
  }
);

if (response.status === 201) {
  const category = await response.json();
  console.log(`Created: ${category.name}`);
}
```

---

## 8. GET /admin/categories/:id

Get category by ID.

### Request

```http
GET /admin/categories/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

Same schema as individual category object from GET /admin/categories

### Error Cases

- 400 Bad Request: Category not found

---

## 9. PUT /admin/categories/:id

Update category.

### Request

```http
PUT /admin/categories/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Fiction (Updated)",
  "order": 5
}
```

### Request Schema (All optional)

- `name` (string): New category name
- `slug` (string): New slug (must be unique if provided)
- `description` (string): New description
- `order` (number): New display order
- `active` (boolean): New visibility status

### Response (200 OK)

Returns updated category object

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/categories/507f1f77bcf86cd799439011',
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      active: false,
      order: 10
    })
  }
);

const updated = await response.json();
console.log(`Updated: ${updated.name}`);
```

---

## 10. DELETE /admin/categories/:id

Delete category.

### Request

```http
DELETE /admin/categories/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
```

### Response (200 OK)

```json
{
  "message": "Category \"Fiction\" deleted successfully"
}
```

### Error Cases

- 400 Bad Request: Category not found

### Notes

- Deletes only the category, not associated books
- Books can be reassigned to other categories

### Examples

**JavaScript/Node.js**

```javascript
const response = await fetch(
  'http://localhost:3109/admin/categories/507f1f77bcf86cd799439011',
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

if (response.ok) {
  const result = await response.json();
  console.log(result.message);
}
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
  "message": "Category with slug \"fiction\" already exists",
  "error": "Bad Request"
}
```

Returned when:
- Duplicate slug when creating/updating category
- Category not found
- Configuration is incomplete

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to connect to Polar"
}
```

Returned when:
- Third-party service connectivity fails (Polar, Google Drive, SMTP)

---

## Configuration Management

### Settings Singleton Pattern

All platform settings are stored in a single `SiteConfig` document:
- Only one document exists per system
- Auto-created on first access with sensible defaults
- Cached for 5 minutes to reduce database queries

### SMTP Password Security

- Password never returned in GET responses
- Must be provided in PUT request body to update
- Stored encrypted in database
- Only used for outbound email

### Google Drive Service Account Configuration

- Credentials stored in MongoDB as JSON (no .env required)
- Download service account JSON from Google Cloud Console
- Service account JSON loaded on app startup
- Service automatically reloads when admin updates settings (no app restart needed)
- Event-driven: `settings.googleDrive.updated` triggers DriveService reload
- Service account JSON never fully returned in GET responses
- Changes apply immediately to all subsequent file uploads
- No token expiration - uses service account's private key for authentication

### Caching Strategy

```javascript
// Server-side cache expires after 5 minutes
// Cache invalidated on every PUT /admin/settings
// Manual cache invalidation not needed

// Recommended client-side caching:
const settingsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedSettings() {
  if (settingsCache.has('current')) {
    const { data, expires } = settingsCache.get('current');
    if (Date.now() < expires) return data;
  }
  
  const data = await fetch('/admin/settings').then(r => r.json());
  settingsCache.set('current', {
    data,
    expires: Date.now() + CACHE_TTL
  });
  
  return data;
}
```

---

## Data Models Reference

### SiteConfig Schema

```typescript
{
  _id: ObjectId,
  siteName: string,
  contactEmail: string,
  description: string,
  logoUrl?: string,
  socialLinks: {
    instagram: string,
    twitter: string,
    tiktok: string,
    youtube: string
  },
  seo: {
    title: string,
    description: string
  },
  notifications: {
    newPurchase: boolean,
    newReview: boolean,
    dailySummary: boolean,
    weeklySummary: boolean,
    monthlySummary: boolean
  },
  polar: {
    provider: string,
    environment: 'sandbox' | 'production',
    apiKey: string,
    webhookSecret: string,
    connected: boolean
  },
  googleDrive: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    booksFolderId: string;
    coversFolderId: string;
  };
  smtp: {
    host: string,
    port: number,
    user: string,
    password: string,
    senderEmail: string
  },
  system: {
    maintenanceMode: boolean,
    maintenanceMessage: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Category Schema

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,
  description?: string,
  order: number,
  active: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `slug` (unique)
- `active` + `order` (compound)

---

## Related Endpoints

- [Admin Books API](./ADMIN_BOOKS_API.md) - Book management
- [Admin Analytics API](./ADMIN_ANALYTICS_API.md) - Business metrics
- [Admin Reporting API](./ADMIN_REPORTING_API.md) - Financial reports
- [Admin Community API](./ADMIN_COMMUNITY_API.md) - Reader engagement

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-02 | Initial release with settings and category management |
