const API_URL = import.meta.env.VITE_API_URL;

export interface BookDetail {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverUrl?: string;
  priceCents: number;
  currency: string;
  previewPages: number;
  totalPages: number;
  category?: { _id: string; name: string; slug: string } | null;
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

  getPdfUrl(bookId: string): string {
    return `${API_URL}/books/id/${bookId}/pdf`;
  },
};