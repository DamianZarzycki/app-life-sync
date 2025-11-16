import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteActionsComponent } from './note-actions.component';

describe('NoteActionsComponent', () => {
  let component: NoteActionsComponent;
  let fixture: ComponentFixture<NoteActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteActionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit editClicked event when edit button is clicked', (done) => {
    spyOn(component.editClicked, 'emit');

    component.onEditClick();

    expect(component.editClicked.emit).toHaveBeenCalled();
    done();
  });

  it('should emit deleteClicked event when delete button is clicked', (done) => {
    spyOn(component.deleteClicked, 'emit');

    component.onDeleteClick();

    expect(component.deleteClicked.emit).toHaveBeenCalled();
    done();
  });

  it('should have edit button with correct aria-label', () => {
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      'button[aria-label="Edit note"]'
    );
    expect(editButton).toBeTruthy();
  });

  it('should have delete button with correct aria-label', () => {
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Delete note"]'
    );
    expect(deleteButton).toBeTruthy();
  });

  it('should disable edit button when isLoading is true', () => {
    TestBed.runInInjectionContext(() => {
      component.isLoading = jasmine.createSpy().and.returnValue(true);
    });

    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      'button[aria-label="Edit note"]'
    );
    expect(editButton?.disabled).toBe(true);
  });

  it('should disable delete button when isDeleting is true', () => {
    TestBed.runInInjectionContext(() => {
      component.isDeleting = jasmine.createSpy().and.returnValue(true);
    });

    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Delete note"]'
    );
    expect(deleteButton?.disabled).toBe(true);
  });

  it('should display edit button with icon', () => {
    fixture.detectChanges();

    const editIcon = fixture.nativeElement.querySelector(
      'button[aria-label="Edit note"] [nz-icon]'
    );
    expect(editIcon).toBeTruthy();
  });

  it('should display delete button with icon', () => {
    fixture.detectChanges();

    const deleteIcon = fixture.nativeElement.querySelector(
      'button[aria-label="Delete note"] [nz-icon]'
    );
    expect(deleteIcon).toBeTruthy();
  });
});

