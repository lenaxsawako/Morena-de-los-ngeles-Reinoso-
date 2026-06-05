import { useState, useEffect } from 'react';
import { supportService, type Ticket } from '../../../services/support';

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
};

const STATUS_TABS = [
  { key: '', label: 'Todos' },
  { key: 'open', label: 'Abiertos' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'resolved', label: 'Resueltos' },
];

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editReply, setEditReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await supportService.getTickets({ status: statusFilter || undefined });
      setTickets(data.items);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openTicket = async (id: string) => {
    const t = await supportService.getTicket(id);
    setSelected(t);
    setEditStatus(t.status);
    setEditReply(t.adminReply || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await supportService.updateTicket(selected._id, {
        status: editStatus,
        adminReply: editReply || undefined,
      });
      setSelected(updated);
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div style={{ padding: '2rem', color: '#e5e2e1' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Soporte — Tickets</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: `1px solid ${statusFilter === tab.key ? '#F3EAD3' : 'rgba(255,255,255,0.1)'}`,
              background: statusFilter === tab.key ? 'rgba(243,234,211,0.1)' : 'transparent',
              color: statusFilter === tab.key ? '#F3EAD3' : '#999888',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#999888' }}>Cargando...</p>
      ) : tickets.length === 0 ? (
        <p style={{ color: '#999888' }}>No hay tickets.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#999888', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Nombre</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Asunto</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr
                  key={t._id}
                  onClick={() => openTicket(t._id)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>{new Date(t.createdAt).toLocaleDateString('es-ES')}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{t.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{t.email}</td>
                  <td style={{ padding: '0.75rem 0.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: t.status === 'open' ? 'rgba(251,191,36,0.15)' : t.status === 'in_progress' ? 'rgba(96,165,250,0.15)' : 'rgba(74,222,128,0.15)',
                      color: t.status === 'open' ? '#fbbf24' : t.status === 'in_progress' ? '#60a5fa' : '#4ade80',
                    }}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            padding: '1rem',
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: '#131313', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px', padding: '2rem', maxWidth: '600px', width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600 }}>{selected.subject}</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#999888' }}>#{selected._id}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#999888', cursor: 'pointer', fontSize: '1.25rem' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <p style={{ margin: '0 0 0.25rem' }}><strong>De:</strong> {selected.name} ({selected.email})</p>
              {selected.orderId && <p style={{ margin: '0 0 0.25rem' }}><strong>Orden:</strong> {selected.orderId}</p>}
              <p style={{ margin: 0, color: '#999888' }}>{new Date(selected.createdAt).toLocaleString('es-ES')}</p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem',
              fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>
              {selected.message}
            </div>

            {selected.adminReply && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#4ade80', marginBottom: '0.5rem' }}>
                  Respuesta enviada el {selected.repliedAt ? new Date(selected.repliedAt).toLocaleString('es-ES') : ''}
                </p>
                <div style={{
                  background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)',
                  borderRadius: '8px', padding: '1rem', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {selected.adminReply}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#999888', marginBottom: '0.3rem', display: 'block' }}>Estado</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e5e2e1', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
                  }}
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En progreso</option>
                  <option value="resolved">Resuelto</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#999888', marginBottom: '0.3rem', display: 'block' }}>Respuesta (se envía por email al usuario)</label>
                <textarea
                  value={editReply}
                  onChange={e => setEditReply(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e5e2e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit', minHeight: '100px',
                  }}
                  placeholder="Escribí tu respuesta..."
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%', padding: '0.75rem', border: 'none', borderRadius: '8px',
                  background: '#F3EAD3', color: '#0a0a0a', fontSize: '0.85rem',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? 'GUARDANDO...' : 'GUARDAR Y NOTIFICAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
