import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { landingService } from '../services/landing';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    landingService.getLandingData().then(data => {
      if (data.siteName) setSiteName(data.siteName);
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

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-surface/80 backdrop-blur-md border-b border-white/5 z-50 transition-all duration-500 ease-out">
      <div className="flex justify-between items-center w-full px-6 md:px-16 py-6 z-50 max-w-[1200px] mx-auto">
        {/* Logo */}
        <div className="font-display-lg text-headline-sm text-primary tracking-tighter">
          {siteName}
        </div>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-10">
          <a
            href="/"
            className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 pb-1 ${
              isActive('/')
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Inicio
          </a>
          <a
            href="/library"
            className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 pb-1 ${
              isActive('/library')
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Biblioteca
          </a>
          <a
            href="/catalog"
            className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 pb-1 ${
              isActive('/catalog')
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Catálogo
          </a>
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
            <a
              href="/profile"
              className="hover:opacity-80 transition-opacity"
              title="Profile"
            >
              <span className="material-symbols-outlined notranslate text-primary" translate="no">account_circle</span>
            </a>
          ) : (
            <a
              href="/login"
              className="hidden md:block font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
            >
              Sign In
            </a>
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
            <a
              href="/"
              onClick={handleNavClick}
              className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 py-2 ${
                isActive('/')
                  ? 'text-primary border-l-2 border-primary pl-2'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Home
            </a>
            <a
              href="/library"
              onClick={handleNavClick}
              className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 py-2 ${
                isActive('/library')
                  ? 'text-primary border-l-2 border-primary pl-2'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Library
            </a>
            <a
              href="/catalog"
              onClick={handleNavClick}
              className={`font-label-md text-label-md uppercase tracking-widest transition-colors duration-300 py-2 ${
                isActive('/catalog')
                  ? 'text-primary border-l-2 border-primary pl-2'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Catalog
            </a>

            <div className="border-t border-white/10 pt-4 mt-2">
              {isLoggedIn ? (
                <a
                  href="/profile"
                  onClick={handleNavClick}
                  className="font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-80 transition-opacity block py-2"
                >
                  Profile
                </a>
              ) : (
                <a
                  href="/login"
                  onClick={handleNavClick}
                  className="font-label-md text-label-md uppercase tracking-widest text-primary hover:opacity-80 transition-opacity block py-2"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}