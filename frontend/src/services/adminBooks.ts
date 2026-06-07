import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================================
// JWT INTERCEPTOR FOR ADMIN CALLS
// ============================================================================

async function handleAdminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);
  
  // If JWT expired (401), redirect to login
  if (response.status === 401) {
    window.location.href = '/login';
    // Throw error to prevent further processing
    throw new Error('JWT expirado - redirigiendo a login');
  }
  
  return response;
}

// ============================================================================
// TYPES
// ============================================================================

export interface AdminBook {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  authorNotes?: string;
  coverUrl?: string;
  driveFileId?: string;
  mimeType?: string;
  fileSize?: number;
  totalPages: number;
  previewPages: number;
  priceCents: number;
  currency: string;
  categoryRef?: string;
  isPublished: boolean;
  isPreorder: boolean;
  releaseDate?: string;
  isFeatured: boolean;
  isLatestRelease: boolean;
  polarProductId?: string;
  prequelRef?: string;
  publishedAt?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardActivity {
  type: 'purchase' | 'registration';
  title: string;
  description: string;
  createdAt: string;
}

export interface DashboardBookOverview {
  _id: string;
  title: string;
  coverUrl?: string;
  priceCents: number;
  sales: number;
  status: 'published' | 'draft' | 'preorder';
}

export interface DashboardSummary {
  totalSales: number;
  activeReaders: number;
  publishedBooks: number;
  monthlyRevenue: number;
}

export interface DashboardStats {
  // New structure for Dashboard component
  summary: DashboardSummary;
  recentActivity: DashboardActivity[];
  books: DashboardBookOverview[];
  
  // Legacy fields for Manuscripts component compatibility
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  preorders: number;
  totalPurchases: number;
  revenue: {
    month: number;
    total: number;
  };
}

export interface BookAnalytics {
  sales: number;
  revenue: number;
  readers: number;
  conversionRate: number;
  averageProgress: number;
}

// Analytics & Revenue Types
export interface ChartDataPoint {
  label: string; // YYYY-MM-DD, YYYY-Www, or YYYY-MM
  revenue: number;
  purchases: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  totalPurchases: number;
  averageOrderValue: number;
}

export interface TopBook {
  bookId: string;
  title: string;
  coverUrl?: string;
  revenue: number;
  purchases: number;
  conversionRate: number;
}

export interface AnalyticsMetrics {
  summary: AnalyticsSummary;
  chart: ChartDataPoint[];
  topBooks: TopBook[];
}

export interface Transaction {
  purchaseId: string;
  userEmail: string;
  bookTitle: string;
  price: number;
  currency: string;
  provider: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  pages: number;
}

// ============================================================================
// COMMUNITY & ENGAGEMENT TYPES
// ============================================================================

export interface CommunityStats {
  totalReaders: number;
  newsletterSubscribers: number;
  totalReviews: number;
  reviewsCount?: number;
  averageRating: number;
}

export interface CommunityReview {
  _id: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  bookTitle: string;
  rating: number;
  content: string;
  createdAt: string;
  isVerified: boolean;
}

export interface CommunityReader {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  booksOwned: number;
  readingProgress: number; // Percentage 0-100
  lastActivityAt: string;
}

// Reader Activity Types
export interface ActivityChartDataPoint {
  label: string; // YYYY-MM-DD format
  sessions: number;
  pagesRead: number;
  readingTime: number; // in minutes
}

export interface TopReaderBook {
  bookId: string;
  title: string;
  coverUrl?: string | null;
  pagesRead: number;
  progressPercentage: number;
  lastReadAt: string;
}

export interface ReaderActivitySummary {
  totalSessions: number;
  totalPagesRead: number;
  totalReadingTime: number; // in minutes
  averageSessionTime: number; // in minutes
  booksInProgress: number;
  booksFinished: number;
}

export interface ReaderActivityMetrics {
  period: string;
  summary: ReaderActivitySummary;
  chart: ActivityChartDataPoint[];
  topBooks: TopReaderBook[];
}

export interface CreateBookInput {
  title: string;
  subtitle?: string;
  description?: string;
  priceCents?: number;
  currency?: string;
  previewPages?: number;
  categoryRef?: string;
  cover?: File;
}

export interface UpdateBookInput {
  title?: string;
  subtitle?: string;
  description?: string;
  authorNotes?: string;
  priceCents?: number;
  currency?: string;
  previewPages?: number;
  categoryRef?: string;
  isFeatured?: boolean;
  polarProductId?: string;
  prequelRef?: string | null;
}

// ============================================================================
// SETTINGS & CATEGORIES TYPES
// ============================================================================

export interface WebsiteSettings {
  siteName: string;
  contactEmail: string;
  description: string;
  logoUrl?: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  };
  seo: {
    title: string;
    description: string;
  };
}

export interface NotificationSettings {
  newPurchase: boolean;
  newReview: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
}

export interface PaymentSettings {
  polar: {
    provider: string;
    enabled: boolean;
    server: 'sandbox' | 'production';
    connected: boolean;
    webhookSecret: string;
  };
}

export interface StorageSettings {
  googleDrive: {
    enabled: boolean;
    serviceAccountConfigured?: boolean;
    booksFolderId: string;
    coversFolderId: string;
    clientId?: string;
    clientSecret?: string;
  };
  cloudinary?: {
    enabled: boolean;
    cloudName: string;
    apiKey: string;
    folder: string;
    configured?: boolean;
  };
}

export interface CloudinaryStatus {
  enabled: boolean;
  configured?: boolean;
  cloudName?: string;
  folder?: string;
  message?: string;
}

export interface DriveStatus {
  enabled: boolean;
  booksFolderId?: string;
  coversFolderId?: string;
  clientId?: string;
  message?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface EmailSettings {
  smtp: {
    host: string;
    port: number;
    user: string;
    senderEmail: string;
  };
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface SiteSettings {
  website: WebsiteSettings;
  notifications: NotificationSettings;
  payments: PaymentSettings;
  storage: StorageSettings;
  email: EmailSettings;
  system: SystemSettings;
  launch?: {
    launchMode: boolean;
    launchDate: string | null;
    comingSoonTitle: string;
    comingSoonSubtitle: string;
    comingSoonBg: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SAFE JSON PARSING
// ============================================================================

async function safeParseJSON<T>(response: Response, fallback: T): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) return fallback;

  const text = await response.text();
  if (!text || !text.trim()) return fallback;

  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// ADMIN BOOKS SERVICE
// ============================================================================

class AdminBooksService {
  /**
   * Get dashboard summary statistics, recent activity, and books overview
   */
  async getDashboard(): Promise<DashboardStats> {
    const defaultDashboard: DashboardStats = {
      summary: {
        totalSales: 0,
        activeReaders: 0,
        publishedBooks: 0,
        monthlyRevenue: 0,
      },
      recentActivity: [],
      books: [],
      totalBooks: 0,
      publishedBooks: 0,
      draftBooks: 0,
      preorders: 0,
      totalPurchases: 0,
      revenue: { month: 0, total: 0 },
    };

    try {
      // Fetch dashboard data from API
      const dashboardResponse = await handleAdminFetch(`${API_URL}/admin/dashboard`, {
        headers: authService.getAuthHeader(),
      });

      if (!dashboardResponse.ok) {
        throw new Error(`Dashboard fetch failed: ${dashboardResponse.statusText}`);
      }

      const dashboardData = await safeParseJSON<any>(dashboardResponse, {});
      
      // Fetch all books to calculate statistics
      const allBooks = await this.getBooks(undefined, 1, 1000); // Fetch up to 1000 books

      // Calculate book statistics
      const publishedCount = allBooks.filter(b => b.isPublished && !b.isPreorder).length;
      const draftCount = allBooks.filter(b => !b.isPublished && !b.isPreorder).length;
      const preorderCount = allBooks.filter(b => b.isPreorder).length;

      // Combine dashboard data with calculated stats
      const result: DashboardStats = {
        summary: dashboardData.summary || defaultDashboard.summary,
        recentActivity: dashboardData.recentActivity || [],
        books: dashboardData.books || [],
        totalBooks: allBooks.length,
        publishedBooks: publishedCount,
        draftBooks: draftCount,
        preorders: preorderCount,
        totalPurchases: dashboardData.summary?.totalSales || 0,
        revenue: { 
          month: dashboardData.summary?.monthlyRevenue || 0, 
          total: dashboardData.summary?.totalRevenue || 0 
        },
      };

      return result;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return defaultDashboard;
    }
  }

  /**
   * Get all books with optional filtering
   * @param status Filter by status: 'published', 'draft', 'preorder'
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 12)
   */
  async getBooks(status?: 'published' | 'draft' | 'preorder', page: number = 1, limit: number = 12): Promise<AdminBook[]> {
    try {
      const url = new URL(`${API_URL}/admin/books`, window.location.origin);
      if (status) url.searchParams.append('status', status);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get books failed: ${response.statusText}`);
      }

      const data = await safeParseJSON<{ items: AdminBook[] }>(response, { items: [] });
      return data.items || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  }

  /**
   * Get single book by ID
   */
  async getBook(bookId: string): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get book failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  }

  /**
   * Create new book (draft) with optional cover image
   */
  async createBook(input: CreateBookInput): Promise<AdminBook | null> {
    try {
      // Use FormData for multipart upload if cover is provided, otherwise use JSON
      const authHeader = authService.getAuthHeader() || {};
      let body: BodyInit;
      let headers: HeadersInit = authHeader;

      if (input.cover) {
        const formData = new FormData();
        formData.append('title', input.title);
        if (input.subtitle) formData.append('subtitle', input.subtitle);
        if (input.description) formData.append('description', input.description);
        if (input.priceCents !== undefined) formData.append('priceCents', input.priceCents.toString());
        if (input.currency) formData.append('currency', input.currency);
        if (input.previewPages !== undefined) formData.append('previewPages', input.previewPages.toString());
        if (input.categoryRef) formData.append('categoryRef', input.categoryRef);
        formData.append('cover', input.cover);
        body = formData;
        // Do NOT set Content-Type header for FormData - browser will set it with boundary
      } else {
        headers = {
          ...authHeader,
          'Content-Type': 'application/json',
        };
        body = JSON.stringify(input);
      }

      const response = await handleAdminFetch(`${API_URL}/admin/books`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`Create book failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error creating book:', error);
      return null;
    }
  }

  /**
   * Update book details
   */
  async updateBook(bookId: string, input: UpdateBookInput): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}`, {
        method: 'PUT',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Update book failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error updating book:', error);
      return null;
    }
  }

  /**
   * Upload or replace book cover image
   */
  async uploadBookCover(bookId: string, cover: File): Promise<AdminBook | null> {
    try {
      const formData = new FormData();
      formData.append('cover', cover);

      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/cover`, {
        method: 'PATCH',
        headers: authService.getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        const errBody = await safeParseJSON<{ message?: string | string[] }>(response, {});
        const message = Array.isArray(errBody.message)
          ? errBody.message.join(', ')
          : errBody.message;
        throw new Error(message || `Error al subir portada (${response.status})`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error uploading book cover:', error);
      if (error instanceof TypeError) {
        throw new Error(
          'No se pudo conectar con el servidor. Comprueba que el backend esté en ejecución (puerto 3109).',
        );
      }
      throw error;
    }
  }

  /**
   * Delete a book by ID
   */
  async deleteBook(bookId: string): Promise<{ message: string } | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Delete book failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error deleting book:', error);
      return null;
    }
  }

  /**
   * Attach an existing Google Drive PDF to a book.
   */
  async attachDriveFile(
    bookId: string,
    file: { id: string; mimeType?: string; size?: string | number },
    totalPages?: number
  ): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/drive-file`, {
        method: 'PATCH',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driveFileId: file.id,
          mimeType: file.mimeType || 'application/pdf',
          fileSize: file.size ? Number(file.size) : undefined,
          totalPages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Drive file attach failed: ${response.statusText}`;
        throw new Error(message);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error attaching Drive file:', error);
      throw error;
    }
  }

  /**
   * Check if Google Drive is enabled for uploads
   */
  async checkCloudinaryStatus(): Promise<CloudinaryStatus> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        return {
          enabled: false,
          message: 'No se pudo verificar Cloudinary',
        };
      }

      const settings = (await response.json()) as SiteSettings;
      const cloudinary = settings.storage?.cloudinary;

      if (!cloudinary) {
        return {
          enabled: false,
          message: 'Configuración de Cloudinary no encontrada',
        };
      }

      const configured = cloudinary.configured === true;
      return {
        enabled: cloudinary.enabled && configured,
        configured,
        cloudName: cloudinary.cloudName,
        folder: cloudinary.folder,
        message:
          cloudinary.enabled && !configured
            ? 'Completa cloud name, API key y API secret en Ajustes → Almacenamiento'
            : undefined,
      };
    } catch (error) {
      console.error('Error checking Cloudinary status:', error);
      return {
        enabled: false,
        message: 'Error al verificar Cloudinary',
      };
    }
  }

  async testCloudinary(): Promise<{ success: boolean; message: string }> {
    const response = await handleAdminFetch(`${API_URL}/admin/settings/test-cloudinary`, {
      method: 'POST',
      headers: authService.getAuthHeader(),
    });
    const data = await safeParseJSON<{ success: boolean; message: string }>(response, {
      success: false,
      message: 'Error al probar Cloudinary',
    });
    if (!response.ok) {
      throw new Error(
        typeof data.message === 'string' ? data.message : 'Error al probar Cloudinary',
      );
    }
    return data;
  }

  async checkDriveStatus(): Promise<DriveStatus> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings`, {
        method: 'GET',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        return {
          enabled: false,
          message: 'No se pudo verificar el estado de Google Drive',
        };
      }

      const settings = await response.json() as SiteSettings;
      const googleDrive = settings.storage?.googleDrive;
      
      if (!googleDrive) {
        return {
          enabled: false,
          message: 'Configuración de Google Drive no encontrada',
        };
      }

      return {
        enabled: googleDrive.enabled,
        booksFolderId: googleDrive.booksFolderId,
        coversFolderId: googleDrive.coversFolderId,
        clientId: googleDrive.clientId,
      };
    } catch (error) {
      console.error('Error checking drive status:', error);
      return {
        enabled: false,
        message: 'Error al verificar Google Drive',
      };
    }
  }

  /**
   * Publish book (make it public)
   */
  async publishBook(
    bookId: string,
    options?: { asPreorder?: boolean; releaseDate?: string },
  ): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/publish`, {
        method: 'PATCH',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asPreorder: options?.asPreorder === true,
          ...(options?.asPreorder && options.releaseDate
            ? { releaseDate: options.releaseDate }
            : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`Publish failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error publishing book:', error);
      return null;
    }
  }

  /**
   * Unpublish book (remove from public)
   */
  async unpublishBook(bookId: string): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/unpublish`, {
        method: 'PATCH',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Unpublish failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error unpublishing book:', error);
      return null;
    }
  }

  /**
   * Mark book as latest release
   */
  async markAsLatest(bookId: string): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/latest`, {
        method: 'PATCH',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Mark as latest failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error marking as latest:', error);
      return null;
    }
  }

  /**
   * Mark book as preorder
   * @param bookId Book MongoDB ID
   * @param releaseDate ISO8601 date string for release date
   */
  async markAsPreorder(bookId: string, releaseDate: string): Promise<AdminBook | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/preorder`, {
        method: 'PATCH',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ releaseDate }),
      });

      if (!response.ok) {
        throw new Error(`Mark as preorder failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error marking as preorder:', error);
      return null;
    }
  }

  /**
   * Get detailed analytics for a specific book
   * @param bookId Book MongoDB ID
   */
  async getBookAnalytics(bookId: string): Promise<BookAnalytics | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/books/${bookId}/analytics`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get analytics failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error fetching book analytics:', error);
      return null;
    }
  }

  /**
   * Get comprehensive financial analytics with summary metrics, revenue trends, and top performing books
   * @param period Time period: 7d, 30d, 90d, 12m
   */
  async getAnalytics(period: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<AnalyticsMetrics> {
    try {
      const url = new URL(`${API_URL}/admin/dashboard/analytics`, window.location.origin);
      url.searchParams.append('period', period);

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get analytics failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, {
        summary: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalPurchases: 0,
          averageOrderValue: 0,
        },
        chart: [],
        topBooks: [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        summary: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalPurchases: 0,
          averageOrderValue: 0,
        },
        chart: [],
        topBooks: [],
      };
    }
  }

  /**
   * Get aggregated reader activity statistics across all readers
   * @param period Time period: 7d, 30d, 90d
   */
  async getReaderActivity(period: '7d' | '30d' | '90d' = '7d'): Promise<ReaderActivityMetrics> {
    try {
      const url = new URL(`${API_URL}/admin/analytics/activity`, window.location.origin);
      url.searchParams.append('period', period);

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get reader activity failed: ${response.statusText}`);
      }

      const data = await safeParseJSON<any>(response, null);
      if (!data) {
        return {
          period,
          summary: { totalSessions: 0, totalPagesRead: 0, totalReadingTime: 0, averageSessionTime: 0, booksInProgress: 0, booksFinished: 0 },
          chart: [],
          topBooks: [],
        };
      }

      return {
        period: data.period || period,
        summary: {
          totalSessions: data.summary?.totalActiveSessions ?? 0,
          totalPagesRead: data.summary?.totalPagesReadPlatform ?? 0,
          totalReadingTime: data.summary?.totalReadingTimePlatform ?? 0,
          averageSessionTime: data.summary?.averageSessionTime ?? 0,
          booksInProgress: data.summary?.booksInProgress ?? 0,
          booksFinished: data.summary?.booksFinished ?? 0,
        },
        chart: (data.chart || []).map((c: any) => ({
          label: c.label,
          sessions: c.sessions || 0,
          pagesRead: c.pagesRead || 0,
          readingTime: c.readingTime || 0,
        })),
        topBooks: (data.topBooks || []).map((b: any) => ({
          bookId: b.bookId || b._id,
          title: b.title || '',
          coverUrl: b.coverUrl || null,
          pagesRead: b.pagesRead || 0,
          progressPercentage: b.progressPercentage || 0,
          lastReadAt: b.lastReadAt || new Date().toISOString(),
        })),
      };
    } catch (error) {
      console.error('Error fetching reader activity:', error);
      return {
        period: period,
        summary: {
          totalSessions: 0,
          totalPagesRead: 0,
          totalReadingTime: 0,
          averageSessionTime: 0,
          booksInProgress: 0,
          booksFinished: 0,
        },
        chart: [],
        topBooks: [],
      };
    }
  }

  /**
   * Get recent transactions with pagination and optional status filtering
   * @param page Page number (default: 1)
   * @param limit Number of transactions per page (default: 20)
   * @param status Filter by status: paid, pending, failed, refunded
   */
  async getTransactions(page: number = 1, limit: number = 20, status?: 'paid' | 'pending' | 'failed' | 'refunded'): Promise<TransactionsResponse> {
    try {
      const url = new URL(`${API_URL}/admin/dashboard/transactions`, window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      if (status) url.searchParams.append('status', status);

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get transactions failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, {
        items: [],
        total: 0,
        page: 1,
        pages: 0,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        pages: 0,
      };
    }
  }

  /**
   * Export transactions as CSV file attachment
   * @param status Filter by status: paid, pending, failed, refunded
   */
  async exportTransactionsCSV(status?: 'paid' | 'pending' | 'failed' | 'refunded'): Promise<Blob | null> {
    try {
      const url = new URL(`${API_URL}/admin/dashboard/reports/export`, window.location.origin);
      if (status) url.searchParams.append('status', status);

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Export CSV failed: ${response.statusText}`);
      }

      // Return the CSV blob directly (Content-Type: text/csv)
      return await response.blob();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return null;
    }
  }

  /**
   * Get community statistics: total readers, subscribers, reviews, average rating
   */
  async getCommunityStats(): Promise<CommunityStats> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/community`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get community stats failed: ${response.statusText}`);
      }

      const data = await safeParseJSON<{ summary?: CommunityStats }>(response, { summary: undefined });
      return {
        totalReaders: data?.summary?.totalReaders ?? 0,
        newsletterSubscribers: data?.summary?.newsletterSubscribers ?? 0,
        totalReviews: data?.summary?.reviewsCount ?? 0,
        averageRating: data?.summary?.averageRating ?? 0,
      };
    } catch (error) {
      console.error('Error fetching community stats:', error);
      return {
        totalReaders: 0,
        newsletterSubscribers: 0,
        totalReviews: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * Get latest reviews from readers
   * @param limit Number of reviews to return
   * @param page Page number
   */
  async getReviews(limit: number = 10, page: number = 1): Promise<CommunityReview[]> {
    try {
      const url = new URL(`${API_URL}/admin/reviews`, window.location.origin);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('page', page.toString());

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get reviews failed: ${response.statusText}`);
      }

      const data = await safeParseJSON<{ items?: any[] }>(response, { items: [] });
      return (data.items || []).map((r: any) => ({
        _id: r.reviewId || r._id,
        userEmail: '',
        userName: r.userName || 'Anonymous',
        userAvatar: undefined,
        bookTitle: r.bookTitle || 'Unknown',
        rating: r.rating || 0,
        content: r.content || '',
        createdAt: r.createdAt || new Date().toISOString(),
        isVerified: false,
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  /**
   * Get top readers by books owned and activity
   * @param limit Number of readers to return
   */
  async getTopReaders(limit: number = 3): Promise<CommunityReader[]> {
    try {
      const url = new URL(`${API_URL}/admin/readers`, window.location.origin);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('sort', 'booksOwned');

      const response = await handleAdminFetch(url.toString(), {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get top readers failed: ${response.statusText}`);
      }

      const data = await safeParseJSON<{ items?: any[] }>(response, { items: [] });
      return (data.items || []).map((r: any) => ({
        _id: r.userId || r._id,
        name: r.name || 'Unknown',
        email: '',
        avatar: undefined,
        booksOwned: r.booksOwned || 0,
        readingProgress: r.averageProgress || r.readingProgress || 0,
        lastActivityAt: r.lastActivity || r.lastActivityAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching top readers:', error);
      return [];
    }
  }

  /**
   * Format price for display
   */
  formatPrice(priceCents: number, currency: string = 'USD'): string {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
    const amount = (priceCents / 100).toFixed(2);
    return `${symbol}${amount}`;
  }

  // ============================================================================
  // SETTINGS ENDPOINTS
  // ============================================================================

  /**
   * Get all platform settings
   */
  async getSettings(): Promise<SiteSettings | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get settings failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  /**
   * Update platform settings
   */
  async updateSettings(data: Record<string, any>): Promise<SiteSettings | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Try to get error details from response
        try {
          const errorData = await response.json();
          const errorMessage = typeof errorData.message === 'string' 
            ? errorData.message 
            : Array.isArray(errorData.message) 
              ? errorData.message.join(', ')
              : errorData.error || response.statusText;
          throw new Error(errorMessage);
        } catch (e) {
          throw new Error(`Update settings failed: ${response.statusText}`);
        }
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Test Polar payment provider connection
   */
  async testPolarConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings/test-polar`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Test Polar failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, { success: false, message: 'Test failed' });
    } catch (error) {
      console.error('Error testing Polar:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  /**
   * Test Google Drive connection
   */
  async testGoogleDriveConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings/test-drive`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
      });

      const data = await response.json();

      if (!response.ok) {
        // Return the specific error message from the API
        return {
          success: false,
          message: data.message || `Test failed: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error('Error testing Google Drive:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  /**
   * List Google Drive folders
   */
  async listGoogleDriveFolders(): Promise<Array<{ id: string; name: string; webViewLink?: string }>> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings/list-drive-folders`, {
        method: 'GET',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorData.message === 'string' 
            ? errorData.message 
            : 'Failed to list Google Drive folders'
        );
      }

      const data = await response.json();
      return data.folders || [];
    } catch (error) {
      console.error('Error listing Google Drive folders:', error);
      throw error;
    }
  }

  /**
   * List PDF files from Google Drive.
   */
  async listGoogleDriveFiles(folderId?: string): Promise<DriveFile[]> {
    try {
      const url = new URL(`${API_URL}/admin/settings/list-drive-files`, window.location.origin);
      if (folderId) url.searchParams.append('folderId', folderId);

      const response = await handleAdminFetch(url.toString(), {
        method: 'GET',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorData.message === 'string'
            ? errorData.message
            : 'Failed to list Google Drive files'
        );
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw error;
    }
  }

  /**
   * Test SMTP email configuration
   */
  async testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/settings/test-email`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Test Email failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, { success: false, message: 'Test failed' });
    } catch (error) {
      console.error('Error testing email:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Email test failed' };
    }
  }

  // ============================================================================
  // CATEGORIES ENDPOINTS
  // ============================================================================

  /**
   * Get all categories sorted by display order
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/categories`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Get categories failed: ${response.statusText}`);
      }

      const data = await safeParseJSON<{ items?: Category[] }>(response, { items: [] });
      return data.items || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Create new category
   */
  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    order?: number;
    active?: boolean;
  }): Promise<Category | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Create category failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    data: Partial<Category>
  ): Promise<Category | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Update category failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error updating category:', error);
      return null;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<{ message: string } | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`Delete category failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error deleting category:', error);
      return null;
    }
  }

  // ============================================================================
  // LANDING / AUTHOR IMAGE
  // ============================================================================

  /**
   * Upload author image for the landing page
   */
  async uploadSiteLogo(file: File): Promise<{ url: string } | null> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await handleAdminFetch(`${API_URL}/admin/settings/logo`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload logo failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  }

  async uploadComingSoonBg(file: File): Promise<{ url: string } | null> {
    try {
      const formData = new FormData();
      formData.append('bg', file);

      const response = await handleAdminFetch(`${API_URL}/admin/settings/coming-soon-bg`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload coming soon bg failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error uploading coming soon bg:', error);
      return null;
    }
  }

  async uploadAuthorImage(file: File): Promise<{ authorImageUrl: string } | null> {
    try {
      const formData = new FormData();
      formData.append('authorImage', file);

      const response = await handleAdminFetch(`${API_URL}/admin/landing/author-image`, {
        method: 'PATCH',
        headers: authService.getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload author image failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error uploading author image:', error);
      return null;
    }
  }

  /**
   * Get landing/philosophy settings
   */
  async getPhilosophySettings(): Promise<{ title: string; content: string; authorImageUrl?: string | null } | null> {
    try {
      const response = await fetch(`${API_URL}/landing/philosophy`);
      if (!response.ok) throw new Error('Failed to fetch philosophy');
      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error fetching philosophy:', error);
      return null;
    }
  }

  /**
   * Update philosophy section (title, content, authorImageUrl)
   */
  async updatePhilosophy(data: { title: string; content: string; authorImageUrl?: string | null }): Promise<any | null> {
    try {
      const response = await handleAdminFetch(`${API_URL}/admin/landing/philosophy`, {
        method: 'PUT',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Update philosophy failed: ${response.statusText}`);
      }

      return await safeParseJSON(response, null);
    } catch (error) {
      console.error('Error updating philosophy:', error);
      return null;
    }
  }
}

export const adminBooksService = new AdminBooksService();

