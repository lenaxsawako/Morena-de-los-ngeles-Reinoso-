import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { booksService, type BookDetail } from '../../services/books';

export default function Book() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('ID no proporcionado');
      setLoading(false);
      return;
    }

    booksService.getBookById(id).then(data => {
      if (data) {
        setBook(data);
      } else {
        setError('Libro no encontrado');
      }
    }).catch(() => {
      setError('Error al cargar el libro');
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center">
        <p className="text-on-surface-variant">Cargando...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-error">{error || 'Libro no encontrado'}</p>
          <button
            onClick={() => navigate('/catalog')}
            className="bg-primary text-on-primary px-6 py-3 rounded-full font-medium"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  const price = book.priceCents > 0 ? `$${(book.priceCents / 100).toFixed(2)} ${book.currency}` : 'Gratis';

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="border-b border-outline-variant px-6 py-4 sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="material-symbols-outlined notranslate" translate="no">arrow_back</span>
          <span className="text-body-md font-medium">Volver</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 mb-12">
          {/* Cover */}
          <div className="rounded-xl overflow-hidden shadow-lg">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-auto aspect-[3/4] object-cover"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-surface-high flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">book</span>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            <div>
              {book.category && (
                <p className="text-label-md text-on-surface-variant font-medium uppercase mb-2">
                  {book.category.name}
                </p>
              )}
              <h1 className="text-display-lg font-bold mb-2">{book.title}</h1>
              {book.subtitle && (
                <p className="text-headline-md text-on-surface-variant">{book.subtitle}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="space-y-1">
                <p className="text-label-md text-on-surface-variant">Páginas</p>
                <p className="text-headline-md font-medium">{book.totalPages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-label-md text-on-surface-variant">Páginas Preview</p>
                <p className="text-headline-md font-medium">{book.previewPages}</p>
              </div>
              {(book.priceCents > 0) && (
                <div className="space-y-1">
                  <p className="text-label-md text-on-surface-variant">Precio</p>
                  <p className="text-headline-md font-medium">{price}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate(`/chapter/${book._id}`)}
                className="flex-1 bg-primary text-on-primary py-3 rounded-full font-medium text-body-md hover:shadow-lg transition-shadow"
              >
                Leer Online
              </button>
              {book.priceCents > 0 && (
                <button
                  onClick={() => navigate(`/checkout/${id}`)}
                  className="flex-1 border border-outline text-primary py-3 rounded-full font-medium text-body-md hover:bg-surface-container transition-colors"
                >
                  Comprar ({price})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="max-w-3xl space-y-4">
            <h2 className="text-headline-lg font-bold">Sinopsis</h2>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              {book.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
