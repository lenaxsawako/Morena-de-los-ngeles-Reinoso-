import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
import { booksService, type BookDetail } from '../../services/books';
import { guestReadingService } from '../../services/guestReading';
import { readingService } from '../../services/reading';
import { authService } from '../../services/auth';
import { paymentsService } from '../../services/payments';
import Paywall from '../../components/Paywall';
import './chapter.css';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export default function Chapter() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [bookData, setBookData] = useState<BookDetail | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Páginas 0-3 son gratis (1-4 en numeración humana)
  // Páginas 4-5 (5-6) están bloqueadas
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

  // Cargar progreso guardado al montar
  useEffect(() => {
    if (!bookId) return;

    // Siempre cargar desde localStorage (guest o backup)
    const saved = guestReadingService.getProgress(bookId);
    if (saved) {
      setCurrentPage(saved.currentPage);
    }

    // Si está autenticado, cargar desde API (más actualizado)
    if (authService.isAuthenticated()) {
      readingService.getProgress(bookId).then(apiProgress => {
        if (apiProgress && apiProgress.currentPage > (saved?.currentPage ?? 0)) {
          setCurrentPage(apiProgress.currentPage);
          // Actualizar localStorage con el dato más reciente
          const total = totalPages || 1;
          guestReadingService.saveProgress(bookId, apiProgress.currentPage, Math.round((apiProgress.currentPage / total) * 100));
        }
      }).catch(() => {});
    }
  }, [bookId]);

  // Cargar datos del libro para el paywall
  useEffect(() => {
    if (!bookId) return;
    booksService.getBookById(bookId).then(data => {
      if (data) setBookData(data);
    });
  }, [bookId]);

  // Guardar progreso en localStorage + API
  const saveProgress = useCallback((page: number) => {
    if (!bookId || totalPages === 0) return;
    const safePage = Math.min(page, totalPages - 1);
    const progressPct = Math.round(((safePage + 1) / totalPages) * 100);
    guestReadingService.saveProgress(bookId, safePage, progressPct);
    if (authService.isAuthenticated()) {
      readingService.updateProgress(bookId, safePage + 1).catch(() => {});
    }
  }, [bookId, totalPages]);

  // Al cargar el PDF, corregir currentPage si excede totalPages y guardar
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

  // Cargar PDF solo si no está bloqueado
  useEffect(() => {
    const loadPdf = async () => {
      // No cargar si está bloqueado
      if (isBlocked) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Obtener URL del PDF desde el servicio
        const pdfUrl = booksService.getPdfUrl(bookId || '1');
        
        // Cargar el PDF
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        setTotalPages(pdf.numPages);

        // Renderizar cada página a imagen
        const images: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          images.push(canvas.toDataURL('image/png'));
        }
        
        setPageImages(images);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando el PDF');
        console.error('Error loading PDF:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [bookId, isBlocked]);

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
          {loading && (
            <div className="reader-state-container">
              <div className="reader-loader">
                <div className="loader-spinner" />
                <p>Cargando libro...</p>
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
          {!loading && !error && pageImages.length > 0 && (
            <div 
              className="reader-page-container"
              ref={pageContainerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Page Image */}
              <div className="reader-page-wrapper" onClick={toggleFullscreen}>
                <img 
                  src={pageImages[currentPage]} 
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
          {!loading && !error && pageImages.length === 0 && (
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
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`reader-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          title={isBookmarked ? 'Remover marcador' : 'Agregar marcador'}
        >
          <span className="material-symbols-outlined">
            {isBookmarked ? 'bookmark_added' : 'bookmark_add'}
          </span>
        </button>
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
    </div>
  );
}