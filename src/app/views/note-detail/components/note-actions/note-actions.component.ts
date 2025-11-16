/**
 * NoteActionsComponent
 *
 * Presentational component for note action buttons.
 * Provides Edit and Delete buttons with proper styling and state management.
 *
 * Responsibilities:
 * - Render Edit button (triggers edit modal)
 * - Render Delete button (triggers delete confirmation)
 * - Apply loading states to buttons based on operation status
 * - Emit events to parent container when buttons clicked
 * - Provide accessibility labels (ARIA)
 *
 * Does NOT:
 * - Manage state
 * - Make API calls
 * - Handle confirmation logic (parent handles via modals)
 */

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-note-actions',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule],
  templateUrl: './note-actions.component.html',
  styleUrl: './note-actions.component.scss',
})
export class NoteActionsComponent {
  /**
   * Input: Edit/update operation loading state
   * When true, disables Edit button and shows loading indicator
   */
  readonly isLoading = input<boolean>(false);

  /**
   * Input: Delete operation loading state
   * When true, disables Delete button
   */
  readonly isDeleting = input<boolean>(false);

  /**
   * Output: Edit button clicked event
   * Parent opens edit modal when this is emitted
   */
  readonly editClicked = output<void>();

  /**
   * Output: Delete button clicked event
   * Parent shows delete confirmation when this is emitted
   */
  readonly deleteClicked = output<void>();

  /**
   * Handle edit button click
   * Emits editClicked event to parent
   */
  onEditClick(): void {
    this.editClicked.emit();
  }

  /**
   * Handle delete button click
   * Emits deleteClicked event to parent
   */
  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}

