import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reviewsService, type ReviewItem } from '../services/reviews';

interface ReviewModalProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
  hasPurchase: boolean;
}

const PAGE_SIZE = 10;

export default function ReviewModal({ bookId, isOpen, onClose, currentUserId, hasPurchase }: ReviewModalProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [editState, setEditState] = useState<Record<string, { editing: boolean; editText: string; editRating: number }>>({});
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const userReview = reviews.find(r => r.userId === currentUserId);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await reviewsService.getBookReviews(bookId, p, PAGE_SIZE);
      if (p === 1) {
        setReviews(data.reviews);
        setAvgRating(data.avgRating);
        setTotalCount(data.count);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      setHasMore(p < (data.totalPages ?? 1));
    } catch {
      setError('Error al cargar opiniones');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setReviews([]);
    setHasMore(true);
    setEditState({});
    setFormRating(5);
    setFormComment('');
    setError('');
    fetchPage(1);
    scrollContainerRef.current?.scrollTo(0, 0);
  }, [isOpen, bookId, fetchPage]);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage);
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, loading, hasMore, page, fetchPage]);

  const startEdit = (review: ReviewItem) => {
    setEditState(prev => ({
      ...prev,
      [review.id]: { editing: true, editText: review.comment || '', editRating: review.rating },
    }));
  };

  const cancelEdit = (reviewId: string) => {
    setEditState(prev => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
  };

  const saveEdit = async (review: ReviewItem) => {
    const state = editState[review.id];
    if (!state) return;
    setSubmitting(true);
    setError('');
    try {
      await reviewsService.upsert(bookId, state.editRating, state.editText || undefined);
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, rating: state.editRating, comment: state.editText } : r));
      setEditState(prev => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewReview = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await reviewsService.upsert(bookId, formRating, formComment || undefined);
      setReviews(prev => [result, ...prev]);
      setTotalCount(prev => prev + 1);
      setAvgRating(prev => {
        const total = prev * totalCount + formRating;
        return total / (totalCount + 1);
      });
      setFormRating(5);
      setFormComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />

      {/* Mobile: full screen; Desktop: right drawer */}
      <div
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-0 md:right-0 md:bottom-0 w-full md:w-[460px] max-h-[90vh] md:max-h-none bg-surface-container md:rounded-l-2xl flex flex-col shadow-2xl"
        style={{ animation: 'reviewSlideUp 0.3s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-headline-md font-bold text-primary">Opiniones</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-headline-sm font-bold text-accent-gold">{avgRating.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(avgRating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                    star
                  </span>
                ))}
              </div>
              <span className="text-label-sm text-on-surface-variant">{totalCount}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Form section — fixed at top, does not scroll */}
        <div className="shrink-0 px-6 pt-4 pb-3 border-b border-white/5">
          {currentUserId ? (
            hasPurchase ? (
              userReview ? (
                <div className="p-3 rounded-xl border border-accent-gold/30 bg-surface-high space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-primary">Tu opinión</span>
                    {!editState[userReview.id]?.editing && (
                      <button onClick={() => startEdit(userReview)} className="p-1 rounded-full hover:bg-white/10 transition-colors" title="Editar">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
                      </button>
                    )}
                  </div>
                  {editState[userReview.id]?.editing ? (
                    <>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setEditState(prev => ({ ...prev, [userReview.id]: { ...prev[userReview.id], editRating: n } }))}>
                            <span className={`material-symbols-outlined text-lg ${n <= (editState[userReview.id]?.editRating ?? userReview.rating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>star</span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editState[userReview.id]?.editText ?? ''}
                        onChange={e => setEditState(prev => ({ ...prev, [userReview.id]: { ...prev[userReview.id], editText: e.target.value } }))}
                        className="w-full bg-surface-container rounded-lg p-2 text-body-sm text-on-surface-variant outline-none border border-white/10 focus:border-primary resize-none"
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdit(userReview)} disabled={submitting} className="px-3 py-1 rounded-full bg-primary text-on-primary text-label-xs font-medium disabled:opacity-40">Guardar</button>
                        <button onClick={() => cancelEdit(userReview.id)} className="px-3 py-1 rounded-full text-on-surface-variant text-label-xs hover:text-on-background transition-colors">Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`material-symbols-outlined text-sm ${i < userReview.rating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>star</span>
                        ))}
                      </div>
                      {userReview.comment && <p className="text-body-sm text-on-surface-variant leading-relaxed">{userReview.comment}</p>}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-body-sm font-medium text-accent-gold">Dejá tu opinión</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setFormRating(n)}>
                        <span className={`material-symbols-outlined text-xl transition-colors ${n <= formRating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>star</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={formComment}
                    onChange={e => setFormComment(e.target.value)}
                    placeholder="Escribí un comentario..."
                    className="w-full bg-surface-high rounded-lg p-2 text-body-sm text-on-surface-variant outline-none border border-white/10 focus:border-primary resize-none"
                    rows={3}
                  />
                  <button onClick={submitNewReview} disabled={submitting} className="w-full py-2 rounded-full bg-primary text-on-primary text-label-md font-medium disabled:opacity-40 transition-opacity">
                    {submitting ? 'Enviando...' : 'Publicar'}
                  </button>
                </div>
              )
            ) : (
              <p className="text-body-sm text-on-surface-variant text-center py-2">
                <Link to={`/checkout/${bookId}`} className="text-primary underline">Comprá el libro</Link> para dejar tu opinión
              </p>
            )
          ) : (
            <p className="text-body-sm text-on-surface-variant text-center py-2">
              <Link to="/login" className="text-primary underline">Iniciá sesión</Link> para dejar tu opinión
            </p>
          )}
          {error && <p className="text-body-sm text-red-400 mt-2">{error}</p>}
        </div>

        {/* Scrollable reviews list */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {reviews.map(review => {
              const isOwn = review.userId === currentUserId;
              if (isOwn && userReview) return null;
              return (
                <div key={review.id} className="p-3 rounded-xl border border-white/10 bg-surface-high space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-primary">{review.userName}</span>
                    <span className="text-label-xs text-on-surface-variant ml-auto">
                      {new Date(review.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>star</span>
                    ))}
                  </div>
                  {review.comment && <p className="text-body-sm text-on-surface-variant leading-relaxed">{review.comment}</p>}
                </div>
              );
            })}

            <div ref={sentinelRef} className="h-4" />

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 rounded-xl border border-white/5 bg-surface-high animate-pulse space-y-2">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="h-3 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            )}

            {!hasMore && reviews.length > 0 && (
              <p className="text-label-sm text-on-surface-variant text-center py-4">Todas las opiniones cargadas</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes reviewSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (min-width: 768px) {
          @keyframes reviewSlideUp {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        }
      `}</style>
    </div>
  );
}
