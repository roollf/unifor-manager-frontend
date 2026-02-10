import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { createAuthGuard, type AuthGuardData } from 'keycloak-angular';

/**
 * AuthGuard: blocks unauthenticated users and redirects to Keycloak login.
 * Per PRD Phase 2 and ARCHITECTURE §3.2.
 */
export const authGuard = createAuthGuard(
  async (
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    authData: AuthGuardData
  ): Promise<boolean> => {
    if (authData.authenticated) {
      return true;
    }
    const keycloak = authData.keycloak;
    if (keycloak) {
      const redirectUri = `${window.location.origin}${state.url}`;
      await keycloak.login({ redirectUri });
    }
    return false;
  }
);
