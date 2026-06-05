import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: true, marketing: true }));
    setVisible(false);
  };

  const handleEssentials = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: false, marketing: false }));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-3xl bg-surface-container border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-body-sm text-on-surface-variant flex-1">
          Usamos cookies para mejorar tu experiencia. Podés aceptarlas todas o solo las esenciales.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleEssentials}
            className="px-4 py-2 rounded-xl border border-white/10 text-label-sm text-on-surface-variant hover:bg-white/5 transition-colors"
          >
            Solo esenciales
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-xl bg-primary text-label-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
