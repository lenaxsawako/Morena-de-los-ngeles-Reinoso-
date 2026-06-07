import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminBooksService, type ActivityItem, type ActivityListResponse } from '../../../services/adminBooks';

const ACTIVITY_ICONS: Record<string, string> = {
  purchase: 'shopping_cart',
  registration: 'person_add',
};

const STATUS_BADGES: Record<string, string> = {
  purchase: 'bg-secondary/20 text-secondary',
  registration: 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim',
};

const formatTimestamp = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export default function ActivityViewAll() {
  const navigate = useNavigate();
  const [data, setData] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadActivity = async (p: number) => {
    setLoading(true);
    setError(null);
    const result = await adminBooksService.getActivity(p, 20);
    if (result.items.length === 0 && p === 1) {
      setError('No hay actividad registrada');
    }
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadActivity(page);
  }, [page]);

  return (
    <>
      {/* Page Header */}
      <section className="admin-section mb-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Volver al Panel
            </button>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Toda la Actividad
            </h1>
            <p className="text-on-surface-variant font-body-md max-w-[600px]">
              Historial completo de compras y registros de usuarios.
            </p>
          </div>
        </header>
      </section>

      {/* Activity Timeline */}
      <section className="admin-section">
        {error && !loading && (
          <div className="glass-card p-6 border border-white/10 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50 mb-2">info</span>
            <p className="text-on-surface-variant">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-on-surface-variant">Cargando actividad...</div>
          </div>
        )}

        {!loading && data && data.items.length > 0 && (
          <div className="space-y-4">
            {data.items.map((item: ActivityItem) => (
              <div key={item.id} className="glass-card admin-activity-item p-6 hover:bg-white/5 transition-colors">
                <div className="admin-activity-item-header mb-4">
                  <div className={`admin-activity-avatar ${STATUS_BADGES[item.type] || 'bg-white/10 text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined">
                      {ACTIVITY_ICONS[item.type] || 'notifications'}
                    </span>
                  </div>
                  <div className="admin-activity-meta flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="admin-activity-title text-body-md text-primary">
                          {item.title}
                        </p>
                        <p className="admin-activity-subtitle text-body-sm text-on-surface-variant">
                          {item.description}
                        </p>
                      </div>
                      <p className="text-label-md text-on-surface-variant whitespace-nowrap">
                        {formatTimestamp(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <section className="admin-section flex justify-center items-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-6 py-3 border border-white/10 text-primary rounded-lg hover:bg-white/5 transition-colors font-label-md text-label-md uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-on-surface-variant text-body-sm">
            Página {page} de {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-3 border border-white/10 text-primary rounded-lg hover:bg-white/5 transition-colors font-label-md text-label-md uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </section>
      )}
    </>
  );
}
