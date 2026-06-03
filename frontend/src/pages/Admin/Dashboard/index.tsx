import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminBooksService, type DashboardStats } from '../../../services/adminBooks';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const dashboardData = await adminBooksService.getDashboard();
        setDashboard(dashboardData);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="admin-section">
        <div className="admin-hero">
          <h2>Panel de Control</h2>
          <p>Bienvenido de nuevo. Aquí está el estado actual de tu negocio de libros y el rendimiento de tu catálogo.</p>
        </div>
      </section>

      {loading && (
        <section className="admin-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#ccc6bb' }}>Cargando datos...</p>
        </section>
      )}

      {!loading && (
        <>
      {/* Stats Grid */}
      <section className="admin-section">
        <div className="admin-stats-grid">
          {/* Total Sales */}
          <div className="glass-card admin-stat-card">
            <div>
              <p className="admin-stat-card-label">Ventas Totales</p>
              <p className="admin-stat-card-value">{dashboard?.summary.totalSales || 0}</p>
            </div>
            <div className="admin-stat-card-footer">
              <span className="material-symbols-outlined admin-stat-card-footer-icon">trending_up</span>
              <span className="admin-stat-card-footer-text">Transacciones completadas</span>
            </div>
            <div className="admin-stat-card-bg-icon material-symbols-outlined">shopping_cart</div>
          </div>

          {/* Active Readers */}
          <div className="glass-card admin-stat-card">
            <div>
              <p className="admin-stat-card-label">Lectores Activos</p>
              <p className="admin-stat-card-value">{dashboard?.summary.activeReaders || 0}</p>
            </div>
            <div className="admin-stat-card-footer">
              <span className="material-symbols-outlined admin-stat-card-footer-icon">auto_stories</span>
              <span className="admin-stat-card-footer-text">Últimos 30 días</span>
            </div>
            <div className="admin-stat-card-bg-icon material-symbols-outlined">book</div>
          </div>

          {/* Monthly Revenue */}
          <div className="glass-card admin-stat-card admin-stat-card-accent">
            <div>
              <p className="admin-stat-card-label">Ingresos Mensuales</p>
              <p className="admin-stat-card-value">${(dashboard?.summary.monthlyRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="admin-stat-card-footer">
              <span className="material-symbols-outlined admin-stat-card-footer-icon">payments</span>
              <span className="admin-stat-card-footer-text">Mes actual</span>
            </div>
            <div className="admin-stat-card-bg-icon material-symbols-outlined">monetization_on</div>
          </div>
        </div>
      </section>

      {/* Split View: Activity & Manuscripts */}
      <section className="admin-section">
        <div className="admin-split-grid">
          {/* Activity Feed */}
          <div className="admin-split-left">
            <div className="admin-section-header">
              <h3 className="admin-section-title">Actividad Reciente</h3>
              <button 
                onClick={() => navigate('/admin/activity')}
                className="admin-view-all"
              >
                Ver Todo
              </button>
            </div>

            <div className="admin-activity-list">
              {dashboard?.recentActivity.map((item) => {
                // Map activity types to Material Symbols icons
                const activityIcons: Record<string, string> = {
                  purchase: 'shopping_cart',
                  registration: 'person_add',
                };
                
                return (
                  <div key={item.description} className="glass-card admin-activity-item">
                    <div className="admin-activity-item-header">
                      <div className="admin-activity-avatar">
                        <span className="material-symbols-outlined admin-activity-avatar-icon">
                          {activityIcons[item.type] || 'notifications'}
                        </span>
                      </div>
                      <div className="admin-activity-meta">
                        <p className="admin-activity-title">
                          {item.title}
                        </p>
                        <p className="admin-activity-subtitle">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <p className="admin-activity-text" style={{ fontSize: '0.75rem', color: '#ccc6bb', marginTop: '0.5rem' }}>
                      {new Date(item.createdAt).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manuscript Management */}
          <div className="admin-split-right">
            <div className="admin-section-header">
              <h3 className="admin-section-title">Gestión de Libros</h3>
              <button 
                onClick={() => navigate('?new=true')}
                className="text-accent-gold border-b border-accent-gold pb-1 font-semibold hover:opacity-70 transition-opacity"
              >
                + Nuevo Libro
              </button>
            </div>

            <div className="admin-manuscripts-container">
              <div className="admin-manuscripts-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Precio</th>
                      <th>Ventas</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                  {dashboard?.books.map((book) => {
                    // Map status from dashboard to display format
                    const statusLabel = book.status === 'published' ? 'Publicado' : book.status === 'draft' ? 'Borrador' : 'Preorden';
                    const statusKey = book.status;
                    
                    return (
                      <tr key={book._id}>
                        <td>
                          <div className="admin-manuscript-cell">
                            <div className="admin-manuscript-cover">
                              {book.coverUrl ? (
                                <img src={book.coverUrl} alt={book.title} />
                              ) : (
                                <span className="material-symbols-outlined">book</span>
                              )}
                            </div>
                            <div className="admin-manuscript-info">
                              <p className="admin-manuscript-title">{book.title}</p>
                            </div>
                          </div>
                        </td>
                        <td>{adminBooksService.formatPrice(book.priceCents)}</td>
                        <td>{book.sales} ventas</td>
                        <td>
                          <span
                            className={`admin-status-badge admin-status-${statusKey}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button 
                              onClick={() => navigate(`/admin/manuscripts/${book._id}`)}
                              className="admin-table-action-btn material-symbols-outlined hover:text-primary transition-colors"
                              title="Editar libro"
                            >
                              edit
                            </button>
                            <button 
                              onClick={() => navigate(`/admin/manuscripts/${book._id}/analytics`)}
                              className="admin-table-action-btn material-symbols-outlined hover:text-primary transition-colors"
                              title="Ver analítica"
                            >
                              analytics
                            </button>
                            <button 
                              onClick={() => alert(`Más opciones para: ${book.title}`)}
                              className="admin-table-action-btn material-symbols-outlined hover:text-primary transition-colors"
                              title="Más opciones"
                            >
                              more_vert
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

              {/* Mobile Card View */}
              <div className="admin-manuscripts-cards">
                {dashboard?.books.map((book) => {
                  const statusLabel = book.status === 'published' ? 'Publicado' : book.status === 'draft' ? 'Borrador' : 'Preorden';
                  const statusKey = book.status;
                  
                  return (
                    <div key={book._id} className="admin-manuscript-card">
                      <div className="admin-manuscript-card-header">
                        <div className="admin-manuscript-cover-small">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} />
                          ) : (
                            <span className="material-symbols-outlined">book</span>
                          )}
                        </div>
                        <div className="admin-manuscript-info-small">
                          <p className="admin-manuscript-title-card">{book.title}</p>
                        </div>
                      </div>

                      <div className="admin-manuscript-card-body">
                        <div className="admin-manuscript-card-row">
                          <span className="admin-manuscript-card-label">Precio</span>
                          <span className="admin-manuscript-card-value">{adminBooksService.formatPrice(book.priceCents)}</span>
                        </div>
                        <div className="admin-manuscript-card-row">
                          <span className="admin-manuscript-card-label">Ventas</span>
                          <span className="admin-manuscript-card-value">{book.sales}</span>
                        </div>
                        <div className="admin-manuscript-card-row">
                          <span className="admin-manuscript-card-label">Estado</span>
                          <span
                            className={`admin-status-badge admin-status-${statusKey}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="admin-manuscript-card-actions">
                        <button 
                          onClick={() => navigate(`/admin/manuscripts/${book._id}`)}
                          className="admin-card-action-btn"
                        >
                          <span className="material-symbols-outlined">edit</span>
                          Editar
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/manuscripts/${book._id}/analytics`)}
                          className="admin-card-action-btn"
                        >
                          <span className="material-symbols-outlined">analytics</span>
                          Analítica
                        </button>
                        <button 
                          onClick={() => alert(`Más opciones para: ${book.title}`)}
                          className="admin-card-action-btn"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                          Más
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/admin/manuscripts?new=true')}
                style={{ color: '#F3EAD3', border: 'none', borderBottom: '1px solid #F3EAD3', background: 'transparent', cursor: 'pointer', paddingBottom: '0.25rem', fontFamily: 'Geist', fontSize: '0.75rem', textTransform: 'uppercase', transition: 'all 0.3s ease', fontWeight: 'bold' }} 
                onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = '#ffffff'; e.currentTarget.style.color = '#ffffff'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = '#F3EAD3'; e.currentTarget.style.color = '#F3EAD3'; }}
              >
                + Crear Nuevo Libro
              </button>
            </div>
          </div>
        </div>
      </section>
        </>
      )}
    </>
  );
}
