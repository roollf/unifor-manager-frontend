import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { createAuthGuard, type AuthGuardData } from 'keycloak-angular';

/**
 * Redirects the default route (/) to the role-appropriate dashboard:
 * - coordinator → /coordinator/matrices
 * - student → /student/enrollments (Minhas matrículas)
 * - otherwise → /forbidden
 */
export const defaultDashboardGuard = createAuthGuard(
  async (
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
    authData: AuthGuardData
  ): Promise<boolean | UrlTree> => {
    const router = inject(Router);
    if (!authData.authenticated) {
      return false;
    }
    const roles = authData.grantedRoles.realmRoles;
    if (roles.includes('coordinator')) {
      return router.createUrlTree(['/coordinator/matrices']);
    }
    if (roles.includes('student')) {
      return router.createUrlTree(['/student/enrollments']);
    }
    return router.createUrlTree(['/forbidden']);
  }
);
