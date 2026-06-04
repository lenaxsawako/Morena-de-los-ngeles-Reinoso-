import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { landingService } from '../services/landing';
import { guestReadingService } from '../services/guestReading';
import { booksService } from '../services/books';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [lastRead, setLastRead] = useState<{ bookId: string; title: string; coverUrl?: string } | null>(null);

  useEffect(() => {
    landingService.getLandingData().then(data => {
      if (data.siteName) setSiteName(data.siteName);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
    }).catch(() => {});
  }, []);

  // Load last read book for "Continue Reading"
  useEffect(() => {
    const allProgress = guestReadingService.getAll();
    if (allProgress.length === 0) return;
    const sorted = allProgress.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
    const last = sorted[0];
    booksService.getBookById(last.bookId).then(data => {
      if (data) setLastRead({ bookId: last.bookId, title: data.title, coverUrl: data.coverUrl });
    }).catch(() => {});
  }, []);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
    };

    checkAuth();

    // Escuchar cambios en el localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isActive = (path: string) => {
    const base = '/book';
    const current = location.pathname.startsWith(base) ? location.pathname.slice(base.length) || '/' : location.pathname;
    return current === path;
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
    <nav className="fixed top-0 w-full bg-surface/80 backdrop-blur-md border-b border-white/5 z-50 transition-all duration-500 ease-out">
      <div className="flex justify-between items-center w-full px-6 md:px-16 py-6 z-50 max-w-[1200px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <span className="font-display-lg text-headline-sm text-primary tracking-tighter">{siteName}</span>
          )}
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-10">
          <Link
            to="/"
            className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 pb-1 ${
              isActive('/')
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Inicio
          </Link>
          <Link
            to="/library"
            className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 pb-1 ${
              isActive('/library')
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Biblioteca
          </Link>
          <Link
            to="/catalog"
            className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 pb-1 ${
              isActive('/catalog')
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Catálogo
          </Link>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* <button 
            onClick={() => {
              const searchQuery = prompt('¿Qué libro buscas?');
              if (searchQuery) {
                window.location.href = `/library?search=${encodeURIComponent(searchQuery)}`;
              }
            }}
            className="hover:opacity-80 transition-opacity hidden md:block"
            title="Buscar libros"
          >
            <span className="material-symbols-outlined notranslate text-primary" translate="no">search</span>
          </button> */}

          {isLoggedIn ? (
            <Link
              to="/profile"
              className="hover:opacity-80 transition-opacity"
              title="Profile"
            >
              <span className="material-symbols-outlined notranslate text-primary" translate="no">account_circle</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden md:block font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
            >
              Sign In
            </Link>
          )}

          {/* Hamburger Menu - Mobile */}
          <button
            className="md:hidden flex flex-col gap-1.5 hover:opacity-80 transition-opacity"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-primary transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-primary transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-primary transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-white/5 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col p-6 gap-4">
            <Link
              to="/"
              onClick={handleNavClick}
              className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 py-2 ${
                isActive('/')
                  ? 'text-primary border-l-2 border-primary pl-2'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link
              to="/library"
              onClick={handleNavClick}
              className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 py-2 ${
                isActive('/library')
                  ? 'text-primary border-l-2 border-primary pl-2'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Library
            </Link>
            <Link
              to="/catalog"
              onClick={handleNavClick}
              className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 py-2 ${
                isActive('/catalog')
                  ? 'text-primary border-l-2 border-primary pl-2'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Catalog
            </Link>

            <div className="border-t border-white/10 pt-4 mt-2">
              {isLoggedIn ? (
                <Link
                  to="/profile"
                  onClick={handleNavClick}
                  className="font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-80 transition-opacity block py-2"
                >
                  Profile
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={handleNavClick}
                  className="font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-80 transition-opacity block py-2"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      </nav>

      {/* Continue Reading Banner */}
      {lastRead && (
        <Link
          to={`/chapter/${lastRead.bookId}`}
          className="fixed top-[88px] left-0 right-0 z-40 bg-surface-container border-b border-white/5 px-6 md:px-16 py-3 flex items-center gap-3 hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-accent-gold text-lg">play_circle</span>
          <span className="font-body-md text-body-md text-primary truncate">{lastRead.title}</span>
          <span className="font-label-sm text-label-sm text-accent-gold uppercase tracking-widest ml-auto flex-shrink-0">Continuar Leyendo</span>
        </Link>
      )}
    </>
  );
}