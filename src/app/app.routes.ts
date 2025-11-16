import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
// import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./views/login/login.component').then(m => m.LoginComponent),
    data: { title: 'Login - LifeSync' },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./views/registration/registration.component').then(
        m => m.RegistrationComponent
      ),
    data: { title: 'Register - LifeSync' },
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      ),
  },
  {
    path: 'preferences',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/preferences/preferences.component').then(
        m => m.PreferencesComponent
      ),
    data: { title: 'Preferences - LifeSync' },
  },
  {
    path: 'notes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/notes-list/notes-list-container.component').then(
        m => m.NotesListContainerComponent
      ),
    data: { title: 'Notes - LifeSync' },
  },
  {
    path: 'notes/:noteId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/note-detail/note-detail-container.component').then(
        m => m.NoteDetailContainerComponent
      ),
    data: { title: 'Note - LifeSync' },
  },
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
