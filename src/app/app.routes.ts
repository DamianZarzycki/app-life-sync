import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./views/login/login.component').then((m) => m.LoginComponent),
    data: { title: 'Login - LifeSync' },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./views/registration/registration.component').then(
        (m) => m.RegistrationComponent
      ),
    data: { title: 'Register - LifeSync' },
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
