import { useState, useEffect } from 'react';
import { reviewsService, type AdminReviewItem } from '../../../services/reviews';

type StatusFilter = '' | 'pending' | 'approved' | 'rejected';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    const data = await reviewsService.getAdminReviews(page, 20, statusFilter || undefined);
    setReviews(data.items);
    setPages(data.pages);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [page, statusFilter]);

  const handleApprove = async (id: string) => {
    await reviewsService.approve(id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim() && rejectReason !== undefined) return;
    await reviewsService.reject(id, rejectReason || undefined);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    setRejectingId(null);
    setRejectReason('');
  };

  const filters: StatusFilter[] = ['', 'pending', 'approved', 'rejected'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-primary">Reseñas</h1>
        <p className="text-on-surface-variant text-body-md">Moderá las reseñas de los lectores</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
              statusFilter === f
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
            }`}
          >
            {f === '' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : 'Rechazadas'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Cargando...</p>
      ) : reviews.length === 0 ? (
        <p className="text-on-surface-variant">No hay reseñas</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 rounded-xl border border-white/10 bg-surface-container space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-body-md font-medium text-primary truncate">{review.bookTitle}</p>
                  <p className="text-body-sm text-on-surface-variant">{review.userName}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`text-label-sm px-2 py-1 rounded-full ${
                  review.status === 'approved' ? 'bg-green-900/40 text-green-400' :
                  review.status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                  'bg-yellow-900/40 text-yellow-400'
                }`}>
                  {review.status}
                </span>
              </div>
              {review.comment && <p className="text-body-md text-on-surface-variant leading-relaxed">{review.comment}</p>}
              {review.rejectionReason && (
                <p className="text-body-sm text-red-400">Motivo: {review.rejectionReason}</p>
              )}
              <p className="text-label-sm text-on-surface-variant">
                {new Date(review.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>

              {review.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="px-4 py-2 rounded-full bg-green-900/40 text-green-400 text-body-sm font-medium hover:bg-green-900/60 transition-colors"
                  >
                    Aprobar
                  </button>
                  {rejectingId === review.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Motivo (opcional)"
                        className="flex-1 px-3 py-2 rounded-full bg-surface-high text-on-background text-body-sm outline-none"
                      />
                      <button
                        onClick={() => handleReject(review.id)}
                        className="px-4 py-2 rounded-full bg-red-900/40 text-red-400 text-body-sm font-medium hover:bg-red-900/60 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-4 py-2 rounded-full text-on-surface-variant text-body-sm hover:bg-surface-high transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRejectingId(review.id)}
                      className="px-4 py-2 rounded-full bg-red-900/40 text-red-400 text-body-sm font-medium hover:bg-red-900/60 transition-colors"
                    >
                      Rechazar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-full text-body-sm font-medium transition-colors ${
                    page === p ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}