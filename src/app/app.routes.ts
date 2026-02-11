import { Routes } from '@angular/router';
import { authGuard, createRoleGuard } from '@unifor-manager/auth';

/**
 * Base route structure per ARCHITECTURE §3.2.
 * Coordinator and student routes protected by AuthGuard + RoleGuard.
 * Default (/) loads a redirect component by role: coordinator → Matrizes, student → Minhas matrículas.
 */
export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/default-dashboard/default-dashboard.component').then(
        (m) => m.DefaultDashboardComponent
      ),
  },
  {
    path: 'coordinator',
    canActivate: [authGuard, createRoleGuard('coordinator')],
    children: [
      {
        path: 'matrices',
        loadComponent: () =>
          import('./pages/coordinator-matrices/coordinator-matrices.component').then(
            (m) => m.CoordinatorMatricesComponent
          ),
      },
      {
        path: 'matrices/:id/classes',
        loadComponent: () =>
          import('./pages/coordinator-classes/coordinator-classes.component').then(
            (m) => m.CoordinatorClassesComponent
          ),
      },
    ],
  },
  {
    path: 'student',
    canActivate: [authGuard, createRoleGuard('student')],
    children: [
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./pages/student-enrollments/student-enrollments.component').then(
            (m) => m.StudentEnrollmentsComponent
          ),
      },
      {
        path: 'classes/available',
        loadComponent: () =>
          import('./pages/student-available-classes/student-available-classes.component').then(
            (m) => m.StudentAvailableClassesComponent
          ),
      },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
