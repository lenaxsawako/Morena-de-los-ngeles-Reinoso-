import { authService } from './auth';

/**
 * Reading Progress API Service
 * Gestiona progreso de lectura, favoritos y sincronización
 */

/**
 * Helper para parsear JSON de forma segura
 * Maneja respuestas vacías del servidor
 */
async function safeParseJSON<T>(response: Response, fallback: T): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  // Si no es JSON o no hay content-length, devolver fallback
  if (!contentType?.includes('application/json')) {
    return fallback;
  }

  const text = await response.text();
  
  // Si el body está vacío o solo tiene whitespace, devolver fallback
  if (!text || !text.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // Si falla el parsing, devolver fallback
    return fallback;
  }
}

export interface ReadingProgressItem {
  bookId: string;
  currentPage: number;
  progressPercentage: number;
  lastReadAt: string;
}

export interface ReadingProgressWithDetails extends ReadingProgressItem {
  bookTitle?: string;
  bookCoverUrl?: string;
}

export interface LibraryBook {
  bookId: string;
  title: string;
  slug: string;
  coverUrl: string;
  progressPercentage: number;
  status: 'unread' | 'reading' | 'completed';
}

export interface ContinueReading {
  bookId: string;
  title: string;
  coverUrl: string;
  currentPage: number;
  progressPercentage: number;
  remainingPages: number;
  lastReadAt: string;
}

export interface LibraryDashboard {
  continueReading: ContinueReading | null;
  collection: LibraryBook[];
}

export interface BookmarkResponse {
  id: string;
  page: number;
  note?: string;
  createdAt?: string;
}

export interface ReadingStats {
  totalBooks: number;
  booksInProgress: number;
  booksFinished: number;
  averageProgress: number;
  lastReadAt: string;
}

export interface SyncResult {
  synced: number;
  details: Array<{
    bookId: string;
    action: 'created' | 'updated';
    currentPage: number;
    progressPercentage: number;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL;

export const readingService = {
  /**
   * POST /reading-progress/:bookId
   * Actualiza o crea el progreso de lectura para un libro
   * @param bookId - ID del libro
   * @param currentPage - Página actual
   */
  async updateProgress(bookId: string, currentPage: number): Promise<ReadingProgressItem> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/reading-progress/${bookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ currentPage }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar progreso');
      }

      return await safeParseJSON(response, {
        bookId,
        currentPage,
        progressPercentage: 0,
        lastReadAt: new Date().toISOString(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /reading-progress/:bookId
   * Obtiene el progreso de lectura actual para un libro
   * @param bookId - ID del libro
   */
  async getProgress(bookId: string): Promise<ReadingProgressItem | null> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/reading-progress/${bookId}`, {
        headers: authHeader,
      });

      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Error al obtener progreso');

      return await safeParseJSON(response, null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /reading-progress
   * Obtiene todo el progreso de lectura del usuario
   */
  async getAllProgress(): Promise<ReadingProgressWithDetails[]> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/reading-progress`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener progreso');

      return await safeParseJSON(response, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library
   * Obtiene la colección de libros comprados con estado de lectura
   */
  async getLibrary(): Promise<LibraryBook[]> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener biblioteca');

      return await safeParseJSON(response, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library/dashboard
   * Obtiene el dashboard completo: libro en lectura + colección
   */
  async getDashboard(): Promise<LibraryDashboard> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library/dashboard`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener dashboard');

      return await safeParseJSON(response, {
        continueReading: null,
        collection: [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library/continue-reading
   * Obtiene el libro más recientemente abierto
   */
  async getContinueReading(): Promise<ContinueReading | null> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library/continue-reading`, {
        headers: authHeader,
      });

      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Error al obtener continuar lectura');

      return await safeParseJSON(response, null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library/recent?limit=5
   * Obtiene libros abiertos recientemente
   * @param limit - Número de libros a retornar (default: 5)
   */
  async getRecentBooks(limit: number = 5): Promise<ReadingProgressWithDetails[]> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library/recent?limit=${limit}`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener libros recientes');

      return await safeParseJSON(response, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library/favorites
   * Obtiene los libros marcados como favoritos
   */
  async getFavorites(): Promise<LibraryBook[]> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library/favorites`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener favoritos');

      return await safeParseJSON(response, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * POST /library/sync
   * Sincroniza el progreso de lectura del invitado con la cuenta autenticada
   * @param progressData - Array de progreso del invitado
   */
  async syncGuestProgress(progressData: ReadingProgressItem[]): Promise<SyncResult> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    if (progressData.length === 0) {
      return { synced: 0, details: [] };
    }

    try {
      const response = await fetch(`${API_URL}/library/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) throw new Error('Error al sincronizar progreso');

      return await safeParseJSON(response, {
        synced: 0,
        details: [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library/stats
   * Obtiene estadísticas de lectura del usuario
   */
  async getStats(): Promise<ReadingStats> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library/stats`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener estadísticas');

      return await safeParseJSON(response, {
        totalBooks: 0,
        booksInProgress: 0,
        booksFinished: 0,
        averageProgress: 0,
        lastReadAt: new Date().toISOString(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /library/:bookId
   * Obtiene detalles completos de un libro con progreso de lectura
   * @param bookId - ID del libro
   */
  async getBookDetails(bookId: string) {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/library/${bookId}`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener detalles del libro');

      return await safeParseJSON(response, null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * POST /bookmarks/:bookId
   * Crear un marcapáginas
   * @param bookId - ID del libro
   * @param page - Número de página
   * @param note - Nota o comentario
   */
  async createBookmark(bookId: string, page: number, note?: string): Promise<BookmarkResponse | null> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/bookmarks/${bookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ page, note }),
      });

      if (!response.ok) throw new Error('Error al crear marcapáginas');

      return await safeParseJSON(response, null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * GET /bookmarks/:bookId
   * Obtener todos los marcapáginas de un libro
   * @param bookId - ID del libro
   */
  async getBookmarks(bookId: string): Promise<BookmarkResponse[]> {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/bookmarks/${bookId}`, {
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al obtener marcapáginas');

      return await safeParseJSON(response, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },

  /**
   * DELETE /bookmarks/:bookmarkId
   * Eliminar un marcapáginas
   * @param bookmarkId - ID del marcapáginas
   */
  async deleteBookmark(bookmarkId: string) {
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    try {
      const response = await fetch(`${API_URL}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: authHeader,
      });

      if (!response.ok) throw new Error('Error al eliminar marcapáginas');

      return await safeParseJSON(response, { message: 'deleted' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
};
