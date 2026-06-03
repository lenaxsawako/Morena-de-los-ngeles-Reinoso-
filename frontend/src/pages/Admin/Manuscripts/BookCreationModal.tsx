import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminBooksService, type CreateBookInput, type Category } from '../../../services/adminBooks';

interface FormData {
  title: string;
  subtitle?: string;
  description: string;
  priceCents: string;
  currency: string;
  previewPages: string;
  selectedCategories: string[];
}

export default function BookCreationModal({ onSuccess }: { onSuccess?: () => void }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    priceCents: '',
    currency: 'USD',
    previewPages: '',
    selectedCategories: [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await adminBooksService.getCategories();
        if (cats.length > 0) {
          setCategories(cats);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'priceCents') {
      // Allow empty string or valid decimal numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else if (name === 'previewPages') {
      // Allow empty string or valid integers
      if (value === '' || /^\d*$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-');
      const created = await adminBooksService.createCategory({
        name: newCategoryName,
        slug: slug,
        order: categories.length + 1,
        active: true,
      });

      if (created) {
        setCategories(prev => [...prev, created]);
        setFormData(prev => ({
          ...prev,
          selectedCategories: [...prev.selectedCategories, created._id]
        }));
        setNewCategoryName('');
        setShowNewCategoryInput(false);
      }
    } catch (err) {
      console.error('Error creating category:', err);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the File for upload
      setCoverFile(file);
      // Create preview for display
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setCoverPreview(preview);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.title.trim()) {
      setError('El título es requerido');
      setLoading(false);
      return;
    }

    const price = formData.priceCents ? parseFloat(formData.priceCents) : 0;
    if (price < 0) {
      setError('El precio no puede ser negativo');
      setLoading(false);
      return;
    }

    const pages = formData.previewPages ? parseInt(formData.previewPages) : 0;
    if (pages < 0) {
      setError('Las páginas de preview no pueden ser negativas');
      setLoading(false);
      return;
    }

    try {
      // Convert string values to proper types for API
      const bookData: CreateBookInput = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        priceCents: Math.round((parseFloat(formData.priceCents) || 0) * 100),
        currency: formData.currency,
        previewPages: parseInt(formData.previewPages) || 0,
        categoryRef: formData.selectedCategories[0] || '',
        cover: coverFile || undefined,
      };
      const book = await adminBooksService.createBook(bookData);
      if (book) {
        onSuccess?.();
        navigate('/admin/manuscripts');
      } else {
        setError('Error al crear el libro');
      }
    } catch (err) {
      setError('Error al crear el libro: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <section className="admin-section mb-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Crear Nuevo Libro
            </h1>
            <p className="text-on-surface-variant font-body-md max-w-[600px]">
              Añade un nuevo libro a tu catálogo. Completa los detalles básicos y sube el PDF después.
            </p>
          </div>
          <button 
            onClick={() => navigate('/admin/manuscripts')}
            className="border border-white/20 px-8 py-3 font-label-md text-label-md flex items-center justify-center gap-2 hover:border-accent-gold hover:text-accent-gold transition-all"
          >
            <span className="material-symbols-outlined">close</span>
            Cancelar
          </button>
        </header>
      </section>

      {/* Form */}
      <section className="admin-section">
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="glass-card p-4 border border-error/50 bg-error/10">
                <div className="text-error text-body-sm">{error}</div>
              </div>
            )}

            {/* Cover Image */}
            <div>
              <label className="block text-primary font-label-lg mb-4">
                Portada del Libro
              </label>
              <div className="flex gap-6 items-start">
                <div className="w-32 h-48 flex-shrink-0 border-2 border-dashed border-white/20 rounded-lg overflow-hidden bg-white/5">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">
                        image
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="cover-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="cover-input"
                    className="block bg-secondary/20 text-secondary border border-secondary px-4 py-3 text-center font-semibold cursor-pointer hover:opacity-80 transition-opacity mb-2"
                  >
                    Seleccionar Imagen
                  </label>
                  <p className="text-on-surface-variant text-body-sm">
                    Recomendado: 300x400px, JPG o PNG
                  </p>
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-primary font-label-lg mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ej: Midnight Axiom"
                  className="w-full bg-white/5 border border-white/20 text-primary placeholder-on-surface-variant px-4 py-3 font-body-md focus:outline-none focus:border-accent-gold transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-primary font-label-lg mb-2">
                  Subtítulo (Opcional)
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle || ''}
                  onChange={handleChange}
                  placeholder="Ej: Una historia de misterio"
                  className="w-full bg-white/5 border border-white/20 text-primary placeholder-on-surface-variant px-4 py-3 font-body-md focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-primary font-label-lg mb-2">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe el contenido y trama del libro..."
                rows={4}
                className="w-full bg-white/5 border border-white/20 text-primary placeholder-on-surface-variant px-4 py-3 font-body-md focus:outline-none focus:border-accent-gold transition-colors resize-none"
                required
              />
            </div>

            {/* Price & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-primary font-label-lg mb-2">
                  Precio *
                </label>
                <input
                  type="text"
                  name="priceCents"
                  inputMode="decimal"
                  value={formData.priceCents}
                  onChange={handleChange}
                  placeholder="14.99"
                  className="w-full bg-white/5 border border-white/20 text-primary placeholder-on-surface-variant px-4 py-3 font-body-md focus:outline-none focus:border-accent-gold transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-primary font-label-lg mb-2">
                  Moneda
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/20 text-primary px-4 py-3 font-body-md focus:outline-none focus:border-accent-gold transition-colors"
                >
                  <option value="USD" className="bg-surface-container text-primary">USD ($)</option>
                  <option value="EUR" className="bg-surface-container text-primary">EUR (€)</option>
                  <option value="MXN" className="bg-surface-container text-primary">MXN ($)</option>
                  <option value="COP" className="bg-surface-container text-primary">COP ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-primary font-label-lg mb-2">
                  Páginas Preview *
                </label>
                <input
                  type="text"
                  name="previewPages"
                  inputMode="numeric"
                  value={formData.previewPages}
                  onChange={handleChange}
                  placeholder="20"
                  className="w-full bg-white/5 border border-white/20 text-primary placeholder-on-surface-variant px-4 py-3 font-body-md focus:outline-none focus:border-accent-gold transition-colors"
                  required
                />
              </div>
            </div>

            {/* Categories Section */}
            <div>
              <label className="block text-primary font-label-lg mb-4">
                Categorías
              </label>
              <div className="space-y-3 mb-4">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <label key={cat._id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.selectedCategories.includes(cat._id)}
                        onChange={() => toggleCategory(cat._id)}
                        className="w-4 h-4"
                      />
                      <span className="text-primary font-body-md">{cat.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-on-surface-variant text-body-sm">No hay categorías disponibles</p>
                )}
              </div>

              {/* Create New Category */}
              {showNewCategoryInput ? (
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="flex-1 bg-white/5 border border-white/20 text-primary placeholder-on-surface-variant px-4 py-2 font-body-md focus:outline-none focus:border-accent-gold transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="bg-accent-gold text-surface px-6 py-2 font-label-md text-label-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCategory ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(false)}
                    className="border border-white/20 text-primary px-6 py-2 font-label-md text-label-md hover:border-white/40 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="flex items-center gap-2 mt-4 text-accent-gold hover:text-accent-gold/80 transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Nueva Categoría
                </button>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-8 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent-gold text-surface px-8 py-3 font-label-md text-label-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Libro'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/manuscripts')}
                className="border border-white/20 px-8 py-3 font-label-md text-label-md hover:border-accent-gold hover:text-accent-gold transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>

          <p className="text-on-surface-variant text-body-sm mt-8">
            Nota: Después de crear el libro, podrás subir el archivo PDF y gestionar sus detalles desde el panel.
          </p>
        </div>
      </section>
    </>
  );
}
