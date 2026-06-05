import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
import { Link } from 'react-router-dom';
import { booksService, type BookDetail } from '../../services/books';
import { reviewsService, type ReviewItem } from '../../services/reviews';
import { guestReadingService } from '../../services/guestReading';
import { readingService } from '../../services/reading';
import { authService } from '../../services/auth';
import { paymentsService } from '../../services/payments';
import Paywall from '../../components/Paywall';
import ShareButton from '../../components/ShareButton';
import './chapter.css';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

const WINDOW_RADIUS = 1; // pages before/after current to preload

interface BookmarkItem {
  id: string;
  page: number;
  note?: string;
}

export default function Chapter() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [pageCache, setPageCache] = useState<Record<number, string>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [bookData, setBookData] = useState<BookDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewFocused, setReviewFocused] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewMenuOpen, setReviewMenuOpen] = useState<string | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const isBookmarked = bookmarks.some(b => b.page === currentPage + 1);
  const userId = authService.getUserId();
  const userReview = reviews.find(r => r.userId === userId);

  const FREE_PAGES = 4;
  const isBlocked = currentPage >= FREE_PAGES && !isPurchased;

  // Verificar si ya compró este capítulo al cargar
  useEffect(() => {
    async function syncPurchases() {
      if (!bookId) return;
      const purchasedBooks = JSON.parse(localStorage.getItem('purchasedBooks') || '[]');
      if (purchasedBooks.includes(bookId)) {
        setIsPurchased(true);
        return;
      }
      if (!authService.isAuthenticated()) return;
      try {
        const purchases = await paymentsService.getPurchases();
        const purchasedIds = purchases
          .filter((p) => p.status === 'paid' || p.status === 'completed')
          .map((p) => {
            if (typeof p.bookRef === 'string') return p.bookRef;
            return p.bookRef?._id || p.bookRef;
          })
          .filter((id): id is string => !!id);
        const merged = [...new Set([...purchasedBooks, ...purchasedIds])];
        localStorage.setItem('purchasedBooks', JSON.stringify(merged));
        if (purchasedIds.includes(bookId)) setIsPurchased(true);
      } catch {}
    }
    syncPurchases();
  }, [bookId]);

  // Cargar progreso guardado y marcadores al montar
  useEffect(() => {
    if (!bookId) return;
    const saved = guestReadingService.getProgress(bookId);
    if (saved) {
      setCurrentPage(saved.currentPage);
    }
    if (authService.isAuthenticated()) {
      readingService.getProgress(bookId).then(apiProgress => {
        if (apiProgress && apiProgress.currentPage > (saved?.currentPage ?? 0)) {
          setCurrentPage(apiProgress.currentPage);
          const total = totalPages || 1;
          guestReadingService.saveProgress(bookId, apiProgress.currentPage, Math.round((apiProgress.currentPage / total) * 100));
        }
      }).catch(() => {});

      readingService.getBookmarks(bookId).then(setBookmarks).catch(() => {});
    }
  }, [bookId]);

  // Cargar datos del libro para totalPages y paywall
  useEffect(() => {
    if (!bookId) return;
    booksService.getBookById(bookId).then(data => {
      if (data) {
        setBookData(data);
        setTotalPages(data.totalPages);
      }
    });
    reviewsService.getBookReviews(bookId).then(data => {
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setReviewCount(data.count);
    }).catch(() => {});
  }, [bookId]);

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

  // Guardar progreso
  const saveProgress = useCallback((page: number) => {
    if (!bookId || totalPages === 0) return;
    const safePage = Math.min(page, totalPages - 1);
    const progressPct = Math.round(((safePage + 1) / totalPages) * 100);
    guestReadingService.saveProgress(bookId, safePage, progressPct);
    if (authService.isAuthenticated()) {
      readingService.updateProgress(bookId, safePage + 1).catch(() => {});
    }
  }, [bookId, totalPages]);

  // Al conocer totalPages, corregir currentPage si excede
  useEffect(() => {
    if (totalPages > 0) {
      if (currentPage >= totalPages) {
        setCurrentPage(totalPages - 1);
      }
      if (currentPage > 0) {
        saveProgress(currentPage);
      }
    }
  }, [totalPages]);

  // Cargar páginas cercanas a currentPage
  useEffect(() => {
    if (!bookId || totalPages === 0) return;
    if (isBlocked) return;

    const pagesToLoad: number[] = [];
    for (let p = Math.max(0, currentPage - WINDOW_RADIUS); p <= Math.min(totalPages - 1, currentPage + WINDOW_RADIUS); p++) {
      if (!isPurchased && p >= FREE_PAGES) continue;
      if (pageCache[p] !== undefined) continue;
      pagesToLoad.push(p);
    }

    if (pagesToLoad.length === 0) {
      setLoading(false);
      return;
    }

    // Batch consecutive pages into a single range request
    pagesToLoad.sort((a, b) => a - b);
    const ranges: { start: number; pages: number[] }[] = [];
    let currentRange: { start: number; pages: number[] } | null = null;
    for (const p of pagesToLoad) {
      if (loadingPages.has(p)) continue;
      if (!currentRange || p !== currentRange.pages[currentRange.pages.length - 1] + 1) {
        currentRange = { start: p, pages: [p] };
        ranges.push(currentRange);
      } else {
        currentRange.pages.push(p);
      }
    }

    if (ranges.length > 0) setLoading(true);

    ranges.forEach(async (range) => {
      const start = range.pages[0] + 1;
      const end = range.pages[range.pages.length - 1] + 1;
      range.pages.forEach(p => setLoadingPages(prev => new Set(prev).add(p)));

      try {
        const buffer = await booksService.fetchPageRange(bookId, start, end);
        if (!buffer) return;

        const pdf = await pdfjsLib.getDocument(buffer).promise;
        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport, canvas }).promise;

          const pageIndex = range.pages[i];
          setPageCache(prev => ({ ...prev, [pageIndex]: canvas.toDataURL('image/png') }));
        }
      } catch (err) {
        console.error('Error loading page range:', err);
        setError(err instanceof Error ? err.message : 'Error cargando páginas');
      } finally {
        range.pages.forEach(p => {
          setLoadingPages(prev => {
            const next = new Set(prev);
            next.delete(p);
            return next;
          });
        });
        setLoading(false);
      }
    });
  }, [currentPage, bookId, totalPages, isPurchased, isBlocked]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') goToPreviousPage();
      if (e.key === 'ArrowRight' || e.key === 'd') goToNextPage();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen]);

  // Touch Swipe Support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left (next page)
    if (diff > 50) goToNextPage();
    // Swipe right (previous page)
    if (diff < -50) goToPreviousPage();

    setTouchStart(0);
  };

  const goToNextPage = () => {
    // Si la siguiente página está bloqueada, mostrar paywall modal
    if (currentPage + 1 >= FREE_PAGES && !isPurchased) {
      // Si estamos en fullscreen, salir primero
      if (isFullscreen) {
        document.exitFullscreen().then(() => {
          setShowPaywallModal(true);
        });
      } else {
        setShowPaywallModal(true);
      }
      return;
    }
    
    if (currentPage < totalPages - 1) {
      const next = currentPage + 1;
      setCurrentPage(next);
      saveProgress(next);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      saveProgress(prev);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await pageContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error al entrar a pantalla completa:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error al salir de pantalla completa:', err);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleBookmark = async () => {
    if (!bookId || !authService.isAuthenticated()) return;

    if (isBookmarked) {
      const existing = bookmarks.find(b => b.page === currentPage + 1);
      if (!existing) return;
      try {
        await readingService.deleteBookmark(existing.id);
        setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      } catch {}
    } else {
      try {
        const created = await readingService.createBookmark(bookId, currentPage + 1);
        if (created) {
          setBookmarks(prev => [...prev, { id: created.id, page: created.page, note: created.note }]);
        }
      } catch {}
    }
  };

  const handleBuy = () => {
    // Redirigir al checkout
    navigate(`/checkout/${bookId}`);
  };

  const progressPercent = totalPages > 0 ? (currentPage / (totalPages - 1)) * 100 : 0;

  return (
    <div className="reader-wrapper">
      {/* Progress Bar */}
      <div 
        className="reader-progress-bar" 
        style={{ width: `${progressPercent}%` }}
      />

      {/* Header with Back Button */}
      <div className="reader-header">
        <button 
          onClick={() => navigate(-1)}
          className="reader-back-button"
          title="Volver a la biblioteca"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Volver</span>
        </button>
      </div>

      {/* Paywall - Si el capítulo está bloqueado */}
      {isBlocked ? (
        <main className="reader-main">
          <div className="reader-state-container">
            <Paywall
              title={bookData?.title ? `Desbloquea ${bookData.title}` : 'Desbloquea el libro completo'}
              description="Accede al libro completo y continúa la lectura"
              price={bookData ? bookData.priceCents / 100 : 0}
              onBuy={handleBuy}
            />
          </div>
        </main>
      ) : (
        <main className={`reader-main ${isFullscreen ? 'fullscreen-active' : ''}`}>
          {/* Loading State */}
          {(loading || pageCache[currentPage] === undefined) && !error && (
            <div className="reader-state-container">
              <div className="reader-loader">
                <div className="loader-spinner" />
                <p>{loading ? 'Cargando libro...' : 'Cargando página...'}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="reader-state-container">
              <div className="reader-error">
                <span className="material-symbols-outlined">error_outline</span>
                <p>Error cargando el PDF</p>
                <p className="reader-error-detail">{error}</p>
              </div>
            </div>
          )}

          {/* Page Viewer */}
          {!error && pageCache[currentPage] !== undefined && (
            <div 
              className="reader-page-container"
              ref={pageContainerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Page Image */}
              <div className="reader-page-wrapper" onClick={toggleFullscreen}>
                <img 
                  src={pageCache[currentPage]} 
                  alt={`Página ${currentPage + 1}`}
                  className="reader-page-image"
                />
              </div>

              {/* Bottom Bar - Page Navigation */}
              {!isFullscreen && (
                <div className="reader-bottom-bar">
                  {/* Previous Button */}
                  <button 
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    className="reader-nav-btn reader-nav-prev"
                    title="Página anterior (←)"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>

                  {/* Page Counter */}
                  <div className="reader-page-info">
                    <span className="reader-page-current">{currentPage + 1}</span>
                    <span className="reader-page-divider">/</span>
                    <span className="reader-page-total">{totalPages}</span>
                  </div>

                  {/* Next Button */}
                  <button 
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="reader-nav-btn reader-nav-next"
                    title={currentPage + 1 >= FREE_PAGES && !isPurchased ? "Desbloquear capítulos" : "Próxima página (→)"}
                  >
                    <span className="material-symbols-outlined">
                      {currentPage + 1 >= FREE_PAGES && !isPurchased ? 'lock' : 'arrow_forward'}
                    </span>
                  </button>
                </div>
              )}

              {/* Progress Dots - Mobile */}
              {!isFullscreen && (
                <div className="reader-dots-container">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentPage(idx); saveProgress(idx); }}
                      className={`reader-dot ${currentPage === idx ? 'active' : ''}`}
                      title={`Ir a página ${idx + 1}`}
                      aria-label={`Página ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Fullscreen Controls Overlay */}
              {isFullscreen && (
                <div className="reader-fullscreen-controls">
                  <button 
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    className="reader-fullscreen-nav-btn"
                    title="Página anterior (←)"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>

                  <div className="reader-fullscreen-info">
                    <span>{currentPage + 1} / {totalPages}</span>
                    <button
                      onClick={toggleFullscreen}
                      className="reader-fullscreen-exit"
                      title="Salir de pantalla completa (F)"
                    >
                      <span className="material-symbols-outlined">fullscreen_exit</span>
                    </button>
                  </div>

                  <button 
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="reader-fullscreen-nav-btn"
                    title={currentPage + 1 >= FREE_PAGES && !isPurchased ? "Desbloquear capítulos" : "Próxima página (→)"}
                  >
                    <span className="material-symbols-outlined">
                      {currentPage + 1 >= FREE_PAGES && !isPurchased ? 'lock' : 'arrow_forward'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!error && pageCache[currentPage] === undefined && !loading && (
            <div className="reader-state-container">
              <div className="reader-empty">
                <span className="material-symbols-outlined">book</span>
                <p>No hay páginas disponibles</p>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Bookmark Button - Solo mostrar si no está bloqueado */}
      {!isBlocked && (
        <button 
          onClick={toggleBookmark}
          className={`reader-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          title={isBookmarked ? 'Remover marcador' : 'Agregar marcador'}
        >
          <span className="material-symbols-outlined">
            {isBookmarked ? 'bookmark_added' : 'bookmark_add'}
          </span>
        </button>
      )}

      {/* Share Button */}
      {!isBlocked && bookData && (
        <ShareButton
          title={bookData.title}
          currentPage={currentPage + 1}
          totalPages={totalPages}
          authorName={bookData.author?.name}
          bookUrl={bookId}
        />
      )}

      {/* Fullscreen Button - Solo mostrar si no está bloqueado */}
      {!isBlocked && (
        <button 
          onClick={toggleFullscreen}
          className="reader-fullscreen-btn"
          title="Pantalla completa (F)"
        >
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
      )}

      {/* Paywall Modal - Mostrar cuando intenta acceder a página bloqueada */}
      {showPaywallModal && (
        <div className="paywall-modal-overlay" onClick={() => setShowPaywallModal(false)}>
          <div className="paywall-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="paywall-modal-close"
              onClick={() => setShowPaywallModal(false)}
              title="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <Paywall
              title={bookData?.title ? `Desbloquea ${bookData.title}` : 'Desbloquea el libro completo'}
              description="Accede al libro completo y continúa la lectura"
              price={bookData ? bookData.priceCents / 100 : 0}
              onBuy={handleBuy}
            />
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {!isFullscreen && (
        <div className="reader-reviews">
          <div className="reader-reviews-inner">
            <h3 className="text-headline-md font-bold text-primary">Opiniones</h3>
            <div className="flex items-center gap-2 mb-4">
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
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-body-md font-medium mt-2"
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
        </div>
      )}

      {/* Reviews Modal */}
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

            {/* Reviews List */}
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

            {/* Rating Form */}
            <div className="border-t border-white/10 p-4">
              {authService.isAuthenticated() && isPurchased ? (
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
                                await reviewsService.upsert(bookId!, reviewRating, reviewComment || undefined);
                                setReviewRating(5);
                                setReviewComment('');
                                setReviewFocused(false);
                                setEditingReview(false);
                                const data = await reviewsService.getBookReviews(bookId!);
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
              ) : authService.isAuthenticated() && !isPurchased ? (
                <p className="text-body-md text-on-surface-variant text-center">
                  <Link to={`/checkout/${bookId}`} className="text-primary underline">Comprá el libro</Link> para valorarlo
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
    </div>
  );
}