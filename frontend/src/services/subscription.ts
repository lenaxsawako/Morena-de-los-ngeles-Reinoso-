import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
  source: string;
  createdAt: string;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
}

export interface NewsletterCampaign {
  _id: string;
  subject: string;
  htmlContent: string;
  segment: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface CampaignsResponse {
  items: NewsletterCampaign[];
  total: number;
  page: number;
  pages: number;
}

function authHeaders(): Record<string, string> {
  const h = authService.getAuthHeader();
  return h ? { ...h } : {};
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
    const response = await fetch(`${API_URL}/admin/subscriptions?page=${page}&limit=${limit}`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('Error al obtener suscriptores');
    return response.json();
  },

  async getStats(): Promise<NewsletterStats> {
    const response = await fetch(`${API_URL}/admin/subscriptions/stats`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  async previewTemplate(subject: string, content: string, email?: string): Promise<{ html: string }> {
    const response = await fetch(`${API_URL}/admin/subscriptions/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ subject, content, email }),
    });
    if (!response.ok) throw new Error('Error al previsualizar');
    return response.json();
  },

  async sendNewsletter(subject: string, content: string, segment?: string): Promise<{ message: string; results: { sent: number; failed: number } }> {
    const response = await fetch(`${API_URL}/admin/subscriptions/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ subject, content, segment }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al enviar newsletter');
    }
    return response.json();
  },

  async createCampaign(data: { subject: string; htmlContent: string; segment?: string; scheduledAt?: string }): Promise<NewsletterCampaign> {
    const response = await fetch(`${API_URL}/admin/subscriptions/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear campaña');
    return response.json();
  },

  async getCampaigns(page: number = 1, limit: number = 20): Promise<CampaignsResponse> {
    const response = await fetch(`${API_URL}/admin/subscriptions/campaigns?page=${page}&limit=${limit}`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('Error al obtener campañas');
    return response.json();
  },

  async sendCampaign(id: string): Promise<{ message: string; results: { sent: number; failed: number } }> {
    const response = await fetch(`${API_URL}/admin/subscriptions/campaigns/${id}/send`, {
      method: 'PUT',
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('Error al enviar campaña');
    return response.json();
  },

  async getStatus(): Promise<{ subscribed: boolean; email: string }> {
    const response = await fetch(`${API_URL}/subscriptions/status`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) return { subscribed: false, email: '' };
    return response.json();
  },
};