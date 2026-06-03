import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { landingService, type LandingData } from '../../services/landing';
import { subscriptionService } from '../../services/subscription';
import { paymentsService } from '../../services/payments';
import { authService } from '../../services/auth';
import './home.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [landingData, setLandingData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const data = await landingService.getLandingData();
        setLandingData(data);

        if (authService.isAuthenticated()) {
          const purchases = await paymentsService.getPurchases().catch(() => []);
          const ids = new Set<string>(
            purchases
              .filter((p) => p.status === 'paid' || p.status === 'completed')
              .map((p) => (typeof p.bookRef === 'string' ? p.bookRef : p.bookRef?._id))
              .filter((id): id is string => !!id),
          );
          setPurchasedIds(ids);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  if (loading) {
    return (
      <main className="pt-32">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: '#ccc6bb'
        }}>
          <div className="text-center">
            <div className="profile-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '2rem' }}>Cargando...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !landingData) {
    return (
      <main className="pt-32">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: '#fca5a5',
          textAlign: 'center'
        }}>
          <p>{error || 'No se pudieron cargar los datos'}</p>
        </div>
      </main>
    );
  }

  const { latestRelease, featuredBooks, latestVolumes, philosophy } = landingData;

  return (
    <main className="pt-32">
      {/* Progress Bar */}
      <div 
        className="progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Hero Section: Latest Release */}
      {latestRelease && (
      <section className="px-16 mb-32 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="space-y-6">
              <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant opacity-60">
                Último lanzamiento
              </span>
              <h1 className="font-display-lg text-display-lg text-primary max-w-xl">
                {latestRelease.title}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg italic">
                {latestRelease.subtitle}
              </p>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                {latestRelease.description}
              </p>
              <div className="pt-8 flex flex-wrap gap-6">
                <button 
                  onClick={() => navigate(purchasedIds.has(latestRelease._id) ? `/chapter/${latestRelease._id}` : `/chapter/${latestRelease._id}`)}
                  className="bg-[#F3EAD3] text-[#0A0A0A] font-label-md px-8 py-4 transition-all duration-300 hover:opacity-90 tracking-widest uppercase"
                >
                  {purchasedIds.has(latestRelease._id) ? 'LEER AHORA' : 'LEE EL PRIMER CAPÍTULO'}
                </button>
                {purchasedIds.has(latestRelease._id) ? (
                  <button 
                    onClick={() => navigate(`/chapter/${latestRelease._id}`)}
                    className="border border-green-500/50 text-green-400 font-label-md px-8 py-4 transition-all duration-300 hover:border-green-400 tracking-widest uppercase"
                  >
                    ✓ YA COMPRADO
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(`/checkout/${latestRelease._id}`)}
                    className="border border-white/20 text-primary font-label-md px-8 py-4 transition-all duration-300 hover:border-[#F3EAD3] hover:shadow-[0_0_15px_rgba(243,234,211,0.2)] uppercase tracking-widest"
                  >
                    COMPRAR: ${(latestRelease.priceCents / 100).toFixed(2)}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative aspect-[3/4] w-full max-w-[450px] mx-auto overflow-hidden group">
              <img
                alt={latestRelease.title}
                src={latestRelease.coverUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Poetic Introduction */}
      <section className="py-32 bg-surface-container-lowest">
        <div className="reading-container px-5 md:px-16 text-center">
          {philosophy.authorImageUrl ? (
            <div className="w-24 h-24 mx-auto mb-16 rounded-full overflow-hidden border-2 border-[#F3EAD3]/30">
              <img
                src={philosophy.authorImageUrl}
                alt="Author"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#F3EAD3] to-transparent mx-auto mb-16"></div>
          )}
          <h2 className="font-headline-lg text-headline-lg text-primary mb-12">{philosophy.title}</h2>
          <div className="space-y-8 font-body-lg text-body-lg text-on-surface-variant leading-relaxed italic opacity-80">
            <p>{philosophy.content}</p>
          </div>
        </div>
      </section>

      {/* Featured Stories: Bento Grid */}
      <section className="px-16 py-32 max-w-[1200px] mx-auto">
        <div className="flex justify-between items-end mb-16">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-4 block">
              Colección Seleccionada
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">Historias Destacadas</h2>
          </div>
          <div className="hidden md:block">
            <Link 
              to="/catalog"
              className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              Ver Todas las Obras →
            </Link>
          </div>
        </div>

        {featuredBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[800px]">
          {/* Large Featured Card (First Book) */}
          {featuredBooks[0] && (
          <div className="md:col-span-8 group relative overflow-hidden glass-card p-0 transition-transform duration-500 hover:-translate-y-2 cursor-pointer"
               onClick={() => navigate(`/book/${featuredBooks[0]._id}`)}>
            <img
              alt={featuredBooks[0].title}
              src={featuredBooks[0].coverUrl}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-12 relative z-10">
              <h3 className="font-headline-md text-headline-md text-primary mb-4">{featuredBooks[0].title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                {featuredBooks[0].description}
              </p>
            </div>
          </div>
          )}

          {/* Small Featured Cards */}
          <div className="md:col-span-4 flex flex-col gap-8">
            {/* Card 2 */}
            {featuredBooks[1] && (
            <div className="flex-1 group relative overflow-hidden glass-card transition-transform duration-500 hover:-translate-y-2 cursor-pointer"
                 onClick={() => navigate(`/book/${featuredBooks[1]._id}`)}>
              <img
                alt={featuredBooks[1].title}
                src={featuredBooks[1].coverUrl}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40"
              />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{featuredBooks[1].title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{featuredBooks[1].description}</p>
              </div>
            </div>
            )}

            {/* Card 3 */}
            {featuredBooks[2] && (
            <div className="flex-1 group relative overflow-hidden glass-card transition-transform duration-500 hover:-translate-y-2 cursor-pointer"
                 onClick={() => navigate(`/book/${featuredBooks[2]._id}`)}>
              <img
                alt={featuredBooks[2].title}
                src={featuredBooks[2].coverUrl}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40"
              />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{featuredBooks[2].title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{featuredBooks[2].description}</p>
              </div>
            </div>
            )}
          </div>
        </div>
        )}
      </section>

      {/* Latest Releases: Minimal Grid */}
      <section className="px-16 py-32 bg-[#0E0E0E]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-24 text-center">
            <h2 className="font-headline-lg text-headline-lg text-primary">Últimos Volúmenes</h2>
          </div>
          {latestVolumes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {latestVolumes.map((book) => (
              <div key={book._id} className="space-y-6 group cursor-pointer">
                <div className="aspect-[2/3] overflow-hidden border border-white/5 transition-colors group-hover:border-[#F3EAD3]/30">
                  <img
                    alt={book.title}
                    src={book.coverUrl}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="text-center">
                  <h4 className="font-headline-sm text-headline-sm text-primary">{book.title}</h4>
                  <p className="font-label-md text-label-md uppercase tracking-tighter text-on-surface-variant">
                    {new Date(book.publishedAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section id="newsletter" className="py-48 px-5 md:px-16">
        <div className="max-w-[600px] mx-auto text-center glass-card p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">mail</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary mb-6">Correspondencia</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-10">
            Recibe notas ocasionales sobre el proceso de escritura, acceso temprano a nuevos capítulos, y reflexiones sobre el oficio.
          </p>
          <form className="space-y-12" onSubmit={async (e) => {
            e.preventDefault();
            if (!newsletterEmail) return;
            setNewsletterStatus('loading');
            try {
              await subscriptionService.subscribe(newsletterEmail);
              setNewsletterStatus('success');
              setNewsletterMessage('¡Gracias por suscribirte! Revisa tu correo.');
              setNewsletterEmail('');
            } catch {
              setNewsletterStatus('error');
              setNewsletterMessage('Error al suscribir. Intenta de nuevo.');
            }
          }}>
            <div className="relative group">
              <input
                className="newsletter-input w-full px-0 py-4 font-body-md text-primary placeholder:text-white/20"
                placeholder="Dirección de Correo"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === 'loading'}
                required
              />
            </div>
            {newsletterMessage && (
              <p className={`font-body-sm text-body-sm ${newsletterStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {newsletterMessage}
              </p>
            )}
            <button
              className="w-full bg-[#F3EAD3] text-[#0A0A0A] font-label-md py-5 tracking-widest hover:bg-white transition-colors uppercase disabled:opacity-50"
              type="submit"
              disabled={newsletterStatus === 'loading'}
            >
              {newsletterStatus === 'loading' ? 'ENVIANDO...' : 'SUSCRIBIRSE A LA CARTA'}
            </button>
          </form>
          <p className="mt-8 font-body-sm text-body-sm text-white/30 italic">Sin frecuencia. Solo calidad.</p>
        </div>
      </section>

    </main>
  );
}
