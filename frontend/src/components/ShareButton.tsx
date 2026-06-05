import { useState, useRef, useEffect } from 'react';

const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

interface Props {
  title: string;
  currentPage?: number;
  totalPages?: number;
  progressPercentage?: number;
  authorName?: string;
  bookUrl?: string;
}

export default function ShareButton({ title, currentPage, totalPages, progressPercentage, authorName, bookUrl }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isComplete = totalPages ? currentPage! >= totalPages : (progressPercentage ?? 0) >= 100;

  const statusText = isComplete
    ? `Terminé "${title}" de ${authorName || 'la autora'} ⭐ — lo leí en ${SITE_URL}`
    : currentPage && totalPages
      ? `Llevo ${currentPage} páginas de "${title}" de ${authorName || 'la autora'} 📖 — lo estoy leyendo en ${SITE_URL}`
      : `Voy ${progressPercentage ?? 0}% de "${title}" de ${authorName || 'la autora'} 📖 — lo estoy leyendo en ${SITE_URL}`;

  const shareUrl = bookUrl ? `${SITE_URL}/book/${bookUrl}` : SITE_URL;

  const handleNativeShare = async () => {
    if (!('share' in navigator)) return false;
    try {
      await (navigator as any).share({ title, text: statusText, url: shareUrl });
      return true;
    } catch {
      return false;
    }
  };

  const handleClick = async () => {
    const shared = await handleNativeShare();
    if (!shared) setDropdownOpen(o => !o);
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(statusText)}`, '_blank', 'noopener');
    setDropdownOpen(false);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(statusText + '\n' + shareUrl)}`, '_blank', 'noopener');
    setDropdownOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(statusText + '\n' + shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setDropdownOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={handleClick} title="Compartir progreso" className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-lg">share</span>
      </button>

      {dropdownOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-surface-container border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[180px] z-50">
          <button onClick={handleTwitter} className="w-full flex items-center gap-3 px-4 py-3 text-body-sm text-on-surface hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </button>
          <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 text-body-sm text-on-surface hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-lg">chat</span>
            WhatsApp
          </button>
          <button onClick={handleCopy} className="w-full flex items-center gap-3 px-4 py-3 text-body-sm text-on-surface hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-lg">link</span>
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>
        </div>
      )}
    </div>
  );
}
