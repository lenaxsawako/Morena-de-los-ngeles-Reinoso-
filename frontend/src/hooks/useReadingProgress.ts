import { useEffect } from 'react';
import { authService } from '../services/auth';
import { guestReadingService } from '../services/guestReading';
import { readingService } from '../services/reading';

interface UseReadingProgressOptions {
  bookId: string;
}

/**
 * Hook para sincronizar progreso de lectura automáticamente
 * Maneja tanto usuarios autenticados como guests
 */
export function useReadingProgress({ bookId }: UseReadingProgressOptions) {
  const isAuthenticated = authService.isAuthenticated();

  /**
   * Guarda el progreso de lectura
   * Si es guest: localStorage
   * Si es autenticado: backend + localStorage como cache
   */
  const saveProgress = (currentPage: number, progressPercentage: number) => {
    if (isAuthenticated) {
      // Usuario autenticado: sincronizar con backend
      readingService.updateProgress(bookId, currentPage)
        .catch((error) => {
          console.error('Error sincronizando progreso con backend:', error);
          // Como fallback, guardar en guest service también
          guestReadingService.saveProgress(bookId, currentPage, progressPercentage);
        });
    } else {
      // Guest: solo localStorage
      guestReadingService.saveProgress(bookId, currentPage, progressPercentage);
    }
  };

  /**
   * Obtiene el progreso actual
   */
  const getProgress = async () => {
    if (isAuthenticated) {
      try {
        return await readingService.getProgress(bookId);
      } catch (error) {
        console.error('Error obteniendo progreso del backend:', error);
        // Fallback a localStorage
        return guestReadingService.getProgress(bookId);
      }
    } else {
      return guestReadingService.getProgress(bookId);
    }
  };

  /**
   * Cargar el progreso previo al abrir un libro
   */
  useEffect(() => {
    getProgress().then((progress) => {
      if (progress) {
        window.dispatchEvent(
          new CustomEvent('bookProgressLoaded', {
            detail: progress,
          })
        );
      }
    });
  }, [bookId, isAuthenticated]);

  return {
    saveProgress,
    getProgress,
    isAuthenticated,
  };
}

/**
 * Hook para debounce de progreso de lectura
 * Evita guardar demasiado frecuentemente
 */
export function useDebouncedReadingProgress(
  bookId: string,
  debounceMs: number = 3000
) {
  const { saveProgress: directSave, getProgress, isAuthenticated } = useReadingProgress({ bookId });
  let timeoutId: ReturnType<typeof setTimeout>;

  const saveProgress = (currentPage: number, progressPercentage: number) => {
    // Cancelar el timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Configurar un nuevo timeout
    timeoutId = setTimeout(() => {
      directSave(currentPage, progressPercentage);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    saveProgress,
    getProgress,
    isAuthenticated,
  };
}
