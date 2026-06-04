import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { booksService, type BookDetail, type SeriesInfo, type Recommendation } from '../../services/books';
import { favoritesService } from '../../services/favorites';
import { authService } from '../../services/auth';
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
    }
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
  const pageUrl = `${SITE_URL}/book/${book._id}`;
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setShareOpen(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
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
              {book.priceCents > 0 && (
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
                    favoritesService.toggleFavorite(book._id, isFav).then(() => setIsFav(!isFav));
                  }}
                  className="p-3 rounded-full border border-outline text-primary hover:bg-surface-container transition-colors"
                  title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                  <span className={`material-symbols-outlined ${isFav ? 'text-red-400' : ''}`}>
                    {isFav ? 'favorite' : 'favorite_outline'}
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
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`material-symbols-outlined text-sm ${i < rec.relevanceScore ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                          {i < rec.relevanceScore ? 'star' : 'star'}
                        </span>
                      ))}
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
              {navigator.share && (
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
