import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { NoteDetailContainerComponent } from './note-detail-container.component';
import { NotesService } from '../../services/notes.service';
import { DashboardService } from '../../services/dashboard.service';
import {
  NoteDto,
  UpdateNoteCommand,
} from '../../../types';

describe('NoteDetailContainerComponent', () => {
  let component: NoteDetailContainerComponent;
  let fixture: ComponentFixture<NoteDetailContainerComponent>;
  let notesService: jasmine.SpyObj<NotesService>;
  let router: jasmine.SpyObj<Router>;
  let messageService: jasmine.SpyObj<NzMessageService>;
  let modalService: jasmine.SpyObj<NzModalService>;

  const mockNoteDto: NoteDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    category_id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Test Note',
    content: 'Test content for the note',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    deleted_at: null,
  };

  beforeEach(async () => {
    const notesServiceSpy = jasmine.createSpyObj('NotesService', [
      'getNoteById',
      'updateNote',
      'deleteNote',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const messageServiceSpy = jasmine.createSpyObj('NzMessageService', [
      'success',
      'error',
    ]);
    const modalServiceSpy = jasmine.createSpyObj('NzModalService', ['confirm']);
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getCategoryColorMap',
      'getCategoryNameById',
    ]);

    await TestBed.configureTestingModule({
      imports: [NoteDetailContainerComponent],
      providers: [
        { provide: NotesService, useValue: notesServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NzMessageService, useValue: messageServiceSpy },
        { provide: NzModalService, useValue: modalServiceSpy },
        { provide: DashboardService, useValue: dashboardServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ noteId: '123e4567-e89b-12d3-a456-426614174000' }),
          },
        },
      ],
    }).compileComponents();

    notesService = TestBed.inject(NotesService) as jasmine.SpyObj<NotesService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    messageService = TestBed.inject(
      NzMessageService
    ) as jasmine.SpyObj<NzMessageService>;
    modalService = TestBed.inject(
      NzModalService
    ) as jasmine.SpyObj<NzModalService>;

    fixture = TestBed.createComponent(NoteDetailContainerComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should fetch note on component init', (done) => {
      notesService.getNoteById.and.returnValue(of(mockNoteDto));

      fixture.detectChanges();

      setTimeout(() => {
        expect(notesService.getNoteById).toHaveBeenCalledWith(
          '123e4567-e89b-12d3-a456-426614174000'
        );
        done();
      }, 100);
    });

    it('should handle note fetch error (404)', (done) => {
      const error = {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
        },
      };
      notesService.getNoteById.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.fetchError()).toBeTruthy();
        expect(component.fetchError()?.status).toBe(404);
        done();
      }, 100);
    });

    it('should handle unauthorized error (401)', (done) => {
      const error = {
        status: 401,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      };
      notesService.getNoteById.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.fetchError()?.status).toBe(401);
        done();
      }, 100);
    });
  });

  describe('Edit Note', () => {
    beforeEach((done) => {
      notesService.getNoteById.and.returnValue(of(mockNoteDto));
      fixture.detectChanges();

      setTimeout(() => {
        done();
      }, 100);
    });

    it('should open edit modal when edit is clicked', () => {
      component.onEditClicked();
      expect(component.isEditModalOpen()).toBe(true);
    });

    it('should submit edit form and update note', (done) => {
      const updatedNote: NoteDto = {
        ...mockNoteDto,
        title: 'Updated Title',
        content: 'Updated content',
        updated_at: '2025-01-15T11:00:00Z',
      };

      const command: UpdateNoteCommand = {
        category_id: mockNoteDto.category_id,
        title: 'Updated Title',
        content: 'Updated content',
      };

      notesService.updateNote.and.returnValue(of(updatedNote));

      component.onEditSubmitted(command);

      setTimeout(() => {
        expect(notesService.updateNote).toHaveBeenCalledWith(
          '123e4567-e89b-12d3-a456-426614174000',
          command
        );
        expect(component.isEditModalOpen()).toBe(false);
        expect(messageService.success).toHaveBeenCalledWith(
          'Note updated successfully'
        );
        done();
      }, 100);
    });

    it('should handle edit error (422 validation)', (done) => {
      const error = {
        status: 422,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content must be between 1 and 1000 characters',
        },
      };

      const command: UpdateNoteCommand = {
        category_id: mockNoteDto.category_id,
        title: 'Test',
        content: '',
      };

      notesService.updateNote.and.returnValue(throwError(() => error));

      component.onEditSubmitted(command);

      setTimeout(() => {
        expect(component.editFormError()).toBeTruthy();
        expect(component.editFormError()?.status).toBe(422);
        expect(component.isEditModalOpen()).toBe(true);
        done();
      }, 100);
    });

    it('should cancel edit without saving', () => {
      component.onEditClicked();
      expect(component.isEditModalOpen()).toBe(true);

      component.onEditCancelled();
      expect(component.isEditModalOpen()).toBe(false);
    });
  });

  describe('Delete Note', () => {
    beforeEach((done) => {
      notesService.getNoteById.and.returnValue(of(mockNoteDto));
      fixture.detectChanges();

      setTimeout(() => {
        done();
      }, 100);
    });

    it('should show confirmation dialog on delete click', () => {
      component.onDeleteClicked();
      expect(modalService.confirm).toHaveBeenCalled();
    });

    it('should delete note after confirmation', (done) => {
      notesService.deleteNote.and.returnValue(of(void 0));

      // Get the confirm callback from the modal service
      let confirmCallback: (() => void) | null = null;
      modalService.confirm.and.callFake((config: any) => {
        confirmCallback = config.nzOnOk;
        return undefined as any;
      });

      component.onDeleteClicked();

      if (confirmCallback) {
        confirmCallback();

        setTimeout(() => {
          expect(notesService.deleteNote).toHaveBeenCalledWith(
            '123e4567-e89b-12d3-a456-426614174000'
          );
          expect(messageService.success).toHaveBeenCalledWith(
            'Note deleted successfully'
          );
          done();
        }, 1100);
      } else {
        fail('Confirm callback not set');
      }
    });

    it('should handle delete error', (done) => {
      const error = {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
        },
      };

      notesService.deleteNote.and.returnValue(throwError(() => error));

      let confirmCallback: (() => void) | null = null;
      modalService.confirm.and.callFake((config: any) => {
        confirmCallback = config.nzOnOk;
        return undefined as any;
      });

      component.onDeleteClicked();

      if (confirmCallback) {
        confirmCallback();

        setTimeout(() => {
          expect(component.operationError()).toBeTruthy();
          expect(component.operationError()?.status).toBe(404);
          done();
        }, 100);
      }
    });
  });

  describe('Navigation', () => {
    it('should go back on back button click', () => {
      const location = TestBed.inject(Location);
      spyOn(location, 'back');

      component.onBackClicked();

      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('View Model Transformation', () => {
    it('should format dates correctly', (done) => {
      notesService.getNoteById.and.returnValue(of(mockNoteDto));

      fixture.detectChanges();

      setTimeout(() => {
        const viewModel = component.viewModel();
        expect(viewModel).toBeTruthy();
        expect(viewModel?.createdAtFormatted).toBeTruthy();
        expect(viewModel?.updatedAtFormatted).toBeTruthy();
        done();
      }, 100);
    });

    it('should identify edited notes', (done) => {
      const editedNote: NoteDto = {
        ...mockNoteDto,
        updated_at: '2025-01-15T12:00:00Z',
      };

      notesService.getNoteById.and.returnValue(of(editedNote));

      fixture.detectChanges();

      setTimeout(() => {
        const viewModel = component.viewModel();
        expect(viewModel?.isEdited).toBe(true);
        done();
      }, 100);
    });
  });
});

// Import Location at the top of the file if not already imported
import { Location } from '@angular/common';

