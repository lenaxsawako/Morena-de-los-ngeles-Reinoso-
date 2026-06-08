import { useState, useEffect, type ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface MaintenanceStatus {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'maintenance' | 'pass'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/landing/maintenance-status`)
      .then(r => r.json())
      .then((data: MaintenanceStatus) => {
        if (cancelled) return;
        setStatus(data.maintenanceMode ? 'maintenance' : 'pass');
        setMessage(data.maintenanceMessage);
      })
      .catch(() => {
        if (!cancelled) setStatus('pass');
      });
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (status === 'maintenance') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#e5e2e1',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#F3EAD3', marginBottom: '1.5rem' }}>
          build
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Sitio en Mantenimiento
        </h1>
        <p style={{ fontSize: '1rem', color: '#ccc6bb', maxWidth: 400 }}>
          {message}
        </p>
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '2rem' }}>
          Estaremos de vuelta pronto.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
