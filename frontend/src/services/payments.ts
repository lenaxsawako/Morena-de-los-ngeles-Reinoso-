import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface Purchase {
  _id: string;
  bookRef: string;
  userRef: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
}

export const paymentsService = {
  async createCheckout(bookId: string): Promise<{ url: string }> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/checkout/${bookId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo iniciar el pago');
    }

    return response.json();
  },

  async getPurchases(): Promise<Purchase[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/checkout/purchases`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('No se pudieron obtener las compras');
    }

    return response.json();
  },
};