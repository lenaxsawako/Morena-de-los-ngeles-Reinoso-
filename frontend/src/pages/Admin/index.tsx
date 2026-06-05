import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import './admin.css';

export default function AdminLayout() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        {/* Top Navigation */}
        <header className="admin-navbar">
          <div className="admin-navbar-right">
            <div className="admin-search">
              <span className="admin-search-icon material-symbols-outlined">search</span>
              <input type="text" className="admin-search-input" placeholder="Buscar archivos..." />
            </div>

            <button 
              onClick={() => alert('Notifications')}
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

            <div className="admin-profile-avatar cursor-pointer hover:opacity-80 transition-all">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbHBg0lgXeeqEaZWWqpJQ5234Z3XxhxWEqtPySfy5hyZ9LHVB69n_8qYdC8kvgHSB4VEUOJ9KGW_7fdjFivJMoFKYf1RS7EEBfDXf02hp9yEesFs1ZzUNa0w153XUZUltwzW2qjCRxUHPzEayQYIwxU7Oslff3DMpcVkAKW9QAScA2cO1w_gvjSKhxgpm69AkiSPEm4c0RaU_hLjnHECJ1XwsIdwgUVbWxIYhzlB6sOlIlUpUJCeYlUds_iCQKgazO-0SJqXLQYg"
                alt="Profile"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="admin-main">
          <Outlet />
        </main>

        {/* Footer */}
        
      </div>

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
