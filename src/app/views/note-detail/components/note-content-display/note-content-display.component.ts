/**
 * NoteContentDisplayComponent
 *
 * Presentational component for displaying note content and metadata.
 * Receives formatted note data from parent and renders it in a clean, readable format.
 *
 * Responsibilities:
 * - Render note title (or "Untitled Note" if null)
 * - Display note content with proper formatting
 * - Show creation and modification dates
 * - Display category badge with color
 * - Show "edited" indicator if note has been updated
 *
 * Does NOT:
 * - Manage state
 * - Make API calls
 * - Handle user interactions (read-only)
 */

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NoteDetailViewModel,
} from '../../../../../types';

@Component({
  selector: 'app-note-content-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-content-display.component.html',
  styleUrl: './note-content-display.component.scss',
})
export class NoteContentDisplayComponent {
  /**
   * Input: Pre-formatted note view model
   * Contains all data needed for display including formatted dates and category info
   */
  readonly note = input<NoteDetailViewModel | null>(null);

  /**
   * Input: Loading state flag
   * When true, indicates data is still being fetched (optional for visual feedback)
   */
  readonly isLoading = input<boolean>(false);
}

