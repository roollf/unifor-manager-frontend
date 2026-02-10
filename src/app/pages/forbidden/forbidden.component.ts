import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="forbidden">
      <h2>Access denied</h2>
      <p>You do not have permission to access this page.</p>
      <a routerLink="/">Return to home</a>
    </div>
  `,
  styles: `
    .forbidden {
      padding: 2rem;
      text-align: center;
      color: var(--cinza-900);
    }
    .forbidden h2 { margin-top: 0; }
    .forbidden a { color: var(--azul-principal); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}
