import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { supportService } from '../../services/support';
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
