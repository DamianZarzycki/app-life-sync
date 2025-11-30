import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportFeedbackFormValue } from '../../../../../types';
import { NzButtonModule } from 'ng-zorro-antd/button';

/**
 * ReportFeedbackModal
 * Presentational modal component for collecting user feedback on reports.
 * Displays emoji rating options and comment textarea with character counter.
 */
@Component({
  selector: 'app-report-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NzButtonModule],
  templateUrl: './report-feedback-modal.component.html',
  styleUrls: ['./report-feedback-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFeedbackModalComponent {
  // Input signals
  readonly selectedRating = input<number | null>(null);
  readonly comment = input<string>('');
  readonly isSubmitting = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly remainingChars = input<number>(300);

  // Output emitters
  readonly onRatingSelect = output<number>();
  readonly onCommentChange = output<string>();
  readonly onSubmit = output<ReportFeedbackFormValue>();
  readonly onCancel = output<void>();

  // Computed properties
  readonly isRatingSelected = computed(() => this.selectedRating() !== null);
  readonly isCharCountWarning = computed(() => this.remainingChars() < 50);

  /**
   * Emoji ratings for feedback
   */
  readonly ratingOptions = [
    { value: 0, emoji: '👍', label: 'Good' },
    { value: 1, emoji: '😐', label: 'Neutral' },
    { value: 2, emoji: '👎', label: 'Could improve' },
  ];

  /**
   * Handles emoji rating selection
   */
  public selectRating(rating: number): void {
    this.onRatingSelect.emit(rating);
  }

  /**
   * Handles comment input change
   */
  public updateComment(text: string): void {
    // Enforce 300 character limit
    if (text.length <= 300) {
      this.onCommentChange.emit(text);
    }
  }

  /**
   * Submits the feedback form
   */
  public submit(): void {
    if (this.selectedRating() !== null) {
      this.onSubmit.emit({
        rating: this.selectedRating()!,
        comment: this.comment(),
      });
    }
  }

  /**
   * Cancels feedback submission
   */
  public cancel(): void {
    this.onCancel.emit();
  }
}

