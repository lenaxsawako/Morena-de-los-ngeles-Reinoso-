import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { supportService, type Ticket } from '../../services/support';
import './support.css';

const SUBJECTS = [
  'Mi compra no aparece en mi biblioteca',
  'Problema técnico con el lector',
  'Pregunta sobre un libro',
  'Otro',
];

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ticketId: string } | null>(null);
  const [viewTicketId, setViewTicketId] = useState('');
  const [viewedTicket, setViewedTicket] = useState<Ticket | null>(null);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const token = authService.getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setName(payload.name || '');
        setEmail(payload.email || '');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setError('Completá todos los campos obligatorios');
      return;
    }
    if (message.trim().length < 20) {
      setError('El mensaje debe tener al menos 20 caracteres');
      return;
    }

    setSending(true);
    try {
      const res = await supportService.createTicket({
        email: email.trim(),
        name: name.trim(),
        subject,
        message: message.trim(),
        orderId: orderId.trim() || undefined,
      });
      setResult({ ticketId: res.ticketId });
    } catch (err: any) {
      setError(err.message || 'Error al enviar consulta');
    } finally {
      setSending(false);
    }
  };

  const handleViewTicket = async () => {
    if (!viewTicketId.trim()) return;
    setViewing(true);
    setError(null);
    try {
      const ticket = await supportService.getPublicTicket(viewTicketId.trim());
      setViewedTicket(ticket);
    } catch {
      setError('No encontramos un ticket con ese ID');
    }
    setViewing(false);
  };

  if (viewedTicket) {
    return (
      <main className="support-wrapper">
        <div className="support-container">
          <div className="support-header">
            <button
              onClick={() => setViewedTicket(null)}
              style={{ background: 'none', border: 'none', color: '#F3EAD3', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', fontFamily: 'inherit' }}
            >
              ← Volver
            </button>
            <h1 className="support-title">{viewedTicket.subject}</h1>
            <p className="support-subtitle" style={{ fontSize: '0.8rem', color: '#999888' }}>
              #{viewedTicket._id} — Estado: {viewedTicket.status === 'open' ? 'Abierto' : viewedTicket.status === 'in_progress' ? 'En progreso' : 'Resuelto'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {(viewedTicket.messages && viewedTicket.messages.length > 0 ? viewedTicket.messages : [{ role: 'user', content: viewedTicket.message, createdAt: viewedTicket.createdAt }]).map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.03)' : 'rgba(74,222,128,0.05)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.06)' : 'rgba(74,222,128,0.15)'}`,
                  borderRadius: '8px', padding: '0.75rem 1rem',
                  fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}
              >
                <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: msg.role === 'user' ? '#999888' : '#4ade80', fontWeight: 600 }}>
                  {msg.role === 'user' ? 'Tú' : 'Soporte'}
                  <span style={{ fontWeight: 400, marginLeft: '0.5rem' }}>{new Date(msg.createdAt).toLocaleString('es-ES')}</span>
                </p>
                {msg.content}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="support-wrapper">
        <div className="support-container">
          <div className="support-success">
            <span className="material-symbols-outlined support-success-icon">check_circle</span>
            <h2 className="support-success-title">Tu consulta fue enviada</h2>
            <p className="support-success-text">
              Revisá tu email, te responderemos a la brevedad.
            </p>
            <p className="support-success-ref">
              Número de referencia: <strong>#{result.ticketId}</strong>
            </p>
            <button
              onClick={() => {
                setResult(null);
                setViewTicketId(result.ticketId);
              }}
              className="support-submit"
              style={{ marginTop: '1rem' }}
            >
              VER CONVERSACIÓN
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="support-wrapper">
      <div className="support-container">
        <div className="support-header">
          <h1 className="support-title">Soporte</h1>
          <p className="support-subtitle">
            Tenés un problema o consulta? Escribinos y te respondemos a la brevedad.
          </p>
        </div>

        <div style={{
          marginBottom: '2rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
        }}>
          <p style={{ fontSize: '0.85rem', color: '#999888', marginBottom: '0.5rem' }}>
            Ya enviaste una consulta? Ingresá tu número de referencia para ver las respuestas.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="support-input"
              type="text"
              value={viewTicketId}
              onChange={e => setViewTicketId(e.target.value)}
              placeholder="ID del ticket (ej: 6655abc...)"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <button
              onClick={handleViewTicket}
              disabled={viewing || !viewTicketId.trim()}
              className="support-submit"
              style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', margin: 0 }}
            >
              {viewing ? '...' : 'VER'}
            </button>
          </div>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          <div className="support-field">
            <label className="support-label">Nombre</label>
            <input
              className="support-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>
          <div className="support-field">
            <label className="support-label">Email</label>
            <input
              className="support-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="support-field">
            <label className="support-label">Asunto</label>
            <select
              className="support-input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            >
              <option value="">Seleccioná un asunto</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="support-field">
            <label className="support-label">
              Mensaje <span className="support-char-count">({message.length}/20 mínimo)</span>
            </label>
            <textarea
              className="support-textarea"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describí tu consulta en detalle..."
              rows={5}
              required
            />
          </div>
          <div className="support-field">
            <label className="support-label">ID de orden (opcional)</label>
            <input
              className="support-input"
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="Lo encontrás en el email de confirmación de compra"
            />
          </div>
          {error && <p className="support-error">{error}</p>}
          <button className="support-submit" type="submit" disabled={sending}>
            {sending ? 'ENVIANDO...' : 'ENVIAR CONSULTA'}
          </button>
        </form>
      </div>
    </main>
  );
}
