import React, { useState, useEffect, type ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface LaunchStatus {
  launchMode: boolean;
  launchDate: string | null;
}

export default function LaunchGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'gate' | 'pass'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/landing/launch-status`)
      .then(r => r.json())
      .then((data: LaunchStatus) => {
        if (cancelled) return;
        const launched = !data.launchMode || (!!data.launchDate && new Date(data.launchDate) <= new Date());
        setStatus(launched ? 'pass' : 'gate');
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

  if (status === 'gate') {
    const ComingSoon = React.lazy(() => import('../pages/ComingSoon'));
    return (
      <React.Suspense fallback={null}>
        <ComingSoon />
      </React.Suspense>
    );
  }

  return <>{children}</>;
}
