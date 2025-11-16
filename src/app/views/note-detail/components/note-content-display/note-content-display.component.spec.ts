import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteContentDisplayComponent } from './note-content-display.component';
import { NoteDetailViewModel } from '../../../../../types';

describe('NoteContentDisplayComponent', () => {
  let component: NoteContentDisplayComponent;
  let fixture: ComponentFixture<NoteContentDisplayComponent>;

  const mockNoteViewModel: NoteDetailViewModel = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    category_id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Test Note Title',
    content: 'This is the test note content with\nmultiple lines',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    deleted_at: null,
    createdAtFormatted: 'Jan 15, 2025 at 10:00 AM',
    updatedAtFormatted: 'Jan 15, 2025 at 10:00 AM',
    categoryName: 'Family',
    categoryColor: 'bg-red-500',
    isEdited: false,
    readableContent: 'This is the test note content with\nmultiple lines',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteContentDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteContentDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display note title', () => {
    TestBed.runInInjectionContext(() => {
      component.note = jasmine
        .createSpy()
        .and.returnValue(mockNoteViewModel);
    });

    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('h1');
    expect(titleElement?.textContent).toContain('Test Note Title');
  });

  it('should display "Untitled Note" when title is null', () => {
    const noteWithoutTitle = { ...mockNoteViewModel, title: null };

    TestBed.runInInjectionContext(() => {
      component.note = jasmine
        .createSpy()
        .and.returnValue(noteWithoutTitle);
    });

    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('h1');
    expect(titleElement?.textContent).toContain('Untitled Note');
  });

  it('should display note content', () => {
    TestBed.runInInjectionContext(() => {
      component.note = jasmine
        .createSpy()
        .and.returnValue(mockNoteViewModel);
    });

    fixture.detectChanges();

    const contentElement = fixture.nativeElement.querySelector('.prose');
    expect(contentElement?.textContent).toContain(
      'This is the test note content'
    );
  });

  it('should display creation date', () => {
    TestBed.runInInjectionContext(() => {
      component.note = jasmine
        .createSpy()
        .and.returnValue(mockNoteViewModel);
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Jan 15, 2025 at 10:00 AM'
    );
  });

  it('should display category name and color', () => {
    TestBed.runInInjectionContext(() => {
      component.note = jasmine
        .createSpy()
        .and.returnValue(mockNoteViewModel);
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Family');
  });

  it('should show edited indicator when note is edited', () => {
    const editedNote = {
      ...mockNoteViewModel,
      isEdited: true,
      updatedAtFormatted: 'Jan 15, 2025 at 11:00 AM',
    };

    TestBed.runInInjectionContext(() => {
      component.note = jasmine.createSpy().and.returnValue(editedNote);
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Edited');
    expect(fixture.nativeElement.textContent).toContain(
      'Jan 15, 2025 at 11:00 AM'
    );
  });

  it('should not show edited indicator when note is not edited', () => {
    TestBed.runInInjectionContext(() => {
      component.note = jasmine
        .createSpy()
        .and.returnValue(mockNoteViewModel);
    });

    fixture.detectChanges();

    const editedIndicator = fixture.nativeElement.textContent;
    // The word "Edited" should not be shown for non-edited notes in the edited section
    const editedCount = (editedIndicator.match(/Edited/g) || []).length;
    expect(editedCount).toBe(0);
  });

  it('should not display when note is null', () => {
    TestBed.runInInjectionContext(() => {
      component.note = jasmine.createSpy().and.returnValue(null);
    });

    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.note-content-wrapper');
    expect(wrapper).toBeFalsy();
  });
});

