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
 * - Consistent visual styling with blue accent color
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
   * Output: Event emitted when category card is clicked to view notes
   * Emits the category UUID
   */
  readonly viewNotesClick = output<UUID>();

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
   * Handle category card click to view notes for this category
   * Validates category ID and emits event to parent
   */
  onViewNotesClick(): void {
    const cat = this.category();

    if (cat?.id) {
      this.viewNotesClick.emit(cat.id);
    } else {
      console.error(
        'CategoryCard: Cannot emit click - missing or invalid category ID'
      );
    }
  }

  /**
   * Get CSS class object for card container
   * Applies conditional classes for loading state
   */
  getCardClasses = computed(() => ({
    'category-card': true,
    'category-card--loading': this.isLoading(),
  }));
}
