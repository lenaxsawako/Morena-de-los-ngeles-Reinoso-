import { useState, useEffect, useRef, useCallback } from 'react';
import './settings.css';
import { adminBooksService, type Category } from '../../../services/adminBooks';

interface WebsiteSettings {
  siteName: string;
  contactEmail: string;
  siteDescription: string;
  siteLogo: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  seoTitle: string;
  seoDescription: string;
}

interface NotificationSettings {
  emailOnNewPurchase: boolean;
  emailOnNewReview: boolean;
  emailDailySummary: boolean;
  emailWeeklySummary: boolean;
  emailMonthlySummary: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
}

interface PaymentsSettings {
  enabled: boolean;
  server: 'sandbox' | 'production';
  apiKey: string;
  webhookSecret: string;
  connected: boolean;
}

interface LocalStorageSettings {
  provider: 'google_drive';
  enabled: boolean;
  serviceAccountConfigured?: boolean;
  connectionStatus: 'connected' | 'disconnected';
  booksFolderId?: string;
  coversFolderId?: string;
  serviceAccountJson?: Record<string, any>;
}

interface CloudinarySettingsState {
  enabled: boolean;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  configured?: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  senderEmail: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  version: string;
  environment: 'development' | 'production';
  lastDeployment: string;
}

interface LaunchSettings {
  launchMode: boolean;
  launchDate: string;
  comingSoonTitle: string;
  comingSoonSubtitle: string;
  comingSoonBg: string;
  instagramUrl: string;
  tiktokUrl: string;
}

type SettingsTab = 'website' | 'categories' | 'notifications' | 'security' | 'payments' | 'storage' | 'email' | 'system';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('website');
  const [isSaving, setIsSaving] = useState(false);
  const [testDriveResult, setTestDriveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testCloudinaryResult, setTestCloudinaryResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveStorageResult, setSaveStorageResult] = useState<{ success: boolean; message: string } | null>(null);
  const [folders, setFolders] = useState<Array<{ id: string; name: string; webViewLink?: string }>>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notificationModal, setNotificationModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Author Image (Landing page)
  const [authorImageUrl, setAuthorImageUrl] = useState<string | null>(null);
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const [authorImagePreview, setAuthorImagePreview] = useState<string>('');
  const [philosophyTitle, setPhilosophyTitle] = useState('');
  const [philosophyContent, setPhilosophyContent] = useState('');
  
  // Website Settings
  const [website, setWebsite] = useState<WebsiteSettings>({
    siteName: '',
    contactEmail: '',
    siteDescription: '',
    siteLogo: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    seoTitle: '',
    seoDescription: '',
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>([
    { _id: '1', name: 'Fantasy', slug: 'fantasy', order: 1, active: true, createdAt: '', updatedAt: '' },
    { _id: '2', name: 'Romance', slug: 'romance', order: 2, active: true, createdAt: '', updatedAt: '' },
    { _id: '3', name: 'Contemporary', slug: 'contemporary', order: 3, active: true, createdAt: '', updatedAt: '' },
  ]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [categoriesToDelete, setCategoriesToDelete] = useState<Set<string>>(new Set());
  const [newCategoriesToAdd, setNewCategoriesToAdd] = useState<Array<{ name: string; description: string }>>([]);
  const [editingPreviewIndex, setEditingPreviewIndex] = useState<number | null>(null);

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all settings
        const settings = await adminBooksService.getSettings();
        if (settings) {
          // Map website settings
          if (settings.website) {
            setWebsite({
              siteName: settings.website.siteName,
              contactEmail: settings.website.contactEmail,
              siteDescription: settings.website.description,
              siteLogo: settings.website.logoUrl || '',
              instagram: settings.website.socialLinks?.instagram || '',
              twitter: settings.website.socialLinks?.twitter || '',
              tiktok: settings.website.socialLinks?.tiktok || '',
              youtube: settings.website.socialLinks?.youtube || '',
              seoTitle: settings.website.seo?.title || '',
              seoDescription: settings.website.seo?.description || '',
            });
          }

          // Map notification settings
          if (settings.notifications) {
            setNotifications({
              emailOnNewPurchase: settings.notifications.newPurchase,
              emailOnNewReview: settings.notifications.newReview,
              emailDailySummary: settings.notifications.dailySummary,
              emailWeeklySummary: settings.notifications.weeklySummary,
              emailMonthlySummary: settings.notifications.monthlySummary,
            });
          }

          // Map payment settings
          if (settings.payments?.polar) {
            setPayments({
              enabled: settings.payments.polar.enabled,
              server: settings.payments.polar.server || 'sandbox',
              apiKey: '',
              webhookSecret: settings.payments.polar.webhookSecret ? '***' : '',
              connected: settings.payments.polar.connected || false,
            });
          }

          // Map storage settings
          if (settings.storage?.googleDrive) {
            setStorage({
              provider: 'google_drive',
              enabled: settings.storage.googleDrive.enabled,
              serviceAccountConfigured: settings.storage.googleDrive.serviceAccountConfigured,
              connectionStatus: settings.storage.googleDrive.enabled ? 'connected' : 'disconnected',
              booksFolderId: settings.storage.googleDrive.booksFolderId,
              coversFolderId: settings.storage.googleDrive.coversFolderId,
              serviceAccountJson: undefined, // Never load JSON from API (security)
            });
          }

          if (settings.storage?.cloudinary) {
            setCloudinary({
              enabled: settings.storage.cloudinary.enabled,
              cloudName: settings.storage.cloudinary.cloudName || '',
              apiKey: settings.storage.cloudinary.apiKey || '',
              apiSecret: '',
              folder: settings.storage.cloudinary.folder || 'lbb/covers',
              configured: settings.storage.cloudinary.configured,
            });
          }

          // Map email settings
          if (settings.email?.smtp) {
            setEmail({
              smtpHost: settings.email.smtp.host,
              smtpPort: settings.email.smtp.port,
              smtpUser: settings.email.smtp.user,
              smtpPassword: '••••••••••••',
              senderEmail: settings.email.smtp.senderEmail,
            });
          }

          // Map system settings
          if (settings.system) {
            setSystem({
              maintenanceMode: settings.system.maintenanceMode,
              version: '1.0.0',
              environment: 'production',
              lastDeployment: settings.system.maintenanceMessage,
            });
          }

          // Map launch settings
          if (settings.launch) {
            setLaunch({
              launchMode: settings.launch.launchMode ?? true,
              launchDate: settings.launch.launchDate ? new Date(settings.launch.launchDate).toISOString().slice(0, 16) : '',
              comingSoonTitle: settings.launch.comingSoonTitle || 'Próximamente',
              comingSoonSubtitle: settings.launch.comingSoonSubtitle || '',
              comingSoonBg: settings.launch.comingSoonBg || '',
              instagramUrl: settings.launch.instagramUrl || '',
              tiktokUrl: settings.launch.tiktokUrl || '',
            });
          }
        }

        // Load categories
        const cats = await adminBooksService.getCategories();
        if (cats.length > 0) {
          setCategories(cats);
        }

        // Load philosophy / author image
        const philosophy = await adminBooksService.getPhilosophySettings();
        if (philosophy) {
          setAuthorImageUrl(philosophy.authorImageUrl || null);
          setPhilosophyTitle(philosophy.title);
          setPhilosophyContent(philosophy.content);
        }

        setLoadError(null);
      } catch (error: any) {
        console.error('Error loading settings:', error);
        const errorMsg = error?.message || 'Error loading settings';
        setLoadError(errorMsg);
      }
    };

    loadData();
  }, []);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailOnNewPurchase: true,
    emailOnNewReview: true,
    emailDailySummary: false,
    emailWeeklySummary: true,
    emailMonthlySummary: true,
  });

  // Security
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: 'Oct 15, 2024',
  });

  // Payments
  const [payments, setPayments] = useState<PaymentsSettings>({
    enabled: false,
    server: 'sandbox',
    apiKey: '',
    webhookSecret: '',
    connected: false,
  });

  // Storage
  const [storage, setStorage] = useState<LocalStorageSettings>({
    provider: 'google_drive',
    enabled: true,
    serviceAccountConfigured: false,
    connectionStatus: 'connected',
    booksFolderId: '1ABC-123-DEF',
    coversFolderId: '1GHI-456-JKL',
    serviceAccountJson: undefined,
  });
  const [serviceAccountJsonError, setServiceAccountJsonError] = useState<string | null>(null);
  const [showJsonUploadInput, setShowJsonUploadInput] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [cloudinary, setCloudinary] = useState<CloudinarySettingsState>({
    enabled: false,
    cloudName: '',
    apiKey: '',
    apiSecret: '',
    folder: 'lbb/covers',
  });

  // Email
  const [email, setEmail] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    senderEmail: '',
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaveResult, setEmailSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // System
  const [system, setSystem] = useState<SystemSettings>({
    maintenanceMode: false,
    version: '1.0.0',
    environment: 'production',
    lastDeployment: 'Jun 2, 2026 at 14:30',
  });

  // Launch
  const [launch, setLaunch] = useState<LaunchSettings>({
    launchMode: true,
    launchDate: '',
    comingSoonTitle: 'Próximamente',
    comingSoonSubtitle: '',
    comingSoonBg: '',
    instagramUrl: '',
    tiktokUrl: '',
  });
  const [launchBgUploading, setLaunchBgUploading] = useState(false);
  const launchBgInputRef = useRef<HTMLInputElement>(null);

  // Ref to prevent multiple auto-load calls
  const autoLoadRef = useRef(false);

  // Load folders from Google Drive
  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const foldersList = await adminBooksService.listGoogleDriveFolders();
      setFolders(foldersList);
    } catch (error) {
      console.error('Error loading folders:', error);
      setSaveStorageResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load folders',
      });
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  // Auto-load folders once when serviceAccountConfigured is true
  useEffect(() => {
    if (storage.serviceAccountConfigured && folders.length === 0 && !autoLoadRef.current) {
      autoLoadRef.current = true;
      loadFolders();
    }
  }, [storage.serviceAccountConfigured, loadFolders]);

  // Handlers
  const handleWebsiteChange = (field: keyof WebsiteSettings, value: string) => {
    setWebsite(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const result = await adminBooksService.uploadSiteLogo(file);
      if (result?.url) {
        setWebsite(prev => ({ ...prev, siteLogo: result.url }));
      }
    } catch {
      // error logged in service
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleAuthorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAuthorImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAuthorImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAuthorImage = async () => {
    if (!authorImageFile) return;

    setIsSaving(true);
    try {
      const result = await adminBooksService.uploadAuthorImage(authorImageFile);
      if (result?.authorImageUrl) {
        setAuthorImageUrl(result.authorImageUrl);
        setAuthorImageFile(null);
        setAuthorImagePreview('');
        setNotificationModal({ type: 'success', message: 'Imagen del autor actualizada' });
      } else {
        setNotificationModal({ type: 'error', message: 'Error al subir la imagen' });
      }
    } catch (error) {
      setNotificationModal({ type: 'error', message: 'Error al subir la imagen' });
      console.error('Error uploading author image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAuthorImage = async () => {
    setIsSaving(true);
    try {
      await adminBooksService.updatePhilosophy({
        title: philosophyTitle,
        content: philosophyContent,
        authorImageUrl: null,
      });
      setAuthorImageUrl(null);
      setAuthorImageFile(null);
      setAuthorImagePreview('');
      setNotificationModal({ type: 'success', message: 'Imagen del autor eliminada' });
    } catch (error) {
      setNotificationModal({ type: 'error', message: 'Error al eliminar la imagen' });
      console.error('Error removing author image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleDeleteCategory = () => {
    setIsEditingCategories(true);
  };

  const toggleCategoryForDeletion = (id: string) => {
    const newSet = new Set(categoriesToDelete);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCategoriesToDelete(newSet);
  };

  const handleBatchDeleteCategories = async () => {
    if (categoriesToDelete.size === 0) {
      setIsEditingCategories(false);
      return;
    }

    setIsSaving(true);
    try {
      const idsToDelete = Array.from(categoriesToDelete);
      for (const id of idsToDelete) {
        await adminBooksService.deleteCategory(id);
      }
      setCategories(prev => prev.filter(cat => !categoriesToDelete.has(cat._id)));
      setCategoriesToDelete(new Set());
      setIsEditingCategories(false);
      alert(`${idsToDelete.length} categor${idsToDelete.length > 1 ? 'ías' : 'ía'} eliminada${idsToDelete.length > 1 ? 's' : ''}`);
    } catch (error) {
      alert('Failed to delete categories');
      console.error('Error deleting categories:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingCategories(false);
    setCategoriesToDelete(new Set());
  };

  const handleSaveWebsite = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        adminBooksService.updateSettings({
          siteName: website.siteName,
          contactEmail: website.contactEmail,
          description: website.siteDescription,
          logoUrl: website.siteLogo,
          socialLinks: {
            instagram: website.instagram || '',
            twitter: website.twitter || '',
            tiktok: website.tiktok || '',
            youtube: website.youtube || '',
          },
          seo: {
            title: website.seoTitle,
            description: website.seoDescription,
          },
        }),
        adminBooksService.updatePhilosophy({
          title: philosophyTitle,
          content: philosophyContent,
          authorImageUrl: authorImageUrl,
        }),
      ]);
      setNotificationModal({ type: 'success', message: 'Website settings saved successfully' });
    } catch (error) {
      setNotificationModal({ type: 'error', message: 'Failed to save website settings' });
      console.error('Error saving website:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await adminBooksService.updateSettings({
        notifications: {
          newPurchase: notifications.emailOnNewPurchase,
          newReview: notifications.emailOnNewReview,
          dailySummary: notifications.emailDailySummary,
          weeklySummary: notifications.emailWeeklySummary,
          monthlySummary: notifications.emailMonthlySummary,
        },
      });
      alert('Notification settings saved');
    } catch (error) {
      alert('Failed to save notification settings');
      console.error('Error saving notifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      setNewCategoriesToAdd(prev => [...prev, newCategory]);
      setNewCategory({ name: '', description: '' });
    }
  };

  const handleRemoveNewCategory = (index: number) => {
    setNewCategoriesToAdd(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveNewCategories = async () => {
    if (newCategoriesToAdd.length === 0) return;

    setIsSaving(true);
    try {
      const createdCategories: Category[] = [];
      
      for (const cat of newCategoriesToAdd) {
        const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
        const created = await adminBooksService.createCategory({
          name: cat.name,
          slug: slug,
          description: cat.description,
          order: categories.length + createdCategories.length + 1,
          active: true,
        });

        if (created) {
          createdCategories.push(created);
        }
      }

      setCategories(prev => [...prev, ...createdCategories]);
      setNewCategoriesToAdd([]);
      setShowCategoryForm(false);
      alert(`${createdCategories.length} categor${createdCategories.length > 1 ? 'ías' : 'ía'} creada${createdCategories.length > 1 ? 's' : ''}`);
    } catch (error) {
      alert('Failed to create categories');
      console.error('Error creating categories:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAddCategories = () => {
    setNewCategoriesToAdd([]);
    setNewCategory({ name: '', description: '' });
    setShowCategoryForm(false);
    setEditingPreviewIndex(null);
  };

  const handleEditPreviewCategory = (index: number) => {
    setEditingPreviewIndex(index);
    setNewCategory(newCategoriesToAdd[index]);
  };

  const handleSavePreviewEdit = () => {
    if (newCategory.name.trim() && editingPreviewIndex !== null) {
      const updated = [...newCategoriesToAdd];
      updated[editingPreviewIndex] = newCategory;
      setNewCategoriesToAdd(updated);
      setEditingPreviewIndex(null);
      setNewCategory({ name: '', description: '' });
    }
  };

  const handleCancelPreviewEdit = () => {
    setEditingPreviewIndex(null);
    setNewCategory({ name: '', description: '' });
  };

  const handleChangePassword = () => {
    alert('Redirecting to password change...');
  };

  const handleEnable2FA = () => {
    setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
  };

  const handleTestEmail = async () => {
    try {
      const result = await adminBooksService.testEmailConfiguration();
      if (result.success) {
        alert('Email configuration is valid');
      } else {
        alert(`Email test failed: ${result.message}`);
      }
    } catch (error) {
      alert('Failed to test email configuration');
      console.error('Error testing email:', error);
    }
  };

  const handleTestDrive = async () => {
    try {
      const result = await adminBooksService.testGoogleDriveConnection();
      setTestDriveResult(result);
      
      // Auto-load folders after successful connection test
      if (result.success && folders.length === 0) {
        await loadFolders();
      }
    } catch (error) {
      setTestDriveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test Google Drive connection',
      });
      console.error('Error testing Google Drive:', error);
    }
  };

 

  const [polarTesting, setPolarTesting] = useState(false);
  const [polarTestResult, setPolarTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [polarSaveResult, setPolarSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestPolar = async () => {
    setPolarTesting(true);
    setPolarTestResult(null);
    try {
      const result = await adminBooksService.testPolarConnection();
      setPolarTestResult(result);
      if (result.success) {
        setPayments(prev => ({ ...prev, connected: true }));
      }
    } catch (error) {
      setPolarTestResult({ success: false, message: 'Failed to test Polar connection' });
    } finally {
      setPolarTesting(false);
    }
  };

  const handleSavePayments = async () => {
    setPolarSaveResult(null);
    try {
      const polarUpdate: Record<string, any> = {
        enabled: payments.enabled,
        server: payments.server,
      };
      if (payments.apiKey?.trim()) {
        polarUpdate.apiKey = payments.apiKey.trim();
      }
      if (payments.webhookSecret?.trim() && payments.webhookSecret !== '***') {
        polarUpdate.webhookSecret = payments.webhookSecret.trim();
      }
      await adminBooksService.updateSettings({ polar: polarUpdate });
      setPolarSaveResult({ success: true, message: 'Configuración de pagos guardada' });
    } catch {
      setPolarSaveResult({ success: false, message: 'Error al guardar configuración de pagos' });
    }
  };

  const handleSaveSystem = async () => {
    setIsSaving(true);
    try {
      await adminBooksService.updateSettings({
        system: {
          maintenanceMode: system.maintenanceMode,
          maintenanceMessage: system.lastDeployment,
        },
        launchMode: launch.launchMode,
        launchDate: launch.launchDate || null,
        comingSoonTitle: launch.comingSoonTitle,
        comingSoonSubtitle: launch.comingSoonSubtitle,
        comingSoonBg: launch.comingSoonBg,
        instagramUrl: launch.instagramUrl,
        tiktokUrl: launch.tiktokUrl,
      });
      alert('System settings saved');
    } catch (error) {
      alert('Failed to save system settings');
      console.error('Error saving system settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailSaving(true);
    setEmailSaveResult(null);
    try {
      const smtpData: Record<string, unknown> = {
        host: email.smtpHost,
        port: email.smtpPort,
        user: email.smtpUser,
        senderEmail: email.senderEmail,
      };
      if (email.smtpPassword !== '••••••••••••') {
        smtpData.password = email.smtpPassword;
      }
      await adminBooksService.updateSettings({ smtp: smtpData });
      setEmailSaveResult({ success: true, message: '¡Guardado!' });
      setTimeout(() => setEmailSaveResult(null), 2000);
    } catch (error) {
      setEmailSaveResult({ success: false, message: 'Error al guardar configuración de email' });
      setTimeout(() => setEmailSaveResult(null), 2000);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSaveStorage = async () => {
    // Allow saving with just JSON on first setup (no folders selected yet)
    // On subsequent saves, require folders to be selected
    const hasBooksFolder = !!storage.booksFolderId;
    const hasFoldersFromDropdown = folders.length > 0;

    if (storage.enabled && hasFoldersFromDropdown && !hasBooksFolder) {
      setSaveStorageResult({
        success: false,
        message: 'Selecciona la carpeta de libros (PDFs) en Google Drive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Build googleDrive config
      const googleDriveData: any = {
        enabled: storage.enabled,
      };

      // Only add folder IDs if they exist
      if (storage.booksFolderId) {
        googleDriveData.booksFolderId = storage.booksFolderId;
      }
      if (storage.coversFolderId) {
        googleDriveData.coversFolderId = storage.coversFolderId;
      }

      // Include serviceAccountJson only if it was uploaded
      if (storage.serviceAccountJson) {
        googleDriveData.serviceAccountJson = storage.serviceAccountJson;
      }

      const cloudinaryData: Record<string, unknown> = {
        enabled: cloudinary.enabled,
        cloudName: cloudinary.cloudName.trim(),
        apiKey: cloudinary.apiKey.trim(),
        folder: cloudinary.folder.trim() || 'lbb/covers',
      };
      if (cloudinary.apiSecret.trim()) {
        cloudinaryData.apiSecret = cloudinary.apiSecret.trim();
      }

      await adminBooksService.updateSettings({
        googleDrive: googleDriveData,
        cloudinary: cloudinaryData,
      });

      if (cloudinary.apiSecret.trim()) {
        setCloudinary((prev) => ({ ...prev, apiSecret: '', configured: true }));
      }

      setSaveStorageResult({
        success: true,
        message: 'Configuración de almacenamiento guardada',
      });

      // Auto-load folders immediately after saving (for first-time setup)
      if (storage.serviceAccountJson && folders.length === 0) {
        await loadFolders();
      }
    } catch (error) {
      setSaveStorageResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save storage configuration',
      });
      console.error('Error saving storage:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleServiceAccountJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Validate required fields
        if (!json.type || !json.private_key || !json.client_email) {
          setServiceAccountJsonError('Invalid Service Account JSON: missing required fields (type, private_key, client_email)');
          return;
        }

        setStorage({ ...storage, serviceAccountJson: json });
        setServiceAccountJsonError(null);
      } catch (error) {
        setServiceAccountJsonError('Invalid JSON file. Please ensure the file is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearServiceAccountJson = () => {
    setStorage({ ...storage, serviceAccountJson: undefined });
    setServiceAccountJsonError(null);
    autoLoadRef.current = false; // Reset auto-load flag
    setShowJsonUploadInput(false);
  };

  const handleShowJsonInput = () => {
    setShowJsonUploadInput(true);
  };

  return (
    <div className="settings-container">
      {/* Page Header */}
      <div className="settings-header">
        <div className="settings-header-content">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Manage your website, categories, notifications, and integrations
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {loadError && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#fee2e2',
          borderLeft: '4px solid #ef4444',
          marginBottom: '1.5rem',
          borderRadius: '0.5rem'
        }}>
          <p style={{ color: '#991b1b', margin: 0, fontWeight: '500' }}>
            ⚠️ {loadError}
          </p>
        </div>
      )}

      {/* Settings Tabs Navigation */}
      <div className="settings-nav">
        <button
          className={`settings-nav-item ${activeTab === 'website' ? 'active' : ''}`}
          onClick={() => setActiveTab('website')}
        >
          <span className="material-symbols-outlined">globe</span>
          Website
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <span className="material-symbols-outlined">category</span>
          Categories
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <span className="material-symbols-outlined">notifications</span>
          Notifications
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="material-symbols-outlined">security</span>
          Security
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <span className="material-symbols-outlined">credit_card</span>
          Payments
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <span className="material-symbols-outlined">cloud_upload</span>
          Storage
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <span className="material-symbols-outlined">mail</span>
          Email
        </button>
        <button
          className={`settings-nav-item ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <span className="material-symbols-outlined">settings_suggest</span>
          System
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* WEBSITE TAB */}
        {activeTab === 'website' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Website Settings</h2>
              <p>Manage your website and social media links</p>
            </div>

            {/* Site Logo */}
            <div className="settings-field-group">
              <label className="settings-label">Site Logo</label>
              <div className="profile-image-upload">
                {website.siteLogo ? (
                  <img src={website.siteLogo} alt="Logo" className="profile-image" />
                ) : (
                  <div className="profile-image profile-image-placeholder">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">image</span>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  className="upload-btn"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                  {logoUploading ? 'Subiendo...' : 'Change Logo'}
                </button>
              </div>
            </div>

            {/* Author Image */}
            <div className="settings-field-group">
              <label className="settings-label">Author Image (Landing Page)</label>
              <div className="profile-image-upload">
                {(authorImagePreview || authorImageUrl) ? (
                  <img
                    src={authorImagePreview || authorImageUrl || ''}
                    alt="Author"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image profile-image-placeholder">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">person</span>
                  </div>
                )}
                <input
                  type="file"
                  id="author-image-input"
                  accept="image/*"
                  onChange={handleAuthorImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="author-image-input"
                  className="upload-btn"
                  style={{ cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                  {authorImageUrl ? 'Change Image' : 'Upload Image'}
                </label>
                {authorImageFile && (
                  <button onClick={handleSaveAuthorImage} disabled={isSaving} className="upload-btn" style={{ backgroundColor: '#F3EAD3', color: '#0A0A0A' }}>
                    {isSaving ? 'Saving...' : 'Save Image'}
                  </button>
                )}
                {authorImageUrl && !authorImageFile && (
                  <button onClick={handleRemoveAuthorImage} disabled={isSaving} className="upload-btn" style={{ color: '#fca5a5' }}>
                    <span className="material-symbols-outlined">delete</span>
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Landing Page Philosophy */}
            <div className="settings-section-title" style={{ marginTop: '2rem' }}>
              <h2>Landing Page Philosophy</h2>
              <p>Edit the philosophy section text shown on the homepage</p>
            </div>

            <div className="settings-field-group">
              <label htmlFor="philosophyTitle" className="settings-label">Philosophy Title</label>
              <input
                id="philosophyTitle"
                type="text"
                value={philosophyTitle}
                onChange={(e) => setPhilosophyTitle(e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label htmlFor="philosophyContent" className="settings-label">Philosophy Content</label>
              <textarea
                id="philosophyContent"
                value={philosophyContent}
                onChange={(e) => setPhilosophyContent(e.target.value)}
                className="settings-textarea"
                rows={6}
              />
            </div>

            {/* Site Name */}
            <div className="settings-field-group">
              <label htmlFor="siteName" className="settings-label">Site Name</label>
              <input
                id="siteName"
                type="text"
                value={website.siteName}
                onChange={(e) => handleWebsiteChange('siteName', e.target.value)}
                className="settings-input"
              />
            </div>

            {/* Contact Email */}
            <div className="settings-field-group">
              <label htmlFor="contactEmail" className="settings-label">Contact Email</label>
              <input
                id="contactEmail"
                type="email"
                value={website.contactEmail}
                onChange={(e) => handleWebsiteChange('contactEmail', e.target.value)}
                className="settings-input"
              />
            </div>

            {/* Site Description */}
            <div className="settings-field-group">
              <label htmlFor="siteDescription" className="settings-label">Site Description</label>
              <textarea
                id="siteDescription"
                value={website.siteDescription}
                onChange={(e) => handleWebsiteChange('siteDescription', e.target.value)}
                className="settings-textarea"
                rows={4}
              />
            </div>

            {/* Social Links */}
            <div className="settings-section-title" style={{ marginTop: '2rem' }}>
              <h2>Social Links</h2>
            </div>

            <div className="settings-field-group">
              <label htmlFor="instagram" className="settings-label">Instagram</label>
              <div className="social-input-wrapper">
                <span className="social-prefix">instagram.com/</span>
                <input
                  id="instagram"
                  type="text"
                  value={website.instagram || ''}
                  onChange={(e) => handleWebsiteChange('instagram', e.target.value)}
                  className="settings-input social-input"
                />
              </div>
            </div>

            <div className="settings-field-group">
              <label htmlFor="twitter" className="settings-label">X / Twitter</label>
              <div className="social-input-wrapper">
                <span className="social-prefix">x.com/</span>
                <input
                  id="twitter"
                  type="text"
                  value={website.twitter || ''}
                  onChange={(e) => handleWebsiteChange('twitter', e.target.value)}
                  className="settings-input social-input"
                />
              </div>
            </div>

            <div className="settings-field-group">
              <label htmlFor="tiktok" className="settings-label">TikTok</label>
              <div className="social-input-wrapper">
                <span className="social-prefix">tiktok.com/@</span>
                <input
                  id="tiktok"
                  type="text"
                  value={website.tiktok || ''}
                  onChange={(e) => handleWebsiteChange('tiktok', e.target.value)}
                  className="settings-input social-input"
                />
              </div>
            </div>

            <div className="settings-field-group">
              <label htmlFor="youtube" className="settings-label">YouTube</label>
              <div className="social-input-wrapper">
                <span className="social-prefix">youtube.com/@</span>
                <input
                  id="youtube"
                  type="text"
                  value={website.youtube || ''}
                  onChange={(e) => handleWebsiteChange('youtube', e.target.value)}
                  className="settings-input social-input"
                />
              </div>
            </div>

            {/* SEO */}
            <div className="settings-section-title" style={{ marginTop: '2rem' }}>
              <h2>SEO Settings</h2>
            </div>

            <div className="settings-field-group">
              <label htmlFor="seoTitle" className="settings-label">SEO Title</label>
              <input
                id="seoTitle"
                type="text"
                value={website.seoTitle}
                onChange={(e) => handleWebsiteChange('seoTitle', e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label htmlFor="seoDescription" className="settings-label">SEO Description</label>
              <textarea
                id="seoDescription"
                value={website.seoDescription}
                onChange={(e) => handleWebsiteChange('seoDescription', e.target.value)}
                className="settings-textarea"
                rows={3}
              />
            </div>

            <button 
              onClick={handleSaveWebsite}
              disabled={isSaving}
              className="settings-btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Book Categories</h2>
              <p>Manage your book categories</p>
            </div>

            {/* Current Categories */}
            <div className="settings-field-group">
              <label className="settings-label">Current Categories</label>
              <div className="settings-category-grid">
                {categories.map((category) => (
                  <div key={category._id} className="settings-category-card">
                    <span className="category-name">{category.name}</span>
                    {isEditingCategories && (
                      <div className="category-card-actions">
                        <button
                          onClick={() => toggleCategoryForDeletion(category._id)}
                          className={`category-delete-btn ${categoriesToDelete.has(category._id) ? 'selected' : ''}`}
                          type="button"
                        >
                          <span className="material-symbols-outlined notranslate" translate="no">close</span>
                        </button>
                        <button
                          className="category-edit-btn"
                          type="button"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined notranslate" translate="no">edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditingCategories && (
                <div className="category-edit-actions">
                  <button
                    onClick={handleBatchDeleteCategories}
                    disabled={isSaving || categoriesToDelete.size === 0}
                    className="settings-btn-danger"
                  >
                    {isSaving ? 'Deleting...' : `Delete Selected (${categoriesToDelete.size})`}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="settings-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {!isEditingCategories && (
              <div className="category-button-group">
                <button
                  onClick={handleDeleteCategory}
                  className="settings-btn-danger"
                >
                  <span className="material-symbols-outlined notranslate" translate="no">delete</span>
                  Delete Categories
                </button>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="settings-btn-secondary"
                >
                  <span className="material-symbols-outlined notranslate" translate="no">add</span>
                  Add Category
                </button>
              </div>
            )}

            {/* Add New Category Form - Only show if not editing categories */}
            {showCategoryForm && !isEditingCategories && (
              <div className="settings-new-category">
                <h3>Add New Categories</h3>
                
                {/* Edit Mode - Show when editing a preview category */}
                {editingPreviewIndex !== null && (
                  <div className="edit-preview-modal">
                    <div className="edit-modal-overlay" onClick={handleCancelPreviewEdit}></div>
                    <div className="edit-modal-content">
                      <h4>Edit Category</h4>
                      
                      <div className="settings-field-group">
                        <label htmlFor="editCategoryName" className="settings-label">Category Name</label>
                        <input
                          id="editCategoryName"
                          type="text"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          className="settings-input"
                        />
                      </div>

                      <div className="settings-field-group">
                        <label htmlFor="editCategoryDesc" className="settings-label">Description</label>
                        <textarea
                          id="editCategoryDesc"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          className="settings-textarea"
                          rows={2}
                        />
                      </div>

                      <div className="category-form-actions">
                        <button
                          onClick={handleSavePreviewEdit}
                          className="settings-btn-primary"
                          type="button"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelPreviewEdit}
                          className="settings-btn-secondary"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Preview of categories to add */}
                {newCategoriesToAdd.length > 0 && (
                  <div className="categories-preview">
                    <label className="settings-label">Categories to Add ({newCategoriesToAdd.length})</label>
                    <div className="preview-grid">
                      {newCategoriesToAdd.map((cat, index) => (
                        <div key={index} className="preview-card">
                          <div>
                            <div className="preview-name">{cat.name}</div>
                            {cat.description && <div className="preview-description">{cat.description}</div>}
                          </div>
                          <div className="preview-actions">
                            <button
                              type="button"
                              onClick={() => handleEditPreviewCategory(index)}
                              className="preview-edit-btn"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined notranslate" translate="no">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewCategory(index)}
                              className="preview-remove-btn"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined notranslate" translate="no">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form to add new category */}
                {editingPreviewIndex === null && (
                  <>
                    <div className="settings-field-group">
                      <label htmlFor="categoryName" className="settings-label">Category Name</label>
                      <input
                        id="categoryName"
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="settings-input"
                        placeholder="e.g. Fantasy, Romance"
                      />
                    </div>

                    <div className="settings-field-group">
                      <label htmlFor="categoryDesc" className="settings-label">Description (Optional)</label>
                      <textarea
                        id="categoryDesc"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="settings-textarea"
                        rows={2}
                      />
                    </div>

                    <div className="category-form-actions">
                      <button
                        onClick={handleAddCategory}
                        className="settings-btn-secondary"
                        type="button"
                      >
                        <span className="material-symbols-outlined notranslate" translate="no">add</span>
                        Add Another
                      </button>
                      <button
                        onClick={handleSaveNewCategories}
                        disabled={isSaving || newCategoriesToAdd.length === 0}
                        className="settings-btn-primary"
                      >
                        {isSaving ? 'Saving...' : `Save All (${newCategoriesToAdd.length})`}
                      </button>
                      <button
                        onClick={handleCancelAddCategories}
                        disabled={isSaving}
                        className="settings-btn-secondary"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Email Notifications</h2>
              <p>Control your notification preferences</p>
            </div>

            <div className="settings-notification-group">
              <h3>Notification Events</h3>

              <div className="settings-toggle-item">
                <div className="toggle-info">
                  <label className="toggle-label">New Purchase</label>
                  <p className="toggle-description">Get notified when someone purchases your book</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailOnNewPurchase}
                    onChange={() => handleNotificationChange('emailOnNewPurchase')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-item">
                <div className="toggle-info">
                  <label className="toggle-label">New Review</label>
                  <p className="toggle-description">Get notified when someone leaves a review</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailOnNewReview}
                    onChange={() => handleNotificationChange('emailOnNewReview')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-notification-group">
              <h3>Periodic Summaries</h3>

              <div className="settings-toggle-item">
                <div className="toggle-info">
                  <label className="toggle-label">Daily Summary</label>
                  <p className="toggle-description">Daily activity summary</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailDailySummary}
                    onChange={() => handleNotificationChange('emailDailySummary')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-item">
                <div className="toggle-info">
                  <label className="toggle-label">Weekly Summary</label>
                  <p className="toggle-description">Weekly activity summary</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailWeeklySummary}
                    onChange={() => handleNotificationChange('emailWeeklySummary')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-item">
                <div className="toggle-info">
                  <label className="toggle-label">Monthly Summary</label>
                  <p className="toggle-description">Monthly performance report</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailMonthlySummary}
                    onChange={() => handleNotificationChange('emailMonthlySummary')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <button onClick={handleSaveNotifications} className="settings-btn-primary">
              Save Preferences
            </button>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Security Settings</h2>
              <p>Protect your account</p>
            </div>

            <div className="settings-security-box">
              <div className="security-box-header">
                <span className="material-symbols-outlined">lock</span>
                <div>
                  <h3>Password</h3>
                  <p className="security-description">Last changed: {security.lastPasswordChange}</p>
                </div>
              </div>
              <button onClick={handleChangePassword} className="settings-btn-secondary">
                Change Password
              </button>
            </div>

            <div className="settings-security-box">
              <div className="security-box-header">
                <span className="material-symbols-outlined">verified</span>
                <div>
                  <h3>Two-Factor Authentication</h3>
                  <p className="security-description">
                    {security.twoFactorEnabled ? '✓ Enabled' : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleEnable2FA} 
                className={security.twoFactorEnabled ? 'settings-btn-danger' : 'settings-btn-secondary'}
              >
                {security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>

            <div className="settings-security-box">
              <div className="security-box-header">
                <span className="material-symbols-outlined">devices</span>
                <div>
                  <h3>Active Sessions</h3>
                  <p className="security-description">Manage your login sessions</p>
                </div>
              </div>
              <button onClick={() => alert('Active sessions')} className="settings-btn-secondary">
                View Sessions
              </button>
            </div>

            <div className="settings-security-box">
              <div className="security-box-header">
                <span className="material-symbols-outlined">history</span>
                <div>
                  <h3>Login History</h3>
                  <p className="security-description">View your recent login activity</p>
                </div>
              </div>
              <button onClick={() => alert('Login history')} className="settings-btn-secondary">
                View History
              </button>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Payments & Integrations</h2>
              <p>Manage your payment provider</p>
            </div>

            {polarSaveResult && (
              <div style={{
                padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.5rem',
                backgroundColor: polarSaveResult.success ? '#10b98120' : '#ef444420',
                border: `1px solid ${polarSaveResult.success ? '#10b981' : '#ef4444'}`,
                color: polarSaveResult.success ? '#10b981' : '#ef4444', fontSize: '0.875rem',
              }}>
                {polarSaveResult.message}
              </div>
            )}

            <div className="settings-info-box">
              <div className="info-box-header">
                <span className="material-symbols-outlined">payment</span>
                <h3>Polar</h3>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                {/* Enable Toggle */}
                <div className="settings-field-group">
                  <label className="settings-label">Enable Polar Payments</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setPayments({ ...payments, enabled: !payments.enabled })}
                      style={{
                        width: '3rem', height: '1.5rem', borderRadius: '999px',
                        background: payments.enabled ? '#10b981' : '#4b5563',
                        border: 'none', cursor: 'pointer', position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                        background: '#fff', position: 'absolute', top: '0.125rem',
                        left: payments.enabled ? '1.625rem' : '0.125rem',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                    <span style={{ color: payments.enabled ? '#10b981' : '#9ca3af', fontSize: '0.875rem' }}>
                      {payments.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Server */}
                <div className="settings-field-group">
                  <label className="settings-label">Environment</label>
                  <select
                    value={payments.server}
                    onChange={(e) => setPayments({ ...payments, server: e.target.value as 'sandbox' | 'production' })}
                    className="settings-input"
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                {/* API Key */}
                <div className="settings-field-group">
                  <label className="settings-label">API Key</label>
                  <input
                    type="text"
                    value={payments.apiKey}
                    onChange={(e) => setPayments({ ...payments, apiKey: e.target.value })}
                    className="settings-input"
                    placeholder="Enter Polar API key"
                    autoComplete="off"
                  />
                </div>

                {/* Webhook Secret */}
                <div className="settings-field-group">
                  <label className="settings-label">Webhook Secret</label>
                  <input
                    type="text"
                    value={payments.webhookSecret}
                    onChange={(e) => setPayments({ ...payments, webhookSecret: e.target.value })}
                    className="settings-input"
                    placeholder="Enter Polar webhook secret"
                    autoComplete="off"
                  />
                  <p className="settings-help" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Cópialo de Polar Dashboard → Settings → Webhooks
                  </p>
                </div>

                {/* Connection Status */}
                <div className="settings-field-group">
                  <label className="settings-label">Status</label>
                  <div style={{
                    padding: '0.75rem', borderRadius: '0.5rem',
                    backgroundColor: payments.connected ? '#10b98120' : '#4b556320',
                    color: payments.connected ? '#10b981' : '#9ca3af',
                    fontSize: '0.875rem',
                  }}>
                    {payments.connected ? '✓ Connected' : 'Not connected'}
                  </div>
                </div>

                {/* Test Result */}
                {polarTestResult && (
                  <div className="settings-field-group">
                    <div style={{
                      padding: '0.75rem', borderRadius: '0.5rem',
                      backgroundColor: polarTestResult.success ? '#10b98120' : '#ef444420',
                      color: polarTestResult.success ? '#10b981' : '#ef4444',
                      fontSize: '0.875rem',
                    }}>
                      {polarTestResult.message}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={handleTestPolar} disabled={polarTesting || !payments.apiKey} className="settings-btn-secondary">
                    {polarTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button onClick={handleSavePayments} className="settings-btn-primary">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === 'storage' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Almacenamiento</h2>
              <p>Google Drive para PDFs · Cloudinary para portadas de libros</p>
            </div>

            {saveStorageResult && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: saveStorageResult.success ? '#10b98120' : '#ef444420',
                  border: `1px solid ${saveStorageResult.success ? '#10b981' : '#ef4444'}`,
                  color: saveStorageResult.success ? '#10b981' : '#ef4444',
                  fontSize: '0.875rem',
                }}
              >
                {saveStorageResult.message}
              </div>
            )}

            <div className="settings-info-box">
              <div className="info-box-header">
                <span className="material-symbols-outlined">cloud</span>
                <h3>Google Drive (PDFs)</h3>
              </div>

              

              <div style={{ marginTop: '1.5rem' }}>
                {/* Enable Toggle */}
                <div className="settings-field-group">
                  <label className="settings-label">Enable Google Drive</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setStorage({ ...storage, enabled: !storage.enabled })}
                      style={{
                        width: '3rem',
                        height: '1.5rem',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: storage.enabled ? '#10b981' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.25rem',
                        transition: 'background-color 0.2s',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '1rem',
                          height: '1rem',
                          borderRadius: '9999px',
                          backgroundColor: 'white',
                          transition: 'transform 0.2s',
                          transform: storage.enabled ? 'translateX(1.5rem)' : 'translateX(0)',
                        }}
                      />
                    </button>
                    <label style={{ cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                      {storage.enabled ? '✓ Enabled' : '✗ Disabled'}
                    </label>
                  </div>
                </div>

                {/* Service Account JSON Upload */}
                <div className="settings-field-group">
                  <label htmlFor="serviceAccountJson" className="settings-label">Service Account JSON</label>
                  <div style={{ marginTop: '0.5rem' }}>
                    {storage.serviceAccountJson ? (
                      // User just uploaded JSON
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#10b98120',
                        border: '1px solid #10b981',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ color: '#10b981', fontWeight: 500 }}>✓ JSON Loaded</div>
                          <div style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.25rem' }}>
                            Project: {storage.serviceAccountJson.project_id}
                          </div>
                        </div>
                        <button
                          onClick={handleClearServiceAccountJson}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : storage.serviceAccountConfigured ? (
                      // Backend has JSON configured (but we don't load it for security)
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#10b98120',
                        border: '1px solid #10b981',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ color: '#10b981', fontWeight: 500 }}>✓ JSON Cargado en el Backend</div>
                          <div style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.25rem' }}>
                            Service Account configurado y listo para usar
                          </div>
                        </div>
                        <button
                          onClick={handleShowJsonInput}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : null}
                    
                    {(!storage.serviceAccountJson && (!storage.serviceAccountConfigured || showJsonUploadInput)) && (
                      <input
                        id="serviceAccountJson"
                        type="file"
                        accept=".json"
                        onChange={handleServiceAccountJsonUpload}
                        style={{
                          display: 'block',
                          padding: '0.75rem',
                          border: '1px dashed #666',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      />
                    )}
                    {serviceAccountJsonError && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#ef444420',
                        border: '1px solid #ef4444',
                        borderRadius: '0.375rem',
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem',
                      }}>
                        {serviceAccountJsonError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Status */}
                <div className="settings-field-group">
                  <label className="settings-label">Connection Status</label>
                  <div style={{ padding: '0.75rem', backgroundColor: storage.connectionStatus === 'connected' ? '#10b98166' : '#ef444466', borderRadius: '0.5rem', color: storage.connectionStatus === 'connected' ? '#059669' : '#dc2626' }}>
                    {storage.connectionStatus === 'connected' ? '✓ Connected' : '✗ Disconnected'}
                  </div>
                </div>

                {/* Books Folder */}
                <div className="settings-field-group">
                  <label htmlFor="booksFolderId" className="settings-label">Books Folder</label>
                  {loadingFolders ? (
                    <div style={{ padding: '0.75rem', color: '#999' }}>Loading folders...</div>
                  ) : folders.length === 0 ? (
                    <div style={{ padding: '0.75rem', color: '#f97316', fontSize: '0.875rem' }}>
                      Load folders to see available options
                    </div>
                  ) : (
                    <select
                      id="booksFolderId"
                      value={storage.booksFolderId || ''}
                      onChange={(e) => setStorage({ ...storage, booksFolderId: e.target.value })}
                      className="settings-input"
                      disabled={!storage.enabled || folders.length === 0}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: storage.enabled && folders.length > 0 ? '#2a2a2a' : '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '0.375rem',
                        cursor: storage.enabled && folders.length > 0 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <option value="">Select a folder...</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Covers Folder (legacy, optional) */}
                <div className="settings-field-group">
                  <label htmlFor="coversFolderId" className="settings-label">Carpeta de portadas (opcional, ya no se usa)</label>
                  {loadingFolders ? (
                    <div style={{ padding: '0.75rem', color: '#999' }}>Loading folders...</div>
                  ) : folders.length === 0 ? (
                    <div style={{ padding: '0.75rem', color: '#f97316', fontSize: '0.875rem' }}>
                      Load folders to see available options
                    </div>
                  ) : (
                    <select
                      id="coversFolderId"
                      value={storage.coversFolderId || ''}
                      onChange={(e) => setStorage({ ...storage, coversFolderId: e.target.value })}
                      className="settings-input"
                      disabled={!storage.enabled || folders.length === 0}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: storage.enabled && folders.length > 0 ? '#2a2a2a' : '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '0.375rem',
                        cursor: storage.enabled && folders.length > 0 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <option value="">Select a folder...</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={handleTestDrive} 
                      disabled={!storage.enabled || (!storage.serviceAccountJson && !storage.serviceAccountConfigured)} 
                      className="settings-btn-secondary"
                      style={{
                        opacity: (!storage.enabled || (!storage.serviceAccountJson && !storage.serviceAccountConfigured)) ? 0.5 : 1,
                      }}
                    >
                      Test Connection
                    </button>
                    <button 
                      onClick={handleSaveStorage} 
                      disabled={isSaving || !storage.enabled} 
                      className="settings-btn-primary"
                      style={{
                        opacity: (isSaving || !storage.enabled) ? 0.5 : 1,
                      }}
                    >
                      {isSaving ? 'Saving...' : storage.serviceAccountConfigured && folders.length === 0 ? 'Load Folders' : folders.length === 0 ? 'Save & Load Folders' : 'Save Configuration'}
                    </button>
                  </div>
                  {(storage.serviceAccountJson || storage.serviceAccountConfigured) && folders.length === 0 && !loadingFolders && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#1e3a5f',
                      border: '1px solid #3b82f6',
                      borderRadius: '0.375rem',
                      color: '#93c5fd',
                      fontSize: '0.875rem',
                    }}>
                      Click <strong>{storage.serviceAccountConfigured && folders.length === 0 ? 'Load Folders' : 'Save & Load Folders'}</strong> to fetch available folders from Google Drive
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="settings-info-box" style={{ marginTop: '2rem' }}>
              <div className="info-box-header">
                <span className="material-symbols-outlined">image</span>
                <h3>Cloudinary (portadas)</h3>
              </div>
              <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Las portadas se suben a Cloudinary. Los cambios aplican al instante, sin reiniciar el servidor.
              </p>

              <div style={{ marginTop: '1rem' }}>
                <div className="settings-field-group">
                  <label className="settings-label">Activar Cloudinary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setCloudinary({ ...cloudinary, enabled: !cloudinary.enabled })}
                      style={{
                        width: '3rem',
                        height: '1.5rem',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: cloudinary.enabled ? '#10b981' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          width: '1rem',
                          height: '1rem',
                          borderRadius: '9999px',
                          backgroundColor: 'white',
                          transform: cloudinary.enabled ? 'translateX(1.5rem)' : 'translateX(0)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>
                    <span>{cloudinary.enabled ? 'Activado' : 'Desactivado'}</span>
                  </div>
                </div>

                <div className="settings-field-group">
                  <label htmlFor="cloudName" className="settings-label">Cloud name</label>
                  <input
                    id="cloudName"
                    type="text"
                    value={cloudinary.cloudName}
                    onChange={(e) => setCloudinary({ ...cloudinary, cloudName: e.target.value })}
                    className="settings-input"
                    placeholder="tu-cloud-name"
                    disabled={!cloudinary.enabled}
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="cloudinaryApiKey" className="settings-label">API Key</label>
                  <input
                    id="cloudinaryApiKey"
                    type="text"
                    value={cloudinary.apiKey}
                    onChange={(e) => setCloudinary({ ...cloudinary, apiKey: e.target.value })}
                    className="settings-input"
                    disabled={!cloudinary.enabled}
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="cloudinaryApiSecret" className="settings-label">API Secret</label>
                  <input
                    id="cloudinaryApiSecret"
                    type="password"
                    value={cloudinary.apiSecret}
                    onChange={(e) => setCloudinary({ ...cloudinary, apiSecret: e.target.value })}
                    className="settings-input"
                    placeholder={cloudinary.configured ? '•••••••• (dejar vacío para no cambiar)' : 'Requerido'}
                    disabled={!cloudinary.enabled}
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="cloudinaryFolder" className="settings-label">Carpeta en Cloudinary</label>
                  <input
                    id="cloudinaryFolder"
                    type="text"
                    value={cloudinary.folder}
                    onChange={(e) => setCloudinary({ ...cloudinary, folder: e.target.value })}
                    className="settings-input"
                    placeholder="lbb/covers"
                    disabled={!cloudinary.enabled}
                  />
                </div>

                {testCloudinaryResult && (
                  <div
                    style={{
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: testCloudinaryResult.success ? '#10b98120' : '#ef444420',
                      border: `1px solid ${testCloudinaryResult.success ? '#10b981' : '#ef4444'}`,
                      color: testCloudinaryResult.success ? '#10b981' : '#ef4444',
                      fontSize: '0.875rem',
                    }}
                  >
                    {testCloudinaryResult.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await handleSaveStorage();
                        const result = await adminBooksService.testCloudinary();
                        setTestCloudinaryResult(result);
                      } catch (error) {
                        setTestCloudinaryResult({
                          success: false,
                          message: error instanceof Error ? error.message : 'Error al probar Cloudinary',
                        });
                      }
                    }}
                    disabled={!cloudinary.enabled || isSaving}
                    className="settings-btn-secondary"
                  >
                    Probar Cloudinary
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL TAB */}
        {activeTab === 'email' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>Email Configuration</h2>
              <p>Configure SMTP settings</p>
            </div>

            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <div className="settings-field-group">
                <label htmlFor="smtpHost" className="settings-label">SMTP Host</label>
                <input
                  id="smtpHost"
                  type="text"
                  value={email.smtpHost}
                  onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
                  className="settings-input"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="smtpPort" className="settings-label">SMTP Port</label>
                <input
                  id="smtpPort"
                  type="number"
                  value={email.smtpPort}
                  onChange={(e) => setEmail({ ...email, smtpPort: parseInt(e.target.value) })}
                  className="settings-input"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="smtpUser" className="settings-label">SMTP User</label>
                <input
                  id="smtpUser"
                  type="text"
                  value={email.smtpUser}
                  onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })}
                  className="settings-input"
                  autoComplete="off"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="smtpPassword" className="settings-label">SMTP Password</label>
                <input
                  id="smtpPassword"
                  type="text"
                  value={email.smtpPassword}
                  onChange={(e) => setEmail({ ...email, smtpPassword: e.target.value })}
                  className="settings-input"
                  autoComplete="new-password"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="senderEmail" className="settings-label">Sender Email</label>
                <input
                  id="senderEmail"
                  type="email"
                  value={email.senderEmail}
                  onChange={(e) => setEmail({ ...email, senderEmail: e.target.value })}
                  className="settings-input"
                />
              </div>
            </form>

            {emailSaveResult && (
              <div style={{
                padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.5rem',
                backgroundColor: emailSaveResult.success ? '#10b98120' : '#ef444420',
                border: `1px solid ${emailSaveResult.success ? '#10b981' : '#ef4444'}`,
                color: emailSaveResult.success ? '#10b981' : '#ef4444', fontSize: '0.875rem',
              }}>
                {emailSaveResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleTestEmail} className="settings-btn-secondary">
                Test Email
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={emailSaving}
                className="settings-btn-primary"
              >
                {emailSaving ? 'Guardando...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <div className="settings-section">
            <div className="settings-section-title">
              <h2>System Settings</h2>
              <p>Application configuration</p>
            </div>

            <div className="settings-toggle-item">
              <div className="toggle-info">
                <label className="toggle-label">Maintenance Mode</label>
                <p className="toggle-description">Enable maintenance mode to take the site offline</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={system.maintenanceMode}
                  onChange={() => setSystem({ ...system, maintenanceMode: !system.maintenanceMode })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Launch Configuration */}
            <div className="settings-field-group" style={{ marginTop: '1.5rem' }}>
              <div className="settings-section-title" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Launch Configuration</h3>
              </div>

              <div className="settings-field-group">
                <label htmlFor="launchDate" className="settings-label">Fecha de lanzamiento</label>
                <input
                  id="launchDate"
                  type="datetime-local"
                  value={launch.launchDate}
                  onChange={(e) => setLaunch({ ...launch, launchDate: e.target.value })}
                  className="settings-input"
                />
                <p className="toggle-description" style={{ marginTop: '0.25rem' }}>El sitio se abrirá automáticamente en esta fecha</p>
              </div>

              <div className="settings-field-group">
                <label htmlFor="comingSoonTitle" className="settings-label">Título de la página de espera</label>
                <input
                  id="comingSoonTitle"
                  type="text"
                  value={launch.comingSoonTitle}
                  onChange={(e) => setLaunch({ ...launch, comingSoonTitle: e.target.value })}
                  className="settings-input"
                  placeholder="Próximamente"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="comingSoonSubtitle" className="settings-label">Subtítulo / descripción</label>
                <textarea
                  id="comingSoonSubtitle"
                  value={launch.comingSoonSubtitle}
                  onChange={(e) => setLaunch({ ...launch, comingSoonSubtitle: e.target.value })}
                  className="settings-textarea"
                  rows={3}
                  placeholder="Algo increíble está en camino..."
                />
              </div>

              <div className="settings-field-group">
                <label className="settings-label">Imagen de fondo</label>
                <div className="profile-image-upload">
                  {launch.comingSoonBg ? (
                    <img src={launch.comingSoonBg} alt="Fondo" className="profile-image" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="profile-image profile-image-placeholder">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">image</span>
                    </div>
                  )}
                  <input
                    ref={launchBgInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLaunchBgUploading(true);
                      try {
                        const result = await adminBooksService.uploadComingSoonBg(file);
                        if (result?.url) {
                          setLaunch(prev => ({ ...prev, comingSoonBg: result.url }));
                        }
                      } finally {
                        setLaunchBgUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    className="upload-btn"
                    onClick={() => launchBgInputRef.current?.click()}
                    disabled={launchBgUploading}
                  >
                    <span className="material-symbols-outlined">photo_camera</span>
                    {launchBgUploading ? 'Subiendo...' : launch.comingSoonBg ? 'Cambiar fondo' : 'Subir fondo'}
                  </button>
                  {launch.comingSoonBg && (
                    <button
                      onClick={() => setLaunch(prev => ({ ...prev, comingSoonBg: '' }))}
                      className="upload-btn"
                      style={{ color: '#fca5a5' }}
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-field-group">
                <label htmlFor="instagramUrl" className="settings-label">URL Instagram</label>
                <input
                  id="instagramUrl"
                  type="url"
                  value={launch.instagramUrl}
                  onChange={(e) => setLaunch({ ...launch, instagramUrl: e.target.value })}
                  className="settings-input"
                  placeholder="https://instagram.com/tu-cuenta"
                />
              </div>

              <div className="settings-field-group">
                <label htmlFor="tiktokUrl" className="settings-label">URL TikTok</label>
                <input
                  id="tiktokUrl"
                  type="url"
                  value={launch.tiktokUrl}
                  onChange={(e) => setLaunch({ ...launch, tiktokUrl: e.target.value })}
                  className="settings-input"
                  placeholder="https://tiktok.com/@tu-cuenta"
                />
              </div>

              <a
                href="/coming-soon-preview"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  color: '#60a5fa', fontSize: '0.875rem', textDecoration: 'none',
                  marginTop: '0.25rem',
                }}
              >
                Previsualizar página de espera →
              </a>
            </div>

            <div className="settings-info-box">
              <div className="info-box-header">
                <span className="material-symbols-outlined">info</span>
                <h3>Environment Information</h3>
              </div>

              <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#ccc6bb' }}>Version</p>
                  <p style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{system.version}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#ccc6bb' }}>Environment</p>
                  <p style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem', textTransform: 'capitalize' }}>{system.environment}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#ccc6bb' }}>Last Deployment</p>
                  <p style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{system.lastDeployment}</p>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSystem} disabled={isSaving} className="settings-btn-primary">
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* Test Drive Result Modal */}
      {testDriveResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-lg max-w-md w-full p-6 border border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <span 
                className="material-symbols-outlined text-4xl" 
                style={{ color: testDriveResult.success ? '#10b981' : '#ef4444' }}
              >
                {testDriveResult.success ? 'check_circle' : 'error'}
              </span>
              <div>
                <h3 className="text-headline-md font-headline-md text-primary">
                  {testDriveResult.success ? 'Connection Successful' : 'Connection Failed'}
                </h3>
              </div>
            </div>

            <p className="text-on-surface-variant text-body-sm mb-4">
              {testDriveResult.message}
            </p>

            <button
              onClick={() => setTestDriveResult(null)}
              className="w-full px-4 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Save Storage Result Modal */}
      {saveStorageResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-lg max-w-md w-full p-6 border border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <span 
                className="material-symbols-outlined text-4xl" 
                style={{ color: saveStorageResult.success ? '#10b981' : '#ef4444' }}
              >
                {saveStorageResult.success ? 'check_circle' : 'error'}
              </span>
              <div>
                <h3 className="text-headline-md font-headline-md text-primary">
                  {saveStorageResult.success ? 'Saved Successfully' : 'Save Failed'}
                </h3>
              </div>
            </div>

            <p className="text-on-surface-variant text-body-sm mb-4">
              {saveStorageResult.message}
            </p>

            <button
              onClick={() => setSaveStorageResult(null)}
              className="w-full px-4 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
            >
              Close
            </button>
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
    </div>
  );
}
