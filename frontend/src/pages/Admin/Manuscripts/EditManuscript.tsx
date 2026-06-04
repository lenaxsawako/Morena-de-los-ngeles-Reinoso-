import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminBooksService, type AdminBook, type UpdateBookInput, type DriveStatus, type DriveFile, type CloudinaryStatus } from '../../../services/adminBooks';
import './manuscripts-mobile.css';

export default function EditManuscript() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<AdminBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateBookInput>({});
  const [saving, setSaving] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ enabled: false, message: '' });
  const [cloudinaryStatus, setCloudinaryStatus] = useState<CloudinaryStatus>({ enabled: false, message: '' });
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);
  const [attachingDriveFile, setAttachingDriveFile] = useState(false);
  const [driveModalError, setDriveModalError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [notificationModal, setNotificationModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [allBooks, setAllBooks] = useState<AdminBook[]>([]);

  // Load book and drive status on mount
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('ID no proporcionado');
        setLoading(false);
        return;
      }

      try {
        // Load book data
        const data = await adminBooksService.getBook(id);
        if (data) {
          setBook(data);
          setCoverPreview(data.coverUrl || '');
          setCoverFile(null);
          setFormData({
            title: data.title,
            subtitle: data.subtitle,
            description: data.description,
            priceCents: data.priceCents,
            currency: data.currency,
            previewPages: data.previewPages,
            prequelRef: data.prequelRef || null,
          });
        } else {
          setError('Libro no encontrado');
        }

        // Check Google Drive status
        const [drive, cloudinary] = await Promise.all([
          adminBooksService.checkDriveStatus(),
          adminBooksService.checkCloudinaryStatus(),
        ]);
        setDriveStatus(drive);
        setCloudinaryStatus(cloudinary);

        // Load all published books for prequel selector
        const books = await adminBooksService.getBooks('published', 1, 500);
        setAllBooks(books.filter(b => b._id !== id));
      } catch (err) {
        setError('Error al cargar el libro: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'priceCents') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value ? parseFloat(value) : 0,
        }));
      }
    } else if (name === 'previewPages') {
      if (value === '' || /^\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value ? parseInt(value) : 0,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFeaturedToggle = () => {
    setFormData(prev => ({ ...prev, isFeatured: !(prev.isFeatured ?? book?.isFeatured ?? false) }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setCoverPreview(preview);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!book) return;

    setSaving(true);
    setError(null);
    try {
      let currentBook = book;

      if (coverFile) {
        if (!cloudinaryStatus.enabled) {
          setError(
            cloudinaryStatus.message ||
              'Cloudinary no está configurado. Configúralo en Ajustes → Almacenamiento para subir portadas.',
          );
          return;
        }
        const withCover = await adminBooksService.uploadBookCover(book._id, coverFile);
        if (!withCover) {
          setError('Error al subir la portada');
          return;
        }
        currentBook = withCover;
        setBook(withCover);
        setCoverFile(null);
        setCoverPreview(withCover.coverUrl || coverPreview);
      }

      const updated = await adminBooksService.updateBook(currentBook._id, formData);
      if (updated) {
        setBook(updated);
        setCoverPreview(updated.coverUrl || coverPreview);
        setNotificationModal({ type: 'success', message: 'Libro guardado exitosamente' });
      } else {
        setNotificationModal({ type: 'error', message: 'Error al guardar el libro' });
      }
    } catch (err) {
      setError((err as Error).message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const loadDriveFiles = async () => {
    if (!driveStatus.enabled) {
      setShowDriveModal(true);
      return;
    }

    setError(null);
    setDriveModalError(null);
    setLoadingDriveFiles(true);
    try {
      const files = await adminBooksService.listGoogleDriveFiles(driveStatus.booksFolderId);
      setDriveFiles(files);
      setShowDriveModal(true);
    } catch (err) {
      setDriveModalError((err as Error).message);
      setShowDriveModal(true);
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  const handleAttachDriveFile = async () => {
    if (!book || !selectedDriveFile) return;

    setAttachingDriveFile(true);
    setDriveModalError(null);
    try {
      const updated = await adminBooksService.attachDriveFile(
        book._id,
        selectedDriveFile,
      );
      if (updated) {
        setBook(updated);
        setSelectedDriveFile(null);
        setShowDriveModal(false);
        setNotificationModal({ type: 'success', message: 'PDF vinculado desde Google Drive' });
      } else {
        setDriveModalError('Error al vincular el PDF');
      }
    } catch (err) {
      setDriveModalError('Error al vincular PDF: ' + (err as Error).message);
    } finally {
      setAttachingDriveFile(false);
    }
  };

  const formatFileSize = (size?: string) => {
    if (!size) return 'Sin tamaÃ±o';
    const bytes = Number(size);
    if (!Number.isFinite(bytes)) return 'Sin tamaÃ±o';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <section className="admin-section">
        <div className="text-center py-12">
          <p className="text-on-surface-variant">Cargando...</p>
        </div>
      </section>
    );
  }

  if (error || !book) {
    return (
      <section className="admin-section">
        <div className="text-center py-12">
          <p className="text-error mb-4">{error || 'Manuscrito no encontrado'}</p>
          <button
            onClick={() => navigate('/admin/manuscripts')}
            className="mt-4 px-6 py-2 bg-secondary text-background rounded-lg font-label-md hover:opacity-90 transition-all"
          >
            Volver a Manuscritos
          </button>
        </div>
      </section>
    );
  }

  const statusLabel = book.isPreorder ? 'Preorden' : book.isPublished ? 'Publicado' : 'Borrador';
  const statusColor = book.isPublished ? 'text-on-error-container' : book.isPreorder ? 'text-secondary' : 'text-tertiary-fixed-dim';

  return (
    <>
      {/* Page Header */}
      <section className="admin-section mb-16">
        <button
          onClick={() => navigate('/admin/manuscripts')}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver a Manuscritos
        </button>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{book.title}</h1>
            <p className="text-on-surface-variant font-body-md mb-4">{book.description}</p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-widest">Total de Páginas</p>
                <p className="text-body-md text-primary">{book.totalPages}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-widest">Páginas Preview</p>
                <p className="text-body-md text-primary">{book.previewPages}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-widest">Precio</p>
                <p className="text-body-md text-primary">
                  ${(book.priceCents / 100).toFixed(2)} {book.currency}
                </p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant uppercase tracking-widest">Estado</p>
                <p className={`text-body-md font-semibold ${statusColor}`}>{statusLabel}</p>
              </div>
            </div>
          </div>
        </header>
      </section>

      {/* Edit Form */}
      <section className="admin-section">
        {/* Cover — arriba del formulario */}
        <div className="glass-card p-8 rounded-xl mb-8">
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-6">
            Portada del libro
          </h3>
          {!cloudinaryStatus.enabled && (
            <div className="mb-4 p-4 rounded-lg bg-error/10 border border-error/50">
              <p className="text-error text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">warning</span>
                {cloudinaryStatus.message || 'Cloudinary no está configurado. Configúralo en Ajustes → Almacenamiento.'}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-36 h-52 flex-shrink-0 border-2 border-dashed border-white/20 rounded-lg overflow-hidden bg-white/5">
              {coverPreview ? (
                <img src={coverPreview} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-50">
                    image
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <input
                type="file"
                id="edit-cover-input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="hidden"
                disabled={!cloudinaryStatus.enabled}
              />
              <label
                htmlFor="edit-cover-input"
                className={`block w-full sm:w-auto text-center bg-secondary/20 text-secondary border border-secondary px-6 py-3 rounded-lg font-label-md transition-opacity mb-2 ${
                  cloudinaryStatus.enabled ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {coverPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </label>
              <p className="text-on-surface-variant text-body-sm">
                JPG, PNG o WebP. Recomendado: 300×400px. Se sube a Cloudinary
                {cloudinaryStatus.folder ? ` (${cloudinaryStatus.folder})` : ''}.
              </p>
              {coverFile && (
                <p className="text-accent-gold text-body-sm mt-2">
                  Nueva portada pendiente — pulsa Guardar cambios para subirla.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Title & Details */}
            <div className="glass-card p-8 rounded-xl">
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-6">
                Detalles del Libro
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest mb-2 block">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:border-primary transition-colors focus:ring-0 text-primary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest mb-2 block">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle || ''}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:border-primary transition-colors focus:ring-0 text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="glass-card p-8 rounded-xl">
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-6">
                Descripción
              </h3>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/20 rounded-lg p-4 focus:border-primary transition-colors focus:ring-0 text-primary min-h-[200px]"
                placeholder="Descripción del libro..."
              />
            </div>

            {/* Pricing & Pages */}
            <div className="glass-card p-8 rounded-xl">
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-6">
                Precio y Páginas
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest mb-2 block">
                      Precio ({book.currency})
                    </label>
                    <input
                      type="text"
                      name="priceCents"
                      inputMode="decimal"
                      value={formData.priceCents ? (formData.priceCents / 100).toFixed(2) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setFormData(prev => ({
                            ...prev,
                            priceCents: value ? Math.round(parseFloat(value) * 100) : 0,
                          }));
                        }
                      }}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:border-primary transition-colors focus:ring-0 text-primary"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest mb-2 block">
                      Páginas Preview
                    </label>
                    <input
                      type="text"
                      name="previewPages"
                      inputMode="numeric"
                      value={formData.previewPages || ''}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b border-white/20 py-2 focus:border-primary transition-colors focus:ring-0 text-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drive PDF */}
            <div className="glass-card p-8 rounded-xl border-l-4" style={{ borderLeftColor: driveStatus.enabled ? '#F3EAD3' : '#ffb3b3' }}>
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-4">
                PDF en Google Drive
              </h3>

              {!driveStatus.enabled && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/50">
                  <p className="text-error text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    {driveStatus.message || 'Google Drive no está configurado.'}
                  </p>
                </div>
              )}

              {driveStatus.enabled && book.driveFileId && (
                <div className="mb-6 p-4 rounded-lg bg-on-error-container/10 border border-on-error-container/30">
                  <p className="text-on-error-container text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    PDF vinculado (ID: {book.driveFileId.slice(0, 20)}...)
                  </p>
                </div>
              )}

              <button
                onClick={loadDriveFiles}
                disabled={loadingDriveFiles}
                className="w-full bg-secondary text-background py-3 rounded-lg font-label-md text-label-md tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">{loadingDriveFiles ? 'hourglass_empty' : 'folder_open'}</span>
                {loadingDriveFiles ? 'Cargando...' : book.driveFileId ? 'Cambiar PDF' : 'Elegir PDF de Drive'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col md:flex-row">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-accent-gold text-background py-4 rounded-lg font-label-md text-label-md tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={() => navigate('/admin/manuscripts')}
                className="flex-1 border border-white/20 text-primary py-4 rounded-lg font-body-md hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Metadata */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Metadatos</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                    ID del Libro
                  </p>
                  <p className="text-body-sm text-on-surface-variant break-all">{book._id}</p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                    Slug
                  </p>
                  <p className="text-body-md text-primary">{book.slug}</p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                    Creado
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {new Date(book.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-1">
                    Actualizado
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {new Date(book.updatedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-label-md text-on-surface-variant uppercase tracking-widest">
                        Colección Seleccionada
                      </p>
                      <p className="text-body-xs text-on-surface-variant mt-0.5">Historias Destacadas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured ?? book.isFeatured ?? false}
                        onChange={handleFeaturedToggle}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-accent-gold peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-2">
                    Polar Product ID
                  </p>
                  <input
                    type="text"
                    value={formData.polarProductId ?? book.polarProductId ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, polarProductId: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary"
                    placeholder="prod_xxx..."
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-2">
                    Serie / Precuela
                  </p>
                  <select
                    value={formData.prequelRef ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, prequelRef: e.target.value || null }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="">— Sin precuela —</option>
                    {allBooks.map(b => (
                      <option key={b._id} value={b._id}>{b.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Drive File Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl max-w-3xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-4xl text-secondary">folder_open</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary mb-1">
                    Google Drive
                  </h2>
                  <p className="text-body-sm text-on-surface-variant">
                    {driveStatus.enabled ? 'Selecciona un PDF de la carpeta de libros.' : 'Google Drive no está configurado.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {!driveStatus.enabled && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error text-body-sm">
                  Google Drive debe estar activo y tener una carpeta de libros configurada.
                </div>
              )}

              {driveModalError && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error text-body-sm">
                  {driveModalError}
                </div>
              )}

              {driveStatus.enabled && loadingDriveFiles && (
                <div className="py-10 text-center text-on-surface-variant">Cargando archivos...</div>
              )}

              {driveStatus.enabled && !loadingDriveFiles && driveFiles.length === 0 && (
                <div className="py-10 text-center text-on-surface-variant">No hay PDFs en esta carpeta.</div>
              )}

              {driveStatus.enabled && !loadingDriveFiles && driveFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {driveFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedDriveFile(file)}
                      className={`text-left p-4 rounded-lg border transition-all ${
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
                          {file.modifiedTime && (
                            <p className="text-on-surface-variant text-body-xs">
                              {new Date(file.modifiedTime).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedDriveFile && (
                <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                  <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-2">Archivo seleccionado</p>
                  <p className="text-primary break-all">{selectedDriveFile.name}</p>
                  <p className="text-body-sm text-on-surface-variant mt-2">El total de páginas se detectará automáticamente.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => {
                  setShowDriveModal(false);
                  setSelectedDriveFile(null);
                }}
                className="flex-1 py-3 px-4 border border-white/20 rounded-lg font-label-md text-label-md text-primary hover:bg-white/5 transition-colors"
                disabled={attachingDriveFile}
              >
                Cancelar
              </button>
              {driveStatus.enabled ? (
                <button
                  onClick={handleAttachDriveFile}
                  disabled={!selectedDriveFile || attachingDriveFile}
                  className="flex-1 py-3 px-4 bg-secondary text-background rounded-lg font-label-md text-label-md tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">{attachingDriveFile ? 'hourglass_empty' : 'link'}</span>
                  {attachingDriveFile ? 'Vinculando...' : 'Vincular PDF'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowDriveModal(false);
                    navigate('/admin/settings?tab=storage');
                  }}
                  className="flex-1 py-3 px-4 bg-secondary text-background rounded-lg font-label-md text-label-md tracking-widest uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">settings</span>
                  Ir a Configuración
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-lg max-w-sm w-full p-6 border border-white/10">
            <div className="flex items-start gap-3 mb-4">
              <span
                className={`material-symbols-outlined text-3xl ${
                  notificationModal.type === 'success' ? 'text-accent-gold' : 'text-error'
                }`}
              >
                {notificationModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <div>
                <h3 className="text-headline-md font-headline-md text-primary">
                  {notificationModal.type === 'success' ? 'Success' : 'Error'}
                </h3>
                <p className="text-on-surface-variant text-body-sm mt-1">{notificationModal.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotificationModal(null)}
              className="w-full px-4 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
