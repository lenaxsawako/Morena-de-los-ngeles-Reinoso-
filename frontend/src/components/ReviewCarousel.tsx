import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { reviewsService, type ReviewItem } from '../services/reviews';

interface ReviewCarouselProps {
  reviews: ReviewItem[];
  currentUserId: string | null;
  hasPurchase: boolean;
  bookId: string;
  avgRating: number;
  reviewCount: number;
  onReviewSubmit: (review: ReviewItem) => void;
  onReviewUpdate: (review: ReviewItem) => void;
}

export default function ReviewCarousel({
  reviews,
  currentUserId,
  hasPurchase,
  bookId,
  avgRating,
  reviewCount,
  onReviewSubmit,
  onReviewUpdate,
}: ReviewCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editState, setEditState] = useState<Record<string, { editing: boolean; editText: string; editRating: number }>>({});
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const userReview = reviews.find(r => r.userId === currentUserId);
  const sortedReviews = [...reviews].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  const showFormCard = !userReview;
  const totalCards = sortedReviews.length + (showFormCard ? 1 : 0);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -340 : 340;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const updateActiveIndex = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    setActiveIndex(Math.max(0, Math.min(idx, totalCards - 1)));
  };

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
      onReviewUpdate({ ...review, rating: state.editRating, comment: state.editText });
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
      onReviewSubmit(result);
      setFormRating(5);
      setFormComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-headline-md font-bold">Opiniones</h3>
        <span className="text-headline-sm font-bold text-accent-gold">{avgRating.toFixed(1)}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(avgRating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
              star
            </span>
          ))}
        </div>
        <span className="text-label-sm text-on-surface-variant">({reviewCount})</span>
      </div>

      <div className="relative group">
        {/* Arrows (desktop only) */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-surface-container border border-white/10 items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          disabled={activeIndex === 0}
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-surface-container border border-white/10 items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          disabled={activeIndex >= totalCards - 1}
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>

        {/* Carousel Track */}
        <div
          ref={scrollRef}
          onScroll={updateActiveIndex}
          className="flex gap-4 overflow-x-auto scroll-smooth"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <style>{`
            .review-carousel::-webkit-scrollbar { display: none; }
          `}</style>

          {sortedReviews.map(review => {
            const isOwn = review.userId === currentUserId;
            const editing = editState[review.id]?.editing;
            const editText = editState[review.id]?.editText ?? review.comment ?? '';
            const editRating = editState[review.id]?.editRating ?? review.rating;

            return (
              <div
                key={review.id}
                className="flex-shrink-0 w-[80vw] md:w-[340px] p-4 rounded-xl border border-white/10 bg-surface-container space-y-3"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-body-sm font-medium text-primary truncate">
                      {isOwn ? 'Tu opinión' : review.userName}
                    </span>
                    {review.verified && (
                      <span className="flex items-center gap-0.5 text-label-xs text-green-400 shrink-0">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Compra verificada
                      </span>
                    )}
                  </div>
                  {isOwn && !editing && (
                    <button
                      onClick={() => startEdit(review)}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
                    </button>
                  )}
                </div>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!editing}
                      onClick={() => {
                        if (!editing) return;
                        setEditState(prev => ({
                          ...prev,
                          [review.id]: { ...prev[review.id], editRating: i + 1 },
                        }));
                      }}
                    >
                      <span className={`material-symbols-outlined text-sm transition-colors ${i < editRating ? 'text-accent-gold' : 'text-on-surface-variant/30'} ${editing ? 'cursor-pointer hover:scale-110' : ''}`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>

                {/* Comment */}
                {editing ? (
                  <textarea
                    value={editText}
                    onChange={e => setEditState(prev => ({
                      ...prev,
                      [review.id]: { ...prev[review.id], editText: e.target.value },
                    }))}
                    className="w-full bg-surface-high rounded-lg p-2 text-body-sm text-on-surface-variant outline-none border border-white/10 focus:border-primary resize-none"
                    rows={3}
                  />
                ) : (
                  review.comment && (
                    <p className="text-body-sm text-on-surface-variant leading-relaxed line-clamp-4">{review.comment}</p>
                  )
                )}

                {/* Edit Actions */}
                {editing && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(review)}
                      disabled={submitting}
                      className="px-3 py-1 rounded-full bg-primary text-on-primary text-label-xs font-medium disabled:opacity-40 transition-opacity"
                    >
                      {submitting ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => cancelEdit(review.id)}
                      className="px-3 py-1 rounded-full text-on-surface-variant text-label-xs hover:text-on-background transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Date */}
                <p className="text-label-xs text-on-surface-variant">
                  {new Date(review.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                </p>
              </div>
            );
          })}

          {/* Form Card */}
          {showFormCard && (
            <div
              className="flex-shrink-0 w-[80vw] md:w-[340px] p-4 rounded-xl border border-dashed border-accent-gold/40 bg-surface-container space-y-3"
              style={{ scrollSnapAlign: 'start' }}
            >
              {currentUserId && hasPurchase ? (
                <>
                  <p className="text-body-sm font-medium text-accent-gold">Dejá tu opinión</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setFormRating(n)}>
                        <span className={`material-symbols-outlined text-xl transition-colors ${n <= formRating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                          star
                        </span>
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
                  <button
                    onClick={submitNewReview}
                    disabled={submitting}
                    className="w-full py-2 rounded-full bg-primary text-on-primary text-label-md font-medium disabled:opacity-40 transition-opacity"
                  >
                    {submitting ? 'Enviando...' : 'Publicar'}
                  </button>
                  {error && <p className="text-body-sm text-red-400">{error}</p>}
                </>
              ) : currentUserId && !hasPurchase ? (
                <>
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mx-auto block text-center">lock</span>
                  <p className="text-body-sm text-on-surface-variant text-center">
                    <Link to={`/checkout/${bookId}`} className="text-primary underline">Comprá el libro</Link> para dejar tu opinión
                  </p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mx-auto block text-center">lock</span>
                  <p className="text-body-sm text-on-surface-variant text-center">
                    <Link to="/login" className="text-primary underline">Iniciá sesión</Link> para dejar tu opinión
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {totalCards > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalCards }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!scrollRef.current) return;
                const cardEl = scrollRef.current.children[i] as HTMLElement;
                if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', inline: 'start' });
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-primary w-4' : 'bg-on-surface-variant/30 hover:bg-on-surface-variant/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
