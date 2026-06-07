import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminBooksService, type AdminBook, type DashboardStats, type DriveStatus, type DriveFile } from '../../../services/adminBooks';
import BookCreationModal from './BookCreationModal';

const TAB_FILTERS = ['Todos los Libros', 'Publicados', 'Borradores', 'Pre-Órdenes'];

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-on-error-container/20 text-on-error-container',
  draft: 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim',
  preorder: 'bg-secondary/20 text-secondary',
};

const getStatusLabel = (book: AdminBook): string => {
  if (book.isPreorder) return 'Preorden';
  if (book.isPublished) return 'Publicado';
  return 'Borrador';
};

const getStatusKey = (book: AdminBook): string => {
  if (book.isPreorder) return 'preorder';
  if (book.isPublished) return 'published';
  return 'draft';
};

export default function Manuscripts() {
  const [activeTab, setActiveTab] = useState('Todos los Libros');
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNewMode = searchParams.get('new') === 'true';

  // Drive PDF Modal States
  const [pdfUploadModal, setPdfUploadModal] = useState<{ bookId: string; bookTitle: string } | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ enabled: false, message: '' });
  const [showDriveConfigModal, setShowDriveConfigModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);
  const [attachingDriveFile, setAttachingDriveFile] = useState(false);
  const [driveModalError, setDriveModalError] = useState<string | null>(null);
  const [publishingBookId, setPublishingBookId] = useState<string | null>(null);
  const [publishModal, setPublishModal] = useState<{
    book: AdminBook;
    variant: 'publish' | 'confirm-unpublish';
    missingPdf?: boolean;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<'normal' | 'preorder'>('normal');
  const [releaseDate, setReleaseDate] = useState('');

  // Load dashboard and books on mount
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, allBooks, drive] = await Promise.all([
        adminBooksService.getDashboard(),
        adminBooksService.getBooks(),
        adminBooksService.checkDriveStatus(),
      ]);
      setDashboard(dashboardData);
      setBooks(allBooks);
      setDriveStatus(drive);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUploadClick = async (bookId: string, bookTitle: string) => {
    setSelectedDriveFile(null);
    setDriveModalError(null);
    setPdfUploadModal({ bookId, bookTitle });
    if (!driveStatus.enabled) {
      return;
    }

    setLoadingDriveFiles(true);
    try {
      const files = await adminBooksService.listGoogleDriveFiles(driveStatus.booksFolderId);
      setDriveFiles(files);
    } catch (err) {
      setDriveModalError((err as Error).message);
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  const handlePdfSubmit = async () => {
    if (!pdfUploadModal || !selectedDriveFile) return;

    if (!driveStatus.enabled) {
      setPdfUploadModal(null);
      setShowDriveConfigModal(true);
      return;
    }

    setAttachingDriveFile(true);
    try {
      const updated = await adminBooksService.attachDriveFile(pdfUploadModal.bookId, selectedDriveFile);
      if (updated) {
        setBooks(books.map(b => b._id === pdfUploadModal.bookId ? updated : b));
        setPdfUploadModal(null);
        setSelectedDriveFile(null);
        alert('PDF vinculado desde Google Drive');
      } else {
        alert('Error al vincular el PDF');
      }
    } catch (err) {
      alert('Error al vincular PDF: ' + (err as Error).message);
    } finally {
      setAttachingDriveFile(false);
    }
  };

  const formatFileSize = (size?: string) => {
    if (!size) return 'Sin tamaño';
    const bytes = Number(size);
    if (!Number.isFinite(bytes)) return 'Sin tamaño';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const updateDashboardFromBooks = (allBooks: AdminBook[]) => {
    setDashboard((prev) =>
      prev
        ? {
            ...prev,
            publishedBooks: allBooks.filter((b) => b.isPublished && !b.isPreorder).length,
            draftBooks: allBooks.filter((b) => !b.isPublished && !b.isPreorder).length,
            preorders: allBooks.filter((b) => b.isPreorder).length,
          }
        : prev,
    );
  };

  const openPublishModal = (book: AdminBook) => {
    setPublishError(null);
    setPublishMode('normal');
    setReleaseDate('');
    if (book.isPublished) {
      setPublishModal({ book, variant: 'confirm-unpublish' });
      return;
    }
    setPublishModal({
      book,
      variant: 'publish',
      missingPdf: !book.driveFileId,
    });
  };

  const closePublishModal = () => {
    if (publishingBookId) return;
    setPublishModal(null);
    setPublishError(null);
    setPublishMode('normal');
    setReleaseDate('');
  };

  const confirmPublishAction = async () => {
    if (!publishModal) return;

    const { book } = publishModal;
    const isUnpublish = publishModal.variant === 'confirm-unpublish';

    if (!isUnpublish && publishMode === 'preorder' && !releaseDate) {
      setPublishError('Indica la fecha de lanzamiento para la pre-compra.');
      return;
    }

    setPublishingBookId(book._id);
    setPublishError(null);
    try {
      const updated = isUnpublish
        ? await adminBooksService.unpublishBook(book._id)
        : await adminBooksService.publishBook(book._id, {
            asPreorder: publishMode === 'preorder',
            releaseDate: publishMode === 'preorder' ? releaseDate : undefined,
          });

      if (updated) {
        const nextBooks = books.map((b) => (b._id === book._id ? updated : b));
        setBooks(nextBooks);
        updateDashboardFromBooks(nextBooks);
        setPublishModal(null);
      } else {
        setPublishError(`Error al ${isUnpublish ? 'despublicar' : 'publicar'} el libro`);
      }
    } catch (err) {
      setPublishError((err as Error).message);
    } finally {
      setPublishingBookId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isNewMode) {
    return <BookCreationModal onSuccess={() => {
      navigate('/admin/manuscripts');
      loadData();
    }} />;
  }

  // Filter books by tab
  const getFilteredBooks = () => {
    switch (activeTab) {
      case 'Publicados':
        return books.filter((b) => b.isPublished && !b.isPreorder);
      case 'Borradores':
        return books.filter((b) => !b.isPublished && !b.isPreorder);
      case 'Pre-Órdenes':
        return books.filter((b) => b.isPreorder);
      default:
        return books;
    }
  };

  const filteredBooks = getFilteredBooks();

  return (
    <>
      {/* Dashboard Summary */}
      <section className="admin-section mb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4">
            <div className="text-on-surface-variant font-body-sm mb-2">Total de Libros</div>
            <div className="text-3xl font-headline-lg text-primary">
              {dashboard?.totalBooks ?? 0}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="text-on-surface-variant font-body-sm mb-2">Publicados</div>
            <div className="text-3xl font-headline-lg text-on-error-container">
              {dashboard?.publishedBooks ?? 0}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="text-on-surface-variant font-body-sm mb-2">Borradores</div>
            <div className="text-3xl font-headline-lg text-tertiary-fixed-dim">
              {dashboard?.draftBooks ?? 0}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="text-on-surface-variant font-body-sm mb-2">Pre-Ordenes</div>
            <div className="text-3xl font-headline-lg text-secondary">
              {dashboard?.preorders ?? 0}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="text-on-surface-variant font-body-sm mb-2">Ingresos Totales</div>
            <div className="text-3xl font-headline-lg text-accent-gold">
              ${(dashboard?.revenue?.total ?? 0).toFixed(2)}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="text-on-surface-variant font-body-sm mb-2">Compras Totales</div>
            <div className="text-3xl font-headline-lg text-primary">
              {dashboard?.totalPurchases ?? 0}
            </div>
          </div>
        </div>
      </section>

      {/* Page Header */}
      <section className="admin-section mb-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Gestión de Libros
            </h1>
            <p className="text-on-surface-variant font-body-md max-w-[600px]">
              Administra tu Catálogo de libros: publica, edita, sube PDFs y monitorea estadísticas de ventas.
            </p>
          </div>
          <button 
            onClick={() => navigate('?new=true')}
            className="bg-accent-gold text-surface px-8 py-3 font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Nuevo Libro
          </button>
        </header>
      </section>

      {/* Tabs & Filters */}
      <section className="admin-section mb-12">
        <div className="hidden md:flex items-center border-b border-white/10 space-x-12 overflow-x-auto">
          {TAB_FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-accent-gold'
                  : 'text-on-surface-variant hover:text-primary border-b-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mobile Tabs - Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-min px-2">
            {TAB_FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all text-label-md ${
                  activeTab === tab
                    ? 'bg-accent-gold text-surface'
                    : 'bg-white/5 border border-white/10 text-on-surface-variant hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="admin-section">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-on-surface-variant">Cargando libros...</div>
          </div>
        )}

        {error && (
          <div className="glass-card p-6 border border-error/50 bg-error/10">
            <div className="text-error">{error}</div>
          </div>
        )}

        {!loading && !error && filteredBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50 mb-4">
              auto_stories
            </span>
            <p className="text-on-surface-variant font-body-md">
              No hay libros en esta categorÃ­a
            </p>
          </div>
        )}

        {!loading && !error && filteredBooks.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
            {filteredBooks.map((book) => (
              <div
                key={book._id}
                className="glass-card p-6 flex flex-col md:flex-row gap-6 relative group overflow-hidden"
              >
                {/* Cover Image */}
                <div className="w-full md:w-48 h-64 flex-shrink-0 relative overflow-hidden">
                  <img
                    src={book.coverUrl || 'https://via.placeholder.com/300x400?text=Book+Cover'}
                    alt={book.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-300"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <span
                        className={`px-3 py-1 text-label-md font-label-md uppercase tracking-widest rounded-lg flex-shrink-0 ${
                          STATUS_COLORS[getStatusKey(book)]
                        }`}
                      >
                        {getStatusLabel(book)}
                      </span>
                      <span className="text-on-surface-variant text-body-sm italic flex-shrink-0">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="font-headline-md text-headline-md text-primary mb-1">
                      {book.title}
                    </h2>
                    {book.subtitle && (
                      <p className="text-on-surface-variant font-body-sm italic mb-2">
                        {book.subtitle}
                      </p>
                    )}
                    <p className="text-on-surface-variant font-body-sm mb-4 line-clamp-2">
                      {book.description}
                    </p>
                  </div>

                  {/* Book Info */}
                  <div className="space-y-3 py-4 border-t border-white/10">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-on-surface-variant text-body-xs uppercase">Precio</div>
                        <div className="text-accent-gold font-semibold">
                          {adminBooksService.formatPrice(book.priceCents)}
                        </div>
                      </div>
                      <div>
                        <div className="text-on-surface-variant text-body-xs uppercase">Preview</div>
                        <div className="text-primary font-semibold">{book.previewPages} Páginas</div>
                      </div>
                      <div>
                        <div className="text-on-surface-variant text-body-xs uppercase">Total</div>
                        <div className="text-primary font-semibold">{book.totalPages} Páginas</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => navigate(`/admin/manuscripts/${book._id}`)}
                      className="flex-1 border border-white/20 py-2 text-label-md hover:border-accent-gold hover:text-accent-gold transition-all text-center"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handlePdfUploadClick(book._id, book.title)}
                      className="p-2 border border-white/20 hover:border-accent-gold hover:text-accent-gold transition-all"
                      title="Elegir PDF de Drive"
                    >
                      <span className="material-symbols-outlined">folder_open</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/manuscripts/${book._id}/analytics`)}
                      className="p-2 border border-white/20 hover:border-accent-gold hover:text-accent-gold transition-all"
                      title="Ver estadÃ­sticas"
                    >
                      <span className="material-symbols-outlined">bar_chart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPublishModal(book)}
                      disabled={publishingBookId === book._id}
                      className={`p-2 border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        book.isPublished
                          ? 'border-on-error-container/40 text-on-error-container hover:border-on-error-container'
                          : 'hover:border-accent-gold hover:text-accent-gold'
                      }`}
                      title={book.isPublished ? 'Despublicar' : 'Publicar'}
                    >
                      <span className="material-symbols-outlined">
                        {publishingBookId === book._id
                          ? 'hourglass_empty'
                          : book.isPublished
                            ? 'public_off'
                            : 'publish'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`¿Eliminar "${book.title}"? Esta acción no se puede deshacer.`)) return;
                        const result = await adminBooksService.deleteBook(book._id);
                        if (result) {
                          setBooks(prev => prev.filter(b => b._id !== book._id));
                        }
                      }}
                      className="p-2 border border-white/20 hover:border-on-error-container hover:text-on-error-container transition-all"
                      title="Eliminar libro"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Drive PDF Modal */}
      {pdfUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-lg max-w-2xl w-full p-6 border border-white/10 max-h-[85vh] flex flex-col">
            <h3 className="text-headline-md font-headline-md text-primary mb-4">
              Elegir PDF: {pdfUploadModal.bookTitle}
            </h3>

            {!driveStatus.enabled && (
              <div className="bg-error/10 border border-error/30 rounded p-4 mb-4 text-error text-body-sm">
                <p className="font-semibold mb-2">Google Drive no está configurado</p>
                <p>Configura la carpeta de libros antes de vincular PDFs.</p>
              </div>
            )}

            {driveModalError && (
              <div className="bg-error/10 border border-error/30 rounded p-4 mb-4 text-error text-body-sm">
                {driveModalError}
              </div>
            )}

            {driveStatus.enabled && (
              <div className="overflow-y-auto pr-1 mb-4 space-y-3">
                {loadingDriveFiles && (
                  <div className="py-8 text-center text-on-surface-variant">Cargando archivos...</div>
                )}

                {!loadingDriveFiles && driveFiles.length === 0 && (
                  <div className="py-8 text-center text-on-surface-variant">No hay PDFs en esta carpeta.</div>
                )}

                {!loadingDriveFiles && driveFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedDriveFile(file)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedDriveFile?.id === file.id
                        ? 'border-accent-gold bg-accent-gold/10'
                        : 'border-white/10 bg-white/5 hover:border-secondary/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-3xl text-secondary">picture_as_pdf</span>
                      <div className="min-w-0">
                        <p className="text-primary font-body-md truncate">{file.name}</p>
                        <p className="text-on-surface-variant text-body-sm">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setPdfUploadModal(null);
                  setSelectedDriveFile(null);
                }}
                className="flex-1 px-4 py-2 border border-white/20 text-on-surface hover:border-white/40 transition-all rounded"
                disabled={attachingDriveFile}
              >
                Cancelar
              </button>
              {driveStatus.enabled ? (
                <button
                  onClick={handlePdfSubmit}
                  disabled={!selectedDriveFile || attachingDriveFile}
                  className="flex-1 px-4 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {attachingDriveFile ? 'Vinculando...' : 'Vincular'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPdfUploadModal(null);
                    setShowDriveConfigModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
                >
                  Configurar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish / Unpublish Modal */}
      {publishModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-lg max-w-md w-full p-6 border border-white/10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <span
                  className={`material-symbols-outlined text-4xl ${
                    publishModal.variant === 'confirm-unpublish'
                      ? 'text-on-error-container'
                      : publishModal.missingPdf
                        ? 'text-warning'
                        : 'text-accent-gold'
                  }`}
                >
                  {publishModal.variant === 'confirm-unpublish'
                    ? 'public_off'
                    : publishModal.missingPdf
                      ? 'warning'
                      : 'publish'}
                </span>
                <div>
                  <h3 className="text-headline-md font-headline-md text-primary">
                    {publishModal.variant === 'confirm-unpublish' && 'Despublicar libro'}
                    {publishModal.variant === 'publish' && 'Publicar libro'}
                  </h3>
                  <p className="text-on-surface-variant text-body-sm mt-1">{publishModal.book.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePublishModal}
                disabled={!!publishingBookId}
                className="p-1 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {publishError && (
              <div className="bg-error/10 border border-error/30 rounded p-4 mb-4 text-error text-body-sm">
                {publishError}
              </div>
            )}

            {publishModal.variant === 'confirm-unpublish' && (
              <p className="text-on-surface-variant text-body-sm mb-6">
                El libro dejará de mostrarse en el catálogo. Quienes ya lo compraron conservan el acceso en su biblioteca.
              </p>
            )}

            {publishModal.variant === 'publish' && (
              <>
                {publishModal.missingPdf && (
                  <div className="bg-warning/10 border border-warning/30 rounded p-4 mb-4 text-body-sm text-on-surface-variant">
                    No hay PDF vinculado en Google Drive. Puedes publicar igualmente, pero conviene vincular el archivo antes.
                  </div>
                )}

                <p className="text-on-surface-variant text-body-sm mb-4">
                  Elige cómo quieres publicar este libro en el catálogo:
                </p>

                <div className="space-y-3 mb-4">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:border-accent-gold/50 transition-colors">
                    <input
                      type="radio"
                      name="publishMode"
                      checked={publishMode === 'normal'}
                      onChange={() => setPublishMode('normal')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-primary font-body-md">Publicación normal</p>
                      <p className="text-on-surface-variant text-body-sm">
                        Disponible para compra inmediata en el catálogo.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:border-secondary/50 transition-colors">
                    <input
                      type="radio"
                      name="publishMode"
                      checked={publishMode === 'preorder'}
                      onChange={() => setPublishMode('preorder')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-primary font-body-md">Pre-compra</p>
                      <p className="text-on-surface-variant text-body-sm">
                        Los lectores podrán reservarlo antes de la fecha de lanzamiento.
                      </p>
                    </div>
                  </label>
                </div>

                {publishMode === 'preorder' && (
                  <div className="mb-4">
                    <label className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest mb-2 block">
                      Fecha de lanzamiento
                    </label>
                    <input
                      type="date"
                      value={releaseDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 text-primary focus:border-primary transition-colors"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closePublishModal}
                disabled={!!publishingBookId}
                className="flex-1 px-4 py-2 border border-white/20 text-on-surface hover:border-white/40 transition-all rounded disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPublishAction}
                disabled={!!publishingBookId}
                className={`flex-1 px-4 py-2 font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  publishModal.variant === 'confirm-unpublish'
                    ? 'bg-on-error-container/20 text-on-error-container border border-on-error-container/40 hover:bg-on-error-container/30'
                    : 'bg-accent-gold text-surface hover:bg-accent-gold/90'
                }`}
              >
                {publishingBookId && (
                  <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                )}
                {publishModal.variant === 'confirm-unpublish'
                  ? publishingBookId
                    ? 'Despublicando...'
                    : 'Despublicar'
                  : publishingBookId
                    ? 'Publicando...'
                    : publishMode === 'preorder'
                      ? 'Publicar pre-compra'
                      : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drive Configuration Modal */}
      {showDriveConfigModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-lg max-w-md w-full p-6 border border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <span className="material-symbols-outlined text-4xl text-warning">warning</span>
              <div>
                <h3 className="text-headline-md font-headline-md text-primary">
                  Google Drive no configurado
                </h3>
              </div>
            </div>

            <p className="text-on-surface-variant text-body-sm mb-4">
              Para subir archivos PDF, necesitas configurar Google Drive en los ajustes de tu cuenta.
            </p>

            <div className="bg-on-surface/5 rounded p-4 mb-4">
              <h4 className="font-semibold text-primary text-body-sm mb-2">Pasos para configurar:</h4>
              <ol className="text-on-surface-variant text-body-xs space-y-2 list-decimal list-inside">
                <li>Ve a ConfiguraciÃ³n â†’ Almacenamiento</li>
                <li>Conecta tu cuenta de Google Drive</li>
                <li>Autoriza el acceso a la aplicaciÃ³n</li>
                <li>Vuelve e intenta subir el PDF nuevamente</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDriveConfigModal(false)}
                className="flex-1 px-4 py-2 border border-white/20 text-on-surface hover:border-white/40 transition-all rounded"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowDriveConfigModal(false);
                  navigate('/admin/settings?tab=storage');
                }}
                className="flex-1 px-4 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
              >
                Ir a ConfiguraciÃ³n
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
