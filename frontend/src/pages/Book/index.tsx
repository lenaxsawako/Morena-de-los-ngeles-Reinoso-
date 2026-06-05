import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { booksService, type BookDetail, type SeriesInfo, type Recommendation } from '../../services/books';
import { favoritesService } from '../../services/favorites';
import { authService } from '../../services/auth';
import { paymentsService } from '../../services/payments';
import { reviewsService, type ReviewItem } from '../../services/reviews';
import SEO from '../../components/SEO';

const SITE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://lbb.app';

export default function Book() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewFocused, setReviewFocused] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewMenuOpen, setReviewMenuOpen] = useState<string | null>(null);

  const userId = authService.getUserId();
  const userReview = reviews.find(r => r.userId === userId);

  // Pre-fill form when modal opens if user already has a review
  useEffect(() => {
    if (reviewsModalOpen && userReview) {
      setReviewRating(userReview.rating);
      setReviewComment(userReview.comment || '');
      setEditingReview(true);
      setReviewFocused(true);
    } else if (!reviewsModalOpen) {
      setEditingReview(false);
      setReviewFocused(false);
    }
  }, [reviewsModalOpen]);

  useEffect(() => {
    if (!id) {
      setError('ID no proporcionado');
      setLoading(false);
      return;
    }

    booksService.getBookById(id).then(data => {
      if (data) {
        setBook(data);
      } else {
        setError('Libro no encontrado');
      }
    }).catch(() => {
      setError('Error al cargar el libro');
    }).finally(() => {
      setLoading(false);
    });

    booksService.getSeries(id).then(s => setSeries(s)).catch(() => {});
    booksService.getRecommendations(id).then(r => setRecommendations(r)).catch(() => {});
    if (authService.isAuthenticated()) {
      favoritesService.checkFavorite(id).then(setIsFav).catch(() => {});
      paymentsService.getPurchases().then(purchases => {
        const purchased = purchases.some(p =>
          (p.status === 'paid' || p.status === 'completed') &&
          (typeof p.bookRef === 'string' ? p.bookRef === id : p.bookRef?._id === id)
        );
        setHasPurchased(purchased);
      }).catch(() => {});
    }
    reviewsService.getBookReviews(id).then(data => {
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setReviewCount(data.count);
    }).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center">
        <p className="text-on-surface-variant">Cargando...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-error">{error || 'Libro no encontrado'}</p>
          <button
            onClick={() => navigate('/catalog')}
            className="bg-primary text-on-primary px-6 py-3 rounded-full font-medium"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  const price = book.priceCents > 0 ? `$${(book.priceCents / 100).toFixed(2)} ${book.currency}` : 'Gratis';
  const authorName = book.author?.name || 'Autor';
  const pageUrl = `${SITE_URL}/book/book/${book._id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setShareOpen(false);
  };

  const handleShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: book.title,
          text: book.description.slice(0, 200),
          url: pageUrl,
        });
      } catch {}
    } else {
      setShareOpen(true);
    }
  };

  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    description: book.description,
    url: pageUrl,
    image: book.coverUrl,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    numberOfPages: book.totalPages,
    ...(book.priceCents > 0 ? {
      offers: {
        '@type': 'Offer',
        price: (book.priceCents / 100).toFixed(2),
        priceCurrency: book.currency,
        availability: 'https://schema.org/InStock',
      },
    } : {}),
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <SEO
        title={book.title}
        description={book.description.slice(0, 160)}
        image={book.coverUrl}
        url={pageUrl}
        type="book"
        jsonLd={bookSchema}
      />
      <div className="border-b border-outline-variant px-6 py-4 sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="material-symbols-outlined notranslate" translate="no">arrow_back</span>
          <span className="text-body-md font-medium">Volver</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 mb-12">
          {/* Cover */}
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden shadow-lg">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-auto aspect-[3/4] object-cover"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-surface-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">book</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-headline-lg font-bold text-accent-gold">{avgRating.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`material-symbols-outlined text-lg ${i < Math.round(avgRating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                    star
                  </span>
                ))}
              </div>
              <span className="text-label-md text-on-surface-variant">({reviewCount})</span>
            </div>
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            <div>
              {book.category && (
                <p className="text-label-md text-on-surface-variant font-medium uppercase mb-2">
                  {book.category.name}
                </p>
              )}
              <h1 className="text-display-lg font-bold mb-2">{book.title}</h1>
              {book.subtitle && (
                <p className="text-headline-md text-on-surface-variant">{book.subtitle}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="space-y-1">
                <p className="text-label-md text-on-surface-variant">Páginas</p>
                <p className="text-headline-md font-medium">{book.totalPages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-label-md text-on-surface-variant">Páginas Preview</p>
                <p className="text-headline-md font-medium">{book.previewPages}</p>
              </div>
              {(book.priceCents > 0) && (
                <div className="space-y-1">
                  <p className="text-label-md text-on-surface-variant">Precio</p>
                  <p className="text-headline-md font-medium">{price}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate(`/chapter/${book._id}`)}
                className="flex-1 bg-primary text-on-primary py-3 rounded-full font-medium text-body-md hover:shadow-lg transition-shadow"
              >
                Leer Online
              </button>
              {book.priceCents > 0 && !hasPurchased && (
                <button
                  onClick={() => navigate(`/checkout/${id}`)}
                  className="flex-1 border border-outline text-primary py-3 rounded-full font-medium text-body-md hover:bg-surface-container transition-colors"
                >
                  Comprar ({price})
                </button>
              )}
              {authService.isAuthenticated() && (
                <button
                  onClick={() => {
                    favoritesService.toggleFavorite(book._id, isFav).then((ok) => ok && setIsFav(!isFav));
                  }}
                  className="p-3 rounded-full border border-outline text-primary hover:bg-surface-container transition-colors"
                  title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: isFav ? '#f87171' : undefined,
                      fontVariationSettings: isFav ? "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" : undefined,
                    }}
                  >
                    favorite
                  </span>
                </button>
              )}
              <button
                onClick={handleShare}
                className="p-3 rounded-full border border-outline text-primary hover:bg-surface-container transition-colors"
                title="Compartir"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="max-w-3xl space-y-4">
            <h2 className="text-headline-lg font-bold">Sinopsis</h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              {book.description}
            </p>
          </div>
        )}

        {/* Author Notes */}
        {book.authorNotes && (
          <div className="max-w-3xl mt-16 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-headline-lg font-bold">Sobre esta obra</h2>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map(i => (
                  <span key={i} className="material-symbols-outlined text-accent-gold text-xl">
                    star
                  </span>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl border border-white/10 bg-surface-container">
              <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
                El autor explica
              </p>
              <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                {book.authorNotes}
              </p>
            </div>
          </div>
        )}

        {/* Series / Sequel / Prequel */}
        {series && (series.prequel || series.sequels.length > 0) && (
          <div className="max-w-3xl mt-16 space-y-6">
            <h2 className="text-headline-lg font-bold">Serie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {series.prequel && (
                <Link
                  to={`/book/${series.prequel._id}`}
                  className="flex gap-4 p-4 rounded-xl border border-white/10 hover:border-primary/40 transition-colors bg-surface-container group"
                >
                  <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-surface-high">
                    {series.prequel.coverUrl ? (
                      <img src={series.prequel.coverUrl} alt={series.prequel.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/30">book</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-md text-accent-gold uppercase tracking-widest mb-1">Precuela</p>
                    <p className="text-body-md text-primary font-medium truncate group-hover:text-accent-gold transition-colors">{series.prequel.title}</p>
                    {series.prequel.subtitle && (
                      <p className="text-body-sm text-on-surface-variant truncate">{series.prequel.subtitle}</p>
                    )}
                  </div>
                </Link>
              )}
              {series.sequels.map(seq => (
                <Link
                  key={seq._id}
                  to={`/book/${seq._id}`}
                  className="flex gap-4 p-4 rounded-xl border border-white/10 hover:border-primary/40 transition-colors bg-surface-container group"
                >
                  <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-surface-high">
                    {seq.coverUrl ? (
                      <img src={seq.coverUrl} alt={seq.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/30">book</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-md text-accent-gold uppercase tracking-widest mb-1">Secuela</p>
                    <p className="text-body-md text-primary font-medium truncate group-hover:text-accent-gold transition-colors">{seq.title}</p>
                    {seq.subtitle && (
                      <p className="text-body-sm text-on-surface-variant truncate">{seq.subtitle}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Opinions Preview (YouTube-style) */}
        <div className="max-w-3xl mt-16 space-y-4">
          <h3 className="text-headline-md font-bold">Opiniones</h3>
          {reviews.length > 0 ? (
            <>
              <div className="p-4 rounded-xl border border-white/10 bg-surface-container space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-primary">{reviews[0].userName}</span>
                  {reviews[0].verified && (
                    <span className="flex items-center gap-0.5 text-label-xs text-green-400">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Compra verificada
                    </span>
                  )}
                  <span className="text-label-sm text-on-surface-variant">
                    {new Date(reviews[0].createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`material-symbols-outlined text-sm ${i < reviews[0].rating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                      star
                    </span>
                  ))}
                </div>
                {reviews[0].comment && (
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{reviews[0].comment}</p>
                )}
              </div>
              <button
                onClick={() => setReviewsModalOpen(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-body-md font-medium"
              >
                Ver todas las opiniones ({reviewCount})
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setReviewsModalOpen(true)}
              className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Todavía no hay opiniones. <span className="text-primary underline">Hacé click para dejar una</span>
            </button>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="max-w-4xl mt-16 space-y-6">
            <h2 className="text-headline-lg font-bold">También te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recommendations.map(rec => (
                <Link
                  key={rec._id}
                  to={`/book/${rec._id}`}
                  className="group space-y-3"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-high">
                    {rec.coverUrl ? (
                      <img src={rec.coverUrl} alt={rec.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">book</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-primary truncate">{rec.title}</p>
                    {rec.subtitle && (
                      <p className="text-body-sm text-on-surface-variant truncate">{rec.subtitle}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {rec.avgRating > 0 ? (
                        <>
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(rec.avgRating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                              star
                            </span>
                          ))}
                          <span className="text-label-sm text-on-surface-variant ml-1">({rec.reviewCount})</span>
                        </>
                      ) : null}
                    </div>
                    <p className="text-body-sm text-primary mt-1">
                      {rec.priceCents > 0 ? `$${(rec.priceCents / 100).toFixed(2)}` : 'Gratis'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews Modal (YouTube-style) */}
      {reviewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setReviewsModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative bg-surface-container rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[75vh] flex flex-col shadow-2xl"
            style={{ animation: 'slideUp 0.3s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 sm:hidden" />

            {/* Header */}
            <div className="px-6 pt-4 pb-2 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-headline-md font-bold text-primary">Opiniones</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-headline-sm font-bold text-accent-gold">{avgRating.toFixed(1)}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(avgRating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-label-sm text-on-surface-variant">{reviewCount}</span>
                </div>
              </div>
              <button
                onClick={() => setReviewsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Scrollable Reviews List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[...reviews].sort((a, b) => {
                if (a.userId === userId) return -1;
                if (b.userId === userId) return 1;
                return 0;
              }).map(review => {
                const isOwn = review.userId === userId;
                return (
                <div key={review.id} className="p-4 rounded-xl border border-white/10 bg-surface-high space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-primary">
                        {isOwn ? 'Tu opinión' : review.userName}
                      </span>
                      {review.verified && (
                        <span className="flex items-center gap-0.5 text-label-xs text-green-400">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Compra verificada
                        </span>
                      )}
                      <span className="text-label-sm text-on-surface-variant">
                        {new Date(review.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                      </span>
                    </div>
                    {isOwn && (
                      <div className="relative">
                        <button
                          onClick={() => setReviewMenuOpen(reviewMenuOpen === review.id ? null : review.id)}
                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">more_vert</span>
                        </button>
                        {reviewMenuOpen === review.id && (
                          <div className="absolute right-0 top-8 z-10 bg-surface-container border border-white/10 rounded-xl shadow-xl min-w-[120px] overflow-hidden">
                            <button
                              onClick={() => {
                                setReviewRating(review.rating);
                                setReviewComment(review.comment || '');
                                setEditingReview(true);
                                setReviewFocused(true);
                                setReviewMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-body-sm text-primary hover:bg-white/5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                        star
                      </span>
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-body-md text-on-surface-variant leading-relaxed">{review.comment}</p>
                  )}
                </div>
              )})}
            </div>

            {/* Rating Form (YouTube-style) */}
            <div className="border-t border-white/10 p-4">
              {authService.isAuthenticated() && hasPurchased ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => { setReviewRating(n); setReviewFocused(true); }}>
                          <span className={`material-symbols-outlined text-2xl transition-colors ${n <= reviewRating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                            star
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 relative">
                      <input
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        onFocus={() => setReviewFocused(true)}
                        placeholder="Escribí un comentario..."
                        className="w-full bg-transparent border-b border-white/20 pb-1 text-body-md text-on-background outline-none focus:border-primary transition-colors"
                      />
                      {(editingReview || reviewFocused || reviewComment) && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={async () => {
                              setSubmittingReview(true);
                              setReviewError('');
                              try {
                                await reviewsService.upsert(id!, reviewRating, reviewComment || undefined);
                                setReviewRating(5);
                                setReviewComment('');
                                setReviewFocused(false);
                                setEditingReview(false);
                                const data = await reviewsService.getBookReviews(id!);
                                setReviews(data.reviews);
                                setAvgRating(data.avgRating);
                                setReviewCount(data.count);
                              } catch (err: any) {
                                setReviewError(err.message);
                              } finally {
                                setSubmittingReview(false);
                              }
                            }}
                            disabled={submittingReview}
                            className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-md font-medium disabled:opacity-40 transition-opacity"
                          >
                            {submittingReview ? 'Enviando...' : editingReview ? 'Guardar' : 'Enviar'}
                          </button>
                          <button
                            onClick={() => {
                              if (editingReview && userReview) {
                                setReviewRating(userReview.rating);
                                setReviewComment(userReview.comment || '');
                                setEditingReview(false);
                                setReviewFocused(false);
                              } else {
                                setReviewComment('');
                                setReviewRating(5);
                                setReviewFocused(false);
                              }
                            }}
                            className="px-4 py-1.5 rounded-full text-on-surface-variant text-label-md hover:text-on-background transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {reviewError && <p className="text-body-sm text-red-400">{reviewError}</p>}
                  {!reviewComment && !editingReview && (
                    <p className="text-label-sm text-on-surface-variant">Tu valoración aparecerá inmediatamente</p>
                  )}
                </div>
              ) : authService.isAuthenticated() && !hasPurchased ? (
                <p className="text-body-md text-on-surface-variant text-center">
                  <Link to={`/checkout/${id}`} className="text-primary underline">Comprá el libro</Link> para valorarlo
                </p>
              ) : (
                <p className="text-body-md text-on-surface-variant text-center">
                  <Link to="/login" className="text-primary underline">Iniciá sesión</Link> para valorar
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Popup */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShareOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative bg-surface-container rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 pb-8 shadow-2xl"
            style={{ animation: 'slideUp 0.3s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />
            <h3 className="text-headline-md font-bold text-primary mb-6 text-center">Compartir</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-2xl text-accent-gold">
                  {copied ? 'check' : 'link'}
                </span>
                <div>
                  <p className="text-body-md font-medium text-primary">{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</p>
                  <p className="text-body-sm text-on-surface-variant">{copied ? '' : 'Compartí el enlace del libro'}</p>
                </div>
              </button>
              {'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-2xl text-accent-gold">share</span>
                  <div>
                    <p className="text-body-md font-medium text-primary">Compartir</p>
                    <p className="text-body-sm text-on-surface-variant">Usá la hoja de compartir de tu dispositivo</p>
                  </div>
                </button>
              )}
            </div>
            <button
              onClick={() => setShareOpen(false)}
              className="w-full mt-4 py-3 rounded-xl border border-white/10 text-primary font-medium hover:bg-white/5 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
