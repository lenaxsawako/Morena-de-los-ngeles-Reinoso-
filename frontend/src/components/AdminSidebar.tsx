import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { landingService } from '../services/landing';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  filled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard', filled: true },
  { label: 'Manuscripts', icon: 'menu_book', href: '/admin/manuscripts' },
  { label: 'Sales Data', icon: 'payments', href: '/admin/sales' },
  { label: 'Reader Insights', icon: 'group', href: '/admin/readers' },
  { label: 'Cupones', icon: 'redeem', href: '/admin/coupons' },
  { label: 'Newsletter', icon: 'mail', href: '/admin/newsletter' },
  { label: 'Settings', icon: 'settings', href: '/admin/settings' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    landingService.getLandingData().then(data => {
      if (data.siteName) setSiteName(data.siteName);
    }).catch(() => {});
  }, []);

  const handleNewEntry = () => {
    // Navega a crear nuevo manuscrito
    navigate('/admin/manuscripts?new=true');
  };

  const handleLogout = () => {
    // Lógica para logout
    console.log('Logout clicked');
    // Puedes agregar lógica de autenticación aquí
    navigate('/login');
  };

  const handleSupport = () => {
    // Abre soporte o modal
    console.log('Support clicked');
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-primary/5 flex-col py-8 space-y-6 z-[60]">
      {/* Logo */}
      <div className="px-8">
        <h1 className="font-headline-md text-headline-md text-primary">{siteName}</h1>
        <p className="font-label-md text-label-md text-on-surface-variant opacity-60">Author Sanctuary</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center space-x-3 ${
                isActive
                  ? 'text-primary border-l-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface border-l-2 border-transparent'
              } pl-4 py-3 hover:bg-white/5 transition-all duration-200`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Entry Button */}
      <div className="px-6">
        <button 
          onClick={handleNewEntry}
          className="w-full bg-primary text-background py-3 font-label-md text-label-md tracking-wider flex items-center justify-center space-x-2 active:opacity-70 transition-all hover:opacity-90"
        >
          <span className="material-symbols-outlined notranslate text-[18px]" translate="no">add</span>
          <span>New Entry</span>
        </button>
      </div>

      {/* Footer Links */}
      <footer className="px-4 space-y-1 mt-auto">
        <button 
          onClick={handleSupport}
          className="flex items-center space-x-3 text-on-surface-variant hover:text-on-surface pl-4 py-3 transition-all w-full"
        >
          <span className="material-symbols-outlined notranslate" translate="no">help</span>
          <span className="font-label-md text-label-md">Support</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 text-on-surface-variant hover:text-on-surface pl-4 py-3 transition-all w-full"
        >
          <span className="material-symbols-outlined notranslate" translate="no">logout</span>
          <span className="font-label-md text-label-md">Log Out</span>
        </button>
      </footer>
    </aside>
  );
}
