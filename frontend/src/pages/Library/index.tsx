import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { guestReadingService, type ReadingProgress } from '../../services/guestReading';
import { readingService, type ContinueReading, type LibraryBook } from '../../services/reading';
import { booksService } from '../../services/books';
import { landingService } from '../../services/landing';
import ShareButton from '../../components/ShareButton';
import './library.css';

const FILTER_TABS = [
  { id: 'all', label: 'Todos los Libros' },
  { id: 'recent', label: 'Leyendo Actualmente' },
];

export default function Library() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    landingService.getLandingData().then(data => {
      if (data.siteName) setSiteName(data.siteName);
    }).catch(() => {});
  }, []);
  const [activeTab, setActiveTab] = useState('all');
  const [guestLibrary, setGuestLibrary] = useState<ReadingProgress[]>([]);
  const [continueReading, setContinueReading] = useState<ContinueReading | null>(null);
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  // Load library data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          // Usuario autenticado: cargar desde API
          const [libraryData, continueReadingData] = await Promise.all([
            readingService.getLibrary().catch(() => [] as LibraryBook[]),
            readingService.getContinueReading().catch(() => null),
          ]);

          // Combinar con datos de localStorage (backup si JWT expiró)
          const localProgress = guestReadingService.getAll();
          if (localProgress.length > 0) {
            const apiBookIds = new Set(libraryData.map(b => b.bookId));
            const localOnly = localProgress.filter(p => !apiBookIds.has(p.bookId));

            // Fetch real details for localStorage-only books
            const enrichedLocal = await Promise.all(
              localOnly.map(async (p) => {
                const details = await booksService.getBookById(p.bookId);
                return {
                  bookId: p.bookId,
                  title: details?.title || `Libro #${p.bookId.slice(0, 8)}`,
                  slug: '',
                  coverUrl: details?.coverUrl || '',
                  progressPercentage: p.progressPercentage,
                  status: p.progressPercentage >= 100 ? 'completed' as const : 'reading' as const,
                };
              }),
            );

            setLibrary([...libraryData, ...enrichedLocal]);
          } else {
            setLibrary(libraryData);
          }

          // Continue Reading: API primero, localStorage como fallback
          if (continueReadingData) {
            setContinueReading(continueReadingData);
          } else {
            const local = guestReadingService.getContinueReading();
            if (local) {
              const details = await booksService.getBookById(local.bookId);
              setContinueReading({
                bookId: local.bookId,
                title: details?.title || `Libro #${local.bookId.slice(0, 8)}`,
                coverUrl: details?.coverUrl || '',
                currentPage: local.currentPage,
                progressPercentage: local.progressPercentage,
                remainingPages: 0,
                lastReadAt: local.lastReadAt,
              });
            }
          }
        } else {
          // Usuario guest: usar guestReadingService
          const guestData = guestReadingService.getGuestLibrary();

          // Fetch real book details
          const enriched = await Promise.all(
            guestData.map(async (p) => {
              const details = await booksService.getBookById(p.bookId);
              return { ...p, title: details?.title || '', coverUrl: details?.coverUrl || '' };
            }),
          );
          setGuestLibrary(enriched);

          const localContinue = guestReadingService.getContinueReading();
          if (localContinue) {
            const details = await booksService.getBookById(localContinue.bookId);
            setContinueReading({
              bookId: localContinue.bookId,
              title: details?.title || `Libro #${localContinue.bookId.slice(0, 8)}`,
              coverUrl: details?.coverUrl || '',
              currentPage: localContinue.currentPage,
              progressPercentage: localContinue.progressPercentage,
              remainingPages: 0,
              lastReadAt: localContinue.lastReadAt,
            });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error cargando biblioteca';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredBooks = isAuthenticated
    ? library.filter((book) => {
        if (activeTab === 'recent') return book.status === 'reading';
        return true;
      })
    : guestLibrary.filter((book) => {
        if (activeTab === 'recent') return book.progressPercentage > 0 && book.progressPercentage < 100;
        return true;
      });

  const getStatusLabel = (progress: number) => {
    if (progress === 100) return 'Finalizado';
    if (progress === 0) return 'No Leído';
    return `${progress}% Leído`;
  };

  if (loading) {
    return (
      <main className="pt-32">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: '#ccc6bb'
        }}>
          <div className="text-center">
            <div className="profile-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '2rem' }}>Cargando biblioteca...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-32">
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
      </main>
    );
  }

  return (
    <main className="pt-32 pb-24 max-w-[1200px] mx-auto px-5 md:px-16">
      {/* Progress Bar */}
      <div 
        className="reading-progress-top" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Continue Reading Section */}
      <section className="mb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant mb-8">
          Continuar Leyendo
        </h2>
        
          {continueReading ? (
            <div className="glass-card group flex flex-col md:flex-row items-center gap-10 p-8 md:p-12 transition-all duration-500 hover:border-white/10 cursor-pointer"
                 onClick={() => navigate(`/book/${continueReading.bookId}`)}>
              {/* Book Cover */}
              <div className="w-full md:w-1/3 aspect-[2/3] overflow-hidden shadow-2xl relative bg-gradient-to-br from-white/10 to-white/5">
                {continueReading.coverUrl ? (
                  <img src={continueReading.coverUrl} alt={continueReading.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white/30">book</span>
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="w-full md:w-2/3 flex flex-col justify-center">
                <span className="font-label-md text-label-md uppercase tracking-widest text-primary-container mb-4">
                  Lectura Actual
                </span>
                <h1 className="font-headline-lg text-headline-lg mb-4">{continueReading.title}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-[500px]">
                Retoma tu lectura desde la página {continueReading.currentPage}
              </p>

              {/* Progress Bar */}
              <div className="mb-10">
                <div className="flex justify-between font-label-md text-label-md mb-3 text-on-surface-variant">
                  <span>{continueReading.progressPercentage}% Completado</span>
                </div>
                <div className="h-[1px] w-full bg-white/10 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#F3EAD3] shadow-[0_0_8px_rgba(243,234,211,0.5)]"
                    style={{ width: `${continueReading.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate(`/chapter/${continueReading.bookId}`)}
                  className="bg-[#F3EAD3] text-[#0A0A0A] px-12 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-white transition-colors duration-300"
                >
                  Reanudar Lectura
                </button>
                <button 
                  onClick={() => navigate(`/book/${continueReading.bookId}`)}
                  className="border border-white/20 text-white px-12 py-4 font-label-md text-label-md uppercase tracking-widest hover:border-[#F3EAD3] hover:text-[#F3EAD3] transition-all duration-300"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center justify-center py-16 px-8 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-6">
              import_contacts
            </span>
            <h3 className="font-headline-sm text-headline-sm mb-2 text-on-surface-variant">
              Comienza tu lectura
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant/60 mb-8 max-w-sm">
              Explora el catálogo y comienza a leer. Tu progreso se guardará automáticamente.
            </p>
            <button 
              onClick={() => navigate('/catalog')}
              className="bg-[#F3EAD3] text-[#0A0A0A] px-12 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-white transition-colors duration-300"
            >
              Explorar Catálogo
            </button>
          </div>
        )}
      </section>

      {/* Your Collection Section */}
      <section className="mb-24">
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-6">
          <h2 className="font-headline-md text-headline-md">Tu Colección</h2>
          <div className="flex gap-8 border-b border-white/10 pb-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-label-md text-label-md uppercase tracking-widest pb-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-primary border-b border-primary -mb-2.5'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book: any) => {
            const bookId = book.bookId;
            const progress = book.progressPercentage;
            const bookTitle = book.title || `Libro #${bookId.slice(0, 8)}`;
            const coverUrl = book.coverUrl;
            
            return (
            <div 
              key={bookId}
              className="group cursor-pointer"
              onClick={() => navigate(`/book/${bookId}`)}
            >
              {/* Book Cover */}
              <div className="aspect-[2/3] glass-card overflow-hidden mb-6 relative transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                {coverUrl ? (
                  <img src={coverUrl} alt={bookTitle} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-white/20">book</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-4xl">play_arrow</span>
                </div>
              </div>

              {/* Book Info */}
              <div className="space-y-1">
                <p className="font-label-md text-label-md uppercase tracking-tighter text-on-surface-variant">
                  {siteName}
                </p>
                <h3 className="font-headline-sm text-headline-sm">{bookTitle}</h3>

                {/* Progress Bar + Share */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#F3EAD3]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className={`font-label-md text-[10px] uppercase ${
                      progress === 100 
                        ? 'text-primary-container' 
                        : 'text-on-surface-variant'
                    }`}>
                      {getStatusLabel(progress)}
                    </span>
                  </div>
                  <ShareButton
                    title={bookTitle}
                    progressPercentage={progress}
                    bookUrl={bookId}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/10 rounded-lg">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-6">
              book_2
            </span>
            <h3 className="font-headline-sm text-headline-sm mb-2 text-on-surface-variant">
              Tu biblioteca te espera
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant/60 mb-8 max-w-sm text-center">
              Descubre nuevas narrativas y construye tu colección{siteName ? ` desde el catálogo de ${siteName}` : ''}.
            </p>
            <button 
              onClick={() => navigate('/catalog')}
              className="border border-white/20 text-white px-8 py-3 font-label-md text-label-md uppercase tracking-widest hover:border-[#F3EAD3] hover:text-[#F3EAD3] transition-all"
            >
              Explorar Catálogo
            </button>
          </div>
        )}
      </section>
    </main>
  );
}