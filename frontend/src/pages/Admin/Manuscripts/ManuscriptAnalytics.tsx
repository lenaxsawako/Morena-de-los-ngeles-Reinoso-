import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminBooksService, type AdminBook, type BookAnalytics } from '../../../services/adminBooks';
import './manuscripts-mobile.css';

export default function ManuscriptAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<AdminBook | null>(null);
  const [analytics, setAnalytics] = useState<BookAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); setError(true); return; }
    Promise.all([
      adminBooksService.getBook(id),
      adminBooksService.getBookAnalytics(id),
    ]).then(([bookData, analyticsData]) => {
      if (!bookData) {
        setError(true);
      } else {
        setBook(bookData);
        setAnalytics(analyticsData);
      }
    }).catch(() => {
      setError(true);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <section className="admin-section">
        <div className="flex items-center justify-center py-20">
          <div className="profile-spinner" />
        </div>
      </section>
    );
  }

  if (error || !book) {
    return (
      <section className="admin-section">
        <div className="text-center py-12">
          <p className="text-on-surface-variant">Analytics not found</p>
          <button
            onClick={() => navigate('/admin/manuscripts')}
            className="mt-4 text-primary hover:text-secondary transition-colors"
          >
            Back to Manuscripts
          </button>
        </div>
      </section>
    );
  }

  const stats = analytics || { sales: 0, revenue: 0, readers: 0, conversionRate: 0, averageProgress: 0 };
  const price = book.priceCents > 0 ? `$${(book.priceCents / 100).toFixed(2)} ${book.currency}` : 'Gratis';

  return (
    <>
      <section className="admin-section mb-16">
        <button
          onClick={() => navigate('/admin/manuscripts')}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Manuscripts
        </button>
        <header>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{book.title}</h1>
          <p className="text-on-surface-variant font-body-md">
            {book.subtitle ? `${book.subtitle} — ` : ''}{price}
          </p>
        </header>
      </section>

      <section className="admin-section mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter lg:gap-12">
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">Sales</p>
            <p className="text-headline-md text-primary mb-2">{stats.sales}</p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">Revenue</p>
            <p className="text-headline-md text-primary mb-2">${stats.revenue.toFixed(2)}</p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">Readers</p>
            <p className="text-headline-md text-primary mb-2">{stats.readers}</p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">Conversion Rate</p>
            <p className="text-headline-md text-primary mb-2">{(stats.conversionRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </section>

      <section className="admin-section mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter lg:gap-12">
          <div className="glass-card p-8 rounded-xl">
            <h3 className="font-headline-sm text-primary mb-6">Reading Progress</h3>
            <div className="flex items-end gap-3 mb-2">
              <p className="text-display-lg text-headline-md text-primary">{stats.averageProgress}%</p>
              <p className="text-body-sm text-on-surface-variant mb-1">average</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${stats.averageProgress}%` }} />
            </div>
          </div>

          <div className="glass-card p-8 rounded-xl">
            <h3 className="font-headline-sm text-primary mb-6">Book Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Status</span>
                <span className="text-primary">{book.isPublished ? 'Published' : 'Draft'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Price</span>
                <span className="text-primary">{price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Pages</span>
                <span className="text-primary">{book.totalPages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Featured</span>
                <span className="text-primary">{book.isFeatured ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-section mt-8">
        <div className="flex gap-4 flex-col md:flex-row justify-center">
          <button
            onClick={() => navigate(`/admin/manuscripts/${book._id}`)}
            className="px-8 py-3 border border-white/10 text-primary rounded-lg hover:bg-white/5 transition-colors font-label-md uppercase tracking-widest"
          >
            Back to Editing
          </button>
        </div>
      </section>
    </>
  );
}
