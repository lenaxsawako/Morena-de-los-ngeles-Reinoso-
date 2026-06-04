const API_URL = import.meta.env.VITE_API_URL;

export interface BookDetail {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  authorNotes?: string;
  coverUrl?: string;
  priceCents: number;
  currency: string;
  previewPages: number;
  totalPages: number;
  category?: { _id: string; name: string; slug: string } | null;
}

export interface SeriesItem {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  priceCents?: number;
  currency?: string;
}

export interface SeriesInfo {
  prequel: SeriesItem | null;
  sequels: SeriesItem[];
}

export interface Recommendation {
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

export const booksService = {
  async getBookById(id: string): Promise<BookDetail | null> {
    try {
      const response = await fetch(`${API_URL}/books/id/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  async getSeries(bookId: string): Promise<SeriesInfo> {
    try {
      const response = await fetch(`${API_URL}/books/id/${bookId}/series`);
      if (!response.ok) return { prequel: null, sequels: [] };
      return await response.json();
    } catch {
      return { prequel: null, sequels: [] };
    }
  },

  async getRecommendations(bookId: string): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${API_URL}/books/id/${bookId}/recommendations`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  },

  getPdfUrl(bookId: string): string {
    return `${API_URL}/books/id/${bookId}/pdf`;
  },

  getPageRangeUrl(bookId: string, start: number, end: number): string {
    return `${API_URL}/books/id/${bookId}/page-range?start=${start}&end=${end}`;
  },

  async fetchPageRange(bookId: string, start: number, end: number): Promise<ArrayBuffer | null> {
    try {
      const url = this.getPageRangeUrl(bookId, start, end);
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.arrayBuffer();
    } catch {
      return null;
    }
  },
};