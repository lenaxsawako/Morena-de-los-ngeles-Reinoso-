/**
 * Guest Reading System - LocalStorage
 * Manages reading progress for unauthenticated users
 * Data persists across page refreshes
 */

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  progressPercentage: number;
  lastReadAt: string;
}

const STORAGE_KEY = 'reader_progress';

export const guestReadingService = {
  /**
   * Save or update reading progress for a book
   * @param bookId - The book identifier
   * @param currentPage - Current page number
   * @param progressPercentage - Progress percentage (0-100)
   */
  saveProgress(bookId: string, currentPage: number, progressPercentage: number): void {
    try {
      const progress = this.getAll();
      
      // Find existing entry for this book
      const existingIndex = progress.findIndex(p => p.bookId === bookId);
      
      const newEntry: ReadingProgress = {
        bookId,
        currentPage,
        progressPercentage,
        lastReadAt: new Date().toISOString(),
      };
      
      if (existingIndex !== -1) {
        // Update existing entry
        progress[existingIndex] = newEntry;
      } else {
        // Add new entry
        progress.push(newEntry);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.error('Error saving reading progress:', err);
    }
  },

  /**
   * Get reading progress for a specific book
   * @param bookId - The book identifier
   * @returns Reading progress or null if not found
   */
  getProgress(bookId: string): ReadingProgress | null {
    try {
      const progress = this.getAll();
      return progress.find(p => p.bookId === bookId) || null;
    } catch (err) {
      console.error('Error retrieving reading progress:', err);
      return null;
    }
  },

  /**
   * Get all stored reading progress entries
   * @returns Array of all reading progress entries
   */
  getAll(): ReadingProgress[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error parsing reading progress:', err);
      return [];
    }
  },

  /**
   * Get the most recently read book (for Continue Reading widget)
   * @returns Most recent reading progress or null if empty
   */
  getContinueReading(): ReadingProgress | null {
    try {
      const progress = this.getAll();
      if (progress.length === 0) return null;
      
      // Sort by lastReadAt descending and return the first
      return progress.sort((a, b) => 
        new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
      )[0];
    } catch (err) {
      console.error('Error getting continue reading:', err);
      return null;
    }
  },

  /**
   * Get all guest library entries sorted by most recent
   * @returns Array of reading progress sorted by lastReadAt DESC
   */
  getGuestLibrary(): ReadingProgress[] {
    try {
      const progress = this.getAll();
      return progress.sort((a, b) => 
        new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
      );
    } catch (err) {
      console.error('Error getting guest library:', err);
      return [];
    }
  },

  /**
   * Delete progress for a specific book
   * @param bookId - The book identifier
   */
  deleteProgress(bookId: string): void {
    try {
      const progress = this.getAll();
      const filtered = progress.filter(p => p.bookId !== bookId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Error deleting reading progress:', err);
    }
  },

  /**
   * Clear all reading progress
   * Used during login migration after syncing with backend
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing reading progress:', err);
    }
  },

  /**
   * Get all progress for login migration
   * Called when user authenticates to sync with backend
   * @returns All reading progress entries for backend sync
   */
  getProgressForMigration(): ReadingProgress[] {
    return this.getAll();
  },

  /**
   * Clear progress after successful backend sync
   * Called after login migration completes
   */
  clearAfterMigration(): void {
    this.clearAll();
  },
};
