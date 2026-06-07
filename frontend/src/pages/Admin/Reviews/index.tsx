import { useState, useEffect } from 'react';
import { reviewsService, type AdminReviewItem } from '../../../services/reviews';
import ConfirmModal from '../../../components/ConfirmModal';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    const data = await reviewsService.getAdminReviews(1, 200);
    setReviews(data.items);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, []);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    await reviewsService.deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const filtered = search
    ? reviews.filter(r =>
        r.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.userName.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-primary">Reseñas</h1>
        <p className="text-on-surface-variant text-body-md">Administrá las reseñas de los lectores</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por libro o usuario..."
        className="w-full max-w-md px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md outline-none focus:border-primary transition-colors"
      />

      {loading ? (
        <p className="text-on-surface-variant">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-on-surface-variant">{search ? 'Sin resultados' : 'No hay reseñas'}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
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
                <button
                  onClick={() => handleDelete(review.id)}
                  className="shrink-0 p-2 rounded-xl hover:bg-white/5 text-on-surface-variant hover:text-red-400 transition-colors"
                  title="Eliminar reseña"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              {review.comment && <p className="text-body-md text-on-surface-variant leading-relaxed">{review.comment}</p>}
              <p className="text-label-sm text-on-surface-variant">
                {new Date(review.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>
            </div>
          ))}
        </div>
      )}
      {confirmDeleteId && (
        <ConfirmModal
          message="¿Eliminar esta reseña?"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
