import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-surface-container rounded-2xl max-w-sm w-full shadow-2xl p-6"
      >
        {title && <h3 className="font-headline-md text-headline-md text-primary mb-2">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
