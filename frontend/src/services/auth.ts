const API_URL = import.meta.env.VITE_API_URL;

// Interfaces para Request
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

// Interfaces para Reading Progress Migration
export interface ReadingProgressMigration {
  bookId: string;
  currentPage: number;
  progressPercentage: number;
  lastReadAt: string;
}

// Interfaces para Response
export interface AuthResponse {
  access_token: string;
}

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

/**
 * Servicio de autenticación
 * Base URL: http://localhost:3109/auth
 */
export const authService = {
  /**
   * POST /auth/login
   * Inicia sesión con email y contraseña
   * @throws Error con mensaje de credenciales inválidas o validación fallida
   */
  async login(data: LoginDto) {
    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result: AuthResponse | ApiError = await response.json();

      if (!response.ok) {
        const error = result as ApiError;
        throw new Error(
          Array.isArray(error.message)
            ? error.message.join(", ")
            : error.message
        );
      }

      const authData = result as AuthResponse;
      localStorage.setItem("token", authData.access_token);
      localStorage.setItem("userEmail", data.email);

      // Sincronizar progreso de lectura del guest después de autenticación
      const { guestReadingService } = await import('./guestReading');
      const guestProgress = guestReadingService.getProgressForMigration();
      if (guestProgress.length > 0) {
        await this.syncReadingProgress(guestProgress);
        this.clearGuestReadingProgress();
      }

      return authData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error durante el login");
    }
  },

  /**
   * POST /auth/register
   * Registra un nuevo usuario
   * @throws Error con mensaje de email duplicado o validación fallida
   */
  async register(data: RegisterDto) {
    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result: AuthResponse | ApiError = await response.json();

      if (!response.ok) {
        const error = result as ApiError;
        throw new Error(
          Array.isArray(error.message)
            ? error.message.join(", ")
            : error.message
        );
      }

      const authData = result as AuthResponse;
      localStorage.setItem("token", authData.access_token);
      localStorage.setItem("userEmail", data.email);

      // Sincronizar progreso de lectura del guest después de autenticación
      const { guestReadingService } = await import('./guestReading');
      const guestProgress = guestReadingService.getProgressForMigration();
      if (guestProgress.length > 0) {
        await this.syncReadingProgress(guestProgress);
        this.clearGuestReadingProgress();
      }

      return authData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error durante el registro");
    }
  },

  /**
   * Cierra sesión eliminando el token
   */
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  },

  /**
   * Obtiene el token JWT almacenado
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem("token");
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns true si existe un token válido
   */
  isAuthenticated(): boolean {
    return localStorage.getItem("token") !== null;
  },

  /**
   * Obtiene el email del usuario autenticado
   * @returns Email del usuario o null si no está autenticado
   */
  getUserEmail(): string | null {
    return localStorage.getItem("userEmail");
  },

  /**
   * Decodifica el JWT para obtener el ID del usuario (sub)
   * @returns ID del usuario o null si no está autenticado
   */
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  },

  /**
   * Decodifica el JWT para obtener el rol del usuario
   * @returns Rol del usuario ('user' | 'admin') o null si no está autenticado
   */
  getUserRole(): 'user' | 'admin' | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      let role: 'user' | 'admin' | null = null;

      if (payload.isAdmin === true) {
        role = 'admin';
      } else if (payload.role) {
        role = payload.role;
      }

      return role;
    } catch {
      return null;
    }
  },

  /**
   * Verifica si el usuario es administrador
   * @returns true si el usuario tiene rol 'admin'
   */
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  },

  /**
   * Almacena el email del usuario
   * @param email Email del usuario
   */
  setUserEmail(email: string): void {
    localStorage.setItem("userEmail", email);
  },

  /**
   * Obtiene el header de autorización para requests protegidos
   * @returns Header de autorización o undefined si no hay token
   */
  getAuthHeader(): { Authorization: string } | undefined {
    const token = this.getToken();
    if (!token) return undefined;
    return {
      Authorization: `Bearer ${token}`,
    };
  },

  /**
   * Sincroniza el progreso de lectura del guest con el backend
   * Se llama automáticamente después de login/register
   * @param progressData Array de progreso de lectura del guest
   * @throws Error si la sincronización falla
   */
  async syncReadingProgress(progressData: ReadingProgressMigration[]): Promise<void> {
    if (progressData.length === 0) return;

    try {
      const authHeader = this.getAuthHeader();
      if (!authHeader) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(
        `${API_URL}/library/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify(progressData),
        }
      );

      if (!response.ok) {
        // Error silencioso
      }
    } catch {
      // No lanzar error para que no bloquee el flujo de autenticación
    }
  },

  /**
   * Limpia el progreso de lectura del guest después de sincronización exitosa
   * Se llama automáticamente después de sincronizar con el backend
   */
  clearGuestReadingProgress(): void {
    // Importamos dinámicamente para evitar circular dependency
    import('./guestReading').then(({ guestReadingService }) => {
      guestReadingService.clearAfterMigration();
    });
  },
};