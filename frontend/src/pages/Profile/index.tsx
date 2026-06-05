import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth';
import { paymentsService } from '../../services/payments';
import { subscriptionService } from '../../services/subscription';
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
  const [subscribed, setSubscribed] = useState(false);
  const [subChecking, setSubChecking] = useState(true);
  const [subMsg, setSubMsg] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
        const paidPurchases = purchases.filter((p) => p.status === 'paid' || p.status === 'completed');

        const seen = new Set<string>();
        const uniquePurchases = paidPurchases.filter((p) => {
          const id = typeof p.bookRef === 'string' ? p.bookRef : (p.bookRef as any)?._id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        userData.purchasedBooks = [...seen];
        userData.purchases = uniquePurchases;
        setUser(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    subscriptionService.getStatus().then(s => {
      setSubscribed(s.subscribed);
      setSubChecking(false);
    }).catch(() => setSubChecking(false));
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

          {/* Newsletter Subscription */}
          <div className="profile-section">
            <h2 className="profile-section-title">Newsletter</h2>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Estado</span>
                <p className="profile-info-value">
                  {subChecking ? 'Verificando...' : subscribed ? 'Suscripto' : 'No suscripto'}
                </p>
              </div>
            </div>
            {!subChecking && (
              <button
                onClick={async () => {
                  setSubMsg(null);
                  try {
                    if (subscribed) {
                      await subscriptionService.unsubscribe(user.email);
                      setSubscribed(false);
                      setSubMsg('Te desuscribiste correctamente');
                    } else {
                      await subscriptionService.subscribe(user.email, 'profile');
                      setSubscribed(true);
                      setSubMsg('Te suscribiste correctamente');
                    }
                  } catch (err: any) {
                    setSubMsg(err.message || 'Error al gestionar suscripción');
                  }
                }}
                className={`profile-admin-button mt-4 ${subscribed ? 'bg-red-900/40 text-red-400' : ''}`}
                style={subscribed ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' } : {}}
              >
                <span className="material-symbols-outlined notranslate" translate="no">
                  {subscribed ? 'mail_off' : 'mail'}
                </span>
                {subscribed ? 'Cancelar suscripción' : 'Suscribirse al newsletter'}
              </button>
            )}
            {subMsg && (
              <p className={`profile-bio mt-2 ${subMsg.includes('correctamente') ? '' : ''}`} style={{ color: subMsg.includes('correctamente') ? '#4ade80' : '#f87171' }}>
                {subMsg}
              </p>
            )}
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
                <Link to="/catalog" className="profile-browse-button">
                  Explorar Catálogo
                </Link>
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

          {/* Delete Account */}
          <div className="profile-section" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            <h2 className="profile-section-title" style={{ color: '#f87171' }}>Zona de Peligro</h2>
            <p className="profile-bio mb-4">
              Esta acción eliminará permanentemente tu cuenta y todos tus datos personales.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="profile-logout-button"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <span className="material-symbols-outlined notranslate" translate="no">delete_forever</span>
              Eliminar mi cuenta
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(''); setDeleteError(''); }}>
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative bg-surface-container rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/10 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-headline-md font-bold mb-2">Eliminar cuenta</h3>
            <p className="text-body-md text-on-surface-variant mb-4">
              Esta acción es irreversible. Se eliminarán todos tus datos personales, progreso de lectura, favoritos y suscripciones. Tus compras y valoraciones se conservarán de forma anónima.
            </p>
            <p className="text-body-sm text-on-surface-variant mb-3">
              Escribí <strong className="text-red-400">ELIMINAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors mb-4"
            />
            {deleteError && <p className="text-body-sm text-red-400 mb-3">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(''); setDeleteError(''); }}
                className="px-4 py-2 rounded-xl border border-white/10 text-label-sm text-on-surface-variant hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirm !== 'ELIMINAR') {
                    setDeleteError('Escribí ELIMINAR para confirmar');
                    return;
                  }
                  setDeleting(true);
                  setDeleteError('');
                  try {
                    const token = authService.getToken();
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!response.ok) {
                      const data = await response.json().catch(() => ({}));
                      throw new Error(data.message || 'Error al eliminar cuenta');
                    }
                    authService.logout();
                    navigate('/login');
                  } catch (err: any) {
                    setDeleteError(err.message);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-label-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
  );
}