/**
 * NavigationService
 *
 * Centralizes navigation logic across the application.
 * Keeps track of:
 * - Current category being viewed
 * - Navigation between views with proper context
 * - URL routing with category awareness
 *
 * Usage:
 * - Use navigateToNoteDetail() to navigate from notes list to note detail
 * - Use navigateToDashboard() to return to dashboard
 * - Use getCurrentCategoryId() to access the currently selected category
 */

import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UUID } from '../../types';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly router = Router;
  
  // Track the currently selected category
  private readonly currentCategoryId = signal<UUID | null>(null);

  // Public computed signal for tracking category
  readonly selectedCategoryId = computed(() => this.currentCategoryId());

  constructor(private injectedRouter: Router) {}

  /**
   * Navigate to note detail view with category context
   * @param categoryId - The category UUID the note belongs to
   * @param noteId - The note UUID to display
   */
  navigateToNoteDetail(categoryId: UUID, noteId: UUID): Promise<boolean> {
    this.currentCategoryId.set(categoryId);
    return this.injectedRouter.navigate(['/notes', categoryId, noteId]);
  }

  /**
   * Navigate to notes list for a specific category
   * @param categoryId - The category UUID to filter notes by
   */
  navigateToNotesList(categoryId: UUID): Promise<boolean> {
    this.currentCategoryId.set(categoryId);
    return this.injectedRouter.navigate(['/notes'], {
      queryParams: { categoryId },
    });
  }

  /**
   * Navigate to dashboard
   */
  navigateToDashboard(): Promise<boolean> {
    this.currentCategoryId.set(null);
    return this.injectedRouter.navigate(['/dashboard']);
  }

  /**
   * Navigate to login
   */
  navigateToLogin(): Promise<boolean> {
    this.currentCategoryId.set(null);
    return this.injectedRouter.navigate(['/login']);
  }

  /**
   * Navigate to registration
   */
  navigateToRegistration(): Promise<boolean> {
    this.currentCategoryId.set(null);
    return this.injectedRouter.navigate(['/register']);
  }

  /**
   * Navigate to preferences
   */
  navigateToPreferences(): Promise<boolean> {
    return this.injectedRouter.navigate(['/preferences']);
  }

  /**
   * Get the currently selected category ID
   */
  getCurrentCategoryId(): UUID | null {
    return this.currentCategoryId();
  }

  /**
   * Set the current category ID (useful when entering a view via URL)
   */
  setCurrentCategoryId(categoryId: UUID | null): void {
    this.currentCategoryId.set(categoryId);
  }

  /**
   * Clear the current category ID
   */
  clearCurrentCategoryId(): void {
    this.currentCategoryId.set(null);
  }
}

