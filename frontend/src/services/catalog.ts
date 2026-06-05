/**
 * Catalog API Service
 * Public endpoints para navegar libros y categorías
 */

/**
 * Helper para parsear JSON de forma segura
 * Maneja respuestas vacías del servidor
 */
async function safeParseJSON<T>(response: Response, fallback: T): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    return fallback;
  }

  const text = await response.text();
  
  if (!text || !text.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// Interfaces
export interface BookItem {
  _id: string;
  title: string;
  description: string;
  coverUrl?: string;
  priceCents: number;
  category: string;
}

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverUrl?: string;
  priceCents: number;
  currency: string;
  previewPages: number;
  totalPages: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface RecommendedBook {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  coverUrl: string;
  priceCents: number;
  currency: string;
  purchases: number;
  avgRating: number;
  reviewCount: number;
  relevanceScore: number;
}

export interface CatalogLanding {
  latestRelease?: {
    _id: string;
    title: string;
    subtitle?: string;
    description: string;
    coverUrl?: string;
    publishedAt: string;
  };
  preorderBook?: {
    _id: string;
    title: string;
    description: string;
    coverUrl?: string;
    releaseDate: string;
  };
  categories: Category[];
  featuredBooks: BookItem[];
}

export interface BooksResponse {
  items: BookItem[];
  total: number;
  page: number;
  pages: number;
}

const API_URL = import.meta.env.VITE_API_URL;

export const catalogService = {
  /**
   * GET /catalog
   * Obtiene landing page del catálogo
   */
  async getCatalogLanding(): Promise<CatalogLanding> {
    try {
      const response = await fetch(`${API_URL}/catalog`);

      if (!response.ok) {
        throw new Error('Error al obtener catálogo');
      }

      return await safeParseJSON(response, {
        categories: [],
        featuredBooks: [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /catalog/categories
   * Obtiene todas las categorías activas
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_URL}/catalog/categories`);

      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }

      return await safeParseJSON(response, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /books
   * Obtiene libros con búsqueda, filtro por categoría y paginación
   * @param q - Texto de búsqueda (opcional)
   * @param category - Slug de categoría (opcional)
   * @param page - Número de página (default: 1)
   * @param limit - Items por página (default: 12)
   */
  async getBooks(
    q?: string,
    category?: string,
    page: number = 1,
    limit: number = 12
  ): Promise<BooksResponse> {
    try {
      const params = new URLSearchParams();

      if (q) {
        params.append('q', q);
      }
      if (category) {
        params.append('category', category);
      }
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`${API_URL}/books?${params}`);

      if (!response.ok) {
        throw new Error('Error al obtener libros');
      }

      return await safeParseJSON(response, {
        items: [],
        total: 0,
        page: 1,
        pages: 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /books/:slug
   * Obtiene detalles completos de un libro
   * @param slug - Book slug
   */
  async getBookBySlug(slug: string): Promise<Book | null> {
    try {
      const response = await fetch(`${API_URL}/books/${slug}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Error al obtener libro');
      }

      return await safeParseJSON(response, null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * Helper para convertir priceCents a formato de moneda
   */
  formatPrice(priceCents: number, currency: string = 'USD'): string {
    const amount = (priceCents / 100).toFixed(2);
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${amount}`;
  },

  /**
   * GET /catalog/recommendations
   * Obtiene recomendaciones generales
   */
  async getRecommendations(): Promise<RecommendedBook[]> {
    try {
      const response = await fetch(`${API_URL}/catalog/recommendations`);
      if (!response.ok) return [];
      return await safeParseJSON(response, []);
    } catch {
      return [];
    }
  },

  /**
   * Helper para convertir categoría ID a slug
   */
  getCategorySlug(categoryName: string): string {
    return categoryName.toLowerCase().replace(/\s+/g, '-');
  },
};
