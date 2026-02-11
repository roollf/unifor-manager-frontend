import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

/**
 * Placeholder for the default route (/). Redirects to the role-appropriate dashboard
 * so the outlet always has a component (avoids blank screen).
 * Used after AuthGuard; user is authenticated.
 */
@Component({
  selector: 'app-default-dashboard',
  standalone: true,
  template: `<p class="redirect-msg">Redirecionando…</p>`,
  styles: `
    .redirect-msg {
      padding: 2rem;
      text-align: center;
      color: var(--cinza-700, #495057);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);

  ngOnInit(): void {
    const t = this.keycloak.tokenParsed as { realm_access?: { roles?: string[] } } | undefined;
    const roles = t?.realm_access?.roles ?? [];
    if (roles.includes('coordinator')) {
      this.router.navigate(['/coordinator/matrices'], { replaceUrl: true });
      return;
    }
    if (roles.includes('student')) {
      this.router.navigate(['/student/enrollments'], { replaceUrl: true });
      return;
    }
    this.router.navigate(['/forbidden'], { replaceUrl: true });
  }
}
