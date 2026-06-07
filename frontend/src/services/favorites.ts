const API_URL = import.meta.env.VITE_API_URL;

export interface FavoriteBook {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverUrl?: string;
  priceCents: number;
  currency: string;
}

export interface FavoriteItem {
  _id: string;
  book: FavoriteBook | null;
  createdAt: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const favoritesService = {
  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const res = await fetch(`${API_URL}/favorites`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getFavoriteIds(): Promise<string[]> {
    try {
      const res = await fetch(`${API_URL}/favorites/ids`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.ids || [];
    } catch {
      return [];
    }
  },

  async checkFavorite(bookId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/favorites/check/${bookId}`, { headers: getAuthHeaders() });
      if (!res.ok) return false;
      const data = await res.json();
      return data.isFavorite;
    } catch {
      return false;
    }
  },

  async addFavorite(bookId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/favorites/${bookId}`, { method: 'POST', headers: getAuthHeaders() });
      return res.ok;
    } catch {
      return false;
    }
  },

  async removeFavorite(bookId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/favorites/${bookId}`, { method: 'DELETE', headers: getAuthHeaders() });
      return res.ok;
    } catch {
      return false;
    }
  },

  async toggleFavorite(bookId: string, isFav: boolean): Promise<boolean> {
    return isFav ? this.removeFavorite(bookId) : this.addFavorite(bookId);
  },
};
