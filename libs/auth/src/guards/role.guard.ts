import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { createAuthGuard, type AuthGuardData } from 'keycloak-angular';

export type RequiredRole = 'coordinator' | 'student';

/**
 * Creates a RoleGuard that restricts routes to users with the given role.
 * Must be used after AuthGuard (user is authenticated).
 * On wrong role: redirects to /forbidden.
 * Per PRD Phase 2 and ARCHITECTURE §3.2.
 */
export function createRoleGuard(requiredRole: RequiredRole) {
  return createAuthGuard(
    async (
      _route: ActivatedRouteSnapshot,
      state: RouterStateSnapshot,
      authData: AuthGuardData
    ): Promise<boolean | import('@angular/router').UrlTree> => {
      if (!authData.authenticated) {
        return false;
      }
      const hasRole = authData.grantedRoles.realmRoles.includes(requiredRole);

      if (hasRole) {
        return true;
      }
      return inject(Router).createUrlTree(['/forbidden']);
    }
  );
}
