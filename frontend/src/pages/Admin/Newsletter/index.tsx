import { useState, useEffect } from 'react';
import { subscriptionService, type Subscriber, type NewsletterCampaign, type NewsletterStats } from '../../../services/subscription';

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalSubs, setTotalSubs] = useState(0);
  const [stats, setStats] = useState<NewsletterStats>({ totalSubscribers: 0, activeSubscribers: 0, inactiveSubscribers: 0 });
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState('all');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [subsData, statsData, campaignsData] = await Promise.all([
          subscriptionService.getSubscribers(1, 100),
          subscriptionService.getStats(),
          subscriptionService.getCampaigns(),
        ]);
        setSubscribers(subsData.data);
        setTotalSubs(subsData.total);
        setStats(statsData);
        setCampaigns(campaignsData.items);
      } catch (err) {
        console.error('Error loading newsletter data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePreview = async () => {
    if (!subject || !content) return;
    try {
      const result = await subscriptionService.previewTemplate(subject, content);
      setPreviewHtml(result.html);
      setShowPreview(true);
    } catch {
      setPreviewHtml('<p>Error al generar vista previa</p>');
      setShowPreview(true);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;
    setSending(true);
    setSendResult(null);
    try {
      if (sendMode === 'schedule' && scheduledAt) {
        const campaign = await subscriptionService.createCampaign({
          subject,
          htmlContent: content,
          segment: segment || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
        });
        setSendResult(`Campaña programada para ${new Date(scheduledAt).toLocaleString()}`);
        setCampaigns(prev => [campaign, ...prev]);
      } else {
        const result = await subscriptionService.sendNewsletter(subject, content, segment || undefined);
        setSendResult(result.message);
        const campaignsData = await subscriptionService.getCampaigns();
        setCampaigns(campaignsData.items);
      }
      setSubject('');
      setContent('');
      setScheduledAt('');
    } catch (err: any) {
      setSendResult(err.message || 'Error al enviar newsletter');
    } finally {
      setSending(false);
    }
  };

  const handleSendCampaign = async (id: string) => {
    try {
      const result = await subscriptionService.sendCampaign(id);
      setSendResult(result.message);
      const campaignsData = await subscriptionService.getCampaigns();
      setCampaigns(campaignsData.items);
    } catch (err: any) {
      setSendResult(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline-md">Newsletter</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2">Total</p>
          <p className="text-3xl font-headline-sm">{stats.totalSubscribers}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2">Activos</p>
          <p className="text-3xl font-headline-sm text-green-400">{stats.activeSubscribers}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-2">Inactivos</p>
          <p className="text-3xl font-headline-sm text-red-400">{stats.inactiveSubscribers}</p>
        </div>
      </div>

      {/* Create Campaign */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-headline-md mb-6">Crear Campaña</h2>
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
            <label className="block text-sm text-on-surface-variant mb-2 uppercase tracking-widest">Contenido (HTML o texto)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-primary focus:outline-none focus:border-primary min-h-[200px] font-mono text-sm"
              placeholder="Escribí el contenido del newsletter... Podés usar HTML o texto plano. Las variables {{unsubscribe_url}} se reemplazan automáticamente."
              required
              disabled={sending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-on-surface-variant mb-2 uppercase tracking-widest">Segmento</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-primary focus:outline-none focus:border-primary"
                disabled={sending}
              >
                <option value="all">Todos los suscriptores</option>
                <option value="buyers">Solo compradores</option>
                <option value="registered">Solo usuarios registrados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-on-surface-variant mb-2 uppercase tracking-widest">Modo de envío</label>
              <select
                value={sendMode}
                onChange={(e) => setSendMode(e.target.value as 'now' | 'schedule')}
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-primary focus:outline-none focus:border-primary"
                disabled={sending}
              >
                <option value="now">Enviar ahora</option>
                <option value="schedule">Programar envío</option>
              </select>
            </div>

            {sendMode === 'schedule' && (
              <div>
                <label className="block text-sm text-on-surface-variant mb-2 uppercase tracking-widest">Fecha programada</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-primary focus:outline-none focus:border-primary"
                  required
                  disabled={sending}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!subject || !content}
              className="px-6 py-3 rounded-full border border-outline text-primary font-medium text-body-sm hover:bg-surface-container transition-colors disabled:opacity-40"
            >
              Vista previa
            </button>
            <button
              type="submit"
              disabled={sending || !subject || !content || (sendMode === 'schedule' && !scheduledAt)}
              className="bg-primary text-background font-label-md px-8 py-3 tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50 rounded-full"
            >
              {sending ? 'ENVIANDO...' : sendMode === 'schedule' ? 'PROGRAMAR' : `ENVIAR A ${stats.activeSubscribers} SUSCRIPTORES`}
            </button>
          </div>

          {sendResult && (
            <div className={`p-4 rounded ${sendResult.includes('Error') ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
              <p className={`font-body-sm ${sendResult.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{sendResult}</p>
            </div>
          )}
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <div className="fixed inset-0 bg-black/70" />
          <div className="relative bg-surface-container rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-surface-container p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-headline-md font-bold text-primary">Vista previa</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-full hover:bg-white/10">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {/* Campaign History */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-headline-md mb-6">Historial de Campañas</h2>
        {loading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-on-surface-variant">No hay campañas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-on-surface-variant text-sm uppercase tracking-widest border-b border-white/10">
                  <th className="pb-3 font-label-md">Asunto</th>
                  <th className="pb-3 font-label-md">Estado</th>
                  <th className="pb-3 font-label-md">Segmento</th>
                  <th className="pb-3 font-label-md">Enviados</th>
                  <th className="pb-3 font-label-md">Errores</th>
                  <th className="pb-3 font-label-md">Fecha</th>
                  <th className="pb-3 font-label-md"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-primary font-medium">{c.subject}</td>
                    <td className="py-3">
                      <span className={`text-label-sm px-2 py-1 rounded-full ${
                        c.status === 'sent' ? 'bg-green-900/40 text-green-400' :
                        c.status === 'scheduled' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-surface-high text-on-surface-variant'
                      }`}>
                        {c.status === 'sent' ? 'Enviado' : c.status === 'scheduled' ? 'Programado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="py-3 text-on-surface-variant">{c.segment}</td>
                    <td className="py-3 text-on-surface-variant">{c.sentCount}/{c.recipientsCount}</td>
                    <td className="py-3 text-on-surface-variant">{c.failedCount}</td>
                    <td className="py-3 text-on-surface-variant">
                      {new Date(c.sentAt || c.scheduledAt || c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(c._id)}
                          className="text-primary text-body-sm hover:underline"
                        >
                          Enviar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  <th className="pb-3 font-label-md">Estado</th>
                  <th className="pb-3 font-label-md">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-primary">{sub.email}</td>
                    <td className="py-3 text-on-surface-variant">{sub.source}</td>
                    <td className="py-3">
                      <span className={`text-label-sm ${sub.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {sub.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
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