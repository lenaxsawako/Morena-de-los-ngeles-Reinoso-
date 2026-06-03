import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: number;
  type: 'review' | 'library' | 'milestone' | 'achievement';
  user?: string;
  action: string;
  book?: string;
  detail?: string;
  quote?: string;
  icon: string;
  timestamp: string;
}

const ALL_ACTIVITY_DATA: ActivityItem[] = [
  {
    id: 1,
    type: 'review',
    user: 'Elena V.',
    action: 'Nueva reseña de 5 estrellas',
    book: 'The Silent Echoes',
    quote: '"Una narrativa inquietantemente hermosa que se queda contigo mucho después de que gires la última página."',
    icon: 'star',
    timestamp: 'Hace 2 horas',
  },
  {
    id: 2,
    type: 'library',
    action: 'Adición a Biblioteca',
    detail: 'Archivo: "Midnight Memoirs" Parte IV',
    icon: 'library_add',
    timestamp: 'Hace 4 horas',
  },
  {
    id: 3,
    type: 'review',
    user: 'Marcus T.',
    action: 'Nueva reseña de 4 estrellas',
    book: 'Paper Crowns',
    quote: '"Cautivador de principio a fin. Una página giradora que te mantiene adivinando."',
    icon: 'star',
    timestamp: 'Hace 6 horas',
  },
  {
    id: 4,
    type: 'milestone',
    action: 'Hito Alcanzado',
    detail: '"The Silent Echoes" alcanza 50,000 lectores',
    icon: 'celebration',
    timestamp: 'Hace 1 día',
  },
  {
    id: 5,
    type: 'review',
    user: 'Sarah K.',
    action: 'Nueva reseña de 5 estrellas',
    book: 'Unwritten Vows',
    quote: '"Emocionalmente resonante. La prosa del autor es poesía en su forma más fina."',
    icon: 'star',
    timestamp: 'Hace 1 día',
  },
  {
    id: 6,
    type: 'achievement',
    action: 'Logro Desbloqueado',
    detail: 'Autor Más Vendido — "The Silent Echoes" clasificado #3 en Ficción',
    icon: 'trophy',
    timestamp: 'Hace 2 días',
  },
  {
    id: 7,
    type: 'library',
    action: 'Adición a Biblioteca',
    detail: 'Archivo: "Chronicles of Midnight" Serie Completa',
    icon: 'library_add',
    timestamp: 'Hace 2 días',
  },
  {
    id: 8,
    type: 'review',
    user: 'David N.',
    action: 'Nueva reseña de 4 estrellas',
    book: 'The Silent Echoes',
    quote: '"Una obra maestra de la ficción moderna. Altamente recomendado."',
    icon: 'star',
    timestamp: 'Hace 3 días',
  },
  {
    id: 9,
    type: 'milestone',
    action: 'Hito Alcanzado',
    detail: 'Lectores totales en todas las obras: 150,000+',
    icon: 'celebration',
    timestamp: 'Hace 3 días',
  },
  {
    id: 10,
    type: 'review',
    user: 'Jessica H.',
    action: 'Nueva reseña de 5 estrellas',
    book: 'Paper Crowns',
    quote: '"Una gema inesperada. El viaje del protagonista es inolvidable."',
    icon: 'star',
    timestamp: 'Hace 4 días',
  },
];

const STATUS_BADGES: Record<string, string> = {
  review: 'bg-secondary/20 text-secondary',
  library: 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim',
  milestone: 'bg-accent-gold/20 text-accent-gold',
  achievement: 'bg-on-error-container/20 text-on-error-container',
};

export default function ActivityViewAll() {
  const navigate = useNavigate();

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
              Historial completo de reseñas, hitos y adiciones a la biblioteca en toda tu cartera literaria.
            </p>
          </div>
        </header>
      </section>

      {/* Activity Timeline */}
      <section className="admin-section">
        <div className="space-y-4">
          {ALL_ACTIVITY_DATA.map((item) => (
            <div key={item.id} className="glass-card admin-activity-item p-6 hover:bg-white/5 transition-colors">
              <div className="admin-activity-item-header mb-4">
                <div className={`admin-activity-avatar ${STATUS_BADGES[item.type]}`}>
                  <span className="material-symbols-outlined">
                    {item.icon}
                  </span>
                </div>
                <div className="admin-activity-meta flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="admin-activity-title text-body-md text-primary">
                        {item.action}
                        {item.user && ` — ${item.user}`}
                      </p>
                      <p className="admin-activity-subtitle text-body-sm text-on-surface-variant">
                        {item.book || item.detail}
                      </p>
                    </div>
                    <p className="text-label-md text-on-surface-variant whitespace-nowrap">
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              </div>

              {item.quote && (
                <div className="ml-12 pl-4 border-l border-white/10">
                  <p className="admin-activity-text text-body-sm text-on-surface-variant italic">
                    {item.quote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Load More / Pagination */}
      <section className="admin-section flex justify-center">
        <button className="px-8 py-3 border border-white/10 text-primary rounded-lg hover:bg-white/5 transition-colors font-label-md text-label-md uppercase tracking-widest">
          Cargar Más Actividades
        </button>
      </section>
    </>
  );
}
