import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CreateNoteCommand,
  NoteDto,
  ListNotesQuery,
  ListNotesResponseDto,
  UpdateNoteCommand,
} from '../../types';

/**
 * NotesService
 * Handles API communication for note operations
 * Provides methods to create, read, update, and delete notes
 */
@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/notes';

  /**
   * List notes with optional filters
   * @param query ListNotesQuery with filters (category_id, from, to, etc)
   * @returns Observable<ListNotesResponseDto> - Paginated list of notes
   */
  listNotes(query: ListNotesQuery): Observable<ListNotesResponseDto> {
    let params = new HttpParams();

    if (query.category_id) {
      if (Array.isArray(query.category_id)) {
        query.category_id.forEach(id => {
          params = params.append('category_id', id);
        });
      } else {
        params = params.set('category_id', query.category_id);
      }
    }

    if (query.from) {
      params = params.set('from', query.from);
    }

    if (query.to) {
      params = params.set('to', query.to);
    }

    if (query.include_deleted !== undefined) {
      params = params.set('include_deleted', query.include_deleted.toString());
    }

    if (query.limit) {
      params = params.set('limit', query.limit.toString());
    }

    if (query.offset !== undefined) {
      params = params.set('offset', query.offset.toString());
    }

    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    return this.httpClient.get<ListNotesResponseDto>(this.apiUrl, { params });
  }

  /**
   * Create a new note
   * @param command CreateNoteCommand with category_id, title, and content
   * @returns Observable<NoteDto> - Created note with full details
   */
  createNote(command: CreateNoteCommand): Observable<NoteDto> {
    return this.httpClient.post<NoteDto>(this.apiUrl, command);
  }

  /**
   * Get a note by ID
   * @param noteId UUID of the note to retrieve
   * @returns Observable<NoteDto> - Note details
   */
  getNote(noteId: string): Observable<NoteDto> {
    return this.httpClient.get<NoteDto>(`${this.apiUrl}/${noteId}`);
  }

  /**
   * Update an existing note
   * @param noteId UUID of the note to update
   * @param updates Partial note data to update
   * @returns Observable<NoteDto> - Updated note
   */
  updateNote(noteId: string, updates: Partial<NoteDto>): Observable<NoteDto> {
    return this.httpClient.put<NoteDto>(`${this.apiUrl}/${noteId}`, updates);
  }

  /**
   * Delete a note (soft delete)
   * @param noteId UUID of the note to delete
   * @returns Observable<void>
   */
  deleteNote(noteId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/${noteId}`);
  }
}
