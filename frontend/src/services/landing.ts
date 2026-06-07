export interface LatestRelease {
  _id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  coverUrl: string;
  priceCents: number;
  currency: string;
}

export interface FeaturedBook {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  coverUrl: string;
}

export interface LatestVolume {
  _id: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  coverUrl: string;
}

export interface Philosophy {
  title: string;
  content: string;
  authorImageUrl?: string | null;
}

export interface PreorderBook {
  _id: string;
  title: string;
  description: string;
  coverUrl: string;
  releaseDate: string;
}

export interface SocialLinks {
  instagram: string;
  twitter: string;
  tiktok: string;
  youtube: string;
}

export interface LandingData {
  latestRelease: LatestRelease | null;
  preorderBook: PreorderBook | null;
  featuredBooks: FeaturedBook[];
  latestVolumes: LatestVolume[];
  philosophy: Philosophy;
  siteName: string;
  logoUrl: string;
  socialLinks: SocialLinks;
}

const VITE_API_URL = import.meta.env.VITE_API_URL;

export const landingService = {
  /**
   * Obtiene los datos de la página de aterrizaje
   * @returns Promesa con datos de latest release, featured books y latest volumes
   */
  async getLandingData(): Promise<LandingData> {
    try {
      const response = await fetch(`${VITE_API_URL}/landing`);

      if (!response.ok) {
        throw new Error('Error al cargar los datos del landing');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
};
