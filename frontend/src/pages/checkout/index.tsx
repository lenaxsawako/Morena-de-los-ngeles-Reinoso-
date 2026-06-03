import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/auth';

export default function Checkout() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookId) return;

    if (!authService.isAuthenticated()) {
      navigate(`/login?redirect=/checkout/${bookId}`);
      return;
    }

    const token = authService.getToken();
    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}/checkout/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          navigate(`/login?redirect=/checkout/${bookId}`);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error creating checkout');
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      })
      .catch((err) => {
        if (err.message?.includes('401') || err.message?.includes('token')) {
          navigate(`/login?redirect=/checkout/${bookId}`);
          return;
        }
        setError(err.message || 'Error al crear checkout');
        setLoading(false);
      });
  }, [bookId, navigate]);

  if (error) {
    const isOwned = error.includes('Ya has comprado');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
        <span className={`material-symbols-outlined text-5xl ${isOwned ? 'text-green-400' : 'text-red-400'}`}>
          {isOwned ? 'check_circle' : 'error'}
        </span>
        <p className="text-on-surface-variant">{isOwned ? 'Ya tienes este libro en tu biblioteca' : error}</p>
        <div className="flex gap-4 mt-4">
          {isOwned ? (
            <button onClick={() => navigate(`/chapter/${bookId}`)} className="bg-primary text-background font-label-md px-8 py-4 tracking-widest uppercase hover:opacity-90">
              LEER AHORA
            </button>
          ) : (
            <button onClick={() => navigate(-1)} className="text-primary underline">Volver</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="profile-spinner" />
      <p className="text-on-surface-variant">Redirigiendo a Polar para completar el pago...</p>
    </div>
  );
}
