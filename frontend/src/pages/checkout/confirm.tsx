import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paymentsService } from '../../services/payments';

export default function ConfirmPurchase() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    async function syncPurchase() {
      try {
        const purchases = await paymentsService.getPurchases();
        const purchasedBookIds = purchases
          .filter((p) => p.status === 'paid' || p.status === 'completed')
          .map((p) => p.bookRef);
        const existing = JSON.parse(localStorage.getItem('purchasedBooks') || '[]');
        const merged = [...new Set([...existing, ...purchasedBookIds])];
        localStorage.setItem('purchasedBooks', JSON.stringify(merged));
      } catch {
        // Silently fail — user can still navigate manually
      } finally {
        setSyncing(false);
      }
    }
    syncPurchase();
  }, []);

  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="profile-spinner" />
        <p className="text-on-surface-variant">Verificando tu compra...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
      <span className="material-symbols-outlined text-6xl text-green-400">check_circle</span>
      <h1 className="font-headline-lg text-headline-lg text-primary">¡Compra Exitosa!</h1>
      <p className="text-on-surface-variant max-w-md">
        Gracias por tu compra. El libro ya está disponible en tu biblioteca.
      </p>
      {checkoutId && (
        <p className="text-on-surface-variant text-sm">
          ID de transacción: {checkoutId}
        </p>
      )}
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => navigate(`/chapter/${bookId}`)}
          className="bg-primary text-background font-label-md px-8 py-4 tracking-widest uppercase hover:opacity-90"
        >
          LEER AHORA
        </button>
        <button
          onClick={() => navigate('/library')}
          className="border border-white/20 text-primary font-label-md px-8 py-4 tracking-widest uppercase hover:border-white/40"
        >
          IR A BIBLIOTECA
        </button>
      </div>
    </div>
  );
}
