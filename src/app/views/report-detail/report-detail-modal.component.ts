import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportDetailService } from '../../services/report-detail.service';
import { ReportDetailContentComponent } from './components/report-detail-content/report-detail-content.component';
import { ReportFeedbackModalComponent } from './components/report-feedback-modal/report-feedback-modal.component';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';

/**
 * ReportDetailModal
 * Smart container component that manages the entire report detail modal lifecycle.
 * Uses signals for reactive state management and computed properties for derived state.
 */
@Component({
  selector: 'app-report-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzSpinModule,
    NzAlertModule,
    NzButtonModule,
    ReportDetailContentComponent,
    ReportFeedbackModalComponent,
  ],
  templateUrl: './report-detail-modal.component.html',
  styleUrls: ['./report-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReportDetailModalComponent {
  private readonly reportDetailService = inject(ReportDetailService);

  // Expose service signals and computed state
  readonly state = this.reportDetailService.state;
  readonly isOpen = this.reportDetailService.isOpen;
  readonly isLoading = this.reportDetailService.isLoading;
  readonly isFeedbackSubmitting = this.reportDetailService.isFeedbackSubmitting;
  readonly report = this.reportDetailService.report;
  readonly showFeedback = this.reportDetailService.showFeedback;
  readonly error = this.reportDetailService.error;
  readonly feedbackFormValue = this.reportDetailService.feedbackFormValue;
  readonly feedbackError = this.reportDetailService.feedbackError;

  // Derived computed signals
  readonly isSubmitDisabled = computed(() => {
    const rating = this.feedbackFormValue().rating;
    const isSubmitting = this.isFeedbackSubmitting();
    return rating === null || rating === undefined || isSubmitting;
  });

  readonly remainingChars = computed(() => {
    const comment = this.feedbackFormValue().comment;
    return 300 - (comment?.length || 0);
  });

  /**
   * Closes the report detail modal
   */
  public onModalClose(): void {
    this.reportDetailService.closeModal();
  }

  /**
   * Retries fetching the report on error
   */
  public onRetry(): void {
    const reportId = this.state().reportId;
    if (reportId) {
      this.reportDetailService.retryFetchReport(reportId);
    }
  }

  /**
   * Handles feedback comment input
   */
  public onFeedbackCommentChange(comment: string): void {
    this.reportDetailService.updateFeedbackComment(comment);
  }

  /**
   * Handles feedback rating selection
   */
  public onFeedbackRatingSelect(rating: number): void {
    this.reportDetailService.updateFeedbackRating(rating);
  }

  /**
   * Handles feedback form submission
   */
  public onFeedbackSubmit(): void {
    const reportId = this.state().reportId;
    const feedback = this.feedbackFormValue();

    if (reportId && feedback.rating !== null && feedback.rating !== undefined) {
      this.reportDetailService.submitFeedback(reportId, feedback);
    }
  }

  /**
   * Handles feedback modal cancel/skip
   */
  public onFeedbackCancel(): void {
    this.reportDetailService.closeModal();
  }
}

