import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/auth';
import { booksService } from '../../services/books';

export default function Checkout() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookId) return;

    if (!authService.isAuthenticated()) {
      navigate('/login');
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error creating checkout');
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      })
      .catch((err) => {
        setError(err.message || 'Error al crear checkout');
        setLoading(false);
      });
  }, [bookId, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-on-surface-variant">{error}</p>
        <button onClick={() => navigate(-1)} className="text-primary underline">Volver</button>
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
