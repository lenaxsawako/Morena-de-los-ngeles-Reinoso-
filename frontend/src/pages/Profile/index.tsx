import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { paymentsService } from '../../services/payments';
import './profile.css';

interface UserProfile {
  _id: string;
  email: string;
  purchasedBooks: string[];
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string;
  profile: {
    username: string;
    avatar: string;
    bio: string;
  };
  preferences: {
    theme: string;
    fontSize: number;
  };
  metadata: {
    lastIpAddress: string;
    deviceType: string;
    referralCode: string;
  };
  createdAt: string;
  updatedAt: string;
  purchases?: any[];
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            authService.logout();
            navigate('/login');
            return;
          }
          throw new Error('Error al cargar el perfil');
        }

        const userData = await response.json();

        const purchases = await paymentsService.getPurchases().catch(() => []);
        const purchasedIds = purchases
          .filter((p) => p.status === 'paid' || p.status === 'completed')
          .map((p) => {
            if (typeof p.bookRef === 'string') return p.bookRef;
            return (p.bookRef as any)?._id || p.bookRef;
          })
          .filter(Boolean);

        userData.purchasedBooks = purchasedIds;
        userData.purchases = purchases.filter((p) => p.status === 'paid' || p.status === 'completed');
        setUser(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="profile-wrapper">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-wrapper">
        <div className="profile-error">
          <p>{error || 'No se pudo cargar el perfil'}</p>
          <button onClick={() => navigate('/')} className="profile-error-button">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <main className="profile-main">
        <div className="profile-container">
          {/* User Header */}
          <div className="profile-header-section">
            <div className="profile-user-card">
              <div className="profile-avatar">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.profile.username || 'Usuario'} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #F3EAD3 0%, #e5d7bb 100%)',
                    color: '#0a0a0a',
                    fontSize: '2.5rem',
                    fontWeight: 'bold'
                  }}>
                    {user.profile?.username ? user.profile.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              <div className="profile-user-info">
                <h1 className="profile-username">{user.profile?.username || 'Usuario'}</h1>
                <p className="profile-email">{user.email}</p>
                {user.profile?.bio && (
                  <p className="profile-bio">{user.profile.bio}</p>
                )}
              </div>

              <div className="profile-buttons-group">
                {authService.isAdmin() && (
                  <button onClick={handleGoToAdmin} className="profile-admin-button">
                    <span className="material-symbols-outlined notranslate" translate="no">admin_panel_settings</span>
                    Panel Admin
                  </button>
                )}

                <button onClick={handleLogout} className="profile-logout-button">
                  <span className="material-symbols-outlined notranslate" translate="no">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="profile-section">
            <h2 className="profile-section-title">Información de la Cuenta</h2>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">ID de Usuario</span>
                <p className="profile-info-value">{user._id}</p>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email Verificado</span>
                <p className="profile-info-value">
                  {user.emailVerified ? '✓ Verificado' : 'No verificado'}
                </p>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Miembro Desde</span>
                <p className="profile-info-value">
                  {new Date(user.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Books */}
          <div className="profile-section">
            <h2 className="profile-section-title">Libros Comprados</h2>
            {user.purchasedBooks.length > 0 ? (
              <div className="profile-books-list">
                <p className="profile-books-count">
                  Has comprado {user.purchasedBooks.length} libro{user.purchasedBooks.length !== 1 ? 's' : ''}
                </p>
                <div className="profile-book-grid">
                  {(user as any).purchases?.map((p: any, idx: number) => {
                    const book = typeof p.bookRef === 'string' ? null : p.bookRef;
                    return (
                      <div key={idx} className="profile-book-item" onClick={() => navigate(`/chapter/${book?._id || p.bookRef}`)}>
                        {book?.coverUrl && <img src={book.coverUrl} alt={book.title} className="profile-book-cover" />}
                        <span className="profile-book-title">{book?.title || book?._id || p.bookRef}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="profile-empty-state">
                <span className="material-symbols-outlined notranslate" translate="no">shopping_bag</span>
                <p>Aún no has comprado libros</p>
                <a href="/catalog" className="profile-browse-button">
                  Explorar Catálogo
                </a>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="profile-section">
            <h2 className="profile-section-title">Preferencias</h2>
            <div className="profile-preferences">
              <div className="profile-preference-item">
                <div>
                  <span className="profile-preference-label">Tema</span>
                  <p className="profile-preference-value">{user.preferences?.theme === 'dark' ? 'Oscuro' : 'Claro'}</p>
                </div>
              </div>
              <div className="profile-preference-item">
                <div>
                  <span className="profile-preference-label">Tamaño de Fuente</span>
                  <p className="profile-preference-value">{user.preferences?.fontSize ? `${user.preferences.fontSize}px` : 'Predeterminado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}