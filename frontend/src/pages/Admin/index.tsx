import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { authService } from '../../services/auth';
import './admin.css';

export default function AdminLayout() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationModal, setNotificationModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const isDemo = authService.isDemoUser();
  const location = useLocation();
  const navigate = useNavigate();

  const PRIMARY_NAV = [
    { label: 'Panel', icon: 'dashboard', href: '/admin/dashboard' },
    { label: 'Manuscritos', icon: 'menu_book', href: '/admin/manuscripts' },
    { label: 'Ventas', icon: 'payments', href: '/admin/sales' },
    { label: 'Lectores', icon: 'group', href: '/admin/readers' },
  ];

  const EXTRA_NAV = [
    { label: 'Newsletter', icon: 'newspaper', href: '/admin/newsletter' },
    { label: 'Reseñas', icon: 'reviews', href: '/admin/reviews' },
    { label: 'Cupones', icon: 'redeem', href: '/admin/coupons' },
    { label: 'Soporte', icon: 'support_agent', href: '/admin/support' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="admin-wrapper">
      <div className="admin-progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Wrapper */}
      <div className="admin-main-wrapper">
        {isDemo && (
          <div style={{
            background: '#854d0e',
            color: '#fef3c7',
            textAlign: 'center',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            Modo demo — los cambios no se guardan
          </div>
        )}
        {/* Top Navigation */}
        <header className="admin-navbar">
          <div className="admin-navbar-right">
            <div className="admin-search">
              <span className="admin-search-icon material-symbols-outlined">search</span>
              <input type="text" className="admin-search-input" placeholder="Buscar archivos..." />
            </div>

            <button 
              onClick={() => setNotificationModal({ type: 'success', message: 'Notifications - feature coming soon' })}
              className="admin-icon-btn material-symbols-outlined hover:opacity-70 transition-all"
            >
              notifications
            </button>
            <button 
              onClick={() => navigate('/admin/settings')}
              className="admin-icon-btn material-symbols-outlined hover:opacity-70 transition-all"
            >
              settings
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="admin-main">
          <Outlet />
        </main>

        {/* Footer */}
        
      </div>

      {/* Notification Modal */}
      {notificationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setNotificationModal(null)}>
          <div className="bg-surface p-6 rounded-lg shadow-lg max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <span className={`material-symbols-outlined text-4xl mb-2 ${notificationModal.type === 'success' ? 'text-accent-gold' : 'text-error'}`}>
                {notificationModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <h3 className="text-lg font-semibold text-on-surface mb-1">
                {notificationModal.type === 'success' ? 'Success' : 'Error'}
              </h3>
              <p className="text-on-surface-variant text-body-sm mt-1">{notificationModal.message}</p>
              <button
                onClick={() => setNotificationModal(null)}
                className="mt-4 px-6 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <nav className="admin-mobile-nav">
        {/* Primary nav items: first 2 */}
        {PRIMARY_NAV.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`admin-mobile-nav-btn ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined admin-mobile-nav-btn-icon">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`admin-mobile-hamburger ${isMenuOpen ? 'open' : ''}`}
          aria-label="Menú"
        >
          <div className="admin-hamburger-lines">
            <span />
            <span />
            <span />
          </div>
        </button>

        {/* Primary nav items: last 2 */}
        {PRIMARY_NAV.slice(2).map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`admin-mobile-nav-btn ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined admin-mobile-nav-btn-icon">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Expanded menu overlay */}
      {isMenuOpen && (
        <div className="admin-mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Expanded menu items */}
      <div className={`admin-mobile-extra-menu ${isMenuOpen ? 'open' : ''}`}>
        {EXTRA_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`admin-mobile-extra-item ${active ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
