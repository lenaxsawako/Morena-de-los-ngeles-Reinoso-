import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { favoritesService, type FavoriteItem } from '../../services/favorites';
import { authService } from '../../services/auth';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    favoritesService.getFavorites().then(data => {
      setFavorites(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center pt-32">
        <p className="text-on-surface-variant">Cargando favoritos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background pt-32 px-6 md:px-16 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-headline-lg text-headline-lg text-primary">Mis Favoritos</h1>
        <span className="text-on-surface-variant font-body-md">{favorites.length} libros</span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">favorite_outline</span>
          <p className="text-on-surface-variant font-body-lg">No tienes libros favoritos aún</p>
          <Link to="/catalog" className="inline-block mt-6 bg-primary text-on-primary px-8 py-3 rounded-full font-medium">
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {favorites.map((fav) => (
            <Link key={fav._id} to={`/book/${fav.book._id}`} className="group space-y-3">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-high relative">
                {fav.book.coverUrl ? (
                  <img src={fav.book.coverUrl} alt={fav.book.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">book</span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    favoritesService.removeFavorite(fav.book._id).then(() => {
                      setFavorites(prev => prev.filter(f => f._id !== fav._id));
                    });
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-red-400">favorite</span>
                </button>
              </div>
              <div>
                <p className="text-body-md font-medium text-primary truncate">{fav.book.title}</p>
                {fav.book.subtitle && (
                  <p className="text-body-sm text-on-surface-variant truncate">{fav.book.subtitle}</p>
                )}
                <p className="text-body-sm text-primary mt-1">
                  {fav.book.priceCents > 0 ? `$${(fav.book.priceCents / 100).toFixed(2)}` : 'Gratis'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
