const API_URL = import.meta.env.VITE_API_URL;

export interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
  source: string;
  createdAt: string;
}

export const subscriptionService = {
  async subscribe(email: string, source: string = 'landing'): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Error al suscribir');
    }
    return response.json();
  },

  async unsubscribe(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/subscriptions/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Error al desuscribir');
    return response.json();
  },

  async getSubscribers(page: number = 1, limit: number = 50): Promise<{ data: Subscriber[]; total: number }> {
    const authHeader = JSON.parse(localStorage.getItem('auth') || '{}');
    const token = authHeader?.token;
    const response = await fetch(`${API_URL}/admin/subscriptions?page=${page}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Error al obtener suscriptores');
    return response.json();
  },

  async getStats(): Promise<{ total: number; active: number }> {
    const authHeader = JSON.parse(localStorage.getItem('auth') || '{}');
    const token = authHeader?.token;
    const response = await fetch(`${API_URL}/admin/subscriptions/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  async sendNewsletter(subject: string, bodyText: string, htmlBody?: string): Promise<{ message: string; results: { total: number; sent: number; failed: number } }> {
    const authHeader = JSON.parse(localStorage.getItem('auth') || '{}');
    const token = authHeader?.token;
    const response = await fetch(`${API_URL}/admin/subscriptions/send-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subject, bodyText, htmlBody }),
    });
    if (!response.ok) throw new Error('Error al enviar newsletter');
    return response.json();
  },
};
