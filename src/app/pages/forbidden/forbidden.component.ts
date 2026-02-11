import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="forbidden">
      <h2>Acesso negado</h2>
      <p>Você não tem permissão para acessar esta página.</p>
      <a routerLink="/">Voltar ao início</a>
    </div>
  `,
  /* PRD §3: 403 Forbidden → show "access denied" (e.g. PrimeNG Message). This page fulfils that. */
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
