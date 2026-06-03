import { useState, useEffect } from 'react';
import { subscriptionService, type Subscriber } from '../../../services/subscription';

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalSubs, setTotalSubs] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ message: string; results?: { total: number; sent: number; failed: number } } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [subsData, statsData] = await Promise.all([
          subscriptionService.getSubscribers(1, 100),
          subscriptionService.getStats(),
        ]);
        setSubscribers(subsData.data);
        setTotalSubs(subsData.total);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading subscribers:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !bodyText) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = await subscriptionService.sendNewsletter(subject, bodyText);
      setSendResult(result);
      setSubject('');
      setBodyText('');
    } catch (err) {
      setSendResult({ message: 'Error al enviar newsletter' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline-md text-headline-md">Newsletter</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2">Total Suscriptores</p>
          <p className="text-3xl font-headline-sm">{stats.total}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2">Activos</p>
          <p className="text-3xl font-headline-sm text-green-400">{stats.active}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2">Inactivos</p>
          <p className="text-3xl font-headline-sm text-red-400">{stats.total - stats.active}</p>
        </div>
      </div>

      {/* Send Newsletter */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-headline-md mb-6">Redactar Newsletter</h2>
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm text-on-surface-variant mb-2 uppercase tracking-widest">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-primary focus:outline-none focus:border-primary"
              placeholder="Asunto del correo"
              required
              disabled={sending}
            />
          </div>
          <div>
            <label className="block text-sm text-on-surface-variant mb-2 uppercase tracking-widest">Cuerpo (texto plano)</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-primary focus:outline-none focus:border-primary min-h-[200px]"
              placeholder="Escribe el contenido del newsletter..."
              required
              disabled={sending}
            />
          </div>
          {sendResult && (
            <div className={`p-4 rounded ${sendResult.results ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className={`font-body-sm ${sendResult.results ? 'text-green-400' : 'text-red-400'}`}>
                {sendResult.message}
              </p>
              {sendResult.results && (
                <p className="text-on-surface-variant text-sm mt-2">
                  Enviados: {sendResult.results.sent} / {sendResult.results.total} | Fallos: {sendResult.results.failed}
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={sending || !subject || !bodyText}
            className="bg-primary text-background font-label-md px-8 py-4 tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50"
          >
            {sending ? 'ENVIANDO...' : `ENVIAR A ${stats.active} SUSCRIPTORES`}
          </button>
        </form>
      </div>

      {/* Subscribers List */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-headline-md mb-6">Suscriptores ({totalSubs})</h2>
        {loading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : subscribers.length === 0 ? (
          <p className="text-on-surface-variant">No hay suscriptores aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-on-surface-variant text-sm uppercase tracking-widest border-b border-white/10">
                  <th className="pb-3 font-label-md">Email</th>
                  <th className="pb-3 font-label-md">Fuente</th>
                  <th className="pb-3 font-label-md">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-primary">{sub.email}</td>
                    <td className="py-3 text-on-surface-variant">{sub.source}</td>
                    <td className="py-3 text-on-surface-variant">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
