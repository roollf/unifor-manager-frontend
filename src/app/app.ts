import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

type UserRole = 'coordinator' | 'student' | null;

interface NavItem {
  label: string;
  route: string;
  role: UserRole; /* null = visible to all */
}

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /** Populated in Phase 2 (auth); null = show all nav items for Phase 1 */
  protected readonly userRole = signal<UserRole>(null);

  private readonly navItems: NavItem[] = [
    { label: 'Matrices', route: '/coordinator/matrices', role: 'coordinator' },
    { label: 'My Enrollments', route: '/student/enrollments', role: 'student' },
    { label: 'Available Classes', route: '/student/classes/available', role: 'student' },
  ];

  protected readonly visibleNavItems = computed(() => {
    const role = this.userRole();
    if (!role) return this.navItems;
    return this.navItems.filter((item) => !item.role || item.role === role);
  });
}
