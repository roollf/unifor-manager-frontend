import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';
import { Toast } from 'primeng/toast';
import { StudentService } from '@unifor-manager/api';

type UserRole = 'coordinator' | 'student' | null;

interface NavItem {
  label: string;
  route: string;
  role: UserRole; /* null = visible to all */
}

interface UserInfo {
  name: string;
  email: string;
  role: UserRole;
  courseName: string | null;
}

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly keycloak = inject(Keycloak);
  private readonly studentService = inject(StudentService);

  /** Populated from token; drives nav visibility. */
  protected readonly userRole = signal<UserRole>(null);

  /** User info for sidebar (from Keycloak token + student/me for course). */
  protected readonly userInfo = signal<UserInfo | null>(null);

  private readonly navItems: NavItem[] = [
    { label: 'Matrizes', route: '/coordinator/matrices', role: 'coordinator' },
    { label: 'Minhas matrículas', route: '/student/enrollments', role: 'student' },
    { label: 'Turmas disponíveis', route: '/student/classes/available', role: 'student' },
  ];

  protected readonly visibleNavItems = computed(() => {
    const role = this.userRole();
    if (!role) return this.navItems;
    return this.navItems.filter((item) => !item.role || item.role === role);
  });

  protected logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }

  ngOnInit(): void {
    this.updateUserInfo();
    this.keycloak.onAuthSuccess = () => this.updateUserInfo();
  }

  private updateUserInfo(): void {
    const t = this.keycloak.tokenParsed as Record<string, unknown> | undefined;
    if (!t) {
      this.userInfo.set(null);
      return;
    }
    const name =
      (t['name'] as string) ??
      (t['preferred_username'] as string) ??
      'Usuário';
    const email =
      (t['email'] as string) ?? (t['preferred_username'] as string) ?? '—';
    const realmRoles = (t['realm_access'] as { roles?: string[] })?.roles ?? [];
    const role: UserRole = realmRoles.includes('coordinator')
      ? 'coordinator'
      : realmRoles.includes('student')
        ? 'student'
        : null;
    this.userRole.set(role);
    this.userInfo.set({ name, email, role, courseName: null });
    if (role === 'student') {
      this.studentService.getMe().subscribe((me) => {
        const courseName = me.course?.name ?? null;
        this.userInfo.update((u) => (u ? { ...u, courseName } : null));
      });
    }
  }
}
