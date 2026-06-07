import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService, type CatalogLanding, type BookItem, type RecommendedBook } from '../../services/catalog';
import { guestReadingService } from '../../services/guestReading';
import { paymentsService } from '../../services/payments';
import { authService } from '../../services/auth';
import { favoritesService } from '../../services/favorites';
import Modal from '../../components/Modal';
import SEO from '../../components/SEO';
import './catalog.css';

const CATEGORIES = ['TODOS', 'FANTASÍA', 'ROMANCE', 'CONTEMPORÁNEO'];

export default function Catalog() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data from API
  const [catalogLanding, setCatalogLanding] = useState<CatalogLanding | null>(null);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [pages, setPages] = useState(0);
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);

  // Purchased books (from API if authenticated)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  // Guest library books (from localStorage)
  const [guestLibraryIds, setGuestLibraryIds] = useState<Set<string>>(new Set());
  // Favorite books (from API if authenticated)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Modal state for library add feedback
  const [modalMsg, setModalMsg] = useState('');

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load catalog landing and categories on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const landingData = await catalogService.getCatalogLanding();
        setCatalogLanding(landingData);

        const recs = await catalogService.getRecommendations();
        setRecommendations(recs);

        if (authService.isAuthenticated()) {
          const purchases = await paymentsService.getPurchases().catch(() => []);
          const ids = new Set<string>(
            purchases
              .filter((p) => p.status === 'paid' || p.status === 'completed')
              .map((p) => (typeof p.bookRef === 'string' ? p.bookRef : p.bookRef?._id))
              .filter((id): id is string => !!id),
          );
          setPurchasedIds(ids);

          // Load favorite IDs
          const favIds = await favoritesService.getFavoriteIds().catch(() => []);
          setFavoriteIds(new Set(favIds));
        }

        // Load guest library
        const guestBooks = guestReadingService.getAll();
        const guestIds = new Set(guestBooks.map((p) => p.bookId));
        setGuestLibraryIds(guestIds);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error cargando catálogo';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load books when search, category or page changes
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const categorySlug = activeCategory === 'ALL' 
          ? undefined 
          : catalogService.getCategorySlug(activeCategory);

        const data = await catalogService.getBooks(
          searchQuery || undefined,
          categorySlug,
          currentPage,
          12
        );

        setBooks(data.items);
        setPages(data.pages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error cargando libros';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [searchQuery, activeCategory, currentPage]);

  const isInLibrary = useCallback((bookId: string) => purchasedIds.has(bookId) || guestLibraryIds.has(bookId), [purchasedIds, guestLibraryIds]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  if (loading && !books.length) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: '#ccc6bb'
      }}>
        <div className="text-center">
          <div className="profile-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '2rem' }}>Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (error && !books.length) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: '#fca5a5',
        textAlign: 'center'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://morenareinoso.com';

  return (
    <>
      <SEO
        title="Catálogo — Morena Reinoso"
        description="Explorá todos los libros de Morena Reinoso."
        url={`${siteUrl}/catalog`}
      />
      <div className="catalog-wrapper">
      <div className="reading-progress-top" style={{ width: `${scrollProgress}%` }}></div>

      {/* Search & Filter Section */}
      <section className="catalog-search-section">
        <div className="catalog-search-container">
          <div className="catalog-search-content">
            <h1 className="catalog-search-title">Las Obras Completas.</h1>
            <div className="catalog-search-input-wrapper">
              <input
                type="text"
                placeholder="Buscar por título, tema o palabra clave..."
                className="catalog-search-input"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <span className="material-symbols-outlined catalog-search-icon">search</span>
            </div>
          </div>

          <div className="catalog-category-filters">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`catalog-filter-button ${activeCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-order Section */}
      {catalogLanding?.preorderBook && (
        <section className="catalog-new-releases-section">
          <div className="catalog-section-header">
            <h2 className="catalog-section-title">Próximo Lanzamiento</h2>
            <div className="catalog-section-divider"></div>
          </div>

          <div className="catalog-bento-grid">
            <div className="catalog-featured-card">
              <div className="catalog-featured-image">
                <img src={catalogLanding.preorderBook.coverUrl} alt={catalogLanding.preorderBook.title} />
              </div>
              <div className="catalog-featured-gradient"></div>
              <div className="catalog-featured-content">
                <span className="catalog-featured-badge">PRE-COMPRA</span>
                <h3 className="catalog-featured-title">{catalogLanding.preorderBook.title}</h3>
                <p className="catalog-featured-quote">{catalogLanding.preorderBook.description}</p>
                {catalogLanding.preorderBook.releaseDate && (
                  <p className="text-on-surface-variant text-body-sm mb-4">
                    Lanzamiento:{' '}
                    {new Date(catalogLanding.preorderBook.releaseDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
                <button
                  onClick={() => navigate(`/book/${catalogLanding.preorderBook?._id}`)}
                  className="catalog-featured-button"
                >
                  {isInLibrary(catalogLanding.preorderBook?._id) ? 'YA COMPRADO' : 'PRE-COMPRAR AHORA'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Releases Section */}
      {catalogLanding?.latestRelease && (
        <section className="catalog-new-releases-section">
          <div className="catalog-section-header">
            <h2 className="catalog-section-title">Nuevos Lanzamientos</h2>
            <div className="catalog-section-divider"></div>
          </div>

          <div className="catalog-bento-grid">
            {/* Main Featured Book */}
            <div className="catalog-featured-card">
              <div className="catalog-featured-image">
                <img src={catalogLanding.latestRelease.coverUrl} alt={catalogLanding.latestRelease.title} />
              </div>
              <div className="catalog-featured-gradient"></div>
              <div className="catalog-featured-content">
                <span className="catalog-featured-badge">TRABAJO MÁS RECIENTE</span>
                <h3 className="catalog-featured-title">{catalogLanding.latestRelease.title}</h3>
                <p className="catalog-featured-quote">{catalogLanding.latestRelease.description}</p>
                <button 
                  onClick={() => navigate(`/book/${catalogLanding.latestRelease?._id}`)}
                  className="catalog-featured-button">
                  {isInLibrary(catalogLanding.latestRelease?._id) ? 'YA COMPRADO' : 'COMPRAR AHORA'}
                </button>
              </div>
            </div>

            {/* Secondary Featured Books */}
            {catalogLanding.featuredBooks?.slice(0, 2).map((book) => (
              <div key={book._id} className="catalog-secondary-card">
                <div className="catalog-secondary-image">
                  <img src={book.coverUrl} alt={book.title} />
                </div>
                <div className="catalog-secondary-gradient"></div>
                <div className="catalog-secondary-content">
                  <h3 className="catalog-secondary-title">{book.title}</h3>
                  <p className="catalog-secondary-quote">{book.description}</p>
                  <button 
                    onClick={() => navigate(`/book/${book._id}`)}
                    className="catalog-secondary-button">VER COLECCIÓN</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations Carousel */}
      {recommendations.length > 0 && (
        <section className="catalog-recommendations-section">
          <div className="catalog-section-header">
            <h2 className="catalog-section-title">Recomendaciones</h2>
            <div className="catalog-section-divider"></div>
          </div>
          <div className="catalog-recommendations-carousel">
            <div className="catalog-recommendations-track">
              {recommendations.map((book) => (
                <div key={book._id} className="catalog-recommendation-card" onClick={() => navigate(`/book/${book._id}`)}>
                  <div className="catalog-recommendation-image">
                    <img src={book.coverUrl || 'https://via.placeholder.com/200x300?text=Book+Cover'} alt={book.title} />
                  </div>
                  <div className="catalog-recommendation-info">
                    <h4 className="catalog-recommendation-title">{book.title}</h4>
                    {book.subtitle && <p className="catalog-recommendation-subtitle">{book.subtitle}</p>}
                    <div className="catalog-recommendation-meta">
                      {book.avgRating > 0 && (
                        <span className="catalog-recommendation-rating">
                          ★ {book.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span className="catalog-recommendation-price">
                        {catalogService.formatPrice(book.priceCents)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full Catalog Section */}
      <section className="catalog-grid-section">
        <div className="catalog-section-header">
          <h2 className="catalog-section-title">Catálogo Completo</h2>
          <div className="catalog-section-divider"></div>
        </div>

        <div className="catalog-books-grid">
          {books.map((book) => (
            <div key={book._id} className="catalog-book-card">
              <div className="catalog-book-image" onClick={() => navigate(`/book/${book._id}`)}>
                <img src={book.coverUrl || 'https://via.placeholder.com/300x400?text=Book+Cover'} alt={book.title} />
                {authService.isAuthenticated() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const isFav = favoriteIds.has(book._id);
                      favoritesService.toggleFavorite(book._id, isFav).then((ok) => {
                        if (!ok) return;
                        if (isFav) {
                          setFavoriteIds(prev => { const next = new Set(prev); next.delete(book._id); return next; });
                        } else {
                          setFavoriteIds(prev => new Set(prev).add(book._id));
                        }
                      });
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{
                        color: favoriteIds.has(book._id) ? '#f87171' : 'rgba(255,255,255,0.7)',
                        fontVariationSettings: favoriteIds.has(book._id) ? "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" : undefined,
                      }}
                    >
                      favorite
                    </span>
                  </button>
                )}
                <div className="catalog-book-overlay">
                  <p className="catalog-book-overlay-quote">{book.description}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(isInLibrary(book._id) ? `/chapter/${book._id}` : `/checkout/${book._id}`); }}
                    className="catalog-book-overlay-button primary">
                    {isInLibrary(book._id) ? 'LEER AHORA' : 'COMPRAR AHORA'}
                  </button>
                  {!isInLibrary(book._id) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const existing = guestReadingService.getProgress(book._id);
                        if (existing) {
                          setModalMsg('Este libro ya está en tu biblioteca');
                        } else {
                          guestReadingService.saveProgress(book._id, 0, 0);
                          setGuestLibraryIds(prev => new Set(prev).add(book._id));
                          setModalMsg('Libro añadido a tu biblioteca');
                        }
                      }}
                      className="catalog-book-overlay-button secondary">AÑADIR A BIBLIOTECA</button>
                  )}
                </div>
              </div>
              <div className="catalog-book-info">
                <span className="catalog-book-category">{book.category}</span>
                <h4 className="catalog-book-title" onClick={() => navigate(`/book/${book._id}`)}>{book.title}</h4>
                <p className="catalog-book-price">{catalogService.formatPrice(book.priceCents)}</p>
                {/* Mobile: show buttons below cover */}
                <div className="catalog-book-actions-mobile">
                  <button 
                    onClick={() => navigate(isInLibrary(book._id) ? `/chapter/${book._id}` : `/checkout/${book._id}`)}
                    className="catalog-book-overlay-button primary">
                    {isInLibrary(book._id) ? 'LEER AHORA' : 'COMPRAR AHORA'}
                  </button>
                  {!isInLibrary(book._id) && (
                    <button 
                      onClick={() => {
                        const existing = guestReadingService.getProgress(book._id);
                        if (existing) {
                          setModalMsg('Este libro ya está en tu biblioteca');
                        } else {
                          guestReadingService.saveProgress(book._id, 0, 0);
                          setGuestLibraryIds(prev => new Set(prev).add(book._id));
                          setModalMsg('Libro añadido a tu biblioteca');
                        }
                      }}
                      className="catalog-book-overlay-button secondary">AÑADIR A BIBLIOTECA</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="catalog-pagination" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '3rem',
            flexWrap: 'wrap'
          }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo(0, 0);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === page ? '#F3EAD3' : 'transparent',
                  color: currentPage === page ? '#0a0a0a' : '#e5e2e1',
                  border: '1px solid ' + (currentPage === page ? '#F3EAD3' : '#e5e2e1/30'),
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontWeight: currentPage === page ? 'bold' : 'normal',
                  transition: 'all 0.3s'
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {books.length === 0 && !loading && (
          <div className="catalog-empty-state">
            <p className="catalog-empty-message">No se encontraron libros que coincidan con tu búsqueda.</p>
          </div>
        )}
      </section>

      <Modal open={!!modalMsg} onClose={() => setModalMsg('')}>
        <p className="text-body-md text-on-surface-variant text-center py-4">{modalMsg}</p>
        <div className="flex justify-center">
          <button
            onClick={() => setModalMsg('')}
            className="bg-primary text-background font-label-md px-6 py-2 tracking-widest uppercase"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
    </>
  );
}
