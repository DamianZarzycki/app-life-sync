/**
 * NotesListItemComponent
 *
 * Presentational component for displaying a single note in a list.
 * Shows note title, excerpt of content, and metadata (created date).
 * Does NOT handle interactions - parent component manages click events.
 */

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteDto } from '../../../../../types';

@Component({
  selector: 'app-notes-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes-list-item.component.html',
  styleUrl: './notes-list-item.component.scss',
})
export class NotesListItemComponent {
  /**
   * Input: Note data to display
   */
  readonly note = input<NoteDto | null>(null);

  /**
   * Get formatted date string
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get content excerpt (first 100 characters)
   */
  getExcerpt(content: string): string {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
}

