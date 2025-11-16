import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CategoryDto, UUID } from '../../../../../types';

/**
 * CategoryCard Component
 *
 * Reusable presentational component that displays a single category with its progress
 * indicator and action button. Part of the Dashboard View's categories grid.
 *
 * Features:
 * - Displays category name, progress bar, and note count
 * - Visual distinction for focus/active categories
 * - Loading state handling
 * - Keyboard accessible with ARIA labels
 * - OnPush change detection for optimal performance
 */
@Component({
  selector: 'app-category-card',
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzProgressModule, NzButtonModule, NzSpinModule],
})
export class CategoryCardComponent {
  /**
   * Input: Category data object
   * Complete category object from GET /api/categories containing id, slug, name, active, created_at
   */
  readonly category = input<CategoryDto | null>(null);

  /**
   * Input: Current number of notes for this category
   * From dashboardSummary.notes_count[categoryId]
   */
  readonly noteCount = input(0);

  /**
   * Input: Maximum daily notes limit
   * From preferences.max_daily_notes (typically 10)
   */
  readonly maxNotes = input(10);

  /**
   * Input: Whether category is in user's active categories
   * True if category.id is in preferences.active_categories
   */
  readonly isFocusCategory = input(false);

  /**
   * Input: Loading state flag
   * True while data is being fetched or updated
   */
  readonly isLoading = input(false);

  /**
   * Output: Event emitted when "Add Note" button is clicked
   * Emits the category UUID
   */
  readonly addNoteClick = output<UUID>();

  /**
   * Color mapping for focus categories
   * Maps category slug to Tailwind gradient color class
   */
  private readonly categoryColorMap: Record<string, string> = {
    family: 'from-red-500 to-red-600',
    friends: 'from-yellow-500 to-yellow-600',
    pets: 'from-purple-500 to-purple-600',
    body: 'from-green-500 to-green-600',
    mind: 'from-blue-500 to-blue-600',
    passions: 'from-pink-500 to-pink-600',
  };

  /**
   * Computed: Progress percentage (0-100)
   * Calculated as (noteCount / maxNotes) * 100, capped at 100
   */
  readonly progressPercentage = computed(() => {
    const max = this.maxNotes();
    if (!max || max === 0) {
      return 0;
    }
    const count = this.noteCount();
    const percentage = (count / max) * 100;
    return Math.min(percentage, 100);
  });

  /**
   * Computed: Tailwind color class for focus category styling
   * Returns color based on category slug, defaults to blue if not found
   */
  readonly focusColor = computed(() => {
    const cat = this.category();
    return (
      this.categoryColorMap[cat?.slug ?? ''] || 'from-blue-500 to-blue-600'
    );
  });

  /**
   * Computed: Accessible label for category
   * Used for aria-label and title attributes
   */
  readonly categoryLabel = computed(() => {
    const cat = this.category();
    const count = this.noteCount();
    const max = this.maxNotes();
    return `${cat?.name} category with ${count} of ${max} notes`;
  });

  /**
   * Handle "Add Note" button click
   * Validates category ID and emits event to parent
   */
  onAddNoteClick(): void {
    const loading = this.isLoading();
    const cat = this.category();

    if (!loading && cat?.id) {
      this.addNoteClick.emit(cat.id);
    } else if (!cat?.id) {
      console.error(
        'CategoryCard: Cannot emit click - missing or invalid category ID'
      );
    }
  }

  /**
   * Get CSS class object for card container
   * Applies conditional classes for focus and loading states
   */
  getCardClasses = computed(() => ({
    'category-card': true,
    'category-card--focus': this.isFocusCategory(),
    'category-card--loading': this.isLoading(),
  }));
}
