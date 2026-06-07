import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface TicketMessage {
  role: 'user' | 'admin';
  content: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  userId?: string | null;
  email: string;
  name: string;
  subject: string;
  message: string;
  orderId?: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  messages: TicketMessage[];
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

export interface TicketsResponse {
  items: Ticket[];
  total: number;
  page: number;
  pages: number;
}

function authHeaders(): Record<string, string> {
  const h = authService.getAuthHeader();
  return h ? { ...h } : {};
}

export const supportService = {
  async createTicket(data: { email: string; name: string; subject: string; message: string; orderId?: string }): Promise<{ ticketId: string; message: string }> {
    const response = await fetch(`${API_URL}/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al enviar consulta');
    }
    return response.json();
  },

  async getTickets(params?: { status?: string; page?: number; limit?: number }): Promise<TicketsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const response = await fetch(`${API_URL}/admin/support/tickets?${query}`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('Error al obtener tickets');
    return response.json();
  },

  async getTicket(id: string): Promise<Ticket> {
    const response = await fetch(`${API_URL}/admin/support/tickets/${id}`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('Error al obtener ticket');
    return response.json();
  },

  async getPublicTicket(id: string): Promise<Ticket> {
    const response = await fetch(`${API_URL}/support/tickets/${id}`);
    if (!response.ok) throw new Error('Error al obtener ticket');
    return response.json();
  },

  async updateTicket(id: string, data: { status?: string; adminReply?: string }): Promise<Ticket> {
    const response = await fetch(`${API_URL}/admin/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar ticket');
    return response.json();
  },
};
