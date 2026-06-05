import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
import { booksService, type BookDetail } from '../../services/books';
import { reviewsService, type ReviewItem } from '../../services/reviews';
import { guestReadingService } from '../../services/guestReading';
import { readingService } from '../../services/reading';
import { authService } from '../../services/auth';
import { paymentsService } from '../../services/payments';
import Paywall from '../../components/Paywall';
import ShareButton from '../../components/ShareButton';
import ReviewCarousel from '../../components/ReviewCarousel';
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
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const isBookmarked = bookmarks.some(b => b.page === currentPage + 1);
  const userId = authService.getUserId();

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

              {/* Page Jump Input */}
              {!isFullscreen && totalPages > 1 && (
                <div className="reader-page-jumper">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage + 1}
                    onChange={e => {
                      const p = Math.max(1, Math.min(totalPages, Number(e.target.value) || 1));
                      setCurrentPage(p - 1);
                      saveProgress(p - 1);
                    }}
                    className="reader-page-input"
                    aria-label="Ir a página"
                  />
                  <span className="reader-page-jumper-total">/ {totalPages}</span>
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

      {/* Floating Actions Group */}
      <div className="reader-actions">
        {/* Bookmark Button */}
        {!isBlocked && (
          <button 
            onClick={toggleBookmark}
            className={`reader-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
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

        {/* Fullscreen Button */}
        {!isBlocked && (
          <button 
            onClick={toggleFullscreen}
            className="reader-action-btn"
            title="Pantalla completa (F)"
          >
            <span className="material-symbols-outlined">fullscreen</span>
          </button>
        )}
      </div>

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

      {/* Reviews Carousel */}
      {!isFullscreen && (
        <div className="reader-reviews">
          <div className="reader-reviews-inner">
            <ReviewCarousel
              reviews={reviews}
              currentUserId={userId}
              hasPurchase={isPurchased}
              bookId={bookId!}
              avgRating={avgRating}
              reviewCount={reviewCount}
              onReviewSubmit={(review) => {
                setReviews(prev => [review, ...prev]);
                setAvgRating(prev => {
                  const total = prev * reviewCount + review.rating;
                  return total / (reviewCount + 1);
                });
                setReviewCount(prev => prev + 1);
              }}
              onReviewUpdate={(updated) => {
                setReviews(prev => {
                  const next = prev.map(r => r.id === updated.id ? updated : r);
                  const total = next.reduce((sum, r) => sum + r.rating, 0);
                  setAvgRating(next.length > 0 ? total / next.length : 0);
                  return next;
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}