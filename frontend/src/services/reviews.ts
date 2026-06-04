import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface BookReviewsResponse {
  reviews: ReviewItem[];
  avgRating: number;
  count: number;
}

export interface AdminReviewItem {
  id: string;
  userName: string;
  bookTitle: string;
  rating: number;
  comment?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AdminReviewsResponse {
  items: AdminReviewItem[];
  total: number;
  page: number;
  pages: number;
}

export const reviewsService = {
  async upsert(bookId: string, rating: number, comment?: string) {
    const authHeader = authService.getAuthHeader();
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ bookId, rating, comment }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al enviar valoración');
    }
    return response.json();
  },

  async getBookReviews(bookId: string): Promise<BookReviewsResponse> {
    const response = await fetch(`${API_URL}/reviews/book/${bookId}`);
    if (!response.ok) return { reviews: [], avgRating: 0, count: 0 };
    return response.json();
  },

  async getAdminReviews(page = 1, limit = 20, status?: string): Promise<AdminReviewsResponse> {
    const authHeader = authService.getAuthHeader();
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const response = await fetch(`${API_URL}/admin/reviews?${params}`, { headers: { ...authHeader } });
    if (!response.ok) return { items: [], total: 0, page, pages: 0 };
    return response.json();
  },

  async approve(id: string) {
    const authHeader = authService.getAuthHeader();
    const response = await fetch(`${API_URL}/admin/reviews/${id}/approve`, {
      method: 'PUT',
      headers: { ...authHeader },
    });
    if (!response.ok) throw new Error('Error al aprobar valoración');
    return response.json();
  },

  async reject(id: string, reason?: string) {
    const authHeader = authService.getAuthHeader();
    const response = await fetch(`${API_URL}/admin/reviews/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Error al rechazar valoración');
    return response.json();
  },
};