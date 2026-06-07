import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionService } from '../../services/subscription';

const API_URL = import.meta.env.VITE_API_URL;

interface LaunchStatus {
  launchMode: boolean;
  launchDate: string | null;
  comingSoonTitle: string;
  comingSoonSubtitle: string;
  comingSoonBg: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  socialLinks?: { instagram?: string; tiktok?: string };
  siteName?: string;
  logoUrl?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(launchDate: string): TimeLeft | null {
  const diff = new Date(launchDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function ComingSoon({ forceShow }: { forceShow?: boolean }) {
  const [status, setStatus] = useState<LaunchStatus | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMsg, setSubscribeMsg] = useState('');
  const [socialLinks, setSocialLinks] = useState<{ instagram?: string; tiktok?: string }>({});
  const [siteName, setSiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    fetch(`${API_URL}/landing/launch-status`)
      .then(r => r.json())
      .then((data: LaunchStatus) => {
        setStatus(data);
        if (data.launchDate) {
          const left = calcTimeLeft(data.launchDate);
          setTimeLeft(left);
          if (left) {
            intervalRef.current = setInterval(() => {
              const l = calcTimeLeft(data.launchDate!);
              if (!l) {
                if (!forceShow) window.location.reload();
                clearInterval(intervalRef.current);
                return;
              }
              setTimeLeft(l);
            }, 1000);
          }
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/landing`)
      .then(r => r.json())
      .then(data => {
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        if (data.siteName) setSiteName(data.siteName);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      })
      .catch(() => {});

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [forceShow]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeStatus('loading');
    try {
      const res = await subscriptionService.subscribe(email, 'coming-soon');
      setSubscribeMsg(res.message || '¡Te avisamos cuando estemos listos!');
      setSubscribeStatus('success');
    } catch (err: any) {
      setSubscribeMsg(err.message || 'Error al suscribir');
      setSubscribeStatus('error');
    }
  };

  const bgStyle: React.CSSProperties = status?.comingSoonBg
    ? { backgroundImage: `url(${status.comingSoonBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: status?.comingSoonBg ? undefined : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#fff',
      fontFamily: "'Geist', sans-serif",
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      ...bgStyle,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: status?.comingSoonBg ? 'rgba(0,0,0,0.7)' : undefined,
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', width: '100%', textAlign: 'center' }}>
        {(logoUrl || siteName) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            {logoUrl && (
              <img src={logoUrl} alt={siteName} style={{ height: '48px', objectFit: 'contain' }} />
            )}
            {siteName && (
              <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.6 }}>
                {siteName}
              </span>
            )}
          </div>
        )}

        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.1 }}>
          {status?.comingSoonTitle || 'Próximamente'}
        </h1>

        {status?.comingSoonSubtitle && (
          <p style={{ fontSize: '1.125rem', opacity: 0.7, maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            {status.comingSoonSubtitle}
          </p>
        )}

        {timeLeft && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
            {[
              { label: 'Días', value: timeLeft.days },
              { label: 'Horas', value: timeLeft.hours },
              { label: 'Min', value: timeLeft.minutes },
              { label: 'Seg', value: timeLeft.seconds },
            ].map(unit => (
              <div key={unit.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: '72px',
              }}>
                <span style={{
                  fontSize: '2.5rem', fontWeight: 300, lineHeight: 1,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '0.75rem 0.5rem', borderRadius: '8px',
                  minWidth: '64px', textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pad(unit.value)}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px', margin: '0 auto', marginBottom: '2.5rem' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            disabled={subscribeStatus === 'success'}
            style={{
              flex: 1, padding: '0.875rem 1rem', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff', fontSize: '0.9375rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
            style={{
              padding: '0.875rem 1.5rem', borderRadius: '8px',
              border: 'none', background: '#fff', color: '#0a0a0a',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              whiteSpace: 'nowrap', opacity: subscribeStatus === 'loading' ? 0.6 : 1,
            }}
          >
            {subscribeStatus === 'loading' ? 'Enviando...' : 'Avisame cuando salga'}
          </button>
        </form>

        {subscribeStatus === 'success' && (
          <p style={{ color: '#4ade80', fontSize: '0.875rem', marginBottom: '2rem' }}>{subscribeMsg}</p>
        )}
        {subscribeStatus === 'error' && (
          <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '2rem' }}>{subscribeMsg}</p>
        )}

        {(status?.instagramUrl || status?.tiktokUrl || socialLinks?.instagram || socialLinks?.tiktok) && (
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {(status?.instagramUrl || socialLinks?.instagram) && (
              <a href={status?.instagramUrl || `https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
                style={{ opacity: 0.6, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>
                Instagram
              </a>
            )}
            {(status?.tiktokUrl || socialLinks?.tiktok) && (
              <a href={status?.tiktokUrl || `https://tiktok.com/@${socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer"
                style={{ opacity: 0.6, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>
                TikTok
              </a>
            )}
          </div>
        )}

        <footer style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '2rem' }}>
          &copy; {new Date().getFullYear()} {siteName || 'Literary Book Broker'}
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <Link to="/privacy-policy" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Privacidad
          </Link>
        </footer>
      </div>
    </div>
  );
}
